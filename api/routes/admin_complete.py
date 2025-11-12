from sqlalchemy import func
from src.models.tracking_event import TrackingEvent
from src.models.security_threat import SecurityThreat
from flask import Blueprint, request, jsonify, session, make_response
from werkzeug.security import generate_password_hash
from functools import wraps
from src.database import db
from src.models.user import User
from src.models.campaign import Campaign
from src.models.audit_log import AuditLog
from src.models.link import Link
from src.models.domain import Domain
from src.models.security_threat_db import SecurityThreat
from src.models.support_ticket_db import SupportTicket
from src.models.subscription_verification_db import SubscriptionVerification
from datetime import datetime, timedelta
import csv
import io

admin_complete_bp = Blueprint("admin_complete", __name__)

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
    try:
        audit_log = AuditLog(
            actor_id=actor_id,
            action=action,
            target_id=target_id,
            target_type=target_type
        )
        db.session.add(audit_log)
        db.session.commit()
    except Exception as e:
        print(f"Error logging admin action: {e}")

# ==================== DASHBOARD ENDPOINTS ====================

@admin_complete_bp.route("/api/admin/dashboard", methods=["GET"])
@admin_required
def get_dashboard_stats(current_user):
    """Get comprehensive dashboard statistics"""
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
        
        # Click statistics (sum from all links)
        from sqlalchemy import func
        total_clicks = db.session.query(func.sum(Link.total_clicks)).scalar() or 0
        
        # Recent activity
        recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
        recent_campaigns = Campaign.query.order_by(Campaign.created_at.desc()).limit(5).all()
        recent_links = Link.query.order_by(Link.created_at.desc()).limit(5).all()
        
        # Security threats
        security_threats = SecurityThreat.query.filter_by(status="active").count()
        
        # Support tickets
        open_tickets = SupportTicket.query.filter_by(status="open").count()
        
        return jsonify({
            "totalUsers": total_users,
            "totalCampaigns": total_campaigns,
            "totalLinks": total_links,
            "totalClicks": total_clicks,
            "activeUsers": active_users,
            "activeCampaigns": active_campaigns,
            "activeLinks": active_links,
            "newUsersToday": new_users_today,
            "securityThreats": security_threats,
            "openTickets": open_tickets,
            "recentActivity": {
                "users": [user.to_dict() for user in recent_users],
                "campaigns": [campaign.to_dict() for campaign in recent_campaigns],
                "links": [link.to_dict() for link in recent_links]
            }
        })
        
    except Exception as e:
        print(f"Error fetching dashboard stats: {e}")
        return jsonify({"error": "Failed to fetch dashboard statistics"}), 500

@admin_complete_bp.route("/api/admin/dashboard/stats", methods=["GET"])
@admin_required
def get_admin_dashboard_stats(current_user):
    """Get admin dashboard statistics - alternative endpoint"""
    try:
        # User statistics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        suspended_users = User.query.filter_by(is_active=False).count()
        verified_users = User.query.filter_by(is_verified=True).count()
        
        # Users by role
        main_admins = User.query.filter_by(role="main_admin").count()
        admins = User.query.filter_by(role="admin").count()
        members = User.query.filter_by(role="member").count()
        
        # Campaign statistics
        total_campaigns = Campaign.query.count()
        active_campaigns = Campaign.query.filter_by(status="active").count()
        paused_campaigns = Campaign.query.filter_by(status="paused").count()
        
        # Link statistics
        total_links = Link.query.count()
        active_links = Link.query.filter_by(status="active").count()
        
        # Click statistics
        from sqlalchemy import func
        total_clicks = db.session.query(func.sum(Link.total_clicks)).scalar() or 0
        
        # Domain statistics
        total_domains = Domain.query.count()
        active_domains = Domain.query.filter_by(is_active=True).count()
        verified_domains = Domain.query.filter_by(is_verified=True).count()
        
        return jsonify({
            "users": {
                "total": total_users,
                "active": active_users,
                "suspended": suspended_users,
                "verified": verified_users,
                "by_role": {
                    "main_admin": main_admins,
                    "admin": admins,
                    "member": members
                }
            },
            "campaigns": {
                "total": total_campaigns,
                "active": active_campaigns,
                "paused": paused_campaigns
            },
            "links": {
                "total": total_links,
                "active": active_links
            },
            "clicks": {
                "total": total_clicks
            },
            "domains": {
                "total": total_domains,
                "active": active_domains,
                "verified": verified_domains
            }
        })
        
    except Exception as e:
        print(f"Error fetching admin dashboard stats: {e}")
        return jsonify({"error": "Failed to fetch admin dashboard statistics"}), 500

# ==================== CAMPAIGN MANAGEMENT ====================

@admin_complete_bp.route("/api/admin/campaigns", methods=["GET"])
@admin_required
def get_admin_campaigns(current_user):
    """Get all campaigns for admin - returns live data from Campaign table and campaign_name field"""
    try:
        campaigns_data = []
        from src.models.tracking_event import TrackingEvent

        # Method 1: Get campaigns from Campaign table
        campaigns_from_table = Campaign.query.all()
        for campaign in campaigns_from_table:
            # Get campaign links using campaign_id or campaign_name
            links = Link.query.filter(
                (Link.campaign_id == campaign.id) | (Link.campaign_name == campaign.name)
            ).all()

            # Calculate statistics from TrackingEvent
            link_ids = [link.id for link in links]
            total_clicks = 0
            captured_emails = 0

            if link_ids:
                events = TrackingEvent.query.filter(TrackingEvent.link_id.in_(link_ids)).all()
                total_clicks = len(events)
                captured_emails = len([e for e in events if e.captured_email])

            conversion_rate = (captured_emails / total_clicks * 100) if total_clicks > 0 else 0

            campaign_dict = campaign.to_dict()
            campaign_dict.update({
                "link_count": len(links),
                "clicks": total_clicks,
                "emails": captured_emails,
                "conversion": f"{round(conversion_rate, 1)}%",
                "links": [link.to_dict() for link in links[:10]]
            })
            campaigns_data.append(campaign_dict)

        # Method 2: Get campaigns from campaign_name field (campaigns not in Campaign table)
        campaign_names = db.session.query(Link.campaign_name).filter(
            Link.campaign_name.isnot(None),
            Link.campaign_name != ''
        ).distinct().all()

        for (campaign_name,) in campaign_names:
            # Skip if already included from Campaign table
            if any(c.get('name') == campaign_name for c in campaigns_data):
                continue

            # Get links belonging to this campaign
            campaign_links = Link.query.filter_by(campaign_name=campaign_name).all()
            link_ids = [link.id for link in campaign_links]

            total_clicks = 0
            captured_emails = 0

            if link_ids:
                campaign_events = TrackingEvent.query.filter(TrackingEvent.link_id.in_(link_ids)).all()
                total_clicks = len(campaign_events)
                captured_emails = len([e for e in campaign_events if e.captured_email])

            conversion_rate = (captured_emails / total_clicks * 100) if total_clicks > 0 else 0

            # Get owner of first link
            owner = campaign_links[0].user if campaign_links else None

            campaigns_data.append({
                'id': campaign_name,
                'name': campaign_name,
                'status': 'active',
                'owner': owner.username if owner else 'Unknown',
                'link_count': len(campaign_links),
                'clicks': total_clicks,
                'emails': captured_emails,
                'conversion': f"{round(conversion_rate, 1)}%",
                'created_at': campaign_links[0].created_at.isoformat() if campaign_links and campaign_links[0].created_at else None,
                'links': [link.to_dict() for link in campaign_links[:10]]
            })

        return jsonify({"success": True, "campaigns": campaigns_data})

    except Exception as e:
        print(f"Error fetching campaigns: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@admin_complete_bp.route("/api/admin/campaigns/details", methods=["GET"])
@admin_required
def get_admin_campaigns_details(current_user):
    """Get detailed campaign information"""
    try:
        campaigns = Campaign.query.all()
        campaigns_data = []
        
        for campaign in campaigns:
            # Get campaign links
            links = Link.query.filter_by(campaign_id=campaign.id).all()
            
            # Calculate statistics
            total_clicks = sum(link.clicks or 0 for link in links)
            
            campaign_dict = campaign.to_dict()
            campaign_dict.update({
                "link_count": len(links),
                "click_count": total_clicks,
                "links": [link.to_dict() for link in links]  # All links
            })
            campaigns_data.append(campaign_dict)
        
        return jsonify({"campaigns": campaigns_data})
        
    except Exception as e:
        print(f"Error fetching campaign details: {e}")
        return jsonify({"error": "Failed to fetch campaign details"}), 500

# ==================== SECURITY MANAGEMENT ====================

@admin_complete_bp.route("/api/admin/security/threats", methods=["GET"])
@admin_required
def get_security_threats(current_user):
    """Get all security threats"""
    try:
        threats = SecurityThreat.query.order_by(SecurityThreat.created_at.desc()).all()
        return jsonify({"threats": [threat.to_dict() for threat in threats]})
        
    except Exception as e:
        print(f"Error fetching security threats: {e}")
        return jsonify({"error": "Failed to fetch security threats"}), 500

@admin_complete_bp.route("/api/admin/security/threats/<int:threat_id>/resolve", methods=["POST"])
@admin_required
def resolve_security_threat(current_user, threat_id):
    """Resolve a security threat"""
    try:
        threat = SecurityThreat.query.get_or_404(threat_id)
        threat.status = "resolved"
        threat.resolved_at = datetime.utcnow()
        threat.resolved_by = current_user.id
        
        db.session.commit()
        
        # Log action
        log_admin_action(current_user.id, f"Resolved security threat {threat_id}", threat_id, "security_threat")
        
        return jsonify({"message": "Security threat resolved successfully"})
        
    except Exception as e:
        print(f"Error resolving security threat: {e}")
        return jsonify({"error": "Failed to resolve security threat"}), 500

# ==================== SUBSCRIPTION MANAGEMENT ====================

@admin_complete_bp.route("/api/admin/subscriptions", methods=["GET"])
@admin_required
def get_subscriptions(current_user):
    """Get all user subscriptions"""
    try:
        # Get all users with subscription info
        users = User.query.filter(User.plan_type != "free").all()
        subscriptions = []
        
        for user in users:
            subscription_data = {
                "id": user.id,
                "user_name": user.username,
                "user_email": user.email,
                "plan_type": user.plan_type,
                "status": "expired" if user.subscription_expiry and user.subscription_expiry < datetime.utcnow() else "active",
                "expiry_date": user.subscription_expiry.isoformat() if user.subscription_expiry else None,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
            subscriptions.append(subscription_data)
        
        return jsonify({"subscriptions": subscriptions})
        
    except Exception as e:
        print(f"Error fetching subscriptions: {e}")
        return jsonify({"error": "Failed to fetch subscriptions"}), 500

@admin_complete_bp.route("/api/admin/subscriptions/<int:user_id>/extend", methods=["POST"])
@admin_required
def extend_subscription(current_user, user_id):
    """Extend user subscription"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json() or {}
        days = data.get("days", 30)
        
        if user.subscription_expiry:
            user.subscription_expiry = user.subscription_expiry + timedelta(days=days)
        else:
            user.subscription_expiry = datetime.utcnow() + timedelta(days=days)
        
        db.session.commit()
        
        # Log action
        log_admin_action(current_user.id, f"Extended subscription for user {user.username} by {days} days", user_id, "subscription")
        
        return jsonify({"message": f"Subscription extended by {days} days"})
        
    except Exception as e:
        print(f"Error extending subscription: {e}")
        return jsonify({"error": "Failed to extend subscription"}), 500

# ==================== SUPPORT TICKET MANAGEMENT ====================

@admin_complete_bp.route("/api/admin/support/tickets", methods=["GET"])
@admin_required
def get_support_tickets(current_user):
    """Get all support tickets"""
    try:
        tickets = SupportTicket.query.order_by(SupportTicket.created_at.desc()).all()
        return jsonify({"tickets": [ticket.to_dict() for ticket in tickets]})
        
    except Exception as e:
        print(f"Error fetching support tickets: {e}")
        return jsonify({"error": "Failed to fetch support tickets"}), 500

@admin_complete_bp.route("/api/admin/support/tickets/<int:ticket_id>/status", methods=["PATCH"])
@admin_required
def update_ticket_status(current_user, ticket_id):
    """Update support ticket status"""
    try:
        ticket = SupportTicket.query.get_or_404(ticket_id)
        data = request.get_json()
        new_status = data.get("status")
        
        if new_status not in ["open", "in_progress", "closed"]:
            return jsonify({"error": "Invalid status"}), 400
        
        ticket.status = new_status
        ticket.updated_at = datetime.utcnow()
        
        if new_status == "closed":
            ticket.closed_at = datetime.utcnow()
            ticket.closed_by = current_user.id
        
        db.session.commit()
        
        # Log action
        log_admin_action(current_user.id, f"Updated ticket {ticket_id} status to {new_status}", ticket_id, "support_ticket")
        
        return jsonify({"message": "Ticket status updated successfully"})
        
    except Exception as e:
        print(f"Error updating ticket status: {e}")
        return jsonify({"error": "Failed to update ticket status"}), 500

# ==================== DOMAIN MANAGEMENT ====================

@admin_complete_bp.route("/api/admin/domains", methods=["GET"])
@admin_required
def get_admin_domains(current_user):
    """Get all domains for admin"""
    try:
        if current_user.role == "main_admin":
            domains = Domain.query.all()
        else:
            domains = Domain.query.filter_by(created_by=current_user.id).all()
        
        domains_data = []
        for domain in domains:
            domain_dict = domain.to_dict()
            domain_dict["status"] = "active" if domain.is_active else "inactive"
            domains_data.append(domain_dict)
        
        return jsonify({"domains": domains_data})
        
    except Exception as e:
        print(f"Error fetching domains: {e}")
        return jsonify({"error": "Failed to fetch domains"}), 500

@admin_complete_bp.route("/api/admin/domains", methods=["POST"])
@admin_required
def create_admin_domain(current_user):
    """Create a new domain"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get("domain"):
            return jsonify({"error": "Domain name is required"}), 400
        
        # Check if domain already exists
        existing = Domain.query.filter_by(domain=data["domain"]).first()
        if existing:
            return jsonify({"error": "Domain already exists"}), 409
        
        # Create new domain
        domain = Domain(
            domain=data["domain"],
            domain_type=data.get("domain_type", "custom"),
            description=data.get("description", ""),
            is_active=data.get("is_active", True),
            api_key=data.get("api_key"),
            api_secret=data.get("api_secret"),
            created_by=current_user.id
        )
        
        db.session.add(domain)
        db.session.commit()
        
        # Log action
        log_admin_action(current_user.id, f"Created domain {domain.domain}", domain.id, "domain")
        
        return jsonify(domain.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating domain: {e}")
        return jsonify({"error": "Failed to create domain"}), 500

@admin_complete_bp.route("/api/admin/domains/<int:domain_id>", methods=["DELETE"])
@admin_required
def delete_admin_domain(current_user, domain_id):
    """Delete a domain"""
    try:
        domain = Domain.query.get_or_404(domain_id)
        
        # Check permissions
        if current_user.role != "main_admin" and domain.created_by != current_user.id:
            return jsonify({"error": "Unauthorized"}), 403
        
        # Check if domain has active links
        active_links = Link.query.filter_by(domain=domain.domain, status="active").count()
        if active_links > 0:
            return jsonify({"error": f"Cannot delete domain with {active_links} active links"}), 409
        
        domain_name = domain.domain
        db.session.delete(domain)
        db.session.commit()
        
        # Log action
        log_admin_action(current_user.id, f"Deleted domain {domain_name}", domain_id, "domain")
        
        return jsonify({"message": "Domain deleted successfully"})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting domain: {e}")
        return jsonify({"error": "Failed to delete domain"}), 500

# ==================== AUDIT LOG MANAGEMENT ====================

@admin_complete_bp.route("/api/admin/audit-logs", methods=["GET"])
@main_admin_required
def get_admin_audit_logs(current_user):
    """Get all audit logs (Main Admin only)"""
    try:
        # Get query parameters
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 50, type=int)
        
        # Query audit logs with pagination
        logs_query = AuditLog.query.order_by(AuditLog.created_at.desc())
        logs_paginated = logs_query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        logs_data = []
        for log in logs_paginated.items:
            log_dict = log.to_dict()
            # Get actor name if available
            if log.actor_id:
                actor = User.query.get(log.actor_id)
                log_dict["actor_name"] = actor.username if actor else "Unknown"
            logs_data.append(log_dict)
        
        return jsonify({
            "logs": logs_data,
            "pagination": {
                "page": page,
                "pages": logs_paginated.pages,
                "per_page": per_page,
                "total": logs_paginated.total,
                "has_next": logs_paginated.has_next,
                "has_prev": logs_paginated.has_prev
            }
        })
        
    except Exception as e:
        print(f"Error fetching audit logs: {e}")
        return jsonify({"error": "Failed to fetch audit logs"}), 500

@admin_complete_bp.route("/api/admin/audit-logs/export", methods=["GET"])
@main_admin_required
def export_admin_audit_logs(current_user):
    """Export audit logs as CSV (Main Admin only)"""
    try:
        logs = AuditLog.query.order_by(AuditLog.created_at.desc()).all()
        
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(["ID", "Actor ID", "Actor Name", "Action", "Target ID", "Target Type", "Created At"])
        
        # Write data
        for log in logs:
            actor_name = ""
            if log.actor_id:
                actor = User.query.get(log.actor_id)
                actor_name = actor.username if actor else "Unknown"
            
            writer.writerow([
                log.id,
                log.actor_id or "",
                actor_name,
                log.action,
                log.target_id or "",
                log.target_type or "",
                log.created_at.isoformat() if log.created_at else ""
            ])
        
        # Create response
        output.seek(0)
        response = make_response(output.getvalue())
        response.headers["Content-Type"] = "text/csv"
        response.headers["Content-Disposition"] = f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return response
        
    except Exception as e:
        print(f"Error exporting audit logs: {e}")
        return jsonify({"error": "Failed to export audit logs"}), 500

# ==================== SYSTEM MANAGEMENT ====================

@admin_complete_bp.route("/api/admin/system/health", methods=["GET"])
@admin_required
def get_system_health(current_user):
    """Get system health status"""
    try:
        # Database health
        db_healthy = True
        try:
            User.query.first()
        except Exception:
            db_healthy = False
        
        # Get system statistics
        total_users = User.query.count()
        total_links = Link.query.count()
        total_campaigns = Campaign.query.count()
        total_domains = Domain.query.count()
        
        # Memory usage (basic)
        import psutil
        memory_usage = psutil.virtual_memory().percent
        
        return jsonify({
            "status": "healthy" if db_healthy else "unhealthy",
            "database": {
                "status": "connected" if db_healthy else "disconnected",
                "users": total_users,
                "links": total_links,
                "campaigns": total_campaigns,
                "domains": total_domains
            },
            "system": {
                "memory_usage": memory_usage,
                "uptime": "N/A"  # Would need process tracking
            }
        })
        
    except Exception as e:
        print(f"Error getting system health: {e}")
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

@admin_complete_bp.route("/api/admin/system/delete-all", methods=["POST"])
@main_admin_required
def delete_all_admin_system_data(current_user):
    """Delete all system data except main admin users (Main Admin only)"""
    try:
        data = request.get_json()
        if not data or data.get("confirm") != "DELETE_ALL_DATA":
            return jsonify({"error": "Confirmation required"}), 400
        
        # Delete all tracking events
        from src.models.tracking_event import TrackingEvent
        TrackingEvent.query.delete()
        
        # Delete all links
        Link.query.delete()
        
        # Delete all campaigns
        Campaign.query.delete()
        
        # Delete all domains
        Domain.query.delete()
        
        # Delete all security threats
        SecurityThreat.query.delete()
        
        # Delete all support tickets
        SupportTicket.query.delete()
        
        # Delete all subscription verifications
        SubscriptionVerification.query.delete()
        
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
        return jsonify({"error": "Failed to delete system data"}), 500

@admin_complete_bp.route("/api/admin/users/enhanced", methods=["GET"])
def get_enhanced_users():
    """Get enhanced user list with all requested columns"""
    try:
        # Check admin authentication
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        current_user = User.query.get(user_id)
        if not current_user or current_user.role not in ['admin', 'main_admin']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get all users with enhanced data
        users = User.query.all()
        
        user_list = []
        for user in users:
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'status': user.status,
                'account_type': user.role,  # admin / user / sub_admin
                'subscription_plan': user.plan_type or 'free',
                'subscription_status': user.subscription_status or 'inactive',
                'payment_status': user.subscription_status or 'unpaid',
                'date_joined': user.created_at.isoformat() if user.created_at else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'login_method': getattr(user, 'login_method', 'email'),
                'is_verified': user.is_verified,
                'verification_status': 'verified' if user.is_verified else 'pending',
                'is_active': user.is_active,
                'total_links': Link.query.filter_by(user_id=user.id).count(),
                'total_clicks': db.session.query(func.count(TrackingEvent.id)).join(
                    Link, TrackingEvent.link_id == Link.id
                ).filter(Link.user_id == user.id).scalar() or 0
            }
            user_list.append(user_data)
        
        # Separate into categories
        active_users = [u for u in user_list if u['is_active'] and u['is_verified']]
        pending_users = [u for u in user_list if not u['is_verified']]
        suspended_users = [u for u in user_list if not u['is_active']]
        
        return jsonify({
            'success': True,
            'users': user_list,
            'active_users': active_users,
            'pending_users': pending_users,
            'suspended_users': suspended_users,
            'stats': {
                'total': len(user_list),
                'active': len(active_users),
                'pending': len(pending_users),
                'suspended': len(suspended_users),
                'admins': len([u for u in user_list if u['role'] in ['admin', 'main_admin']])
            }
        })
    
    except Exception as e:
        print(f"Error in enhanced users: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@admin_complete_bp.route("/api/admin/security/threats/enhanced", methods=["GET"])
def get_enhanced_security_threats():
    """Get security threats with enhanced details"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        current_user = User.query.get(user_id)
        if not current_user or current_user.role not in ['admin', 'main_admin']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get all security threats
        threats = SecurityThreat.query.order_by(SecurityThreat.detected_at.desc()).all()
        
        threat_list = []
        for threat in threats:
            threat_data = {
                'id': threat.id,
                'ip_address': threat.ip_address,
                'country': getattr(threat, 'country', 'Unknown'),
                'city': getattr(threat, 'city', 'Unknown'),
                'threat_type': threat.threat_type,
                'severity': threat.severity,
                'status': threat.status,
                'description': threat.description,
                'user_agent': getattr(threat, 'user_agent', 'Unknown'),
                'device': getattr(threat, 'device', 'Unknown'),
                'browser': getattr(threat, 'browser', 'Unknown'),
                'action_taken': getattr(threat, 'action_taken', 'None'),
                'detected_at': threat.detected_at.isoformat() if threat.detected_at else None,
                'resolved_at': threat.resolved_at.isoformat() if threat.resolved_at else None
            }
            threat_list.append(threat_data)
        
        # Get bot activity
        bot_events = TrackingEvent.query.filter_by(is_bot=True).order_by(
            TrackingEvent.timestamp.desc()
        ).limit(100).all()
        
        bot_activity = []
        for event in bot_events:
            bot_activity.append({
                'id': event.id,
                'ip_address': event.ip_address,
                'country': event.country_name,
                'city': event.city,
                'user_agent': event.user_agent,
                'bot_type': event.browser,  # Often contains bot name
                'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                'blocked': True
            })
        
        return jsonify({
            'success': True,
            'threats': threat_list,
            'bot_activity': bot_activity,
            'stats': {
                'total_threats': len(threat_list),
                'active_threats': len([t for t in threat_list if t['status'] == 'active']),
                'resolved_threats': len([t for t in threat_list if t['status'] == 'resolved']),
                'bots_blocked': len(bot_activity),
                'high_severity': len([t for t in threat_list if t['severity'] == 'high'])
            }
        })
    
    except Exception as e:
        print(f"Error in enhanced security: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@admin_complete_bp.route("/api/admin/campaigns/enhanced", methods=["GET"])
def get_enhanced_campaigns():
    """Get campaigns with all requested details"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        # Get all campaigns
        campaigns = Campaign.query.all()
        
        campaign_list = []
        for campaign in campaigns:
            # Get associated links count
            links_count = Link.query.filter_by(campaign_id=campaign.id).count()
            
            # Get total clicks
            total_clicks = db.session.query(func.count(TrackingEvent.id)).join(
                Link, TrackingEvent.link_id == Link.id
            ).filter(Link.campaign_id == campaign.id).scalar() or 0
            
            # Get real visitors (non-bot)
            real_visitors = db.session.query(func.count(TrackingEvent.id)).join(
                Link, TrackingEvent.link_id == Link.id
            ).filter(
                Link.campaign_id == campaign.id,
                TrackingEvent.is_bot == False
            ).scalar() or 0
            
            # Get bot traffic
            bot_traffic = total_clicks - real_visitors
            
            # Calculate conversion rate (placeholder)
            conversion_rate = (real_visitors / total_clicks * 100) if total_clicks > 0 else 0
            
            campaign_data = {
                'id': campaign.id,
                'name': campaign.name,
                'description': campaign.description,
                'status': campaign.status,
                'associated_links': links_count,
                'total_clicks': total_clicks,
                'real_visitors': real_visitors,
                'bot_traffic': bot_traffic,
                'conversion_rate': round(conversion_rate, 2),
                'created_at': campaign.created_at.isoformat() if campaign.created_at else None,
                'user_id': campaign.user_id,
                'user_name': User.query.get(campaign.user_id).username if campaign.user_id else 'Unknown'
            }
            campaign_list.append(campaign_data)
        
        return jsonify({
            'success': True,
            'campaigns': campaign_list,
            'total': len(campaign_list)
        })
    
    except Exception as e:
        print(f"Error in enhanced campaigns: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@admin_complete_bp.route("/api/admin/audit/enhanced", methods=["GET"])
def get_enhanced_audit_logs():
    """Get audit logs with all requested columns"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        # Get query parameters
        action_type = request.args.get('action_type', 'all')
        limit = int(request.args.get('limit', 100))
        
        # Base query
        query = AuditLog.query.order_by(AuditLog.timestamp.desc())
        
        # Filter by action type if specified
        if action_type != 'all':
            query = query.filter_by(action=action_type)
        
        logs = query.limit(limit).all()
        
        log_list = []
        for log in logs:
            log_data = {
                'id': log.id,
                'audit_id': f"AUD-{log.id:06d}",
                'user': User.query.get(log.user_id).username if log.user_id else 'System',
                'user_id': log.user_id,
                'action_type': log.action,
                'description': log.description or log.action,
                'timestamp': log.timestamp.isoformat() if log.timestamp else None,
                'ip_address': log.ip_address or 'Unknown',
                'status': getattr(log, 'status', 'success'),
                'details': log.details if hasattr(log, 'details') else {}
            }
            log_list.append(log_data)
        
        # Calculate stats
        total_logs = AuditLog.query.count()
        failed_actions = len([l for l in log_list if l['status'] == 'failed'])
        successful_actions = len([l for l in log_list if l['status'] == 'success'])
        
        return jsonify({
            'success': True,
            'logs': log_list,
            'stats': {
                'total_logs': total_logs,
                'failed_actions': failed_actions,
                'successful_actions': successful_actions,
                'api_errors': 0  # Would need separate tracking
            }
        })
    
    except Exception as e:
        print(f"Error in enhanced audit logs: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@admin_complete_bp.route("/api/admin/settings/enhanced", methods=["GET"])
def get_enhanced_settings():
    """Get enhanced settings including domain management"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        # Get domains with enhanced data
        domains = Domain.query.all()
        domain_list = []
        for domain in domains:
            domain_data = {
                'id': domain.id,
                'domain': domain.domain,
                'ip_address': getattr(domain, 'ip_address', 'N/A'),
                'ssl_status': getattr(domain, 'ssl_enabled', False),
                'status': 'active' if domain.is_active else 'inactive',
                'severity': getattr(domain, 'severity', 'normal'),
                'created_at': domain.created_at.isoformat() if domain.created_at else None
            }
            domain_list.append(domain_data)
        
        # System stats
        system_stats = {
            'database': {
                'type': 'PostgreSQL',
                'status': 'connected',
                'size': 'N/A'  # Would need separate query
            },
            'email_smtp': {
                'host': os.environ.get('SMTP_HOST', 'Not configured'),
                'port': os.environ.get('SMTP_PORT', 'Not configured'),
                'status': 'configured' if os.environ.get('SMTP_HOST') else 'not configured'
            },
            'telegram': {
                'bot_configured': bool(os.environ.get('TELEGRAM_BOT_TOKEN_SYSTEM')),
                'status': 'active' if os.environ.get('TELEGRAM_BOT_TOKEN_SYSTEM') else 'inactive'
            },
            'payment': {
                'stripe': {
                    'configured': bool(os.environ.get('STRIPE_SECRET_KEY')),
                    'mode': 'test' if 'test' in os.environ.get('STRIPE_SECRET_KEY', '') else 'live'
                },
                'crypto': {
                    'configured': bool(os.environ.get('ENABLE_CRYPTO_PAYMENTS')),
                    'enabled': os.environ.get('ENABLE_CRYPTO_PAYMENTS', 'false') == 'true'
                }
            }
        }
        
        return jsonify({
            'success': True,
            'domains': domain_list,
            'system_stats': system_stats
        })
    
    except Exception as e:
        print(f"Error in enhanced settings: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

@admin_complete_bp.route("/api/admin/dashboard/stats/consistent", methods=["GET"])
def get_consistent_dashboard_stats():
    """Get dashboard stats with consistent calculation"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        # Total users
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True, is_verified=True).count()
        pending_users = User.query.filter_by(is_verified=False).count()
        
        # Total links
        total_links = Link.query.count()
        active_links = Link.query.filter_by(is_active=True).count()
        
        # Total clicks and real visitors - CONSISTENT CALCULATION
        total_clicks = TrackingEvent.query.count()
        real_visitors = TrackingEvent.query.filter_by(is_bot=False).count()
        bot_clicks = TrackingEvent.query.filter_by(is_bot=True).count()
        
        # Campaigns
        total_campaigns = Campaign.query.count()
        active_campaigns = Campaign.query.filter_by(status='active').count()
        
        # Today's stats
        from datetime import datetime, timedelta
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        
        today_clicks = TrackingEvent.query.filter(
            TrackingEvent.timestamp >= today_start
        ).count()
        
        today_visitors = TrackingEvent.query.filter(
            TrackingEvent.timestamp >= today_start,
            TrackingEvent.is_bot == False
        ).count()
        
        # Security threats
        from src.models.security_threat import SecurityThreat
        active_threats = SecurityThreat.query.filter_by(status='active').count()
        
        # Subscription stats
        pro_users = User.query.filter_by(plan_type='pro').count()
        enterprise_users = User.query.filter_by(plan_type='enterprise').count()
        
        return jsonify({
            'success': True,
            'users': {
                'total': total_users,
                'active': active_users,
                'pending': pending_users,
                'pro': pro_users,
                'enterprise': enterprise_users
            },
            'links': {
                'total': total_links,
                'active': active_links
            },
            'traffic': {
                'total_clicks': total_clicks,
                'real_visitors': real_visitors,
                'bot_clicks': bot_clicks,
                'today_clicks': today_clicks,
                'today_visitors': today_visitors
            },
            'campaigns': {
                'total': total_campaigns,
                'active': active_campaigns
            },
            'security': {
                'active_threats': active_threats
            }
        })
    
    except Exception as e:
        print(f"Error in consistent stats: {str(e)}")
        return jsonify({
            'error': str(e),
            'success': False
        }), 500

