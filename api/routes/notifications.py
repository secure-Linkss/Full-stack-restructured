"""
notifications.py — Clean unified notifications endpoint.
All print() replaced with logger. Uses canonical login_required from middleware.
"""
import logging
from flask import Blueprint, request, jsonify, session, g
from api.database import db
from api.models.notification import Notification
from api.middleware.auth_decorators import login_required, admin_required

logger = logging.getLogger(__name__)
notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/api/notifications", methods=["GET"])
@login_required
def get_notifications():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    unread_only = request.args.get("unread_only", "false").lower() == "true"

    query = Notification.query.filter_by(user_id=session.get("user_id"))
    if unread_only:
        query = query.filter_by(read=False)

    notifications = query.order_by(Notification.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    unread_count = Notification.query.filter_by(user_id=session.get("user_id"), read=False).count()

    return jsonify({
        "success": True,
        "notifications": [n.to_dict() for n in notifications.items],
        "unread_count": unread_count,
        "total": notifications.total,
        "page": page,
        "pages": notifications.pages
    }), 200


@notifications_bp.route("/api/notifications/count", methods=["GET"])
@login_required
def get_notification_count():
    count = Notification.query.filter_by(user_id=session.get("user_id"), read=False).count()
    return jsonify({"success": True, "count": count}), 200


@notifications_bp.route("/api/notifications/<int:notification_id>/read", methods=["PATCH", "PUT"])
@login_required
def mark_as_read(notification_id):
    notif = Notification.query.filter_by(id=notification_id, user_id=session.get("user_id")).first()
    if not notif:
        return jsonify({"success": False, "error": "Notification not found"}), 404
    notif.read = True
    db.session.commit()
    return jsonify({"success": True}), 200


@notifications_bp.route("/api/notifications/mark-all-read", methods=["PATCH", "PUT"])
@login_required
def mark_all_read():
    Notification.query.filter_by(user_id=session.get("user_id"), read=False).update({"read": True})
    db.session.commit()
    return jsonify({"success": True}), 200


@notifications_bp.route("/api/notifications/<int:notification_id>", methods=["DELETE"])
@login_required
def delete_notification(notification_id):
    notif = Notification.query.filter_by(id=notification_id, user_id=session.get("user_id")).first()
    if not notif:
        return jsonify({"success": False, "error": "Notification not found"}), 404
    db.session.delete(notif)
    db.session.commit()
    return jsonify({"success": True}), 200


@notifications_bp.route("/api/notifications", methods=["POST"])
@admin_required
def create_notification():
    """Admin: broadcast notification to a user or all users"""
    data = request.get_json() or {}
    user_id = data.get("user_id")  # None = all users
    title = data.get("title")
    message = data.get("message")
    notif_type = data.get("type", "info")
    priority = data.get("priority", "medium")

    if not title or not message:
        return jsonify({"success": False, "error": "title and message required"}), 400

    from api.models.user import User
    if user_id:
        users = [User.query.get(user_id)]
        if not users[0]:
            return jsonify({"success": False, "error": "User not found"}), 404
    else:
        users = User.query.filter_by(role="member").all()

    count = 0
    for user in users:
        if user:
            db.session.add(Notification(
                user_id=user.id, title=title, message=message,
                type=notif_type, priority=priority
            ))
            count += 1

    db.session.commit()
    return jsonify({"success": True, "sent_to": count}), 201
