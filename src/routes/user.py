from flask import Blueprint, request, jsonify, session
from src.models.user import User, db
from functools import wraps
import re

user_bp = Blueprint("user", __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

def validate_email(email):
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None

def sanitize_input(text):
    if not text:
        return ""
    return text.strip()

@user_bp.route("/user/profile", methods=["GET"])
@login_required
def get_profile():
    """Get user profile"""
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(user.to_dict()), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route("/user/profile", methods=["PATCH"])
@login_required
def update_profile():
    """Update user profile"""
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()

        if "email" in data:
            existing = User.query.filter_by(email=data["email"]).first()
            if existing and existing.id != user.id:
                return jsonify({"error": "Email already in use"}), 400
            user.email = data["email"]

        if "settings" in data:
            user.settings = data["settings"]

        db.session.commit()

        return jsonify(user.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@user_bp.route("/user/password", methods=["PATCH"])
@login_required
def change_password():
    """Change user password"""
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json()
        current_password = data.get("current_password")
        new_password = data.get("new_password")

        if not current_password or not new_password:
            return jsonify({"error": "Current and new password required"}), 400

        if not user.check_password(current_password):
            return jsonify({"error": "Current password is incorrect"}), 400

        if len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400

        user.set_password(new_password)
        db.session.commit()

        return jsonify({"message": "Password updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Admin-related user management routes (from the 00392b0 version)
# These routes should ideally be in an admin-specific blueprint and protected by admin role checks.
# For now, they are included here, but note that they lack authentication/authorization.

@user_bp.route("/users", methods=["GET"])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route("/users", methods=["POST"])
def create_user():
    data = request.json
    user = User(username=data["username"], email=data["email"])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@user_bp.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    user.username = data.get("username", user.username)
    user.email = data.get("email", user.email)
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return "", 204

