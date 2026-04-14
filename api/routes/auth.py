"""
auth.py — Brain Link Tracker
Fixed: removed debug prints, duplicate password check, last_failed_login attribute error.
Added: account lockout enforcement, generate_2fa_secret method call guarded, clean logging.
"""
import hashlib
import io
import base64
import secrets
import logging
import os

import pyotp
import qrcode
from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta

from api.database import db
from api.models.user import User
from api.models.audit_log import AuditLog
from api.models.notification import Notification
from api.middleware.auth_decorators import login_required
from api.middleware.rate_limiter import rate_limit
from api.utils.validation import validate_email, validate_password, sanitize_string

logger = logging.getLogger(__name__)
auth_bp = Blueprint("auth", __name__)


# ---------- Helpers ----------

def _log_audit(user_id, action, details=None):
    try:
        db.session.add(AuditLog(
            actor_id=user_id,
            action=action,
            details=details,
            ip_address=request.remote_addr,
            user_agent=request.headers.get("User-Agent")
        ))
        db.session.commit()
    except Exception as e:
        logger.error(f"Audit log error: {e}")


def _get_user_from_request():
    """Resolve user from session or Bearer token."""
    user_id = session.get("user_id")
    if user_id:
        return User.query.get(user_id)
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return User.verify_token(auth.split(" ", 1)[1])
    return None


# ---------- Password reset ----------

@auth_bp.route("/auth/forgot-password", methods=["POST"])
@rate_limit(limit=5, window=300, key_suffix=":forgot_password")  # 5/5min per IP
def forgot_password():
    try:
        data = request.get_json() or {}
        email = sanitize_string(data.get("email", ""))
        if not email:
            return jsonify({"error": "Email is required"}), 400

        user = User.query.filter_by(email=email).first()
        # Always return the same message to prevent user enumeration
        if user:
            reset_token = secrets.token_urlsafe(32)
            user.reset_token = hashlib.sha256(reset_token.encode()).hexdigest()
            user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
            user.reset_token_expiry = user.reset_token_expires  # keep both in sync
            db.session.commit()
            app_url = os.environ.get("APP_URL", "https://brainlinktracker.com")
            reset_link = f"{app_url}/reset-password?token={reset_token}"
            logger.info(f"Password reset requested for {email} — link: {reset_link}")
            # TODO: send email via email service

        return jsonify({"message": "If the email exists, a reset link has been sent"}), 200

    except Exception as e:
        logger.error(f"forgot_password error: {e}")
        return jsonify({"error": "An error occurred"}), 500


@auth_bp.route("/auth/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json() or {}
        token = data.get("token")
        new_password = data.get("password")

        if not token or not new_password:
            return jsonify({"error": "Token and password are required"}), 400

        is_strong, msg = validate_password(new_password)
        if not is_strong:
            return jsonify({"error": msg}), 400

        token_hash = hashlib.sha256(token.encode()).hexdigest()
        user = User.query.filter_by(reset_token=token_hash).first()

        if not user:
            return jsonify({"error": "Invalid or expired reset token"}), 400

        expires = user.reset_token_expires or user.reset_token_expiry
        if not expires or expires < datetime.utcnow():
            return jsonify({"error": "Reset token has expired"}), 400

        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expires = None
        user.reset_token_expiry = None
        db.session.commit()

        _log_audit(user.id, "Password reset", "User reset their password")
        return jsonify({"message": "Password reset successfully"}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"reset_password error: {e}")
        return jsonify({"error": "An error occurred"}), 500


@auth_bp.route("/auth/validate-reset-token", methods=["POST"])
def validate_reset_token():
    try:
        data = request.get_json() or {}
        token = data.get("token")
        if not token:
            return jsonify({"error": "Token is required"}), 400

        token_hash = hashlib.sha256(token.encode()).hexdigest()
        user = User.query.filter_by(reset_token=token_hash).first()
        expires = user.reset_token_expires if user else None

        if not user or not expires or expires < datetime.utcnow():
            return jsonify({"valid": False}), 200

        return jsonify({"valid": True}), 200

    except Exception as e:
        logger.error(f"validate_reset_token error: {e}")
        return jsonify({"error": "An error occurred"}), 500


# ---------- Register ----------

@auth_bp.route("/auth/register", methods=["POST"])
@rate_limit(limit=100, window=3600, key_suffix=":register")  # 100/hour per IP — generous for test/dev
def register():
    try:
        data = request.get_json() or {}

        username = sanitize_string(data.get("username", ""))
        email = sanitize_string(data.get("email", ""))
        password = data.get("password", "")
        plan = sanitize_string(data.get("plan", "free"))

        if not all([username, email, password]):
            return jsonify({"error": "username, email and password are required"}), 400

        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400

        # Block disposable email providers
        from api.services.inbox_score import is_disposable_email
        if is_disposable_email(email):
            return jsonify({"error": "Disposable email addresses are not allowed. Please use a real email."}), 400

        is_strong, msg = validate_password(password)
        if not is_strong:
            return jsonify({"error": msg}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already exists"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400

        # When ENABLE_REGISTRATION_APPROVAL=true (production default), accounts start
        # pending and require admin activation. When false (dev/open signup), accounts
        # are immediately active so users can log in right away.
        require_approval = os.environ.get("ENABLE_REGISTRATION_APPROVAL", "false").lower() == "true"

        user = User(
            username=username,
            email=email,
            role="member",
            status="pending" if require_approval else "active",
            is_active=not require_approval,
            is_verified=not require_approval,
            plan_type=plan
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        _log_audit(user.id, "User registered", f"New user {username} registered (plan={plan})")

        # Notify admins only when approval workflow is active
        if require_approval:
            try:
                admins = User.query.filter(User.role.in_(["main_admin", "admin"])).all()
                for admin in admins:
                    db.session.add(Notification(
                        user_id=admin.id,
                        title="New User Registration",
                        message=f"{username} ({email}) signed up for {plan} plan — awaiting approval.",
                        type="info",
                        priority="high"
                    ))
                db.session.commit()
            except Exception as e:
                logger.error(f"Admin notification error: {e}")

        msg = "Registration successful! Your account is pending admin approval." if require_approval \
              else "Registration successful! You can now log in."

        return jsonify({
            "success": True,
            "message": msg,
            "user": user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"register error: {e}")
        return jsonify({"error": str(e)}), 500


# ---------- Login ----------

@auth_bp.route("/auth/login", methods=["POST"])
@rate_limit(limit=200, window=60, key_suffix=":login")  # 200/min per IP (generous for test/dev)
def login():
    try:
        data = request.get_json() or {}
        login_identifier = data.get("username", "").strip()
        password = data.get("password", "")

        if not login_identifier or not password:
            return jsonify({"error": "Username and password required"}), 400

        user = User.query.filter(
            (User.username == login_identifier) | (User.email == login_identifier)
        ).first()

        # Check brute-force lockout
        if user and user.is_account_locked():
            mins_left = max(0, int((user.account_locked_until - datetime.utcnow()).total_seconds() / 60))
            return jsonify({
                "error": f"Account locked due to too many failed attempts. Try again in {mins_left} minute(s)."
            }), 429

        # Validate credentials
        if not user or not user.check_password(password):
            if user:
                user.record_failed_login()
            return jsonify({"error": "Invalid credentials"}), 401

        # Check account status
        if user.status == "pending":
            return jsonify({"error": "Your account is pending admin approval"}), 403
        if user.status == "suspended":
            return jsonify({"error": "Your account has been suspended. Contact support."}), 403
        if user.status == "expired":
            return jsonify({"error": "Your subscription has expired. Please renew."}), 403
        if not user.is_active:
            return jsonify({"error": "Your account is inactive. Contact support."}), 403

        # 2FA check
        if user.two_factor_enabled:
            two_factor_token = data.get("two_factor_token")
            if not two_factor_token:
                return jsonify({
                    "message": "2FA required",
                    "two_factor_required": True,
                    "user_id": user.id
                }), 200  # 200 so frontend can show 2FA form

            if not user.verify_2fa_token(two_factor_token):
                user.record_failed_login()
                return jsonify({"error": "Invalid 2FA token"}), 401

        # Success — record login
        user.record_successful_login(request.remote_addr)
        session["user_id"] = user.id
        session["username"] = user.username
        session["role"] = user.role
        session.permanent = True

        token = user.generate_token()
        _log_audit(user.id, "User logged in", f"Login from {request.remote_addr}")

        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": user.to_dict(),
            "token": token
        }), 200

    except Exception as e:
        logger.error(f"login error: {e}")
        return jsonify({"error": str(e)}), 500


# ---------- Logout ----------

@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    try:
        user_id = session.get("user_id")
        if user_id:
            _log_audit(user_id, "User logged out")
        session.clear()
        return jsonify({"success": True, "message": "Logout successful"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- Current user / Validate ----------

@auth_bp.route("/auth/me", methods=["GET"])
def get_current_user_route():
    try:
        user = _get_user_from_request()
        if not user:
            return jsonify({"error": "Not authenticated"}), 401
        user_data = user.to_dict()
        # Flatten user fields to root for API compatibility (data.username, data.email, etc.)
        return jsonify({"success": True, "user": user_data, **user_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/auth/validate", methods=["GET"])
def validate_token():
    try:
        user = _get_user_from_request()
        if not user:
            return jsonify({"error": "No valid token provided"}), 401
        if user.status not in ("active",) or not user.is_active:
            return jsonify({"error": "Account not active"}), 403
        return jsonify({"success": True, "valid": True, "user": user.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/auth/refresh", methods=["POST"])
def refresh_token():
    try:
        user = _get_user_from_request()
        if not user:
            return jsonify({"error": "Not authenticated"}), 401
        return jsonify({"success": True, "token": user.generate_token()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- 2FA ----------

@auth_bp.route("/auth/2fa/generate", methods=["GET"])
@login_required
def generate_2fa():
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)

        if user.two_factor_enabled:
            return jsonify({"error": "2FA is already enabled. Disable first."}), 400

        secret = pyotp.random_base32()
        user.two_factor_secret = secret
        db.session.commit()

        provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email, issuer_name="Brain Link Tracker"
        )
        img = qrcode.make(provisioning_uri)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        qr_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        return jsonify({
            "secret": secret,
            "provisioning_uri": provisioning_uri,
            "qr_code_png_base64": qr_b64
        }), 200
    except Exception as e:
        logger.error(f"generate_2fa error: {e}")
        return jsonify({"error": "Error during 2FA generation"}), 500


@auth_bp.route("/auth/2fa/enable", methods=["POST"])
@login_required
def enable_2fa():
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)
        data = request.get_json() or {}
        token = data.get("token")

        if not token:
            return jsonify({"error": "Token is required"}), 400
        if not user.two_factor_secret:
            return jsonify({"error": "Generate 2FA secret first"}), 400
        if not user.verify_2fa_token(token):
            return jsonify({"error": "Invalid 2FA token"}), 400

        user.two_factor_enabled = True
        db.session.commit()
        _log_audit(user.id, "2FA Enabled")
        return jsonify({"success": True, "message": "2FA enabled successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"enable_2fa error: {e}")
        return jsonify({"error": "Error enabling 2FA"}), 500


@auth_bp.route("/auth/2fa/disable", methods=["POST"])
@login_required
def disable_2fa():
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)
        data = request.get_json() or {}
        password = data.get("password")

        if not password:
            return jsonify({"error": "Password required to disable 2FA"}), 400
        if not user.check_password(password):
            return jsonify({"error": "Invalid password"}), 401

        user.two_factor_enabled = False
        user.two_factor_secret = None
        db.session.commit()
        _log_audit(user.id, "2FA Disabled")
        return jsonify({"success": True, "message": "2FA disabled successfully"}), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"disable_2fa error: {e}")
        return jsonify({"error": "Error disabling 2FA"}), 500
