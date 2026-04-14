"""
messages.py — User ↔ Admin messaging system with thread management and notifications.
"""
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify, session, g
from api.database import db
from api.models.message import Thread, Message
from api.models.user import User
from api.models.notification import Notification
from api.middleware.auth_decorators import login_required, admin_required

logger = logging.getLogger(__name__)
messages_bp = Blueprint("messages", __name__)


def _get_user():
    return User.query.get(session.get("user_id"))


# ---------- Threads ----------

@messages_bp.route("/messages/threads", methods=["GET"])
@login_required
def get_threads():
    """Get threads — admins see all, users see own"""
    try:
        user = _get_user()
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        status_filter = request.args.get("status")

        if user.role in ("admin", "main_admin"):
            query = Thread.query
        else:
            query = Thread.query.filter_by(user_id=user.id)

        if status_filter:
            query = query.filter_by(status=status_filter)

        pagination = query.order_by(Thread.updated_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        # Enrich with last message preview and unread counts
        threads = []
        for t in pagination.items:
            td = t.to_dict()
            last_msg = t.messages.order_by(Message.created_at.desc()).first()
            td["last_message_preview"] = (last_msg.body[:100] + "..." if len(last_msg.body) > 100 else last_msg.body) if last_msg else None
            td["last_message_at"] = last_msg.created_at.isoformat() if last_msg else None
            td["unread_count"] = t.messages.filter(
                Message.sender_id != user.id, Message.is_read == False
            ).count()
            td["message_count"] = t.messages.count()
            td["username"] = t.user.username if t.user else "Unknown"
            threads.append(td)

        return jsonify({
            "success": True,
            "threads": threads,
            "total": pagination.total,
            "page": page,
            "pages": pagination.pages
        }), 200
    except Exception as e:
        logger.error(f"get_threads error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@messages_bp.route("/messages/threads", methods=["POST"])
@login_required
def create_thread():
    """User creates a new conversation thread"""
    try:
        user = _get_user()
        data = request.get_json() or {}
        subject = data.get("subject", "").strip()
        body = data.get("message", "").strip()
        priority = data.get("priority", "medium")

        if not subject or not body:
            return jsonify({"success": False, "error": "Subject and message are required"}), 400

        thread = Thread(user_id=user.id, subject=subject, priority=priority if hasattr(Thread, 'priority') else None)
        db.session.add(thread)
        db.session.flush()

        msg = Message(thread_id=thread.id, sender_id=user.id, body=body)
        db.session.add(msg)

        # Notify admins
        admins = User.query.filter(User.role.in_(["admin", "main_admin"])).all()
        for admin in admins:
            db.session.add(Notification(
                user_id=admin.id,
                title="New Support Message",
                message=f"{user.username} opened: {subject[:60]}",
                type="info",
                notification_type="message",
                priority="medium"
            ))

        db.session.commit()
        return jsonify({"success": True, "thread": thread.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"create_thread error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@messages_bp.route("/messages/threads/<int:thread_id>", methods=["GET"])
@login_required
def get_thread_messages(thread_id):
    """Get all messages in a thread"""
    try:
        user = _get_user()
        thread = Thread.query.get(thread_id)
        if not thread:
            return jsonify({"success": False, "error": "Thread not found"}), 404

        is_admin = user.role in ("admin", "main_admin")
        if not is_admin and thread.user_id != user.id:
            return jsonify({"success": False, "error": "Unauthorized"}), 403

        messages_list = thread.messages.order_by(Message.created_at.asc()).all()

        # Mark other party's messages as read
        for m in messages_list:
            if m.sender_id != user.id and not m.is_read:
                m.is_read = True
        db.session.commit()

        return jsonify({
            "success": True,
            "thread": thread.to_dict(),
            "messages": [m.to_dict() for m in messages_list]
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@messages_bp.route("/messages/threads/<int:thread_id>/reply", methods=["POST"])
@login_required
def reply_to_thread(thread_id):
    """Add a reply to a thread"""
    try:
        user = _get_user()
        data = request.get_json() or {}
        body = data.get("message", "").strip()

        if not body:
            return jsonify({"success": False, "error": "Message is required"}), 400

        thread = Thread.query.get(thread_id)
        if not thread:
            return jsonify({"success": False, "error": "Thread not found"}), 404

        is_admin = user.role in ("admin", "main_admin")
        if not is_admin and thread.user_id != user.id:
            return jsonify({"success": False, "error": "Unauthorized"}), 403

        msg = Message(thread_id=thread.id, sender_id=user.id, body=body)
        db.session.add(msg)

        thread.updated_at = datetime.utcnow()
        if thread.status == "resolved":
            thread.status = "open"  # Re-open on new reply

        if is_admin and not thread.admin_id:
            thread.admin_id = user.id  # Claim thread

        # Notify the other party
        notify_user_id = thread.user_id if is_admin else None
        if is_admin:
            # Notify the user
            db.session.add(Notification(
                user_id=thread.user_id,
                title="New Reply from Support",
                message=f"Admin replied to: {thread.subject[:60]}",
                type="info",
                notification_type="message",
                priority="medium"
            ))
        else:
            # Notify assigned admin or all admins
            admin_ids = [thread.admin_id] if thread.admin_id else \
                [a.id for a in User.query.filter(User.role.in_(["admin", "main_admin"])).all()]
            for aid in admin_ids:
                if aid:
                    db.session.add(Notification(
                        user_id=aid,
                        title="New User Reply",
                        message=f"{user.username} replied to: {thread.subject[:60]}",
                        type="info",
                        notification_type="message",
                        priority="medium"
                    ))

        db.session.commit()
        return jsonify({"success": True, "message": msg.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"reply error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@messages_bp.route("/messages/threads/<int:thread_id>/status", methods=["PATCH"])
@login_required
def update_thread_status(thread_id):
    """Update thread status — admin or thread owner"""
    try:
        user = _get_user()
        data = request.get_json() or {}
        status = data.get("status")

        if status not in ("open", "resolved", "closed"):
            return jsonify({"success": False, "error": "Invalid status"}), 400

        thread = Thread.query.get(thread_id)
        if not thread:
            return jsonify({"success": False, "error": "Thread not found"}), 404

        is_admin = user.role in ("admin", "main_admin")
        if not is_admin and thread.user_id != user.id:
            return jsonify({"success": False, "error": "Unauthorized"}), 403

        thread.status = status
        db.session.commit()

        return jsonify({"success": True, "thread": thread.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@messages_bp.route("/messages/unread-count", methods=["GET"])
@login_required
def get_unread_count():
    """Get total unread message count for sidebar badge"""
    user = _get_user()
    is_admin = user.role in ("admin", "main_admin")

    if is_admin:
        # Count unread messages in all threads where sender is not admin
        count = db.session.query(Message).join(Thread).filter(
            Message.sender_id != user.id,
            Message.is_read == False
        ).count()
    else:
        count = db.session.query(Message).join(Thread).filter(
            Thread.user_id == user.id,
            Message.sender_id != user.id,
            Message.is_read == False
        ).count()

    return jsonify({"success": True, "count": count}), 200
