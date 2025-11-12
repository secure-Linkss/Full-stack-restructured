from flask import Blueprint, request, jsonify, session, make_response
from werkzeug.security import generate_password_hash
from functools import wraps
from src.database import db
from src.models.user import User
from src.models.campaign import Campaign
from src.models.audit_log import AuditLog
from src.models.link import Link
from src.models.domain import Domain
from datetime import datetime, timedelta

admin_bp = Blueprint("admin", __name__)

def get_current_user():
    """Get current user from token or session"""
    # Try token first
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        user = User.verify_token(token)
        if user:
            return user
    
    # Fall back to session
    if "user_id" in session:
        return User.query.get(session["user_id"])
    
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

def main_admin_required(f):
    """Decorator to require main_admin role only"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        
        if user.role != "main_admin":
            return jsonify({"error": "Main admin access required"}), 403
        
        return f(user, *args, **kwargs)
    return decorated_function

def log_admin_action(actor_id, action, target_id=None, target_type=None):
    """Log admin actions to audit_logs"""
    audit_log = AuditLog(
        actor_id=actor_id,
        action=action,
        target_id=target_id,
        target_type=target_type
    )
    db.session.add(audit_log)
    db.session.commit()

# User Management Endpoints
@admin_bp.route("/api/admin/users", methods=["GET"])
@admin_required
def get_users(current_user):
    """Get all users (Main Admin: all users, Admin: members only)"""
    if current_user.role == "main_admin":
        users = User.query.all()
    else:
        users = User.query.filter_by(role="member").all()
    
    return jsonify([user.to_dict(include_sensitive=True) for user in users])

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


# Campaign Management Endpoints
@admin_bp.route("/api/admin/campaigns", methods=["GET"])
@admin_required
def get_campaigns(current_user):
    """Get all campaigns"""
    campaigns = Campaign.query.all()
    return jsonify([campaign.to_dict() for campaign in campaigns])

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
        
        # Log the action
        log_admin_action(current_user.id, f"Deleted user {user_to_delete.username}", user_to_delete.id, "user")
        
        # Delete the user
        db.session.delete(user_to_delete)
        db.session.commit()
        
        return jsonify({"message": "User deleted successfully"})
        
    except Exception as e:
        print(f"Error deleting user: {e}")
        return jsonify({"error": str(e)}), 500

@admin_bp.route("/api/admin/system/delete-all", methods=["POST"])
@main_admin_required
def delete_all_system_data(current_user):
    """Delete all system data except main admin users (Main Admin only)"""
    try:
        data = request.get_json()
        if not data or data.get('confirm') != 'DELETE_ALL_DATA':
            return jsonify({"error": "Confirmation required"}), 400
        
        # Delete all tracking events
        from src.models.tracking_event import TrackingEvent
        TrackingEvent.query.delete()
        
        # Delete all links
        Link.query.delete()
        
        # Delete all campaigns
        Campaign.query.delete()
        
        # Delete all audit logs except this action
        AuditLog.query.delete()
        
        # Delete all non-main-admin users
        User.query.filter(User.role != "main_admin").delete()
        
        # Log this critical action
        log_admin_action(current_user.id, "DELETED ALL SYSTEM DATA", None, "system")
        
        db.session.commit()
        
        return jsonify({"message": "All system data deleted successfully"})
        
    except Exception as e:
        print(f"Error deleting system data: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



# ==================== DOMAIN MANAGEMENT ====================

@admin_bp.route('/domains', methods=['GET'])
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


@admin_bp.route('/domains', methods=['POST'])
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


@admin_bp.route('/domains/<int:domain_id>', methods=['GET'])
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


@admin_bp.route('/domains/<int:domain_id>', methods=['PUT'])
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


@admin_bp.route('/domains/<int:domain_id>', methods=['DELETE'])
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


@admin_bp.route('/domains/<int:domain_id>/verify', methods=['POST'])
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


@admin_bp.route('/domains/stats', methods=['GET'])
@admin_required
def get_domains_stats(current_user):
    """Get domain statistics"""
    try:
        if current_user.role == 'main_admin':
            total_domains = Domain.query.count()
            active_domains = Domain.query.filter_by(is_active=True).count()
            verified_domains = Domain.query.filter_by(is_verified=True).count()
        else:
            total_domains = Domain.query.filter_by(created_by=current_user.id).count()
            active_domains = Domain.query.filter_by(created_by=current_user.id, is_active=True).count()
            verified_domains = Domain.query.filter_by(created_by=current_user.id, is_verified=True).count()
        
        return jsonify({
            'total_domains': total_domains,
            'active_domains': active_domains,
            'verified_domains': verified_domains,
            'inactive_domains': total_domains - active_domains
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

