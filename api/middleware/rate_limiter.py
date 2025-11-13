"""
Advanced Rate Limiting Middleware
Implements Redis-based rate limiting with multiple strategies
"""

from flask import request, jsonify, g
from functools import wraps
from datetime import datetime, timedelta
import hashlib
import json
from typing import Optional, Dict, Any
import redis
import os

class RateLimiter:
    """
    Advanced rate limiting with multiple strategies:
    - Fixed window
    - Sliding window
    - Token bucket
    - Adaptive rate limiting based on user tier
    """
    
    def __init__(self, redis_url: Optional[str] = None):
        """Initialize rate limiter with Redis connection"""
        self.redis_url = redis_url or os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            self.enabled = True
            print("✅ Rate limiter connected to Redis")
        except Exception as e:
            print(f"⚠️ Redis not available, using in-memory fallback: {e}")
            self.enabled = False
            self.memory_store = {}
    
    def get_client_identifier(self) -> str:
        """Get unique identifier for the client"""
        # Try to get user ID from session/token
        user_id = getattr(g, 'user_id', None)
        if user_id:
            return f"user:{user_id}"
        
        # Fall back to IP address
        ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if ip:
            # Hash IP for privacy
            return f"ip:{hashlib.sha256(ip.encode()).hexdigest()[:16]}"
        
        return "anonymous"
    
    def get_rate_limit_for_user(self, user_tier: str = "free") -> Dict[str, int]:
        """Get rate limits based on user tier"""
        limits = {
            "free": {
                "requests_per_minute": 20,
                "requests_per_hour": 100,
                "requests_per_day": 1000
            },
            "pro": {
                "requests_per_minute": 60,
                "requests_per_hour": 500,
                "requests_per_day": 10000
            },
            "enterprise": {
                "requests_per_minute": 200,
                "requests_per_hour": 2000,
                "requests_per_day": 50000
            },
            "admin": {
                "requests_per_minute": 1000,
                "requests_per_hour": 10000,
                "requests_per_day": 100000
            }
        }
        return limits.get(user_tier, limits["free"])
    
    def check_rate_limit(
        self,
        identifier: str,
        limit: int,
        window: int,
        endpoint: str = "global"
    ) -> Dict[str, Any]:
        """
        Check if request is within rate limit
        
        Args:
            identifier: Client identifier
            limit: Maximum requests allowed
            window: Time window in seconds
            endpoint: API endpoint name
        
        Returns:
            Dict with allowed status and metadata
        """
        key = f"ratelimit:{endpoint}:{identifier}:{window}"
        current_time = datetime.utcnow().timestamp()
        
        if self.enabled:
            try:
                # Use Redis for distributed rate limiting
                pipe = self.redis_client.pipeline()
                
                # Remove old entries outside the window
                pipe.zremrangebyscore(key, 0, current_time - window)
                
                # Count requests in current window
                pipe.zcard(key)
                
                # Add current request
                pipe.zadd(key, {str(current_time): current_time})
                
                # Set expiry
                pipe.expire(key, window)
                
                results = pipe.execute()
                request_count = results[1]
                
                allowed = request_count < limit
                remaining = max(0, limit - request_count - 1)
                
                return {
                    "allowed": allowed,
                    "limit": limit,
                    "remaining": remaining,
                    "reset": int(current_time + window),
                    "retry_after": window if not allowed else None
                }
                
            except Exception as e:
                print(f"Redis error in rate limiting: {e}")
                # Fall through to memory-based limiting
        
        # Memory-based fallback
        if key not in self.memory_store:
            self.memory_store[key] = []
        
        # Clean old entries
        self.memory_store[key] = [
            t for t in self.memory_store[key]
            if t > current_time - window
        ]
        
        request_count = len(self.memory_store[key])
        allowed = request_count < limit
        
        if allowed:
            self.memory_store[key].append(current_time)
        
        remaining = max(0, limit - request_count - 1)
        
        return {
            "allowed": allowed,
            "limit": limit,
            "remaining": remaining,
            "reset": int(current_time + window),
            "retry_after": window if not allowed else None
        }
    
    def rate_limit(
        self,
        requests_per_minute: Optional[int] = None,
        requests_per_hour: Optional[int] = None,
        requests_per_day: Optional[int] = None,
        endpoint_name: Optional[str] = None
    ):
        """
        Decorator for rate limiting endpoints
        
        Usage:
            @rate_limiter.rate_limit(requests_per_minute=60)
            def my_endpoint():
                return "Hello"
        """
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                identifier = self.get_client_identifier()
                endpoint = endpoint_name or request.endpoint or "unknown"
                
                # Get user tier for adaptive rate limiting
                user = getattr(g, 'user', None)
                user_tier = user.role if user and hasattr(user, 'role') else "free"
                
                if user_tier in ["admin", "main_admin"]:
                    user_tier = "admin"
                elif user_tier == "member":
                    # Check subscription
                    plan = getattr(user, 'plan_type', 'free')
                    user_tier = plan
                
                limits = self.get_rate_limit_for_user(user_tier)
                
                # Override with custom limits if provided
                if requests_per_minute:
                    limits["requests_per_minute"] = requests_per_minute
                if requests_per_hour:
                    limits["requests_per_hour"] = requests_per_hour
                if requests_per_day:
                    limits["requests_per_day"] = requests_per_day
                
                # Check all time windows
                checks = [
                    (limits["requests_per_minute"], 60, "minute"),
                    (limits["requests_per_hour"], 3600, "hour"),
                    (limits["requests_per_day"], 86400, "day")
                ]
                
                for limit, window, period in checks:
                    result = self.check_rate_limit(
                        identifier,
                        limit,
                        window,
                        f"{endpoint}:{period}"
                    )
                    
                    if not result["allowed"]:
                        response = jsonify({
                            "error": "Rate limit exceeded",
                            "message": f"Too many requests. Please try again later.",
                            "limit": result["limit"],
                            "remaining": result["remaining"],
                            "reset": result["reset"],
                            "retry_after": result["retry_after"]
                        })
                        response.status_code = 429
                        response.headers['X-RateLimit-Limit'] = str(result["limit"])
                        response.headers['X-RateLimit-Remaining'] = str(result["remaining"])
                        response.headers['X-RateLimit-Reset'] = str(result["reset"])
                        response.headers['Retry-After'] = str(result["retry_after"])
                        return response
                
                # All checks passed, execute the function
                return f(*args, **kwargs)
            
            return decorated_function
        return decorator
    
    def get_rate_limit_status(self, identifier: str, endpoint: str = "global") -> Dict[str, Any]:
        """Get current rate limit status for a client"""
        user_tier = "free"  # Default
        
        if hasattr(g, 'user') and g.user:
            user_tier = g.user.role if hasattr(g.user, 'role') else "free"
            if user_tier == "member":
                user_tier = getattr(g.user, 'plan_type', 'free')
        
        limits = self.get_rate_limit_for_user(user_tier)
        
        status = {}
        for period, window in [("minute", 60), ("hour", 3600), ("day", 86400)]:
            limit_key = f"requests_per_{period}"
            if limit_key in limits:
                result = self.check_rate_limit(
                    identifier,
                    limits[limit_key],
                    window,
                    f"{endpoint}:{period}"
                )
                status[period] = result
        
        return status


# Global rate limiter instance
rate_limiter = RateLimiter()


def apply_rate_limiting(app):
    """Apply rate limiting to Flask app"""
    
    @app.before_request
    def check_global_rate_limit():
        """Global rate limiting for all requests"""
        # Skip rate limiting for health checks
        if request.path in ['/health', '/api/health']:
            return None
        
        # Apply global rate limit
        identifier = rate_limiter.get_client_identifier()
        
        # Get user tier
        user_tier = "free"
        if hasattr(g, 'user') and g.user:
            user_tier = g.user.role if hasattr(g.user, 'role') else "free"
            if user_tier == "member":
                user_tier = getattr(g.user, 'plan_type', 'free')
        
        limits = rate_limiter.get_rate_limit_for_user(user_tier)
        
        # Check minute limit
        result = rate_limiter.check_rate_limit(
            identifier,
            limits["requests_per_minute"],
            60,
            "global:minute"
        )
        
        if not result["allowed"]:
            response = jsonify({
                "error": "Rate limit exceeded",
                "message": "Too many requests. Please try again later.",
                "limit": result["limit"],
                "remaining": result["remaining"],
                "reset": result["reset"],
                "retry_after": result["retry_after"]
            })
            response.status_code = 429
            response.headers['X-RateLimit-Limit'] = str(result["limit"])
            response.headers['X-RateLimit-Remaining'] = str(result["remaining"])
            response.headers['X-RateLimit-Reset'] = str(result["reset"])
            response.headers['Retry-After'] = str(result["retry_after"])
            return response
        
        # Store rate limit info in g for use in response headers
        g.rate_limit = result
    
    @app.after_request
    def add_rate_limit_headers(response):
        """Add rate limit headers to all responses"""
        if hasattr(g, 'rate_limit'):
            response.headers['X-RateLimit-Limit'] = str(g.rate_limit["limit"])
            response.headers['X-RateLimit-Remaining'] = str(g.rate_limit["remaining"])
            response.headers['X-RateLimit-Reset'] = str(g.rate_limit["reset"])
        
        return response
    
    print("✅ Rate limiting middleware applied")
