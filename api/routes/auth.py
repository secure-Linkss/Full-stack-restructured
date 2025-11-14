from flask import Blueprint, request, jsonify, session
from api.database import db
from api.models.user import User
from api.models.audit_log import AuditLog
from api.models.notification import Notification
from api.middleware.auth_decorators import login_required
from api.utils.validation import validate_email, validate_password, sanitize_string
from datetime import datetime, timedelta
import secrets
import hashlib
import jwt
import os
import pyotp
import qrcode
import io
import base64

auth_bp = Blueprint("auth", __name__)

# --- Password Reset Endpoints ---

@auth_bp.route("/auth/forgot-password", methods=["POST"])
def forgot_password():
    """Request password reset"""
    try:
        data = request.get_json()
        email = data.get("email")
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({
                "message": "If the email exists, a reset link has been sent"
            }), 200
        
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = hashlib.sha256(reset_token.encode()).hexdigest()
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        
        db.session.commit()
        
        reset_link = f"https://yourdomain.com/reset-password?token={reset_token}"
        
        return jsonify({
            "message": "If the email exists, a reset link has been sent",
            "reset_link": reset_link
        }), 200
        
    except Exception as e:
        print(f"Forgot password error: {e}")
        return jsonify({"error": "An error occurred"}), 500

@auth_bp.route("/auth/reset-password", methods=["POST"])
def reset_password():
    """Reset password with token"""
    try:
        data = request.get_json()
        token = data.get("token")
        new_password = data.get("password")
        
        if not token or not new_password:
            return jsonify({"error": "Token and password are required"}), 400
        
        is_strong, message = validate_password(new_password)
        if not is_strong:
            return jsonify({"error": message}), 400
        
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        user = User.query.filter_by(reset_token=token_hash).first()
        
        if not user:
            return jsonify({"error": "Invalid or expired reset token"}), 400
        
        if user.reset_token_expires < datetime.utcnow():
            return jsonify({"error": "Reset token has expired"}), 400
        
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        
        db.session.commit()
        
        from api.models.audit_log import AuditLog
        audit_log = AuditLog(
            actor_id=user.id,
            action="Password reset",
            details="User reset their password",
            ip_address=request.remote_addr
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({"message": "Password reset successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Reset password error: {e}")
        return jsonify({"error": "An error occurred"}), 500

@auth_bp.route("/auth/validate-reset-token", methods=["POST"])
def validate_reset_token():
    """Validate if reset token is still valid"""
    try:
        data = request.get_json()
        token = data.get("token")
        
        if not token:
            return jsonify({"error": "Token is required"}), 400
        
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        user = User.query.filter_by(reset_token=token_hash).first()
        
        if not user or user.reset_token_expires < datetime.utcnow():
            return jsonify({"valid": False}), 200
        
        return jsonify({"valid": True}), 200
        
    except Exception as e:
        print(f"Validate token error: {e}")
        return jsonify({"error": "An error occurred"}), 500

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
        plan = data.get("plan")

        username = sanitize_string(username)
        email = sanitize_string(email)
        plan = sanitize_string(plan)

        if not all([username, email, password, plan]):
            return jsonify({"error": "Missing required fields (username, email, password, plan)"}), 400

        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400
        
        is_strong, message = validate_password(password)
        if not is_strong:
            return jsonify({"error": message}), 400

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
            is_verified=False,
            plan_type=plan
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        log_audit(user.id, "User registered", f"New user {username} registered with pending status and {plan} plan")

        try:
            admins = User.query.filter(User.role.in_(["main_admin", "admin"])).all()
            for admin in admins:
                admin_notification = Notification(
                    user_id=admin.id,
                    title="New User Registration",
                    message=f"New user {username} ({email}) registered with {plan} plan and is awaiting approval.",
                    type="info",
                    priority="high",
                    is_read=False
                )
                db.session.add(admin_notification)
            db.session.commit()
        except Exception as e:
            print(f"Error notifying admins: {e}")

        return jsonify({
            "message": "Registration successful! Your account is pending admin approval.",
            "user": user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Registration error: {e}")
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """User login"""
    try:
        data = request.get_json()
        login_identifier = data.get("username")
        password = data.get("password")

        print(f"Login attempt - Username: {login_identifier}, Password provided: {bool(password)}")

        if not login_identifier or not password:
            return jsonify({"error": "Username and password required"}), 400

        user = User.query.filter(
            (User.username == login_identifier) | (User.email == login_identifier)
        ).first()
        
        print(f"User found: {user is not None}")

        if not user or not user.check_password(password):
            if user:
                user.failed_login_attempts += 1
                user.last_failed_login = datetime.utcnow()
                db.session.commit()
            print("Login failed - invalid credentials")
            return jsonify({"error": "Invalid credentials"}), 401

        if user:
            password_check = user.check_password(password)
            print(f"Password check result: {password_check}")
            print(f"User status: {user.status}, is_active: {user.is_active}")

        if user.two_factor_enabled:
            two_factor_token = data.get("two_factor_token")
            if not two_factor_token:
                return jsonify({
                    "message": "2FA required",
                    "two_factor_required": True,
                    "user": user.to_dict()
                }), 401
            
            if not user.verify_2fa_token(two_factor_token):
                return jsonify({"error": "Invalid 2FA token"}), 401

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
        session["username"] = user.username
        session["role"] = user.role

        token = user.generate_token()

        log_audit(user.id, "User logged in", f"User {login_identifier} logged in successfully")

        return jsonify({
            "message": "Login successful",
            "user": user.to_dict(),
            "token": token
        }), 200

    except Exception as e:
        print(f"Login error: {e}")
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

@auth_bp.route("/auth/2fa/generate", methods=["GET"])
@login_required
def generate_2fa():
    """Generate a new 2FA secret and QR code URL"""
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)

        if user.two_factor_enabled:
            return jsonify({"error": "2FA is already enabled. Disable it first to generate a new secret."}), 400

        secret = user.generate_2fa_secret()
        
        provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name="Brain Link Tracker"
        )

        img = qrcode.make(provisioning_uri)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return jsonify({
            "secret": secret,
            "provisioning_uri": provisioning_uri,
            "qr_code_png_base64": qr_code_base64
        }), 200

    except Exception as e:
        print(f"Generate 2FA error: {e}")
        return jsonify({"error": "An error occurred during 2FA generation"}), 500

@auth_bp.route("/auth/2fa/enable", methods=["POST"])
@login_required
def enable_2fa():
    """Verify token and enable 2FA"""
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)
        data = request.get_json()
        token = data.get("token")

        if not token:
            return jsonify({"error": "Token is required"}), 400

        if not user.two_factor_secret:
            return jsonify({"error": "2FA secret not generated. Please generate it first."}), 400

        if user.verify_2fa_token(token):
            user.two_factor_enabled = True
            db.session.commit()
            log_audit(user.id, "2FA Enabled", "User successfully enabled Two-Factor Authentication.")
            return jsonify({"message": "Two-Factor Authentication enabled successfully"}), 200
        else:
            return jsonify({"error": "Invalid 2FA token. Please try again."}), 400

    except Exception as e:
        db.session.rollback()
        print(f"Enable 2FA error: {e}")
        return jsonify({"error": "An error occurred during 2FA enablement"}), 500

@auth_bp.route("/auth/2fa/disable", methods=["POST"])
@login_required
def disable_2fa():
    """Disable 2FA"""
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)
        data = request.get_json()
        password = data.get("password")

        if not password:
            return jsonify({"error": "Password is required to disable 2FA"}), 400

        if not user.check_password(password):
            return jsonify({"error": "Invalid password"}), 401

        user.two_factor_enabled = False
        user.two_factor_secret = None
        db.session.commit()
        log_audit(user.id, "2FA Disabled", "User successfully disabled Two-Factor Authentication.")
        return jsonify({"message": "Two-Factor Authentication disabled successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Disable 2FA error: {e}")
        return jsonify({"error": "An error occurred during 2FA disablement"}), 500

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
