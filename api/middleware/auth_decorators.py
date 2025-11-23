from flask import jsonify, session, request
from functools import wraps
from api.models.user import User

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # First, check for session-based authentication
        user_id = session.get("user_id")
        
        # If no session, check for token-based authentication
        if not user_id:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                user = User.verify_token(token)
                if user:
                    # Set user_id in session for consistency
                    session["user_id"] = user.id
                    session["username"] = user.username
                    session["role"] = user.role
                    user_id = user.id
                else:
                    return jsonify({"error": "Invalid or expired token"}), 401
            else:
                return jsonify({"error": "Authentication required"}), 401
        
        # Verify user still exists and is active
        user = User.query.get(user_id)
        if not user:
            session.clear()
            return jsonify({"error": "User not found"}), 401
        
        if not user.is_active or user.status != "active":
            return jsonify({"error": "Account not active"}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # First check authentication
        user_id = session.get("user_id")
        
        # If no session, check for token-based authentication
        if not user_id:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                user = User.verify_token(token)
                if user:
                    session["user_id"] = user.id
                    session["username"] = user.username
                    session["role"] = user.role
                    user_id = user.id
                else:
                    return jsonify({"error": "Invalid or expired token"}), 401
            else:
                return jsonify({"error": "Authentication required"}), 401
        
        # Check if user is admin
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 401
        
        if user.role not in ["admin", "main_admin", "assistant_admin"]:
            return jsonify({"error": "Admin access required"}), 403
        
        return f(*args, **kwargs)
    return decorated_function