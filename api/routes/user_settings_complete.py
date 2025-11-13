"""
COMPLETE USER SETTINGS ROUTES
==============================
This file provides all user settings endpoints needed by Settings.jsx:
- /api/user/settings (GET - fetch current settings)
- /api/user/profile (PUT - update profile)
- /api/user/password (PUT - change password)
- /api/user/notifications (PUT - update notification preferences)
- /api/user/preferences (PUT - update app preferences)

All routes filter by current user_id
"""

from flask import Blueprint, request, jsonify, session, g
from api.database import db
from api.models.user import User
from werkzeug.security import check_password_hash, generate_password_hash
from functools import wraps
import json

user_settings_bp = Blueprint("user_settings", __name__)

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Not authenticated"}), 401
        
        user = User.query.get(session["user_id"])
        if not user:
            return jsonify({"error": "User not found"}), 401
        g.user = user
        return f(*args, **kwargs)
    
    return decorated_function


@user_settings_bp.route("/api/user/settings", methods=["GET"])
@require_auth
def get_user_settings():
    """Get all user settings"""
    try:
        user = g.user
        
        # Parse settings if they exist
        notifications = {}
        preferences = {}
        
        # Try to get notification settings from user metadata or default
        if hasattr(user, 'notification_settings') and user.notification_settings:
            try:
                notifications = json.loads(user.notification_settings)
            except:
                notifications = {
                    "emailNotifications": True,
                    "clickAlerts": False,
                    "weeklyReport": True,
                    "securityAlerts": True
                }
        else:
            notifications = {
                "emailNotifications": True,
                "clickAlerts": False,
                "weeklyReport": True,
                "securityAlerts": True
            }
        
        # Try to get preferences from user metadata or default
        if hasattr(user, 'preferences') and user.preferences:
            try:
                preferences = json.loads(user.preferences)
            except:
                preferences = {
                    "timezone": "UTC",
                    "language": "en",
                    "theme": "dark"
                }
        else:
            preferences = {
                "timezone": "UTC",
                "language": "en",
                "theme": "dark"
            }
        
        return jsonify({
            "username": user.username,
            "email": user.email,
            "notifications": notifications,
            "preferences": preferences
        })
    
    except Exception as e:
        print(f"Error fetching user settings: {e}")
        return jsonify({"error": str(e)}), 500


@user_settings_bp.route("/api/user/profile", methods=["PUT"])
@require_auth
def update_user_profile():
    """Update user profile information"""
    try:
        user = g.user
        data = request.get_json()
        
        # Update username if provided
        if "username" in data and data["username"]:
            # Check if username is already taken by another user
            existing_user = User.query.filter(
                User.username == data["username"],
                User.id != user.id
            ).first()
            if existing_user:
                return jsonify({"error": "Username already taken"}), 400
            user.username = data["username"]
        
        # Update email if provided
        if "email" in data and data["email"]:
            # Check if email is already taken by another user
            existing_user = User.query.filter(
                User.email == data["email"],
                User.id != user.id
            ).first()
            if existing_user:
                return jsonify({"error": "Email already taken"}), 400
            user.email = data["email"]
        
        db.session.commit()
        
        return jsonify({
            "message": "Profile updated successfully",
            "username": user.username,
            "email": user.email
        })
    
    except Exception as e:
        print(f"Error updating profile: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@user_settings_bp.route("/api/user/password", methods=["PUT"])
@require_auth
def change_user_password():
    """Change user password"""
    try:
        user = g.user
        data = request.get_json()
        
        current_password = data.get("currentPassword")
        new_password = data.get("newPassword")
        
        if not current_password or not new_password:
            return jsonify({"error": "Both current and new password are required"}), 400
        
        # Verify current password
        if not check_password_hash(user.password, current_password):
            return jsonify({"error": "Current password is incorrect"}), 401
        
        # Validate new password strength
        if len(new_password) < 8:
            return jsonify({"error": "New password must be at least 8 characters"}), 400
        
        # Update password
        user.password = generate_password_hash(new_password)
        db.session.commit()
        
        return jsonify({"message": "Password changed successfully"})
    
    except Exception as e:
        print(f"Error changing password: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@user_settings_bp.route("/api/user/notifications", methods=["PUT"])
@require_auth
def update_notification_settings():
    """Update notification preferences"""
    try:
        user = g.user
        data = request.get_json()
        
        # Store notification settings as JSON in user model
        # If the user model doesn't have this field, we'll need to add it
        notification_settings = {
            "emailNotifications": data.get("emailNotifications", True),
            "clickAlerts": data.get("clickAlerts", False),
            "weeklyReport": data.get("weeklyReport", True),
            "securityAlerts": data.get("securityAlerts", True)
        }
        
        # Store in database
        # Note: This assumes the User model has a notification_settings text field
        # If not, we'll store it in a separate table or add the field
        if hasattr(user, 'notification_settings'):
            user.notification_settings = json.dumps(notification_settings)
        else:
            # Fallback: store in a metadata field if available
            if hasattr(user, 'metadata'):
                metadata = json.loads(user.metadata) if user.metadata else {}
                metadata['notification_settings'] = notification_settings
                user.metadata = json.dumps(metadata)
        
        db.session.commit()
        
        return jsonify({"message": "Notification settings updated successfully"})
    
    except Exception as e:
        print(f"Error updating notification settings: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@user_settings_bp.route("/api/user/preferences", methods=["PUT"])
@require_auth
def update_user_preferences():
    """Update user preferences (timezone, language, theme)"""
    try:
        user = g.user
        data = request.get_json()
        
        # Store preferences as JSON
        user_preferences = {
            "timezone": data.get("timezone", "UTC"),
            "language": data.get("language", "en"),
            "theme": data.get("theme", "dark")
        }
        
        # Store in database
        if hasattr(user, 'preferences'):
            user.preferences = json.dumps(user_preferences)
        else:
            # Fallback: store in metadata field
            if hasattr(user, 'metadata'):
                metadata = json.loads(user.metadata) if user.metadata else {}
                metadata['preferences'] = user_preferences
                user.metadata = json.dumps(metadata)
        
        db.session.commit()
        
        return jsonify({"message": "Preferences updated successfully"})
    
    except Exception as e:
        print(f"Error updating preferences: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
