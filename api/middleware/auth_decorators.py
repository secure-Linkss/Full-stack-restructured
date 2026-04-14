"""
middleware/auth_decorators.py
Single canonical auth decorators used across ALL routes.
Sets g.user AND injects user as first positional arg for admin routes.
"""
import logging
import inspect
from flask import jsonify, session, request, g
from functools import wraps
from api.models.user import User

logger = logging.getLogger(__name__)


def _resolve_user():
    """Resolve user from session or Bearer token. Returns User or None."""
    user_id = session.get("user_id")
    if user_id:
        return User.query.get(user_id)
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1]
        user = User.verify_token(token)
        if user:
            # Hydrate session so subsequent session.get() calls work
            session["user_id"] = user.id
            session["username"] = user.username
            session["role"] = user.role
        return user
    return None


def _needs_user_injection(f):
    """Check if function expects `current_user` as its first parameter."""
    try:
        sig = inspect.signature(f)
        params = list(sig.parameters.keys())
        return len(params) > 0 and params[0] == "current_user"
    except (ValueError, TypeError):
        return False


def login_required(f):
    """Require authenticated, active user. Sets g.user."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = _resolve_user()
        if not user:
            return jsonify({"success": False, "error": "Authentication required"}), 401
        if not user.is_active or user.status not in ("active",):
            # Admins bypass status check
            if user.role not in ("admin", "main_admin"):
                return jsonify({"success": False, "error": "Account not active or pending approval"}), 403
        g.user = user
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """Require admin or main_admin role. Sets g.user. Injects user if function expects current_user."""
    inject = _needs_user_injection(f)

    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = _resolve_user()
        if not user:
            return jsonify({"success": False, "error": "Authentication required"}), 401
        if user.role not in ("admin", "main_admin"):
            return jsonify({"success": False, "error": "Admin access required"}), 403
        g.user = user
        if inject:
            return f(user, *args, **kwargs)
        return f(*args, **kwargs)
    return decorated_function


def main_admin_required(f):
    """Require main_admin only. Sets g.user. Injects user if function expects current_user."""
    inject = _needs_user_injection(f)

    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = _resolve_user()
        if not user:
            return jsonify({"success": False, "error": "Authentication required"}), 401
        if user.role != "main_admin":
            return jsonify({"success": False, "error": "Main admin access required"}), 403
        g.user = user
        if inject:
            return f(user, *args, **kwargs)
        return f(*args, **kwargs)
    return decorated_function