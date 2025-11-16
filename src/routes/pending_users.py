"""
Pending Users Management
Handle user registration approval system
"""

from flask import Blueprint, request, jsonify
from functools import wraps
from src.database import db
from src.models.user import User
from src.models.notification import Notification
from src.models.audit_log import AuditLog
from datetime import datetime

pending_users_bp = Blueprint("pending_users", __name__)

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

@pending_users_bp.route("/api/pending-users", methods=["GET"])
@admin_required
def get_pending_users(current_user):
    """Get all pending users awaiting approval"""
    try:
        pending_users = User.query.filter_by(status="pending").order_by(User.created_at.desc()).all()

        users_data = []
        for user in pending_users:
            users_data.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "plan_type": user.plan_type,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "is_verified": user.is_verified
            })

        return jsonify({
            "success": True,
            "pending_users": users_data,
            "count": len(users_data)
        }), 200

    except Exception as e:
        print(f"Error fetching pending users: {e}")
        return jsonify({"error": "Failed to fetch pending users"}), 500

@pending_users_bp.route("/api/pending-users/<int:user_id>/approve", methods=["POST"])
@admin_required
def approve_user(current_user, user_id):
    """Approve a pending user"""
    try:
        user = User.query.get_or_404(user_id)

        if user.status != "pending":
            return jsonify({"error": "User is not pending approval"}), 400

        # Update user status to active
        user.status = "active"
        user.is_active = True
        user.is_verified = True

        db.session.commit()

        # Create notification for the user
        try:
            notification = Notification(
                user_id=user.id,
                title="Account Approved",
                message=f"Your account has been approved by an administrator. You can now access all features.",
                type="success",
                priority="high"
            )
            db.session.add(notification)
            db.session.commit()
        except Exception as e:
            print(f"Error creating notification: {e}")

        # Log the action
        try:
            audit_log = AuditLog(
                actor_id=current_user.id,
                action=f"Approved user {user.username}",
                target_id=user.id,
                target_type="user"
            )
            db.session.add(audit_log)
            db.session.commit()
        except Exception as e:
            print(f"Error logging approval action: {e}")

        return jsonify({
            "success": True,
            "message": f"User {user.username} has been approved",
            "user": user.to_dict()
        }), 200

    except Exception as e:
        print(f"Error approving user: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to approve user"}), 500

@pending_users_bp.route("/api/pending-users/<int:user_id>/reject", methods=["POST"])
@admin_required
def reject_user(current_user, user_id):
    """Reject a pending user"""
    try:
        data = request.get_json() or {}
        reason = data.get("reason", "Your registration has been rejected by an administrator")

        user = User.query.get_or_404(user_id)

        if user.status != "pending":
            return jsonify({"error": "User is not pending approval"}), 400

        username = user.username
        email = user.email

        # Create notification before deletion
        try:
            notification = Notification(
                user_id=user.id,
                title="Account Rejected",
                message=reason,
                type="error",
                priority="high"
            )
            db.session.add(notification)
            db.session.commit()
        except Exception as e:
            print(f"Error creating notification: {e}")

        # Log the action before deletion
        try:
            audit_log = AuditLog(
                actor_id=current_user.id,
                action=f"Rejected user {username} ({email})",
                target_id=user.id,
                target_type="user"
            )
            db.session.add(audit_log)
            db.session.commit()
        except Exception as e:
            print(f"Error logging rejection action: {e}")

        # Delete the user
        db.session.delete(user)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": f"User {username} has been rejected and removed"
        }), 200

    except Exception as e:
        print(f"Error rejecting user: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to reject user"}), 500

@pending_users_bp.route("/api/pending-users/<int:user_id>/suspend", methods=["POST"])
@admin_required
def suspend_pending_user(current_user, user_id):
    """Suspend a pending user (keep for review)"""
    try:
        data = request.get_json() or {}
        reason = data.get("reason", "Your account is under review")

        user = User.query.get_or_404(user_id)

        if user.status != "pending":
            return jsonify({"error": "User is not pending approval"}), 400

        # Update user status to suspended
        user.status = "suspended"
        user.is_active = False

        db.session.commit()

        # Create notification
        try:
            notification = Notification(
                user_id=user.id,
                title="Account Under Review",
                message=reason,
                type="warning",
                priority="high"
            )
            db.session.add(notification)
            db.session.commit()
        except Exception as e:
            print(f"Error creating notification: {e}")

        # Log the action
        try:
            audit_log = AuditLog(
                actor_id=current_user.id,
                action=f"Suspended pending user {user.username}",
                target_id=user.id,
                target_type="user"
            )
            db.session.add(audit_log)
            db.session.commit()
        except Exception as e:
            print(f"Error logging suspension action: {e}")

        return jsonify({
            "success": True,
            "message": f"User {user.username} has been suspended",
            "user": user.to_dict()
        }), 200

    except Exception as e:
        print(f"Error suspending user: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to suspend user"}), 500

@pending_users_bp.route("/api/pending-users/bulk-approve", methods=["POST"])
@admin_required
def bulk_approve_users(current_user):
    """Approve multiple users at once"""
    try:
        data = request.get_json()
        user_ids = data.get("user_ids", [])

        if not user_ids:
            return jsonify({"error": "No user IDs provided"}), 400

        approved_count = 0
        for user_id in user_ids:
            try:
                user = User.query.get(user_id)
                if user and user.status == "pending":
                    user.status = "active"
                    user.is_active = True
                    user.is_verified = True

                    # Create notification
                    notification = Notification(
                        user_id=user.id,
                        title="Account Approved",
                        message="Your account has been approved. Welcome!",
                        type="success",
                        priority="high"
                    )
                    db.session.add(notification)
                    approved_count += 1
            except Exception as e:
                print(f"Error approving user {user_id}: {e}")

        db.session.commit()

        # Log bulk approval
        try:
            audit_log = AuditLog(
                actor_id=current_user.id,
                action=f"Bulk approved {approved_count} users",
                target_id=None,
                target_type="user"
            )
            db.session.add(audit_log)
            db.session.commit()
        except Exception as e:
            print(f"Error logging bulk approval: {e}")

        return jsonify({
            "success": True,
            "message": f"Approved {approved_count} users",
            "approved_count": approved_count
        }), 200

    except Exception as e:
        print(f"Error bulk approving users: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to bulk approve users"}), 500

@pending_users_bp.route("/api/pending-users/stats", methods=["GET"])
@admin_required
def get_pending_stats(current_user):
    """Get statistics about pending users"""
    try:
        total_pending = User.query.filter_by(status="pending").count()

        # Get pending users by date
        from datetime import timedelta
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday = today - timedelta(days=1)
        week_ago = today - timedelta(days=7)

        today_pending = User.query.filter(
            User.status == "pending",
            User.created_at >= today
        ).count()

        yesterday_pending = User.query.filter(
            User.status == "pending",
            User.created_at >= yesterday,
            User.created_at < today
        ).count()

        week_pending = User.query.filter(
            User.status == "pending",
            User.created_at >= week_ago
        ).count()

        return jsonify({
            "total_pending": total_pending,
            "today_pending": today_pending,
            "yesterday_pending": yesterday_pending,
            "week_pending": week_pending
        }), 200

    except Exception as e:
        print(f"Error fetching pending stats: {e}")
        return jsonify({"error": "Failed to fetch pending stats"}), 500
