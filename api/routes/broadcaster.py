"""
Global Broadcaster System
Send system-wide notifications to all active users
"""

from flask import Blueprint, request, jsonify
from functools import wraps
from api.database import db
from api.models.user import User
from api.models.notification import Notification
from api.models.audit_log import AuditLog
from datetime import datetime

broadcaster_bp = Blueprint("broadcaster", __name__)

def get_current_user():
    """Get current user from token"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        user = User.verify_token(token)
        if user:
            return user
    return None

def admin_required(f):
    """Decorator to require admin or main_admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401

        if user.role not in ["admin", "main_admin"]:
            return jsonify({"error": "Admin access required"}), 403

        return f(user, *args, **kwargs)
    return decorated_function

@broadcaster_bp.route("/api/broadcaster/send", methods=["POST"])
@admin_required
def send_broadcast(current_user):
    """Send broadcast message to all active users"""
    try:
        data = request.get_json()

        # Validate required fields
        if not data.get("title"):
            return jsonify({"error": "Title is required"}), 400

        if not data.get("message"):
            return jsonify({"error": "Message is required"}), 400

        title = data["title"]
        message = data["message"]
        message_type = data.get("type", "info")  # info, warning, success, error
        priority = data.get("priority", "medium")  # low, medium, high

        # Get all active users
        active_users = User.query.filter_by(is_active=True, status="active").all()

        if not active_users:
            return jsonify({"error": "No active users found"}), 404

        # Create notifications for all active users
        notifications_created = 0
        for user in active_users:
            notification = Notification(
                user_id=user.id,
                title=title,
                message=message,
                type=message_type,
                priority=priority,
                read=False
            )
            db.session.add(notification)
            notifications_created += 1

        # Commit all notifications
        db.session.commit()

        # Log the broadcast action
        try:
            audit_log = AuditLog(
                actor_id=current_user.id,
                action=f"Broadcast message to {notifications_created} users",
                target_id=None,
                target_type="broadcast"
            )
            db.session.add(audit_log)
            db.session.commit()
        except Exception as e:
            print(f"Error logging broadcast action: {e}")

        return jsonify({
            "success": True,
            "message": f"Broadcast sent to {notifications_created} users",
            "recipients": notifications_created
        }), 200

    except Exception as e:
        print(f"Error sending broadcast: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to send broadcast"}), 500

@broadcaster_bp.route("/api/broadcaster/history", methods=["GET"])
@admin_required
def get_broadcast_history(current_user):
    """Get broadcast history from audit logs"""
    try:
        # Get recent broadcast actions from audit logs
        broadcasts = AuditLog.query.filter(
            AuditLog.target_type == "broadcast"
        ).order_by(AuditLog.created_at.desc()).limit(50).all()

        history = []
        for broadcast in broadcasts:
            actor = User.query.get(broadcast.actor_id)
            history.append({
                "id": broadcast.id,
                "actor": actor.username if actor else "Unknown",
                "action": broadcast.action,
                "created_at": broadcast.created_at.isoformat() if broadcast.created_at else None
            })

        return jsonify({"history": history}), 200

    except Exception as e:
        print(f"Error fetching broadcast history: {e}")
        return jsonify({"error": "Failed to fetch broadcast history"}), 500

@broadcaster_bp.route("/api/broadcaster/stats", methods=["GET"])
@admin_required
def get_broadcast_stats(current_user):
    """Get broadcast statistics"""
    try:
        # Total active users
        total_active_users = User.query.filter_by(is_active=True, status="active").count()

        # Total broadcasts sent (from audit logs)
        total_broadcasts = AuditLog.query.filter(
            AuditLog.target_type == "broadcast"
        ).count()

        # Recent broadcasts (last 7 days)
        from datetime import timedelta
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_broadcasts = AuditLog.query.filter(
            AuditLog.target_type == "broadcast",
            AuditLog.created_at >= seven_days_ago
        ).count()

        return jsonify({
            "total_active_users": total_active_users,
            "total_broadcasts": total_broadcasts,
            "recent_broadcasts": recent_broadcasts
        }), 200

    except Exception as e:
        print(f"Error fetching broadcast stats: {e}")
        return jsonify({"error": "Failed to fetch broadcast stats"}), 500
