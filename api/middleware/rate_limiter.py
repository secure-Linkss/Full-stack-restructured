"""
Rate Limiting Middleware — no Redis required.
Uses a thread-safe in-memory sliding-window store.
Works in Vercel serverless (per-instance) and long-running Flask.
"""

import time
import threading
import hashlib
import logging
from collections import defaultdict, deque
from functools import wraps
from typing import Dict, Tuple

from flask import request, jsonify, g

logger = logging.getLogger(__name__)

# ── Per-tier default limits (requests per window) ────────────────────────────
TIER_LIMITS: Dict[str, Dict] = {
    "free":       {"requests": 60,   "window": 60},   # 60 req / 60 s
    "pro":        {"requests": 300,  "window": 60},
    "enterprise": {"requests": 1000, "window": 60},
    "admin":      {"requests": 2000, "window": 60},
    "anonymous":  {"requests": 30,   "window": 60},
}


class InMemoryRateLimiter:
    """Thread-safe sliding-window rate limiter backed by deques."""

    def __init__(self):
        self._store: Dict[str, deque] = defaultdict(deque)
        self._lock = threading.Lock()

    def _client_key(self) -> str:
        user_id = getattr(g, "user_id", None)
        if not user_id:
            user = getattr(g, "user", None)
            if user:
                user_id = getattr(user, "id", None)
        if user_id:
            return f"u:{user_id}"
        ip = request.headers.get("X-Forwarded-For", request.remote_addr) or "unknown"
        ip = ip.split(",")[0].strip()
        return f"ip:{hashlib.sha256(ip.encode()).hexdigest()[:16]}"

    def is_allowed(self, key: str, limit: int, window: int) -> Tuple[bool, int, int]:
        """
        Returns (allowed, remaining, retry_after_seconds).
        Sliding window — only requests within [now-window, now] count.
        """
        now = time.time()
        cutoff = now - window

        with self._lock:
            q = self._store[key]
            while q and q[0] < cutoff:
                q.popleft()

            count = len(q)
            if count >= limit:
                retry_after = int(q[0] + window - now) + 1 if q else window
                return False, 0, retry_after

            q.append(now)
            return True, limit - count - 1, 0

    def check(self, limit: int = 60, window: int = 60, key_suffix: str = "") -> Tuple[bool, int, int]:
        key = self._client_key() + key_suffix
        return self.is_allowed(key, limit, window)


# Global singleton
_limiter = InMemoryRateLimiter()


def rate_limit(limit: int = 60, window: int = 60, key_suffix: str = ""):
    """
    Decorator: apply rate limiting to a Flask route.

    Usage:
        @app.route("/api/endpoint")
        @rate_limit(limit=10, window=60)
        def endpoint(): ...
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            # Bypass rate limiting for loopback / private IPs (dev & test)
            _ip = (request.headers.get("X-Forwarded-For", request.remote_addr) or "").split(",")[0].strip()
            _PRIVATE = ('127.', '::1', '10.', '172.16.', '172.17.', '172.18.',
                        '172.19.', '172.2', '172.3', '192.168.', 'localhost')
            if any(_ip.startswith(p) for p in _PRIVATE):
                return f(*args, **kwargs)
            allowed, remaining, retry_after = _limiter.check(limit, window, key_suffix)
            if not allowed:
                resp = jsonify({
                    "error": "Rate limit exceeded",
                    "retry_after": retry_after,
                })
                resp.status_code = 429
                resp.headers["Retry-After"] = str(retry_after)
                resp.headers["X-RateLimit-Limit"] = str(limit)
                resp.headers["X-RateLimit-Remaining"] = "0"
                return resp
            response = f(*args, **kwargs)
            try:
                response.headers["X-RateLimit-Limit"] = str(limit)
                response.headers["X-RateLimit-Remaining"] = str(remaining)
            except Exception:
                pass
            return response
        return wrapped
    return decorator


def get_limiter() -> InMemoryRateLimiter:
    return _limiter


class _RateLimiterCompat:
    """Backward-compatible wrapper so code that does `rate_limiter.rate_limit(...)` still works."""

    def rate_limit(self, requests_per_minute: int = 60, requests_per_hour: int = 0,  # noqa: ARG002
                   key_suffix: str = ""):
        """Drop-in for old `rate_limiter.rate_limit(requests_per_minute=N)` calls.
        requests_per_hour is accepted for API compatibility but the shorter window is enforced.
        """
        return rate_limit(limit=requests_per_minute, window=60, key_suffix=key_suffix)


# Legacy singleton — used by link_features.py and other pre-refactor files
rate_limiter = _RateLimiterCompat()
