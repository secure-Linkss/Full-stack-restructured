from flask import Blueprint, request, jsonify, session
from src.models.user import User, db
from src.models.audit_log import AuditLog
from datetime import datetime
import jwt
import os

auth_bp = Blueprint("auth", __name__)

def log_audit(user_id, action, details=None):
    """Helper to log audit events"""
    try:
        audit_log = AuditLog(
            actor_id=user_id,
            action=action,
            details=details,
            ip_address=request.remote_addr,
            user_agent=request.headers.get("User-Agent")
        )
        db.session.add(audit_log)
        db.session.commit()
    except Exception as e:
        print(f"Audit log error: {e}")

@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """Register a new user with PENDING status"""
    try:
        data = request.get_json()

        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        if not all([username, email, password]):
            return jsonify({"error": "Missing required fields"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already exists"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400

        user = User(
            username=username,
            email=email,
            role="member",
            status="pending",
            is_active=False,
            is_verified=False
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        log_audit(user.id, "User registered", f"New user {username} registered with pending status")

        return jsonify({
            "message": "Registration successful! Your account is pending admin approval.",
            "user": user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """User login"""
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        print(f"Login attempt - Username: {username}, Password provided: {bool(password)}")

        if not username or not password:
            return jsonify({"error": "Username and password required"}), 400

        user = User.query.filter_by(username=username).first()
        print(f"User found: {user is not None}")

        if user:
            password_check = user.check_password(password)
            print(f"Password check result: {password_check}")
            print(f"User status: {user.status}, is_active: {user.is_active}")

        if not user or not user.check_password(password):
            if user:
                user.failed_login_attempts += 1
                db.session.commit()
            print("Login failed - invalid credentials")
            return jsonify({"error": "Invalid credentials"}), 401

        if user.status == "pending":
            return jsonify({"error": "Your account is pending admin approval"}), 403

        if user.status == "suspended":
            return jsonify({"error": "Your account has been suspended"}), 403

        if user.status == "expired":
            return jsonify({"error": "Your subscription has expired"}), 403

        if not user.is_active:
            return jsonify({"error": "Your account is inactive"}), 403

        user.last_login = datetime.utcnow()
        user.last_ip = request.remote_addr
        user.login_count += 1
        user.failed_login_attempts = 0
        db.session.commit()

        session["user_id"] = user.id
        session["role"] = user.role

        token = user.generate_token()

        log_audit(user.id, "User logged in", f"User {username} logged in successfully")

        return jsonify({
            "message": "Login successful",
            "user": user.to_dict(),
            "token": token
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    """User logout"""
    try:
        user_id = session.get("user_id")
        if user_id:
            log_audit(user_id, "User logged out", "User logged out successfully")

        session.clear()
        return jsonify({"message": "Logout successful"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/auth/me", methods=["GET"])
def get_current_user():
    """Get current user info"""
    try:
        user_id = session.get("user_id")

        if not user_id:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                user = User.verify_token(token)
                if not user:
                    return jsonify({"error": "Invalid token"}), 401
                user_id = user.id
            else:
                return jsonify({"error": "Not authenticated"}), 401

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"user": user.to_dict()}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/auth/validate", methods=["GET"])
def validate_token():
    """Validate JWT token and session"""
    try:
        auth_header = request.headers.get("Authorization")

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            user = User.verify_token(token)

            if not user:
                return jsonify({"error": "Invalid token"}), 401

            if user.status != "active" or not user.is_active:
                return jsonify({"error": "Account not active"}), 403

            return jsonify({
                "valid": True,
                "user": user.to_dict()
            }), 200
        else:
            return jsonify({"error": "No token provided"}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/auth/refresh", methods=["POST"])
def refresh_token():
    """Refresh JWT token"""
    try:
        user_id = session.get("user_id")

        if not user_id:
            return jsonify({"error": "Not authenticated"}), 401

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        token = user.generate_token()

        return jsonify({"token": token}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

