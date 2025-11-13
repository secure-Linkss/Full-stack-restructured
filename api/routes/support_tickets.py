"""
Support Ticket System with Full Workflow
Handles ticket creation, replies, assignments, and status management
"""

from flask import Blueprint, request, jsonify
from functools import wraps
from api.database import db
from api.models.user import User
from api.models.notification import Notification
from api.models.audit_log import AuditLog
from datetime import datetime
from sqlalchemy import text

support_tickets_bp = Blueprint("support_tickets", __name__)

def get_current_user():
    """Get current user from token"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        user = User.verify_token(token)
        if user:
            return user
    return None

def login_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        return f(user, *args, **kwargs)
    return decorated_function

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

@support_tickets_bp.route("/api/support/tickets", methods=["GET"])
@login_required
def get_tickets(current_user):
    """Get support tickets (users see their own, admins see all)"""
    try:
        if current_user.role in ["admin", "main_admin"]:
            # Admins see all tickets
            query = text("""
                SELECT
                    st.*,
                    u.username as user_username,
                    u.email as user_email,
                    assigned.username as assigned_username,
                    (SELECT COUNT(*) FROM support_ticket_comments WHERE ticket_id = st.id) as reply_count
                FROM support_tickets st
                JOIN users u ON st.user_id = u.id
                LEFT JOIN users assigned ON st.assigned_to = assigned.id
                ORDER BY
                    CASE st.priority
                        WHEN 'urgent' THEN 1
                        WHEN 'high' THEN 2
                        WHEN 'medium' THEN 3
                        ELSE 4
                    END,
                    st.created_at DESC
            """)
        else:
            # Users see only their tickets
            query = text("""
                SELECT
                    st.*,
                    u.username as user_username,
                    u.email as user_email,
                    assigned.username as assigned_username,
                    (SELECT COUNT(*) FROM support_ticket_comments WHERE ticket_id = st.id) as reply_count
                FROM support_tickets st
                JOIN users u ON st.user_id = u.id
                LEFT JOIN users assigned ON st.assigned_to = assigned.id
                WHERE st.user_id = :user_id
                ORDER BY st.created_at DESC
            """)

        if current_user.role in ["admin", "main_admin"]:
            result = db.session.execute(query)
        else:
            result = db.session.execute(query, {"user_id": current_user.id})

        tickets = [dict(row._mapping) for row in result]

        return jsonify({"tickets": tickets}), 200

    except Exception as e:
        print(f"Error getting tickets: {e}")
        return jsonify({"error": "Failed to get tickets"}), 500

@support_tickets_bp.route("/api/support/tickets/<int:ticket_id>", methods=["GET"])
@login_required
def get_ticket_details(current_user, ticket_id):
    """Get ticket details with all replies"""
    try:
        # Get ticket
        ticket_query = text("""
            SELECT
                st.*,
                u.username as user_username,
                u.email as user_email,
                assigned.username as assigned_username
            FROM support_tickets st
            JOIN users u ON st.user_id = u.id
            LEFT JOIN users assigned ON st.assigned_to = assigned.id
            WHERE st.id = :ticket_id
        """)

        ticket_result = db.session.execute(ticket_query, {"ticket_id": ticket_id}).first()

        if not ticket_result:
            return jsonify({"error": "Ticket not found"}), 404

        ticket = dict(ticket_result._mapping)

        # Check permissions
        if current_user.role not in ["admin", "main_admin"] and ticket["user_id"] != current_user.id:
            return jsonify({"error": "Access denied"}), 403

        # Get replies
        replies_query = text("""
            SELECT
                stc.*,
                u.username,
                u.role
            FROM support_ticket_comments stc
            JOIN users u ON stc.user_id = u.id
            WHERE stc.ticket_id = :ticket_id
            ORDER BY stc.created_at ASC
        """)

        replies_result = db.session.execute(replies_query, {"ticket_id": ticket_id})
        replies = [dict(row._mapping) for row in replies_result]

        ticket["replies"] = replies

        return jsonify({"ticket": ticket}), 200

    except Exception as e:
        print(f"Error getting ticket details: {e}")
        return jsonify({"error": "Failed to get ticket details"}), 500

@support_tickets_bp.route("/api/support/tickets", methods=["POST"])
@login_required
def create_ticket(current_user):
    """Create new support ticket"""
    try:
        data = request.get_json()

        if not all(k in data for k in ["subject", "description"]):
            return jsonify({"error": "Subject and description required"}), 400

        # Insert ticket
        insert_query = text("""
            INSERT INTO support_tickets
            (user_id, subject, description, category, priority, status, created_at, updated_at)
            VALUES
            (:user_id, :subject, :description, :category, :priority, :status, :created_at, :updated_at)
            RETURNING id
        """)

        result = db.session.execute(insert_query, {
            "user_id": current_user.id,
            "subject": data["subject"],
            "description": data["description"],
            "category": data.get("category", "general"),
            "priority": data.get("priority", "medium"),
            "status": "open",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        ticket_id = result.fetchone()[0]
        db.session.commit()

        # Notify admins
        admin_users = User.query.filter(User.role.in_(["admin", "main_admin"])).all()
        for admin in admin_users:
            notification = Notification(
                user_id=admin.id,
                title="New Support Ticket",
                message=f"User {current_user.username} created ticket: {data['subject']}",
                type="info",
                priority="medium"
            )
            db.session.add(notification)

        db.session.commit()

        return jsonify({
            "success": True,
            "ticket_id": ticket_id,
            "message": "Ticket created successfully"
        }), 201

    except Exception as e:
        print(f"Error creating ticket: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to create ticket"}), 500

@support_tickets_bp.route("/api/support/tickets/<int:ticket_id>/reply", methods=["POST"])
@login_required
def reply_to_ticket(current_user, ticket_id):
    """Reply to a support ticket"""
    try:
        data = request.get_json()

        if "message" not in data or not data["message"]:
            return jsonify({"error": "Message is required"}), 400

        # Get ticket to verify access
        ticket_query = text("SELECT user_id FROM support_tickets WHERE id = :ticket_id")
        ticket = db.session.execute(ticket_query, {"ticket_id": ticket_id}).first()

        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        # Check permissions
        is_admin = current_user.role in ["admin", "main_admin"]
        is_owner = ticket[0] == current_user.id

        if not (is_admin or is_owner):
            return jsonify({"error": "Access denied"}), 403

        # Insert reply
        insert_query = text("""
            INSERT INTO support_ticket_comments
            (ticket_id, user_id, message, is_internal, created_at)
            VALUES
            (:ticket_id, :user_id, :message, :is_internal, :created_at)
            RETURNING id
        """)

        result = db.session.execute(insert_query, {
            "ticket_id": ticket_id,
            "user_id": current_user.id,
            "message": data["message"],
            "is_internal": data.get("is_internal", False),
            "created_at": datetime.utcnow()
        })

        reply_id = result.fetchone()[0]

        # Update ticket status and timestamp
        update_query = text("""
            UPDATE support_tickets
            SET
                status = CASE
                    WHEN status = 'resolved' THEN 'open'
                    WHEN :is_admin = true THEN 'waiting_response'
                    ELSE status
                END,
                updated_at = :updated_at
            WHERE id = :ticket_id
        """)

        db.session.execute(update_query, {
            "ticket_id": ticket_id,
            "is_admin": is_admin,
            "updated_at": datetime.utcnow()
        })

        db.session.commit()

        # Send notification to relevant user
        if is_admin:
            # Notify ticket owner
            notification = Notification(
                user_id=ticket[0],
                title="Support Ticket Reply",
                message=f"Admin replied to your ticket #{ticket_id}",
                type="info",
                priority="medium"
            )
            db.session.add(notification)
        else:
            # Notify admins
            admin_users = User.query.filter(User.role.in_(["admin", "main_admin"])).all()
            for admin in admin_users:
                notification = Notification(
                    user_id=admin.id,
                    title="Ticket Reply",
                    message=f"User replied to ticket #{ticket_id}",
                    type="info",
                    priority="medium"
                )
                db.session.add(notification)

        db.session.commit()

        return jsonify({
            "success": True,
            "reply_id": reply_id,
            "message": "Reply posted successfully"
        }), 201

    except Exception as e:
        print(f"Error replying to ticket: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to post reply"}), 500

@support_tickets_bp.route("/api/support/tickets/<int:ticket_id>/status", methods=["PATCH"])
@admin_required
def update_ticket_status(current_user, ticket_id):
    """Update ticket status (Admin only)"""
    try:
        data = request.get_json()
        new_status = data.get("status")

        valid_statuses = ["open", "in_progress", "waiting_response", "resolved", "closed"]
        if new_status not in valid_statuses:
            return jsonify({"error": "Invalid status"}), 400

        update_query = text("""
            UPDATE support_tickets
            SET
                status = :status,
                resolved_at = CASE WHEN :status IN ('resolved', 'closed') THEN :resolved_at ELSE NULL END,
                updated_at = :updated_at
            WHERE id = :ticket_id
            RETURNING user_id
        """)

        result = db.session.execute(update_query, {
            "ticket_id": ticket_id,
            "status": new_status,
            "resolved_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        user_id = result.fetchone()
        if not user_id:
            return jsonify({"error": "Ticket not found"}), 404

        db.session.commit()

        # Notify user
        notification = Notification(
            user_id=user_id[0],
            title="Ticket Status Updated",
            message=f"Your ticket #{ticket_id} status changed to: {new_status}",
            type="info",
            priority="medium"
        )
        db.session.add(notification)

        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Updated ticket #{ticket_id} status to {new_status}",
            target_id=ticket_id,
            target_type="support_ticket"
        )
        db.session.add(audit_log)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Ticket status updated"
        }), 200

    except Exception as e:
        print(f"Error updating ticket status: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to update status"}), 500

@support_tickets_bp.route("/api/support/tickets/<int:ticket_id>/assign", methods=["PATCH"])
@admin_required
def assign_ticket(current_user, ticket_id):
    """Assign ticket to an admin"""
    try:
        data = request.get_json()
        admin_id = data.get("admin_id")

        if admin_id:
            # Verify admin exists and has correct role
            admin = User.query.get(admin_id)
            if not admin or admin.role not in ["admin", "main_admin"]:
                return jsonify({"error": "Invalid admin user"}), 400

        update_query = text("""
            UPDATE support_tickets
            SET
                assigned_to = :admin_id,
                status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
                updated_at = :updated_at
            WHERE id = :ticket_id
            RETURNING user_id
        """)

        result = db.session.execute(update_query, {
            "ticket_id": ticket_id,
            "admin_id": admin_id,
            "updated_at": datetime.utcnow()
        })

        user_id = result.fetchone()
        if not user_id:
            return jsonify({"error": "Ticket not found"}), 404

        db.session.commit()

        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Assigned ticket #{ticket_id} to admin {admin_id}",
            target_id=ticket_id,
            target_type="support_ticket"
        )
        db.session.add(audit_log)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Ticket assigned successfully"
        }), 200

    except Exception as e:
        print(f"Error assigning ticket: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to assign ticket"}), 500

@support_tickets_bp.route("/api/support/tickets/<int:ticket_id>/priority", methods=["PATCH"])
@admin_required
def update_ticket_priority(current_user, ticket_id):
    """Update ticket priority"""
    try:
        data = request.get_json()
        priority = data.get("priority")

        valid_priorities = ["low", "medium", "high", "urgent"]
        if priority not in valid_priorities:
            return jsonify({"error": "Invalid priority"}), 400

        update_query = text("""
            UPDATE support_tickets
            SET priority = :priority, updated_at = :updated_at
            WHERE id = :ticket_id
        """)

        db.session.execute(update_query, {
            "ticket_id": ticket_id,
            "priority": priority,
            "updated_at": datetime.utcnow()
        })

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Priority updated"
        }), 200

    except Exception as e:
        print(f"Error updating priority: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to update priority"}), 500

@support_tickets_bp.route("/api/support/stats", methods=["GET"])
@admin_required
def get_support_stats(current_user):
    """Get support ticket statistics"""
    try:
        stats_query = text("""
            SELECT
                COUNT(*) as total_tickets,
                COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
                COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
                COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
                COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tickets,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as tickets_today
            FROM support_tickets
        """)

        result = db.session.execute(stats_query).first()
        stats = dict(result._mapping) if result else {}

        return jsonify({"stats": stats}), 200

    except Exception as e:
        print(f"Error getting stats: {e}")
        return jsonify({"error": "Failed to get statistics"}), 500
