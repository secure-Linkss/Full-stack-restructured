"""
Placeholder Expansion Engine
Substitutes dynamic tokens in redirect URLs using visitor context.

Supported tokens:
  [EMAIL]        — captured email (URL-encoded)
  [EMAIL64]      — base64-encoded email
  [EMAILHEX]     — hex-encoded email
  [IP]           — visitor IP address
  [COUNTRY]      — 2-letter country code  e.g. US
  [COUNTRY_NAME] — full country name      e.g. United States
  [CITY]         — visitor city
  [REGION]       — region / state
  [TIMEZONE]     — IANA timezone          e.g. America/New_York
  [DEVICE]       — mobile | desktop | tablet
  [BROWSER]      — browser name           e.g. Chrome
  [OS]           — operating system       e.g. Windows
  [USERAGENT]    — full user-agent string (URL-encoded)
  [REFERRER]     — HTTP Referer header    (URL-encoded)
  [TIMESTAMP]    — Unix timestamp in seconds
  [DATE]         — YYYY-MM-DD UTC
  [DATETIME]     — ISO-8601 UTC           e.g. 2025-01-15T12:34:56
  [SHORT_CODE]   — the link's short code
  [CLICK_ID]     — Quantum click ID
  [DOMAIN]       — tracking domain host

Usage in a target URL:
  https://offer.example.com/lp?e=[EMAIL64]&ip=[IP]&country=[COUNTRY]
"""

import base64
import logging
import re
import time
from datetime import datetime, timezone
from typing import Dict, Optional
from urllib.parse import quote, urlparse

logger = logging.getLogger(__name__)

# ── token registry (token → callable or static value) ─────────────────────────
_TOKEN_RE = re.compile(r'\[([A-Z0-9_]+)\]')


def expand_placeholders(
    url: str,
    *,
    email: Optional[str] = None,
    ip: Optional[str] = None,
    country: Optional[str] = None,
    country_name: Optional[str] = None,
    city: Optional[str] = None,
    region: Optional[str] = None,
    timezone_str: Optional[str] = None,
    device: Optional[str] = None,
    browser: Optional[str] = None,
    os_name: Optional[str] = None,
    user_agent: Optional[str] = None,
    referrer: Optional[str] = None,
    short_code: Optional[str] = None,
    click_id: Optional[str] = None,
    domain: Optional[str] = None,
) -> str:
    """
    Replace all recognised [TOKEN] placeholders in *url* with live values.
    Unknown tokens are left as-is (safe — no data leakage).
    """
    if not url or '[' not in url:
        return url

    now = datetime.now(timezone.utc)

    # Build a lookup dict of token → replacement string
    _e = email or ''
    lookup: Dict[str, str] = {
        'EMAIL':        quote(_e, safe=''),
        'EMAIL64':      base64.b64encode(_e.encode()).decode() if _e else '',
        'EMAILHEX':     _e.encode().hex() if _e else '',
        'IP':           ip or '',
        'COUNTRY':      (country or '').upper(),
        'COUNTRY_NAME': country_name or '',
        'CITY':         city or '',
        'REGION':       region or '',
        'TIMEZONE':     timezone_str or '',
        'DEVICE':       (device or 'desktop').lower(),
        'BROWSER':      browser or '',
        'OS':           os_name or '',
        'USERAGENT':    quote(user_agent or '', safe=''),
        'REFERRER':     quote(referrer or '', safe=''),
        'TIMESTAMP':    str(int(time.time())),
        'DATE':         now.strftime('%Y-%m-%d'),
        'DATETIME':     now.strftime('%Y-%m-%dT%H:%M:%S'),
        'SHORT_CODE':   short_code or '',
        'CLICK_ID':     click_id or '',
        'DOMAIN':       domain or '',
    }

    def _replace(m: re.Match) -> str:
        token = m.group(1)
        if token in lookup:
            return lookup[token]
        # Unknown token — leave untouched so destination URL isn't corrupted
        return m.group(0)

    try:
        return _TOKEN_RE.sub(_replace, url)
    except Exception as exc:
        logger.error(f"placeholder_engine expand error: {exc}")
        return url


def has_placeholders(url: str) -> bool:
    """Quick check — returns True if the URL contains any [TOKEN] patterns."""
    return bool(url and '[' in url and _TOKEN_RE.search(url))
