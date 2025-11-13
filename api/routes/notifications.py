from flask import Blueprint, request, jsonify, session, g
from functools import wraps
from api.database import db
from api.models.user import User
from api.models.audit_log import AuditLog
from api.models.tracking_event import TrackingEvent
from api.models.link import Link
from api.models.notification import Notification # Import the new Notification model
from datetime import datetime, timedelta
import os

notifications_bp = Blueprint("notifications_api", __name__) # Renamed blueprint to avoid conflict

def login_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        
        user = User.query.get(session["user_id"])
        if not user:
            return jsonify({"error": "User not found"}), 401
        g.user = user # Set g.user for access in routes
        return f(*args, **kwargs)
    return decorated_function

def get_time_ago(timestamp):
    """Convert timestamp to human readable time ago with timezone awareness"""
    from datetime import timezone

    # Ensure timestamp is timezone-aware
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)

    # Use timezone-aware current time
    now = datetime.now(timezone.utc)
    diff = now - timestamp

    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    else:
        return "Just now"

@notifications_bp.route("/api/notifications", methods=["GET"])
@login_required
def get_all_notifications():
    """Get all notifications from database for the current user"""
    try:
        notifications = Notification.query.filter_by(user_id=g.user.id).order_by(Notification.created_at.desc()).all()
        return jsonify({
            "success": True,
            "notifications": [n.to_dict() for n in notifications]
        }), 200
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "notifications": []
        }), 500

@notifications_bp.route("/api/notifications/<int:notification_id>/read", methods=["PUT"])
@login_required
def mark_notification_as_read(notification_id):
    """Mark a specific notification as read"""
    try:
        notification = Notification.query.filter_by(id=notification_id, user_id=g.user.id).first()
        if not notification:
            return jsonify({"success": False, "error": "Notification not found"}), 404
        
        notification.read = True
        db.session.commit()
        return jsonify({"success": True, "message": "Notification marked as read"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error marking notification as read: {e}")
        return jsonify({"success": False, "error": "Failed to mark notification as read"}), 500

@notifications_bp.route("/api/notifications/<int:notification_id>/unread", methods=["PUT"])
@login_required
def mark_notification_as_unread(notification_id):
    """Mark a specific notification as unread"""
    try:
        notification = Notification.query.filter_by(id=notification_id, user_id=g.user.id).first()
        if not notification:
            return jsonify({"success": False, "error": "Notification not found"}), 404
        
        notification.read = False
        db.session.commit()
        return jsonify({"success": True, "message": "Notification marked as unread"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error marking notification as unread: {e}")
        return jsonify({"success": False, "error": "Failed to mark notification as unread"}), 500

@notifications_bp.route("/api/notifications/count", methods=["GET"])
@login_required
def get_notification_count():
    """Get unread notification count"""
    try:
        unread_count = Notification.query.filter_by(user_id=g.user.id, read=False).count()
        return jsonify({"count": unread_count, "success": True})
        
    except Exception as e:
        print(f"Error fetching notification count: {e}")
        return jsonify({"count": 0, "success": False})

@notifications_bp.route("/api/notifications/<int:notification_id>", methods=["DELETE"])
@login_required
def delete_notification(notification_id):
    """Delete a specific notification"""
    try:
        notification = Notification.query.filter_by(id=notification_id, user_id=g.user.id).first()
        if not notification:
            return jsonify({"success": False, "error": "Notification not found"}), 404
        
        db.session.delete(notification)
        db.session.commit()
        return jsonify({"success": True, "message": "Notification deleted"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting notification: {e}")
        return jsonify({"success": False, "error": "Failed to delete notification"}), 500



@notifications_bp.route("/api/notifications/mark-all-read", methods=["PUT"])
@login_required
def mark_all_notifications_read():
    """Mark all notifications as read"""
    try:
        notifications = Notification.query.filter_by(user_id=g.user.id, read=False).all()
        for notification in notifications:
            notification.read = True
        db.session.commit()
        return jsonify({"success": True, "message": "All notifications marked as read"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error marking all notifications as read: {e}")
        return jsonify({"success": False, "error": "Failed to mark all notifications as read"}), 500

