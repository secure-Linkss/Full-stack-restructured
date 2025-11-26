"""
Advanced Campaign Management Routes
Full CRUD operations for campaign management with analytics
"""

from flask import Blueprint, request, jsonify
from functools import wraps
from api.database import db
from api.models.user import User
from api.models.campaign import Campaign
from api.models.link import Link
from api.models.audit_log import AuditLog
from datetime import datetime, timedelta
from sqlalchemy import func, and_

campaigns_advanced_bp = Blueprint("campaigns_advanced", __name__)

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
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        if user.role not in ["admin", "main_admin"]:
            return jsonify({"error": "Admin access required"}), 403
        return f(user, *args, **kwargs)
    return decorated_function

# User Campaign Management Routes

@campaigns_advanced_bp.route("/api/user/campaigns", methods=["GET"])
@login_required
def get_user_campaigns(current_user):
    """Get all campaigns for the current user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str)
        
        query = Campaign.query.filter_by(user_id=current_user.id)
        
        if search:
            query = query.filter(Campaign.name.ilike(f"%{search}%"))
        
        campaigns = query.order_by(Campaign.created_at.desc()).paginate(page=page, per_page=per_page)
        
        return jsonify({
            "campaigns": [{
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "status": c.status,
                "created_at": c.created_at.isoformat(),
                "updated_at": c.updated_at.isoformat(),
                "links_count": Link.query.filter_by(campaign_id=c.id).count(),
                "total_clicks": sum(l.clicks for l in Link.query.filter_by(campaign_id=c.id).all()) if c.id else 0
            } for c in campaigns.items],
            "total": campaigns.total,
            "pages": campaigns.pages,
            "current_page": page
        }), 200
    except Exception as e:
        print(f"Error getting user campaigns: {e}")
        return jsonify({"error": "Failed to get campaigns"}), 500

@campaigns_advanced_bp.route("/api/user/campaigns", methods=["POST"])
@login_required
def create_user_campaign(current_user):
    """Create a new campaign for the current user"""
    try:
        data = request.get_json()
        
        if not data.get("name"):
            return jsonify({"error": "Campaign name is required"}), 400
        
        campaign = Campaign(
            user_id=current_user.id,
            name=data.get("name"),
            description=data.get("description", ""),
            status="active"
        )
        
        db.session.add(campaign)
        db.session.commit()
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Created campaign: {campaign.name}",
            target_id=campaign.id,
            target_type="campaign"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Campaign created successfully",
            "campaign": {
                "id": campaign.id,
                "name": campaign.name,
                "description": campaign.description,
                "status": campaign.status,
                "created_at": campaign.created_at.isoformat()
            }
        }), 201
    except Exception as e:
        print(f"Error creating campaign: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to create campaign"}), 500

@campaigns_advanced_bp.route("/api/user/campaigns/<int:campaign_id>", methods=["GET"])
@login_required
def get_user_campaign_detail(current_user, campaign_id):
    """Get detailed information about a specific campaign"""
    try:
        campaign = Campaign.query.filter_by(id=campaign_id, user_id=current_user.id).first_or_404()
        
        links = Link.query.filter_by(campaign_id=campaign_id).all()
        total_clicks = sum(l.clicks for l in links)
        total_conversions = sum(l.conversions for l in links) if hasattr(links[0] if links else None, 'conversions') else 0
        
        return jsonify({
            "campaign": {
                "id": campaign.id,
                "name": campaign.name,
                "description": campaign.description,
                "status": campaign.status,
                "created_at": campaign.created_at.isoformat(),
                "updated_at": campaign.updated_at.isoformat(),
                "links": [{
                    "id": l.id,
                    "short_code": l.short_code,
                    "original_url": l.original_url,
                    "clicks": l.clicks,
                    "created_at": l.created_at.isoformat()
                } for l in links],
                "stats": {
                    "total_links": len(links),
                    "total_clicks": total_clicks,
                    "total_conversions": total_conversions,
                    "conversion_rate": (total_conversions / total_clicks * 100) if total_clicks > 0 else 0
                }
            }
        }), 200
    except Exception as e:
        print(f"Error getting campaign detail: {e}")
        return jsonify({"error": "Failed to get campaign details"}), 500

@campaigns_advanced_bp.route("/api/user/campaigns/<int:campaign_id>", methods=["PUT"])
@login_required
def update_user_campaign(current_user, campaign_id):
    """Update a campaign"""
    try:
        campaign = Campaign.query.filter_by(id=campaign_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        if "name" in data:
            campaign.name = data["name"]
        if "description" in data:
            campaign.description = data["description"]
        if "status" in data:
            campaign.status = data["status"]
        
        campaign.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Updated campaign: {campaign.name}",
            target_id=campaign.id,
            target_type="campaign"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Campaign updated successfully",
            "campaign": {
                "id": campaign.id,
                "name": campaign.name,
                "description": campaign.description,
                "status": campaign.status,
                "updated_at": campaign.updated_at.isoformat()
            }
        }), 200
    except Exception as e:
        print(f"Error updating campaign: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to update campaign"}), 500

@campaigns_advanced_bp.route("/api/user/campaigns/<int:campaign_id>", methods=["DELETE"])
@login_required
def delete_user_campaign(current_user, campaign_id):
    """Delete a campaign"""
    try:
        campaign = Campaign.query.filter_by(id=campaign_id, user_id=current_user.id).first_or_404()
        
        # Delete associated links
        Link.query.filter_by(campaign_id=campaign_id).delete()
        
        db.session.delete(campaign)
        db.session.commit()
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Deleted campaign: {campaign.name}",
            target_id=campaign_id,
            target_type="campaign"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Campaign deleted successfully"
        }), 200
    except Exception as e:
        print(f"Error deleting campaign: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to delete campaign"}), 500

# Admin Campaign Management Routes

@campaigns_advanced_bp.route("/api/admin/campaigns", methods=["GET"])
@admin_required
def get_all_campaigns(current_user):
    """Get all campaigns (admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        user_id = request.args.get('user_id', None, type=int)
        
        query = Campaign.query
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        campaigns = query.order_by(Campaign.created_at.desc()).paginate(page=page, per_page=per_page)
        
        return jsonify({
            "campaigns": [{
                "id": c.id,
                "name": c.name,
                "user_id": c.user_id,
                "user_username": User.query.get(c.user_id).username if c.user_id else None,
                "status": c.status,
                "created_at": c.created_at.isoformat(),
                "links_count": Link.query.filter_by(campaign_id=c.id).count()
            } for c in campaigns.items],
            "total": campaigns.total,
            "pages": campaigns.pages,
            "current_page": page
        }), 200
    except Exception as e:
        print(f"Error getting campaigns: {e}")
        return jsonify({"error": "Failed to get campaigns"}), 500

@campaigns_advanced_bp.route("/api/admin/campaigns/<int:campaign_id>/approve", methods=["POST"])
@admin_required
def approve_campaign(current_user, campaign_id):
    """Approve a campaign (admin only)"""
    try:
        campaign = Campaign.query.get_or_404(campaign_id)
        campaign.status = "approved"
        campaign.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Approved campaign: {campaign.name}",
            target_id=campaign_id,
            target_type="campaign"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Campaign approved successfully"
        }), 200
    except Exception as e:
        print(f"Error approving campaign: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to approve campaign"}), 500

@campaigns_advanced_bp.route("/api/admin/campaigns/<int:campaign_id>/suspend", methods=["POST"])
@admin_required
def suspend_campaign(current_user, campaign_id):
    """Suspend a campaign (admin only)"""
    try:
        campaign = Campaign.query.get_or_404(campaign_id)
        campaign.status = "suspended"
        campaign.updated_at = datetime.utcnow()
        db.session.commit()
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Suspended campaign: {campaign.name}",
            target_id=campaign_id,
            target_type="campaign"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Campaign suspended successfully"
        }), 200
    except Exception as e:
        print(f"Error suspending campaign: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to suspend campaign"}), 500

@campaigns_advanced_bp.route("/api/admin/campaigns/stats", methods=["GET"])
@admin_required
def get_campaigns_stats(current_user):
    """Get overall campaign statistics (admin only)"""
    try:
        total_campaigns = Campaign.query.count()
        active_campaigns = Campaign.query.filter_by(status="active").count()
        total_links = Link.query.count()
        total_clicks = db.session.query(func.sum(Link.clicks)).scalar() or 0
        
        return jsonify({
            "stats": {
                "total_campaigns": total_campaigns,
                "active_campaigns": active_campaigns,
                "total_links": total_links,
                "total_clicks": total_clicks,
                "avg_clicks_per_campaign": total_clicks / total_campaigns if total_campaigns > 0 else 0
            }
        }), 200
    except Exception as e:
        print(f"Error getting campaign stats: {e}")
        return jsonify({"error": "Failed to get campaign statistics"}), 500
