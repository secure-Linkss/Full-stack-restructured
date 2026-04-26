import logging
from flask import Blueprint, request, jsonify, session, make_response, g
from werkzeug.security import generate_password_hash
from api.database import db
from api.models.user import User
from api.models.campaign import Campaign
from api.models.audit_log import AuditLog
from api.models.link import Link
from api.models.domain import Domain
from api.models.payment import Payment
from api.models.notification import Notification
from api.middleware.auth_decorators import login_required, admin_required, main_admin_required
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
admin_bp = Blueprint("admin", __name__)


def log_admin_action(actor_id, action, target_id=None, target_type=None):
    """Log admin actions to audit_logs"""
    try:
        db.session.add(AuditLog(
            actor_id=actor_id, action=action,
            target_id=target_id, target_type=target_type,
            ip_address=request.remote_addr
        ))
        db.session.commit()
    except Exception as e:
        logger.error(f"Audit log error: {e}")

# User Management Endpoints
@admin_bp.route("/api/admin/users", methods=["GET"])
@admin_required
def get_users(current_user):
    """Get all users (with pagination)"""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)
    status_filter = request.args.get("status")
    role_filter = request.args.get("role")

    query = User.query
    if current_user.role != "main_admin":
        query = query.filter_by(role="member")
    if status_filter:
        query = query.filter_by(status=status_filter)
    if role_filter:
        query = query.filter_by(role=role_filter)

    users = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "success": True,
        "users": [u.to_dict(include_sensitive=True) for u in users.items],
        "total": users.total,
        "page": page,
        "pages": users.pages
    })

@admin_bp.route("/api/admin/users/<int:user_id>", methods=["GET"])
@admin_required
def get_user(current_user, user_id):
    """Get specific user details"""
    user = User.query.get_or_404(user_id)
    
    # Admin can only view members
    if current_user.role == "admin" and user.role != "member":
        return jsonify({"error": "Access denied"}), 403
    
    return jsonify(user.to_dict(include_sensitive=True))

@admin_bp.route("/api/admin/users", methods=["POST"])
@admin_required
def create_user(current_user):
    """Create new user (Main Admin: any role, Admin: members only)"""
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ["username", "email", "password"]):
        return jsonify({"error": "Missing required fields"}), 400
    
    # Check role permissions
    role = data.get("role", "member")
    if current_user.role == "admin" and role != "member":
        return jsonify({"error": "Admin can only create members"}), 403
    
    # Check if username/email already exists
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 400
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 400
    
    # Create user
    user = User(
        username=data["username"],
        email=data["email"],
        role=role,
        is_active=data.get("is_active", True),
        is_verified=data.get("is_verified", False),
        plan_type=data.get("plan_type", "free")
    )
    user.set_password(data["password"])
    
    if "subscription_expiry" in data:
        user.subscription_expiry = datetime.fromisoformat(data["subscription_expiry"]) if data["subscription_expiry"] else None
    
    db.session.add(user)
    db.session.commit()
    
    # Log action
    log_admin_action(current_user.id, f"Created user {user.username}", user.id, "user")
    
    return jsonify(user.to_dict()), 201

@admin_bp.route("/api/admin/users/<int:user_id>", methods=["PATCH"])
@admin_required
def update_user(current_user, user_id):
    """Update user details"""
    user = User.query.get_or_404(user_id)
    
    # Admin can only edit members
    if current_user.role == "admin" and user.role != "member":
        return jsonify({"error": "Access denied"}), 403
    
    data = request.get_json()
    
    # Update allowed fields
    if "email" in data:
        user.email = data["email"]
    if "is_active" in data:
        user.is_active = data["is_active"]
    if "is_verified" in data:
        user.is_verified = data["is_verified"]
    if "plan_type" in data:
        user.plan_type = data["plan_type"]
    if "subscription_expiry" in data:
        user.subscription_expiry = datetime.fromisoformat(data["subscription_expiry"]) if data["subscription_expiry"] else None
    
    db.session.commit()
    
    # Log action
    log_admin_action(current_user.id, f"Updated user {user.username}", user.id, "user")
    
    return jsonify(user.to_dict())

@admin_bp.route("/api/admin/users/<int:user_id>/role", methods=["PATCH"])
@main_admin_required
def update_user_role(current_user, user_id):
    """Update user role (Main Admin only)"""
    user = User.query.get_or_404(user_id)
    
    # Cannot modify main admin
    if user.role == "main_admin":
        return jsonify({"error": "Cannot modify main admin"}), 403
    
    data = request.get_json()
    new_role = data.get("role")
    
    if new_role not in ["admin", "member"]:
        return jsonify({"error": "Invalid role"}), 400
    
    old_role = user.role
    user.role = new_role
    db.session.commit()
    
    # Log action
    log_admin_action(current_user.id, f"Changed user {user.username} role from {old_role} to {new_role}", user.id, "user")
    
    return jsonify(user.to_dict())

@admin_bp.route("/api/admin/users/<int:user_id>/suspend", methods=["PATCH"])
@admin_required
def suspend_user(current_user, user_id):
    """Suspend/unsuspend user"""
    user = User.query.get_or_404(user_id)
    
    # Cannot suspend main admin
    if user.role == "main_admin":
        return jsonify({"error": "Cannot suspend main admin"}), 403
    
    # Admin can only suspend members
    if current_user.role == "admin" and user.role != "member":
        return jsonify({"error": "Access denied"}), 403
    
    data = request.get_json()
    suspend = data.get("suspend", True)

    user.is_active = not suspend
    user.status = "suspended" if suspend else "active"
    db.session.commit()

    action = "Suspended" if suspend else "Unsuspended"
    log_admin_action(current_user.id, f"{action} user {user.username}", user.id, "user")

    return jsonify(user.to_dict())

@admin_bp.route("/api/admin/users/<int:user_id>/approve", methods=["POST"])
@admin_required
def approve_user(current_user, user_id):
    """Approve pending user"""
    user = User.query.get_or_404(user_id)
    
    # Admin can only approve members
    if current_user.role == "admin" and user.role != "member":
        return jsonify({"error": "Access denied"}), 403
    
    user.status = "active"
    user.is_active = True # Ensure is_active is also set
    user.is_verified = True
    db.session.commit()
    
    # Log action
    log_admin_action(current_user.id, f"Approved user {user.username}", user.id, "user")
    
    return jsonify(user.to_dict())

@admin_bp.route("/api/admin/users/<int:user_id>/change-password", methods=["POST"])
@admin_bp.route("/api/admin/users/<int:user_id>/reset-password", methods=["POST"])
@admin_required
def change_user_password(current_user, user_id):
    """Change user password (admin action)"""
    user = User.query.get_or_404(user_id)
    
    # Admin can only change member passwords, main admin can change anyone's except their own username
    if current_user.role == "admin" and user.role != "member":
        return jsonify({"error": "Access denied"}), 403
    
    data = request.get_json()
    if not data or "new_password" not in data:
        return jsonify({"error": "New password is required"}), 400
    
    new_password = data["new_password"]
    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400
    
    # Update password
    user.set_password(new_password) # Use set_password method
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    # Log action
    log_admin_action(current_user.id, f"Changed password for user {user.username}", user.id, "user")
    
    return jsonify({"message": f"Password changed successfully for user {user.username}"})

@admin_bp.route("/api/admin/users/<int:user_id>/extend", methods=["POST"])
@admin_required
def extend_user_subscription(current_user, user_id):
    """Extend user subscription (POST endpoint for admin panel)"""
    user = User.query.get_or_404(user_id)
    
    # Admin can only extend members
    if current_user.role == "admin" and user.role != "member":
        return jsonify({"error": "Access denied"}), 403
    
    data = request.get_json() or {}
    days_to_extend = data.get("days", 30)  # Default 30 days
    
    # Extend subscription
    if user.subscription_expiry:
        user.subscription_expiry = user.subscription_expiry + timedelta(days=days_to_extend)
    else:
        user.subscription_expiry = datetime.utcnow() + timedelta(days=days_to_extend)
    
    # Update status if expired
    if user.status == "expired":
        user.status = "active"
    
    db.session.commit()
    
    # Log action
    log_admin_action(current_user.id, f"Extended user {user.username} subscription by {days_to_extend} days", user.id, "user")
    
    return jsonify(user.to_dict())

@admin_bp.route("/api/admin/users/<int:user_id>/delete", methods=["POST"])
@admin_required
def delete_user_action(current_user, user_id):
    """Delete user (POST endpoint for admin panel)"""
    user = User.query.get_or_404(user_id)
    
    # Cannot delete main admin
    if user.role == "main_admin":
        return jsonify({"error": "Cannot delete main admin"}), 403
    
    # Admin can only delete members
    if current_user.role == "admin" and user.role != "member":
        return jsonify({"error": "Access denied"}), 403
    
    user_username = user.username
    db.session.delete(user)
    db.session.commit()
    
    # Log action
    log_admin_action(current_user.id, f"Deleted user {user_username}", user_id, "user")
    
    return jsonify({"message": f"User {user_username} deleted successfully"})

# Link Management Endpoints (Added for Admin Panel)
@admin_bp.route("/api/admin/links", methods=["GET"])
@admin_required
def get_all_links(current_user):
    """Get all links (Main Admin: all, Admin: all)"""
    links = Link.query.order_by(Link.created_at.desc()).all()
    
    # Enrich with owner info
    result = []
    for link in links:
        link_dict = link.to_dict()
        owner = User.query.get(link.user_id)
        link_dict['owner'] = owner.username if owner else "Unknown"
        link_dict['owner_email'] = owner.email if owner else "Unknown"
        result.append(link_dict)
        
    return jsonify(result)

@admin_bp.route("/api/admin/links/<int:link_id>", methods=["DELETE"])
@admin_required
def admin_delete_link(current_user, link_id):
    """Delete a link (admin action)"""
    try:
        link = Link.query.get(link_id)
        if not link:
            return jsonify({"success": False, "error": "Link not found"}), 404
        db.session.delete(link)
        db.session.commit()
        log_admin_action(current_user.id, f"Deleted link #{link_id}", link_id, "link")
        return jsonify({"success": True, "message": "Link deleted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/api/admin/links/<int:link_id>/pause", methods=["PATCH", "POST"])
@admin_required
def admin_pause_link(current_user, link_id):
    """Pause a link (set status to paused)"""
    try:
        link = Link.query.get(link_id)
        if not link:
            return jsonify({"success": False, "error": "Link not found"}), 404
        link.status = "paused"
        db.session.commit()
        log_admin_action(current_user.id, f"Paused link #{link_id}", link_id, "link")
        return jsonify({"success": True, "message": "Link paused", "link": link.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/api/admin/links/<int:link_id>/resume", methods=["PATCH", "POST"])
@admin_required
def admin_resume_link(current_user, link_id):
    """Resume a paused link (set status to active)"""
    try:
        link = Link.query.get(link_id)
        if not link:
            return jsonify({"success": False, "error": "Link not found"}), 404
        link.status = "active"
        db.session.commit()
        log_admin_action(current_user.id, f"Resumed link #{link_id}", link_id, "link")
        return jsonify({"success": True, "message": "Link resumed", "link": link.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/api/admin/security/blocked-ips", methods=["GET"])
@admin_required
def admin_get_blocked_ips(current_user):
    """Get all blocked IPs (admin-wide, not per-user)"""
    try:
        from api.models.security import BlockedIP
        ips = BlockedIP.query.order_by(BlockedIP.blocked_at.desc()).all()
        return jsonify({
            "success": True,
            "blocked_ips": [{
                "ip_address": b.ip_address,
                "reason": b.reason,
                "blocked_at": b.blocked_at.isoformat() if b.blocked_at else None,
                "user_id": b.user_id,
            } for b in ips]
        })
    except Exception as e:
        logger.error(f"admin_get_blocked_ips error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/api/admin/security/blocked-ips", methods=["POST"])
@admin_required
def admin_add_blocked_ip(current_user):
    """Block an IP address"""
    try:
        from api.models.security import BlockedIP
        data = request.get_json() or {}
        ip = (data.get("ip_address") or data.get("ip", "")).strip()
        reason = data.get("reason", "Blocked by admin")
        if not ip:
            return jsonify({"success": False, "error": "IP address required"}), 400
        existing = BlockedIP.query.filter_by(ip_address=ip).first()
        if existing:
            return jsonify({"success": False, "error": "IP already blocked"}), 400
        db.session.add(BlockedIP(ip_address=ip, reason=reason, user_id=current_user.id,
                                 blocked_at=datetime.utcnow()))
        db.session.commit()
        log_admin_action(current_user.id, f"Blocked IP: {ip}", None, "security")
        return jsonify({"success": True, "message": f"IP {ip} blocked"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/api/admin/security/blocked-ips/<ip>", methods=["DELETE"])
@admin_required
def admin_remove_blocked_ip(current_user, ip):
    """Unblock an IP address"""
    try:
        from api.models.security import BlockedIP
        blocked = BlockedIP.query.filter_by(ip_address=ip).first()
        if not blocked:
            return jsonify({"success": False, "error": "IP not found in block list"}), 404
        db.session.delete(blocked)
        db.session.commit()
        log_admin_action(current_user.id, f"Unblocked IP: {ip}", None, "security")
        return jsonify({"success": True, "message": f"IP {ip} unblocked"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/api/admin/pending-users/<int:user_id>/approve", methods=["POST"])
@admin_required
def approve_pending_user(current_user, user_id):
    """Approve a pending user registration"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        user.status = "active"
        user.is_active = True
        user.is_verified = True
        db.session.commit()
        log_admin_action(current_user.id, f"Approved pending user {user.username}", user.id, "user")
        return jsonify({"success": True, "message": f"User {user.username} approved", "user": user.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/api/admin/pending-users/<int:user_id>/reject", methods=["POST"])
@admin_required
def reject_pending_user(current_user, user_id):
    """Reject and delete a pending user registration"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        data = request.get_json() or {}
        reason = data.get("reason", "Registration rejected by administrator")
        username = user.username
        db.session.delete(user)
        db.session.commit()
        log_admin_action(current_user.id, f"Rejected pending user {username}: {reason}", user_id, "user")
        return jsonify({"success": True, "message": f"User {username} rejected and removed"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/api/admin/settings/wipe", methods=["POST"])
@main_admin_required
def wipe_system_data(current_user):
    """Wipe system data in configurable modes (Main Admin only)"""
    try:
        data = request.get_json() or {}
        mode = data.get("mode", "").upper()
        if mode not in ("SOFT", "MEDIUM", "HARD", "CACHE"):
            return jsonify({"success": False, "error": "Invalid mode. Use SOFT, MEDIUM, HARD, or CACHE"}), 400

        from api.models.tracking_event import TrackingEvent

        if mode == "SOFT":
            # Purge tracking events only
            TrackingEvent.query.delete()
            AuditLog.query.delete()
            db.session.commit()
            msg = "Soft wipe complete: tracking events and audit logs cleared."

        elif mode == "MEDIUM":
            # Delete links, campaigns, non-admin users
            TrackingEvent.query.delete()
            Link.query.delete()
            Campaign.query.delete()
            AuditLog.query.delete()
            User.query.filter(User.role.notin_(["main_admin", "admin"])).delete(synchronize_session=False)
            db.session.commit()
            msg = "Medium wipe complete: links, campaigns, and member users removed."

        elif mode == "HARD":
            # Full factory reset — keep only main_admin
            TrackingEvent.query.delete()
            Link.query.delete()
            Campaign.query.delete()
            AuditLog.query.delete()
            User.query.filter(User.role != "main_admin").delete(synchronize_session=False)
            db.session.commit()
            msg = "Hard factory reset complete: all data wiped except main admin."

        elif mode == "CACHE":
            # Safe cache purge — just clear audit logs and old tracking events (>30 days)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            TrackingEvent.query.filter(TrackingEvent.timestamp < thirty_days_ago).delete(synchronize_session=False)
            AuditLog.query.filter(AuditLog.created_at < thirty_days_ago).delete(synchronize_session=False)
            db.session.commit()
            msg = "Cache purge complete: old logs and events cleared."

        log_admin_action(current_user.id, f"System wipe: {mode}", None, "system")
        db.session.commit()
        return jsonify({"success": True, "message": msg, "mode": mode})

    except Exception as e:
        db.session.rollback()
        logger.error(f"wipe_system_data error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# Campaign Management Endpoints
@admin_bp.route("/api/admin/campaigns", methods=["GET"])
@admin_required
def get_campaigns(current_user):
    """Get all campaigns"""
    campaigns = Campaign.query.all()
    result = []
    for campaign in campaigns:
        camp_dict = campaign.to_dict()
        owner = User.query.get(campaign.owner_id)
        camp_dict['owner'] = owner.username if owner else "Unknown"
        result.append(camp_dict)
    return jsonify(result)

@admin_bp.route("/api/admin/campaigns/<int:campaign_id>", methods=["GET"])
@admin_required
def get_campaign(current_user, campaign_id):
    """Get specific campaign details"""
    campaign = Campaign.query.get_or_404(campaign_id)
    return jsonify(campaign.to_dict())

@admin_bp.route("/api/admin/campaigns", methods=["POST"])
@admin_required
def create_campaign(current_user):
    """Create new campaign"""
    data = request.get_json()
    
    if not data.get("name"):
        return jsonify({"error": "Campaign name is required"}), 400
    
    campaign = Campaign(
        name=data["name"],
        description=data.get("description", ""),
        owner_id=current_user.id,
        status=data.get("status", "active")
    )
    
    db.session.add(campaign)
    db.session.commit()
    
    # Log action
    log_admin_action(current_user.id, f"Created campaign {campaign.name}", campaign.id, "campaign")
    
    return jsonify(campaign.to_dict()), 201

@admin_bp.route("/api/admin/campaigns/<int:campaign_id>", methods=["PATCH"])
@admin_required
def update_campaign(current_user, campaign_id):
    """Update campaign details"""
    campaign = Campaign.query.get_or_404(campaign_id)
    data = request.get_json()
    
    if "name" in data:
        campaign.name = data["name"]
    if "description" in data:
        campaign.description = data["description"]
    if "status" in data:
        campaign.status = data["status"]
    
    db.session.commit()
    
    # Log action
    log_admin_action(current_user.id, f"Updated campaign {campaign.name}", campaign.id, "campaign")
    
    return jsonify(campaign.to_dict())

@admin_bp.route("/api/admin/campaigns/<int:campaign_id>", methods=["DELETE"])
@admin_required
def delete_campaign(current_user, campaign_id):
    """Delete campaign"""
    campaign = Campaign.query.get_or_404(campaign_id)
    
    campaign_name = campaign.name
    db.session.delete(campaign)
    db.session.commit()
    
    # Log action
    log_admin_action(current_user.id, f"Deleted campaign {campaign_name}", campaign_id, "campaign")
    
    return jsonify({"message": "Campaign deleted successfully"})


@admin_bp.route("/api/admin/campaigns/<int:campaign_id>/links", methods=["GET"])
@admin_required
def get_campaign_links(current_user, campaign_id):
    """Get all links for a specific campaign"""
    campaign = Campaign.query.get_or_404(campaign_id)
    links = Link.query.filter_by(campaign_id=campaign_id).all()
    return jsonify([link.to_dict() for link in links])

# Analytics Endpoints
@admin_bp.route("/api/admin/analytics/users", methods=["GET"])
@admin_required
def get_user_analytics(current_user):
    """Get system-wide user analytics"""
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    suspended_users = User.query.filter_by(is_active=False).count()
    verified_users = User.query.filter_by(is_verified=True).count()
    
    # Users by role
    main_admins = User.query.filter_by(role="main_admin").count()
    admins = User.query.filter_by(role="admin").count()
    members = User.query.filter_by(role="member").count()
    
    # Users by plan
    free_users = User.query.filter_by(plan_type="free").count()
    pro_users = User.query.filter_by(plan_type="pro").count()
    enterprise_users = User.query.filter_by(plan_type="enterprise").count()
    
    return jsonify({
        "total_users": total_users,
        "active_users": active_users,
        "suspended_users": suspended_users,
        "verified_users": verified_users,
        "users_by_role": {
            "main_admin": main_admins,
            "admin": admins,
            "member": members
        },
        "users_by_plan": {
            "free": free_users,
            "pro": pro_users,
            "enterprise": enterprise_users
        }
    })

@admin_bp.route("/api/admin/analytics/campaigns", methods=["GET"])
@admin_required
def get_campaign_analytics(current_user):
    """Get system-wide campaign analytics"""
    total_campaigns = Campaign.query.count()
    active_campaigns = Campaign.query.filter_by(status="active").count()
    paused_campaigns = Campaign.query.filter_by(status="paused").count()
    completed_campaigns = Campaign.query.filter_by(status="completed").count()
    
    # Total links across all campaigns
    total_links = Link.query.count()
    
    return jsonify({
        "total_campaigns": total_campaigns,
        "active_campaigns": active_campaigns,
        "paused_campaigns": paused_campaigns,
        "completed_campaigns": completed_campaigns,
        "total_links": total_links
    })

@admin_bp.route("/api/admin/audit-logs", methods=["GET"])
@main_admin_required
def get_audit_logs(current_user):
    """Get all audit logs (Main Admin only)"""
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).all()
    return jsonify([log.to_dict() for log in logs])


@admin_bp.route("/api/admin/dashboard/stats", methods=["GET"])
@admin_required
def get_dashboard_stats(current_user):
    """Get dashboard statistics for admin panel"""
    try:
        # User statistics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        new_users_today = User.query.filter(
            User.created_at >= datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        ).count()
        
        # Campaign statistics
        total_campaigns = Campaign.query.count()
        active_campaigns = Campaign.query.filter_by(status="active").count()
        
        # Link statistics
        total_links = Link.query.count()
        active_links = Link.query.filter_by(status="active").count()
        
        # Recent activity
        recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
        recent_campaigns = Campaign.query.order_by(Campaign.created_at.desc()).limit(5).all()
        
        return jsonify({
            "users": {
                "total": total_users,
                "active": active_users,
                "new_today": new_users_today
            },
            "campaigns": {
                "total": total_campaigns,
                "active": active_campaigns
            },
            "links": {
                "total": total_links,
                "active": active_links
            },
            "recent_activity": {
                "users": [user.to_dict() for user in recent_users],
                "campaigns": [campaign.to_dict() for campaign in recent_campaigns]
            }
        })
        
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/admin/audit-logs/export", methods=["GET"])
@main_admin_required
def export_audit_logs(current_user):
    """Export audit logs as CSV (Main Admin only)"""
    try:
        logs = AuditLog.query.order_by(AuditLog.created_at.desc()).all()
        
        # Create CSV content
        csv_content = "ID,Actor ID,Action,Target ID,Target Type,Created At\n"
        for log in logs:
            csv_content += f"{log.id},{log.actor_id},{log.action},{log.target_id or ''},{log.target_type or ''},{log.created_at}\n"
        
        response = make_response(csv_content)
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = 'attachment; filename=audit_logs.csv'
        return response
        
    except Exception as e:
        print(f"Error exporting audit logs: {e}")
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/admin/users/<int:user_id>/delete", methods=["POST"])
@admin_required
def delete_user_endpoint(current_user, user_id):
    """Delete a user (Admin can only delete members, Main Admin can delete anyone except themselves)"""
    try:
        user_to_delete = User.query.get_or_404(user_id)
        
        # Prevent self-deletion
        if user_to_delete.id == current_user.id:
            return jsonify({"error": "Cannot delete yourself"}), 400
        
        # Admin can only delete members
        if current_user.role == "admin" and user_to_delete.role != "member":
            return jsonify({"error": "Access denied"}), 403
        
        username = user_to_delete.username
        uid = user_to_delete.id

        # Raw SQL cascade: nullify or delete ALL FK references in one shot
        db.session.execute(text("DELETE FROM notifications WHERE user_id = :uid"), {"uid": uid})
        db.session.execute(text("DELETE FROM tracking_events WHERE user_id = :uid"), {"uid": uid})
        db.session.execute(text("DELETE FROM audit_logs WHERE actor_id = :uid"), {"uid": uid})
        db.session.execute(text("DELETE FROM links WHERE user_id = :uid"), {"uid": uid})
        db.session.execute(text("DELETE FROM campaigns WHERE owner_id = :uid OR user_id = :uid"), {"uid": uid})
        db.session.execute(text("DELETE FROM messages WHERE user_id = :uid OR admin_id = :uid"), {"uid": uid})
        db.session.execute(text("DELETE FROM message_replies WHERE sender_id = :uid"), {"uid": uid})
        db.session.execute(text("DELETE FROM api_keys WHERE user_id = :uid"), {"uid": uid})
        db.session.execute(text("DELETE FROM ab_tests WHERE user_id = :uid"), {"uid": uid})
        db.session.execute(text("DELETE FROM purl_mappings WHERE user_id = :uid"), {"uid": uid})
        db.session.execute(text("DELETE FROM subscription_verifications WHERE user_id = :uid"), {"uid": uid})
        db.session.execute(text("DELETE FROM support_ticket_replies WHERE author_id = :uid"), {"uid": uid})
        db.session.execute(text("UPDATE support_tickets SET user_id = NULL, assigned_to = NULL, resolved_by = NULL, closed_by = NULL WHERE user_id = :uid OR assigned_to = :uid OR resolved_by = :uid OR closed_by = :uid"), {"uid": uid})
        db.session.execute(text("UPDATE security_threats SET user_id = NULL, resolved_by = NULL WHERE user_id = :uid OR resolved_by = :uid"), {"uid": uid})
        db.session.execute(text("UPDATE blocked_ips SET blocked_by = NULL WHERE blocked_by = :uid"), {"uid": uid})
        db.session.execute(text("UPDATE admin_settings SET updated_by = NULL WHERE updated_by = :uid"), {"uid": uid})
        db.session.execute(text("UPDATE domains SET created_by = NULL WHERE created_by = :uid"), {"uid": uid})
        db.session.execute(text("DELETE FROM crypto_payment_transactions WHERE user_id = :uid"), {"uid": uid})

        log_admin_action(current_user.id, f"Deleted user {username}", uid, "user")

        db.session.delete(user_to_delete)
        db.session.commit()

        return jsonify({"message": f"User {username} deleted successfully"})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting user: {e}")
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/api/admin/users/<int:user_id>/promote-test", methods=["POST"])
@admin_required
def promote_test_user(current_user, user_id):
    """Grant a user temporary test/enterprise access"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json() or {}
        days = int(data.get("days", 30))
        user.plan_type = "enterprise"
        user.is_active = True
        user.is_verified = True
        user.subscription_expiry = datetime.utcnow() + timedelta(days=days)
        db.session.commit()
        log_admin_action(current_user.id, f"Promoted user {user.username} to enterprise for {days} days", user.id, "user")
        return jsonify({"message": f"User promoted to enterprise for {days} days", "user": user.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/api/admin/users/<int:user_id>/demote-test", methods=["POST"])
@admin_required
def demote_test_user(current_user, user_id):
    """Revoke test/enterprise access and demote to free"""
    try:
        user = User.query.get_or_404(user_id)
        user.plan_type = "free"
        user.subscription_expiry = None
        db.session.commit()
        log_admin_action(current_user.id, f"Demoted user {user.username} to free plan", user.id, "user")
        return jsonify({"message": "User demoted to free plan", "user": user.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/api/admin/users/<int:user_id>/send-email", methods=["POST"])
@admin_required
def send_email_to_user(current_user, user_id):
    """Send a notification message to a user (stored as in-app notification)"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json() or {}
        subject = data.get("subject", "Message from Admin")
        message = data.get("message", "")
        if not message:
            return jsonify({"error": "Message body is required"}), 400
        notif = Notification(
            user_id=user.id,
            type="info",
            title=subject,
            message=message,
        )
        db.session.add(notif)
        db.session.commit()
        log_admin_action(current_user.id, f"Sent message to {user.username}: {subject}", user.id, "user")
        return jsonify({"message": "Message sent successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/api/admin/campaigns/<int:campaign_id>/suspend", methods=["POST"])
@admin_required
def suspend_campaign(current_user, campaign_id):
    """Suspend (pause) a campaign"""
    try:
        campaign = Campaign.query.get_or_404(campaign_id)
        campaign.status = "paused"
        db.session.commit()
        log_admin_action(current_user.id, f"Suspended campaign {campaign.name}", campaign.id, "campaign")
        return jsonify({"message": "Campaign suspended", "campaign": campaign.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@admin_bp.route("/api/admin/system/delete-all", methods=["POST"])
@main_admin_required
def delete_all_system_data(current_user):
    """Delete all system data except main admin users (Main Admin only)"""
    try:
        data = request.get_json()
        if not data or data.get('confirm') != 'DELETE_ALL_DATA':
            return jsonify({"error": "Confirmation required"}), 400
        
        from api.models.tracking_event import TrackingEvent
        from api.models.notification import Notification

        # Delete in dependency order to avoid FK violations
        TrackingEvent.query.delete()
        Notification.query.filter(
            Notification.user_id.in_(
                db.session.query(User.id).filter(User.role != "main_admin")
            )
        ).delete(synchronize_session=False)
        AuditLog.query.delete()
        Link.query.delete()
        Campaign.query.delete()
        User.query.filter(User.role != "main_admin").delete()

        log_admin_action(current_user.id, "DELETED ALL SYSTEM DATA", None, "system")
        
        db.session.commit()
        
        return jsonify({"message": "All system data deleted successfully"})
        
    except Exception as e:
        print(f"Error deleting system data: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



# ==================== DOMAIN MANAGEMENT ====================

@admin_bp.route('/api/admin/domains', methods=['GET'])
@admin_required
def get_domains(current_user):
    """Get all domains (admin can see all, users see their own)"""
    try:
        if current_user.role == 'main_admin':
            domains = Domain.query.all()
        else:
            domains = Domain.query.filter_by(created_by=current_user.id).all()
        
        return jsonify([domain.to_dict() for domain in domains])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/admin/domains', methods=['POST'])
@admin_required
def create_domain(current_user):
    """Create a new domain"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('domain'):
            return jsonify({'error': 'Domain name is required'}), 400
        
        # Check if domain already exists
        existing = Domain.query.filter_by(domain=data['domain']).first()
        if existing:
            return jsonify({'error': 'Domain already exists'}), 409
        
        # Create new domain
        domain = Domain(
            domain=data['domain'],
            domain_type=data.get('domain_type', 'custom'),
            description=data.get('description', ''),
            is_active=data.get('is_active', True),
            api_key=data.get('api_key'),
            api_secret=data.get('api_secret'),
            created_by=current_user.id
        )
        
        db.session.add(domain)
        db.session.commit()
        
        # Log action
        log_admin_action(current_user.id, 'CREATED_DOMAIN', domain.id, 'domain')
        
        return jsonify(domain.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/admin/domains/<int:domain_id>', methods=['GET'])
@admin_required
def get_domain(current_user, domain_id):
    """Get a specific domain"""
    try:
        domain = Domain.query.get(domain_id)
        if not domain:
            return jsonify({'error': 'Domain not found'}), 404
        
        # Check permissions
        if current_user.role != 'main_admin' and domain.created_by != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify(domain.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/admin/domains/<int:domain_id>', methods=['PUT'])
@admin_required
def update_domain(current_user, domain_id):
    """Update a domain"""
    try:
        domain = Domain.query.get(domain_id)
        if not domain:
            return jsonify({'error': 'Domain not found'}), 404
        
        # Check permissions
        if current_user.role != 'main_admin' and domain.created_by != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'domain' in data:
            # Check if new domain already exists
            existing = Domain.query.filter_by(domain=data['domain']).filter(Domain.id != domain_id).first()
            if existing:
                return jsonify({'error': 'Domain already exists'}), 409
            domain.domain = data['domain']
        
        if 'description' in data:
            domain.description = data['description']
        
        if 'is_active' in data:
            domain.is_active = data['is_active']
        
        if 'api_key' in data:
            domain.api_key = data['api_key']
        
        if 'api_secret' in data:
            domain.api_secret = data['api_secret']
        
        domain.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log action
        log_admin_action(current_user.id, 'UPDATED_DOMAIN', domain.id, 'domain')
        
        return jsonify(domain.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/admin/domains/<int:domain_id>', methods=['DELETE'])
@admin_required
def delete_domain(current_user, domain_id):
    """Delete a domain"""
    try:
        domain = Domain.query.get(domain_id)
        if not domain:
            return jsonify({'error': 'Domain not found'}), 404
        
        # Check permissions - only main_admin can delete
        if current_user.role != 'main_admin':
            return jsonify({'error': 'Only main admin can delete domains'}), 403
        
        # Check if domain has active links
        active_links = Link.query.filter_by(domain=domain.domain, status='active').count()
        if active_links > 0:
            return jsonify({'error': f'Cannot delete domain with {active_links} active links'}), 409
        
        db.session.delete(domain)
        db.session.commit()
        
        # Log action
        log_admin_action(current_user.id, 'DELETED_DOMAIN', domain_id, 'domain')
        
        return jsonify({'message': 'Domain deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/admin/domains/<int:domain_id>/verify', methods=['POST'])
@admin_required
def verify_domain(current_user, domain_id):
    """Verify a domain (for DNS verification)"""
    try:
        domain = Domain.query.get(domain_id)
        if not domain:
            return jsonify({'error': 'Domain not found'}), 404
        
        # Check permissions
        if current_user.role != 'main_admin' and domain.created_by != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Mark as verified
        domain.is_verified = True
        domain.verified_at = datetime.utcnow()
        db.session.commit()
        
        # Log action
        log_admin_action(current_user.id, 'VERIFIED_DOMAIN', domain.id, 'domain')
        
        return jsonify({'message': 'Domain verified successfully', 'domain': domain.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



# ============================================================
# MISSING ENDPOINTS — Added for full frontend compatibility
# ============================================================

@admin_bp.route("/api/admin/metrics", methods=["GET"])
@admin_required
def admin_metrics(current_user):
    """Admin dashboard metrics — full KPI summary"""
    try:
        from api.models.tracking_event import TrackingEvent
        from sqlalchemy import func

        now = datetime.utcnow()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        this_week = now - timedelta(days=7)
        this_month = now - timedelta(days=30)

        total_users = User.query.count()
        active_users = User.query.filter_by(status="active").count()
        pending_users = User.query.filter_by(status="pending").count()
        new_users_today = User.query.filter(User.created_at >= today).count()
        new_users_week = User.query.filter(User.created_at >= this_week).count()

        total_links = Link.query.count()
        active_links = Link.query.filter_by(status="active").count()

        total_clicks = db.session.query(func.sum(Link.total_clicks)).scalar() or 0
        total_events = TrackingEvent.query.count()
        events_today = TrackingEvent.query.filter(TrackingEvent.timestamp >= today).count()

        total_revenue = db.session.query(func.sum(Payment.amount))\
            .filter_by(status="confirmed").scalar() or 0
        revenue_month = db.session.query(func.sum(Payment.amount))\
            .filter(Payment.status == "confirmed", Payment.created_at >= this_month).scalar() or 0

        crypto_pending = Payment.query.filter_by(status="pending", payment_type="crypto").count()

        return jsonify({
            "success": True,
            "users": {
                "total": total_users, "active": active_users,
                "pending": pending_users, "new_today": new_users_today,
                "new_week": new_users_week
            },
            "links": {"total": total_links, "active": active_links},
            "tracking": {"total_clicks": total_clicks, "total_events": total_events, "events_today": events_today},
            "revenue": {"total": float(total_revenue), "this_month": float(revenue_month), "crypto_pending": crypto_pending}
        })
    except Exception as e:
        logger.error(f"admin_metrics error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/api/admin/users/graph", methods=["GET"])
@admin_required
def user_registrations_graph(current_user):
    """User registrations over last 30 days for chart"""
    try:
        from sqlalchemy import func, cast, Date
        days = int(request.args.get("days", 30))
        start = datetime.utcnow() - timedelta(days=days)

        rows = db.session.query(
            cast(User.created_at, Date).label("date"),
            func.count(User.id).label("count")
        ).filter(User.created_at >= start)\
         .group_by(cast(User.created_at, Date))\
         .order_by(cast(User.created_at, Date)).all()

        return jsonify({
            "success": True,
            "data": [{"date": str(r.date), "count": r.count} for r in rows]
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/api/admin/users/<int:user_id>/block", methods=["POST"])
@admin_required
def block_user(current_user, user_id):
    """Block (suspend) a user — alias for suspend"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
    if user.role == "main_admin":
        return jsonify({"success": False, "error": "Cannot block main admin"}), 403

    user.status = "suspended"
    user.is_active = False
    db.session.commit()
    log_admin_action(current_user.id, f"Blocked user {user.username}", user.id, "user")
    db.session.add(Notification(
        user_id=user.id, title="Account Suspended",
        message="Your account has been suspended. Contact support for assistance.",
        type="error", priority="high"
    ))
    db.session.commit()
    return jsonify({"success": True, "message": f"{user.username} has been blocked"}), 200


@admin_bp.route("/api/admin/users/<int:user_id>/unblock", methods=["POST"])
@admin_required
def unblock_user(current_user, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
    user.status = "active"
    user.is_active = True
    db.session.commit()
    log_admin_action(current_user.id, f"Unblocked user {user.username}", user.id, "user")
    return jsonify({"success": True, "message": f"{user.username} has been unblocked"}), 200


@admin_bp.route("/api/admin/users/<int:user_id>/impersonate", methods=["POST"])
@main_admin_required
def impersonate_user(current_user, user_id):
    """Issue a short-lived token for the target user (main admin only)"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
    log_admin_action(current_user.id, f"Impersonated user {user.username}", user.id, "user")
    token = user.generate_token()
    return jsonify({"success": True, "token": token, "user": user.to_dict()}), 200


@admin_bp.route("/api/admin/pending-users", methods=["GET"])
@admin_required
def get_pending_users(current_user):
    users = User.query.filter_by(status="pending").order_by(User.created_at.desc()).all()
    return jsonify({"success": True, "users": [u.to_dict(include_sensitive=True) for u in users], "count": len(users)})


@admin_bp.route("/api/admin/subscriptions", methods=["GET"])
@admin_required
def admin_list_subscriptions(current_user):
    """All users with their subscription details"""
    users = User.query.filter(User.plan_type != "free").order_by(User.subscription_expiry.desc()).all()
    return jsonify({
        "success": True,
        "subscriptions": [{
            "user_id": u.id, "username": u.username, "email": u.email,
            "plan_type": u.plan_type, "status": u.subscription_status,
            "expiry": u.subscription_expiry.isoformat() if u.subscription_expiry else None
        } for u in users]
    })


@admin_bp.route("/api/admin/invoices", methods=["GET"])
@admin_required
def admin_list_invoices(current_user):
    """All confirmed payments as invoices"""
    payments = Payment.query.filter_by(status="confirmed")\
        .order_by(Payment.created_at.desc()).all()
    return jsonify({
        "success": True,
        "invoices": [p.to_dict() for p in payments]
    })


@admin_bp.route("/api/admin/transactions", methods=["GET"])
@admin_required
def admin_list_transactions(current_user):
    """All payments (any status)"""
    from api.models.crypto_payment_transaction import CryptoPaymentTransaction
    crypto = CryptoPaymentTransaction.query.order_by(
        CryptoPaymentTransaction.created_at.desc()).all()
    stripe_payments = Payment.query.filter_by(payment_type="stripe")\
        .order_by(Payment.created_at.desc()).all()
    return jsonify({
        "success": True,
        "crypto_transactions": [t.to_dict() for t in crypto],
        "stripe_payments": [p.to_dict() for p in stripe_payments]
    })


@admin_bp.route("/api/admin/subscription-plans", methods=["GET"])
@admin_required
def admin_list_plans(current_user):
    """Return plan configuration"""
    from api.routes.payments import PLANS
    return jsonify({"success": True, "plans": [
        {"id": k, **v} for k, v in PLANS.items()
    ]})


@admin_bp.route("/api/admin/system/health", methods=["GET"])
@admin_required
def system_health(current_user):
    """Basic system health check"""
    try:
        db.session.execute(db.text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    return jsonify({
        "success": True,
        "database": "ok" if db_ok else "error",
        "timestamp": datetime.utcnow().isoformat()
    })


# ═══════════════════════════════════════════════════════════════
#  ADMIN INTELLIGENCE LAYER
# ═══════════════════════════════════════════════════════════════

@admin_bp.route("/api/admin/intelligence", methods=["GET"])
@admin_required
def admin_intelligence(current_user):
    """Platform-wide intelligence: inbox scores, scanner rates, bot %, quantum stats."""
    try:
        from api.models.tracking_event import TrackingEvent
        from api.services.honeypot import honeypot_service

        now = datetime.utcnow()
        last_24h = now - timedelta(hours=24)
        last_7d  = now - timedelta(days=7)

        # --- Tracking event stats ---
        total_events   = TrackingEvent.query.count()
        events_24h     = TrackingEvent.query.filter(TrackingEvent.timestamp >= last_24h).count()
        bot_events_24h = TrackingEvent.query.filter(
            TrackingEvent.timestamp >= last_24h, TrackingEvent.is_bot == True
        ).count()
        scanner_events = TrackingEvent.query.filter(
            TrackingEvent.timestamp >= last_24h, TrackingEvent.status == 'scanner_deflected'
        ).count()
        honeypot_events = TrackingEvent.query.filter(
            TrackingEvent.timestamp >= last_24h, TrackingEvent.status == 'honeypot'
        ).count()
        quantum_violations = TrackingEvent.query.filter(
            TrackingEvent.timestamp >= last_24h,
            TrackingEvent.quantum_security_violation.isnot(None)
        ).count()

        bot_pct     = round((bot_events_24h / events_24h * 100), 1) if events_24h else 0
        scanner_pct = round((scanner_events / events_24h * 100), 1) if events_24h else 0

        # --- Link & user counts ---
        total_links  = Link.query.count()
        active_links = Link.query.filter_by(status='active').count()
        total_users  = User.query.count()
        active_users = User.query.filter(User.last_login_at >= last_7d).count() if hasattr(User, 'last_login_at') else 0

        # --- Inbox score distribution (sampled from active links) ---
        try:
            from api.services.inbox_score import compute_inbox_score
            sample_links = Link.query.filter_by(status='active').limit(50).all()
            scores = []
            for lnk in sample_links:
                try:
                    result = compute_inbox_score(lnk.id)
                    if result and 'inbox_score' in result:
                        scores.append(result['inbox_score'])
                except Exception:
                    pass
            avg_inbox_score = round(sum(scores) / len(scores), 1) if scores else None
            score_distribution = {
                'excellent': len([s for s in scores if s >= 80]),
                'good':      len([s for s in scores if 60 <= s < 80]),
                'warning':   len([s for s in scores if 40 <= s < 60]),
                'critical':  len([s for s in scores if s < 40]),
            }
        except Exception:
            avg_inbox_score = None
            score_distribution = {}

        # --- Honeypot in-memory stats ---
        hp_stats = honeypot_service.get_stats()

        return jsonify({
            "success": True,
            "platform": {
                "total_users":   total_users,
                "active_users_7d": active_users,
                "total_links":   total_links,
                "active_links":  active_links,
                "total_events":  total_events,
            },
            "traffic_24h": {
                "total":     events_24h,
                "bots":      bot_events_24h,
                "bot_pct":   bot_pct,
                "scanners":  scanner_events,
                "scanner_pct": scanner_pct,
                "honeypot_hits": honeypot_events,
                "quantum_violations": quantum_violations,
            },
            "inbox_score": {
                "average": avg_inbox_score,
                "distribution": score_distribution,
                "sample_size": len(scores) if 'scores' in dir() else 0,
            },
            "honeypot": hp_stats,
            "generated_at": now.isoformat(),
        })
    except Exception as e:
        logger.error(f"Admin intelligence error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/api/admin/users/risk-analysis", methods=["GET"])
@admin_required
def users_risk_analysis(current_user):
    """Per-user risk profile: bot ratio, honeypot hits, anomaly flags."""
    try:
        from api.models.tracking_event import TrackingEvent

        page     = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 25, type=int)

        users = User.query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        results = []
        for user in users.items:
            user_links = Link.query.filter_by(user_id=user.id).all()
            link_ids   = [l.id for l in user_links]

            if link_ids:
                total_events = TrackingEvent.query.filter(
                    TrackingEvent.link_id.in_(link_ids)
                ).count()
                bot_events = TrackingEvent.query.filter(
                    TrackingEvent.link_id.in_(link_ids),
                    TrackingEvent.is_bot == True
                ).count()
                honeypot_hits = TrackingEvent.query.filter(
                    TrackingEvent.link_id.in_(link_ids),
                    TrackingEvent.status == 'honeypot'
                ).count()
                scanner_hits = TrackingEvent.query.filter(
                    TrackingEvent.link_id.in_(link_ids),
                    TrackingEvent.status == 'scanner_deflected'
                ).count()
            else:
                total_events = bot_events = honeypot_hits = scanner_hits = 0

            bot_ratio = round((bot_events / total_events * 100), 1) if total_events else 0

            # Risk level heuristic
            if bot_ratio > 60 or honeypot_hits > 10:
                risk_level = 'critical'
            elif bot_ratio > 30 or honeypot_hits > 3:
                risk_level = 'high'
            elif bot_ratio > 10:
                risk_level = 'medium'
            else:
                risk_level = 'low'

            results.append({
                "user_id":      user.id,
                "username":     user.username,
                "email":        user.email,
                "plan":         getattr(user, 'plan_type', 'free'),
                "total_links":  len(link_ids),
                "total_events": total_events,
                "bot_events":   bot_events,
                "bot_ratio":    bot_ratio,
                "honeypot_hits": honeypot_hits,
                "scanner_hits": scanner_hits,
                "risk_level":   risk_level,
                "joined":       user.created_at.isoformat() if user.created_at else None,
            })

        # Sort by risk level
        _risk_rank = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        results.sort(key=lambda x: _risk_rank.get(x['risk_level'], 4))

        return jsonify({
            "success": True,
            "users": results,
            "pagination": {
                "page": page, "per_page": per_page,
                "total": users.total, "pages": users.pages,
            }
        })
    except Exception as e:
        logger.error(f"Risk analysis error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/api/admin/domains/intelligence", methods=["GET"])
@admin_required
def domains_intelligence(current_user):
    """Per-domain reputation: avg inbox score, scanner exposure, total clicks."""
    try:
        from api.models.tracking_event import TrackingEvent

        domains = Domain.query.all()
        results = []

        for domain in domains:
            domain_links = Link.query.filter_by(domain=domain.name).all()
            link_ids = [l.id for l in domain_links]

            if link_ids:
                total_clicks = sum(l.total_clicks or 0 for l in domain_links)
                bot_events = TrackingEvent.query.filter(
                    TrackingEvent.link_id.in_(link_ids),
                    TrackingEvent.is_bot == True
                ).count()
                scanner_events = TrackingEvent.query.filter(
                    TrackingEvent.link_id.in_(link_ids),
                    TrackingEvent.status == 'scanner_deflected'
                ).count()
                total_events = TrackingEvent.query.filter(
                    TrackingEvent.link_id.in_(link_ids)
                ).count()
            else:
                total_clicks = bot_events = scanner_events = total_events = 0

            bot_ratio     = round((bot_events / total_events * 100), 1) if total_events else 0
            scanner_ratio = round((scanner_events / total_events * 100), 1) if total_events else 0

            # Domain reputation score (0-100)
            rep_score = 100
            rep_score -= min(bot_ratio * 0.5, 30)
            rep_score -= min(scanner_ratio * 0.3, 20)
            rep_score = max(0, round(rep_score, 1))

            results.append({
                "domain_id":    domain.id,
                "name":         domain.name,
                "status":       getattr(domain, 'status', 'unknown'),
                "total_links":  len(link_ids),
                "total_clicks": total_clicks,
                "total_events": total_events,
                "bot_events":   bot_events,
                "bot_ratio":    bot_ratio,
                "scanner_events": scanner_events,
                "scanner_ratio": scanner_ratio,
                "reputation_score": rep_score,
                "created_at":   domain.created_at.isoformat() if domain.created_at else None,
            })

        results.sort(key=lambda x: x['reputation_score'])

        return jsonify({"success": True, "domains": results})
    except Exception as e:
        logger.error(f"Domain intelligence error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/api/admin/alerts", methods=["GET"])
@admin_required
def admin_alerts(current_user):
    """Real-time alert system: bot spikes, honeypot surges, domain reputation drops."""
    try:
        from api.models.tracking_event import TrackingEvent
        from api.services.honeypot import honeypot_service

        now      = datetime.utcnow()
        last_1h  = now - timedelta(hours=1)
        last_24h = now - timedelta(hours=24)

        alerts = []

        # Bot spike alert (last hour)
        events_1h = TrackingEvent.query.filter(TrackingEvent.timestamp >= last_1h).count()
        bots_1h   = TrackingEvent.query.filter(
            TrackingEvent.timestamp >= last_1h, TrackingEvent.is_bot == True
        ).count()
        if events_1h > 10 and bots_1h / events_1h > 0.5:
            alerts.append({
                "id": "bot_spike_1h",
                "severity": "critical",
                "title": "Bot Spike Detected",
                "message": f"{bots_1h} bot events in the last hour ({round(bots_1h/events_1h*100)}% of traffic).",
                "category": "traffic",
                "timestamp": now.isoformat(),
            })

        # Honeypot surge alert
        hp_stats = honeypot_service.get_stats()
        if hp_stats.get('blacklisted_ips', 0) > 20:
            alerts.append({
                "id": "honeypot_surge",
                "severity": "warning",
                "title": "Honeypot Surge",
                "message": f"{hp_stats['blacklisted_ips']} IPs currently blacklisted via honeypot.",
                "category": "honeypot",
                "timestamp": now.isoformat(),
            })

        # Quantum violation alert
        quantum_violations = TrackingEvent.query.filter(
            TrackingEvent.timestamp >= last_24h,
            TrackingEvent.quantum_security_violation.isnot(None)
        ).count()
        if quantum_violations > 50:
            alerts.append({
                "id": "quantum_violations",
                "severity": "warning",
                "title": "High Quantum Security Violations",
                "message": f"{quantum_violations} quantum security violations in the last 24h.",
                "category": "security",
                "timestamp": now.isoformat(),
            })

        # High scanner exposure alert
        scanner_events_24h = TrackingEvent.query.filter(
            TrackingEvent.timestamp >= last_24h,
            TrackingEvent.status == 'scanner_deflected'
        ).count()
        events_24h = TrackingEvent.query.filter(TrackingEvent.timestamp >= last_24h).count()
        if events_24h > 0 and scanner_events_24h / events_24h > 0.3:
            alerts.append({
                "id": "scanner_exposure",
                "severity": "info",
                "title": "Elevated Scanner Activity",
                "message": f"{scanner_events_24h} scanner-deflected events (24h). Consider tightening stealth profiles.",
                "category": "scanner",
                "timestamp": now.isoformat(),
            })

        # New users with no approval (trial backlog)
        pending_trial = User.query.filter_by(status='pending').count()
        if pending_trial > 0:
            alerts.append({
                "id": "pending_trials",
                "severity": "info",
                "title": f"{pending_trial} Pending Trial Request{'s' if pending_trial > 1 else ''}",
                "message": "Users are waiting for trial access approval.",
                "category": "users",
                "timestamp": now.isoformat(),
            })

        return jsonify({
            "success": True,
            "alerts": alerts,
            "alert_count": len(alerts),
            "generated_at": now.isoformat(),
        })
    except Exception as e:
        logger.error(f"Admin alerts error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@admin_bp.route("/api/admin/channel-performance", methods=["GET"])
@admin_required
def channel_performance(current_user):
    """Per-channel metrics: clicks, bot ratio, scanner rate, avg inbox score."""
    try:
        from api.models.tracking_event import TrackingEvent
        from api.services.channel_adaptive import CHANNELS

        results = {}
        for channel in CHANNELS:
            channel_links = Link.query.filter_by(channel_type=channel).all()
            link_ids = [l.id for l in channel_links]

            if link_ids:
                total_events = TrackingEvent.query.filter(
                    TrackingEvent.link_id.in_(link_ids)
                ).count()
                bot_events = TrackingEvent.query.filter(
                    TrackingEvent.link_id.in_(link_ids),
                    TrackingEvent.is_bot == True
                ).count()
                scanner_events = TrackingEvent.query.filter(
                    TrackingEvent.link_id.in_(link_ids),
                    TrackingEvent.status == 'scanner_deflected'
                ).count()
                total_clicks = sum(l.total_clicks or 0 for l in channel_links)
            else:
                total_events = bot_events = scanner_events = total_clicks = 0

            results[channel] = {
                "channel":        channel,
                "total_links":    len(link_ids),
                "total_clicks":   total_clicks,
                "total_events":   total_events,
                "bot_events":     bot_events,
                "bot_ratio":      round((bot_events / total_events * 100), 1) if total_events else 0,
                "scanner_events": scanner_events,
                "scanner_ratio":  round((scanner_events / total_events * 100), 1) if total_events else 0,
            }

        return jsonify({"success": True, "channels": results})
    except Exception as e:
        logger.error(f"Channel performance error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------------------------
# Public Stats — homepage live data feed (no auth required)
# ---------------------------------------------------------------------------
@admin_bp.route("/api/public/stats", methods=["GET"])
def get_public_stats():
    """
    Returns anonymised platform-wide aggregate stats for the public homepage.
    Never exposes user data. Used to auto-switch from promotional to live numbers
    once real traffic crosses display thresholds.
    """
    try:
        from api.models.tracking_event import TrackingEvent

        total_links    = Link.query.count()
        total_users    = User.query.filter_by(is_active=True).count()
        total_clicks   = db.session.query(db.func.sum(Link.total_clicks)).scalar() or 0
        total_events   = TrackingEvent.query.count()
        total_campaigns = Campaign.query.count()

        # Derived / estimated metrics
        unique_domains = Domain.query.filter_by(is_active=True).count()
        bot_events = TrackingEvent.query.filter_by(is_bot=True).count()
        bot_ratio = round((bot_events / total_events * 100), 1) if total_events else 0
        uptime_pct = 99.99  # static SLA claim

        return jsonify({
            "success": True,
            "stats": {
                "total_links":     total_links,
                "total_clicks":    int(total_clicks),
                "total_events":    total_events,
                "total_users":     total_users,
                "total_campaigns": total_campaigns,
                "active_domains":  unique_domains,
                "bot_block_rate":  round(100 - bot_ratio, 1),
                "uptime_pct":      uptime_pct,
            }
        })
    except Exception as e:
        logger.error(f"Public stats error: {e}")
        return jsonify({"success": False, "stats": {}}), 500
