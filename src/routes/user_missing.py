
from flask import Blueprint, request, jsonify
from functools import wraps
from src.models.user import db, User
from src.models.link import Link
from src.models.campaign import Campaign
from src.models.tracking_event import TrackingEvent
from src.models.notification import Notification
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import jwt
import os

user_missing_bp = Blueprint("user_missing", __name__)

def get_current_user():
    """Get current user from token"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        return User.verify_token(token)
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

@user_missing_bp.route("/api/analytics/overview", methods=["GET"])
@login_required
def get_analytics_overview(current_user):
    """Get user analytics overview"""
    try:
        # Get user's links and clicks
        user_links = Link.query.filter(Link.user_id == current_user.id).all()
        link_ids = [link.id for link in user_links]
        
        total_clicks = TrackingEvent.query.filter(TrackingEvent.link_id.in_(link_ids)).count() if link_ids else 0
        
        # Get clicks for the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_clicks = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.timestamp >= thirty_days_ago
        ).count() if link_ids else 0
        
        # Get top performing links
        top_links = []
        if link_ids:
            top_links_query = db.session.query(
                Link,
                func.count(TrackingEvent.id).label('click_count')
            ).outerjoin(TrackingEvent).filter(
                Link.id.in_(link_ids)
            ).group_by(Link.id).order_by(desc('click_count')).limit(5)
            
            for link, click_count in top_links_query:
                top_links.append({
                    "id": link.id,
                    "title": link.title,
                    "short_url": link.short_url,
                    "clicks": click_count or 0
                })
        
        return jsonify({
            "totalLinks": len(user_links),
            "totalClicks": total_clicks,
            "recentClicks": recent_clicks,
            "topLinks": top_links,
            "conversionRate": 0.0  # Placeholder
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_missing_bp.route("/api/analytics/links", methods=["GET"])
@login_required
def get_link_analytics(current_user):
    """Get detailed link analytics"""
    try:
        user_links = Link.query.filter(Link.user_id == current_user.id).all()
        
        link_analytics = []
        for link in user_links:
            click_count = TrackingEvent.query.filter(TrackingEvent.link_id == link.id).count()
            
            # Get recent activity (last 7 days)
            week_ago = datetime.utcnow() - timedelta(days=7)
            recent_clicks = TrackingEvent.query.filter(
                TrackingEvent.link_id == link.id,
                TrackingEvent.timestamp >= week_ago
            ).count()
            
            link_analytics.append({
                "id": link.id,
                "title": link.title,
                "original_url": link.original_url,
                "short_url": link.short_url,
                "clicks": click_count,
                "recentClicks": recent_clicks,
                "created_at": link.created_at.isoformat() if link.created_at else None,
                "is_active": link.is_active
            })
        
        return jsonify(link_analytics)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_missing_bp.route("/api/analytics/campaigns", methods=["GET"])
@login_required
def get_campaign_analytics(current_user):
    """Get campaign analytics"""
    try:
        user_campaigns = Campaign.query.filter(Campaign.user_id == current_user.id).all()
        
        campaign_analytics = []
        for campaign in user_campaigns:
            # Get campaign links and clicks
            campaign_links = Link.query.filter(Link.campaign_id == campaign.id).all()
            link_ids = [link.id for link in campaign_links]
            
            total_clicks = TrackingEvent.query.filter(
                TrackingEvent.link_id.in_(link_ids)
            ).count() if link_ids else 0
            
            campaign_analytics.append({
                "id": campaign.id,
                "name": campaign.name,
                "description": campaign.description,
                "status": campaign.status,
                "links_count": len(campaign_links),
                "total_clicks": total_clicks,
                "created_at": campaign.created_at.isoformat() if campaign.created_at else None
            })
        
        return jsonify(campaign_analytics)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_missing_bp.route("/api/analytics/geography", methods=["GET"])
@login_required
def get_geography_analytics(current_user):
    """Get geographic analytics"""
    try:
        # Get user's links
        user_links = Link.query.filter(Link.user_id == current_user.id).all()
        link_ids = [link.id for link in user_links]
        
        # Placeholder geographic data
        geography_data = [
            {"country": "United States", "clicks": 150, "percentage": 45.5},
            {"country": "United Kingdom", "clicks": 80, "percentage": 24.2},
            {"country": "Canada", "clicks": 50, "percentage": 15.2},
            {"country": "Australia", "clicks": 30, "percentage": 9.1},
            {"country": "Germany", "clicks": 20, "percentage": 6.0}
        ]
        
        return jsonify(geography_data)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_missing_bp.route("/api/user/profile", methods=["GET"])
@login_required
def get_user_profile(current_user):
    """Get user profile information"""
    try:
        profile_data = {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
            "status": current_user.status,
            "is_active": current_user.is_active,
            "is_verified": current_user.is_verified,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
            "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
            "stats": {
                "total_links": Link.query.filter(Link.user_id == current_user.id).count(),
                "total_campaigns": Campaign.query.filter(Campaign.user_id == current_user.id).count(),
                "total_clicks": TrackingEvent.query.join(Link).filter(Link.user_id == current_user.id).count()
            }
        }
        
        return jsonify(profile_data)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_missing_bp.route("/api/settings/profile", methods=["GET"])
@login_required
def get_profile_settings(current_user):
    """Get user profile settings"""
    try:
        settings = {
            "email_notifications": True,
            "marketing_emails": False,
            "two_factor_enabled": False,
            "api_access_enabled": True,
            "timezone": "UTC",
            "language": "en"
        }
        
        return jsonify(settings)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_missing_bp.route("/api/security/settings", methods=["GET"])
@login_required
def get_security_settings(current_user):
    """Get user security settings"""
    try:
        security_settings = {
            "password_last_changed": current_user.created_at.isoformat() if current_user.created_at else None,
            "two_factor_enabled": False,
            "login_notifications": True,
            "api_keys_count": 0,
            "recent_logins": []
        }
        
        return jsonify(security_settings)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
