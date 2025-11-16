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