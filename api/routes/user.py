"""
user.py — User profile and settings routes.
Aliases /api/user/profile for frontend compatibility.
"""
import logging
from flask import Blueprint, request, jsonify, session, g
from api.database import db
from api.models.user import User
from api.middleware.auth_decorators import login_required

logger = logging.getLogger(__name__)
user_bp = Blueprint("user", __name__)


def _get_user():
    return User.query.get(g.user.id)


# ---------- Profile — both /user/profile and /profile are supported ----------

@user_bp.route("/user/profile", methods=["GET"])
@user_bp.route("/profile", methods=["GET"])
@user_bp.route("/auth/profile", methods=["GET"])
@login_required
def get_profile():
    user = _get_user()
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
    user_data = user.to_dict()
    # Flatten user fields to root level for API compatibility (data.username, data.email, etc.)
    return jsonify({"success": True, "user": user_data, **user_data}), 200


@user_bp.route("/user/profile", methods=["PATCH", "PUT"])
@user_bp.route("/profile", methods=["PATCH", "PUT"])
@login_required
def update_profile():
    user = _get_user()
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404

    data = request.get_json() or {}
    allowed = ["email", "phone", "country", "timezone", "language", "theme", "bio",
               "avatar", "profile_picture", "notification_settings", "preferences"]

    for field in allowed:
        if field in data:
            # Email uniqueness check
            if field == "email":
                existing = User.query.filter_by(email=data["email"]).first()
                if existing and existing.id != user.id:
                    return jsonify({"success": False, "error": "Email already in use"}), 400
            setattr(user, field, data[field])

    db.session.commit()
    return jsonify({"success": True, "user": user.to_dict()}), 200


@user_bp.route("/user/password", methods=["PATCH"])
@login_required
def change_password():
    user = _get_user()
    data = request.get_json() or {}
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return jsonify({"success": False, "error": "current_password and new_password required"}), 400

    if not user.check_password(current_password):
        return jsonify({"success": False, "error": "Current password is incorrect"}), 400

    from api.utils.validation import validate_password
    is_strong, msg = validate_password(new_password)
    if not is_strong:
        return jsonify({"success": False, "error": msg}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"success": True, "message": "Password updated successfully"}), 200


@user_bp.route("/user/telegram", methods=["GET"])
@login_required
def get_telegram_settings():
    user = _get_user()
    return jsonify({
        "success": True,
        "telegram_enabled": user.telegram_enabled,
        "telegram_chat_id": user.telegram_chat_id or "",
        "has_bot_token": bool(user.telegram_bot_token)
    }), 200


@user_bp.route("/user/telegram", methods=["PATCH"])
@login_required
def update_telegram_settings():
    user = _get_user()
    data = request.get_json() or {}

    if "telegram_enabled" in data:
        user.telegram_enabled = data["telegram_enabled"]
    if "telegram_chat_id" in data:
        user.telegram_chat_id = data["telegram_chat_id"]
    if "telegram_bot_token" in data and data["telegram_bot_token"]:
        user.telegram_bot_token = data["telegram_bot_token"]

    db.session.commit()
    return jsonify({"success": True, "message": "Telegram settings updated"}), 200


@user_bp.route("/api/telegram/test", methods=["POST"])
@login_required
def test_telegram():
    """Test Telegram bot connection and save credentials if successful"""
    import requests as http_requests
    user = _get_user()
    data = request.get_json() or {}
    bot_token = data.get("bot_token")
    chat_id = data.get("chat_id")

    if not bot_token or not chat_id:
        return jsonify({"success": False, "error": "bot_token and chat_id required"}), 400

    try:
        msg = (
            "🔗 <b>Brain Link Tracker</b>\n\n"
            "✅ Telegram integration is working!\n"
            "You will now receive tracking alerts here."
        )
        resp = http_requests.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={"chat_id": chat_id, "text": msg, "parse_mode": "HTML"},
            timeout=10
        )
        if resp.status_code == 200:
            user.telegram_bot_token = bot_token
            user.telegram_chat_id = chat_id
            user.telegram_enabled = True
            db.session.commit()
            return jsonify({"success": True, "message": "Test message sent successfully!"}), 200
        else:
            err = resp.json().get("description", "Unknown error")
            return jsonify({"success": False, "error": f"Telegram API error: {err}"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@user_bp.route("/api/telegram/settings", methods=["GET"])
@login_required
def telegram_settings_get():
    user = _get_user()
    return jsonify({
        "success": True,
        "telegram_enabled": user.telegram_enabled,
        "telegram_chat_id": user.telegram_chat_id or "",
        "has_bot_token": bool(user.telegram_bot_token)
    }), 200


@user_bp.route("/api/telegram/settings", methods=["POST"])
@login_required
def telegram_settings_post():
    user = _get_user()
    data = request.get_json() or {}
    if "telegram_enabled" in data:
        user.telegram_enabled = data["telegram_enabled"]
    if "telegram_chat_id" in data:
        user.telegram_chat_id = data["telegram_chat_id"]
    if data.get("telegram_bot_token"):
        user.telegram_bot_token = data["telegram_bot_token"]
    db.session.commit()
    return jsonify({"success": True, "message": "Telegram settings updated"}), 200
