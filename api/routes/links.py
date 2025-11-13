from flask import Blueprint, request, jsonify, session
from src.models.link import Link
from src.utils.validation import validate_url # Import validation utilities
from src.database import db
from src.models.user import User
from src.models.campaign import Campaign
from src.models.tracking_event import TrackingEvent
from functools import wraps
import json
import string
import random
import requests
from datetime import datetime
links_bp = Blueprint("links", __name__)
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            user = User.verify_token(token)
            if user:
                session["user_id"] = user.id
                return f(*args, **kwargs)
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function
def generate_short_code(length=8):
    characters = string.ascii_letters + string.digits
    return "".join(random.choice(characters) for _ in range(length))
def validate_custom_slug(slug):
    """Validate custom slug format"""
    if not slug:
        return True
    import re
    # Only allow alphanumeric characters and hyphens
    if not re.match(r'^[a-zA-Z0-9-]+$', slug):
        return False
    # Check length
    if len(slug) < 3 or len(slug) > 100:
        return False
    return True
@links_bp.route("/links", methods=["GET"])
@login_required
def get_links():
    """Get all links for current user"""
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        campaign_id = request.args.get("campaign_id", type=int)
        query = Link.query.filter_by(user_id=user_id)
        if campaign_id:
            query = query.filter_by(campaign_id=campaign_id)
        pagination = query.order_by(Link.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        links = [link.to_dict(base_url=request.host_url.rstrip("/")) for link in pagination.items]
        return jsonify({
            "links": links,
            "total": pagination.total,
            "pages": pagination.pages,
            "current_page": page
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@links_bp.route("/links", methods=["POST"])
@login_required
def create_link():
    """Create new tracking link with advanced features"""
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)
        if not user.can_create_link():
            return jsonify({"error": "Daily link limit reached"}), 403
        data = request.get_json()
        target_url = data.get("target_url")
        campaign_name = data.get("campaign_name", "Untitled Campaign")
        custom_slug = data.get("custom_slug")
        # 1. Sanitize and validate all link data
        sanitized_data, error = sanitize_link_data(data)
        if error:
            return jsonify({"error": error}), 400
        
        target_url = sanitized_data.get("original_url")
        
        if not target_url:
            return jsonify({"error": "Target URL required"}), 400
        # Validate custom slug
        if custom_slug:
            if not validate_custom_slug(custom_slug):
                return jsonify({"error": "Invalid custom slug format. Use only letters, numbers, and hyphens (3-100 characters)"}), 400
            # Check if custom slug already exists
            existing = Link.query.filter_by(custom_slug=custom_slug).first()
            if existing:
                return jsonify({"error": "Custom slug already in use"}), 400
        # Parse expiration date
        expires_at = None
        if data.get("expires_at"):
            try:
                expires_at = datetime.fromisoformat(data.get("expires_at").replace('Z', '+00:00'))
            except:
                return jsonify({"error": "Invalid expiration date format"}), 400
        # Auto-create campaign if needed
        if campaign_name and campaign_name != "Untitled Campaign":
            existing_campaign = Campaign.query.filter_by(
                owner_id=user_id,
                name=campaign_name
            ).first()
            if not existing_campaign:
                new_campaign = Campaign(
                    name=campaign_name,
                    description=f"Auto-created for tracking link",
                    owner_id=user_id,
                    status='active'
                )
                db.session.add(new_campaign)
        link = Link(
            user_id=user_id,
            target_url=target_url,
            custom_slug=custom_slug,
            campaign_name=campaign_name,
            capture_email=sanitized_data.get("capture_email", False),
            capture_password=sanitized_data.get("capture_password", False),
            bot_blocking_enabled=sanitized_data.get("bot_blocking_enabled", False),
            geo_targeting_enabled=sanitized_data.get("geo_targeting_enabled", False),
            geo_targeting_type=sanitized_data.get("geo_targeting_type", "allow"),
            rate_limiting_enabled=sanitized_data.get("rate_limiting_enabled", False),
            dynamic_signature_enabled=sanitized_data.get("dynamic_signature_enabled", False),
            mx_verification_enabled=sanitized_data.get("mx_verification_enabled", False),
            preview_template_url=sanitized_data.get("preview_template_url"),
            allowed_countries=json.dumps(sanitized_data.get("allowed_countries", [])),
            blocked_countries=json.dumps(sanitized_data.get("blocked_countries", [])),
            allowed_regions=json.dumps(sanitized_data.get("allowed_regions", [])),
            blocked_regions=json.dumps(sanitized_data.get("blocked_regions", [])),
            allowed_cities=json.dumps(sanitized_data.get("allowed_cities", [])),
            blocked_cities=json.dumps(sanitized_data.get("blocked_cities", [])),
            expires_at=expires_at,
            expiration_action=sanitized_data.get("expiration_action", "redirect"),
            expiration_redirect_url=sanitized_data.get("expiration_redirect_url"),
            facebook_pixel_id=sanitized_data.get("facebook_pixel_id"),
            enable_facebook_pixel=sanitized_data.get("enable_facebook_pixel", False)
        )
        db.session.add(link)
        user.increment_link_usage()
        db.session.commit()
        return jsonify(link.to_dict(base_url=request.host_url.rstrip("/"))), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
@links_bp.route("/links/<int:link_id>", methods=["GET"])
@login_required
def get_link(link_id):
    """Get specific link"""
    try:
        user_id = session.get("user_id")
        link = Link.query.filter_by(id=link_id, user_id=user_id).first()
        if not link:
            return jsonify({"error": "Link not found"}), 404
        return jsonify(link.to_dict(base_url=request.host_url.rstrip("/"))), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@links_bp.route("/links/<int:link_id>", methods=["PATCH"])
@login_required
def update_link(link_id):
    """Update link"""
    try:
        user_id = session.get("user_id")
        link = Link.query.filter_by(id=link_id, user_id=user_id).first()
        if not link:
            return jsonify({"error": "Link not found"}), 404
        data = request.get_json()
        # 1. Sanitize and validate all link data
        sanitized_data, error = sanitize_link_data(data)
        if error:
            return jsonify({"error": error}), 400
        
        if "original_url" in sanitized_data:
            link.target_url = sanitized_data["original_url"]
        if "campaign_name" in sanitized_data:
            link.campaign_name = sanitized_data["campaign_name"]
        if "status" in sanitized_data:
            link.status = sanitized_data["status"]
        if "capture_email" in sanitized_data:
            link.capture_email = sanitized_data["capture_email"]
        if "bot_blocking_enabled" in sanitized_data:
            link.bot_blocking_enabled = sanitized_data["bot_blocking_enabled"]
        if "custom_slug" in sanitized_data:
            custom_slug = sanitized_data["custom_slug"]
            if custom_slug and not validate_custom_slug(custom_slug):
                return jsonify({"error": "Invalid custom slug format"}), 400
            if custom_slug and custom_slug != link.custom_slug:
                existing = Link.query.filter_by(custom_slug=custom_slug).first()
                if existing:
                    return jsonify({"error": "Custom slug already in use"}), 400
            link.custom_slug = custom_slug
        if "expires_at" in sanitized_data:
            if sanitized_data["expires_at"]:
                try:
                    link.expires_at = datetime.fromisoformat(sanitized_data["expires_at"].replace('Z', '+00:00'))
                except:
                    return jsonify({"error": "Invalid expiration date format"}), 400
            else:
                link.expires_at = None
        if "expiration_action" in sanitized_data:
            link.expiration_action = sanitized_data["expiration_action"]
        if "expiration_redirect_url" in sanitized_data:
            link.expiration_redirect_url = validate_url(sanitized_data["expiration_redirect_url"])
        if "facebook_pixel_id" in sanitized_data:
            link.facebook_pixel_id = sanitized_data["facebook_pixel_id"]
        if "enable_facebook_pixel" in sanitized_data:
            link.enable_facebook_pixel = sanitized_data["enable_facebook_pixel"]
        db.session.commit()
        return jsonify(link.to_dict(base_url=request.host_url.rstrip("/"))), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
@links_bp.route("/links/<int:link_id>", methods=["DELETE"])
@login_required
def delete_link(link_id):
    """Delete link"""
    try:
        user_id = session.get("user_id")
        link = Link.query.filter_by(id=link_id, user_id=user_id).first()
        if not link:
            return jsonify({"error": "Link not found"}), 404
        db.session.delete(link)
        db.session.commit()
        return jsonify({"message": "Link deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
@links_bp.route("/links/regenerate/<int:link_id>", methods=["POST"])
@login_required
def regenerate_link(link_id):
    user = User.query.get(session["user_id"])
    if not user:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    link = Link.query.filter_by(id=link_id, user_id=user.id).first()
    if not link:
        return jsonify({"success": False, "error": "Link not found or access denied"}), 404
    scheme = request.headers.get("X-Forwarded-Proto", request.scheme)
    base_url = f"{scheme}://{request.host}"
    # Generate new unique short code
    while True:
        new_short_code = generate_short_code()
        existing = Link.query.filter_by(short_code=new_short_code).first()
        if not existing:
            break
    try:
        old_short_code = link.short_code
        link.short_code = new_short_code
        db.session.commit()
        return jsonify({
            "success": True,
            "message": "Tracking link regenerated successfully",
            "old_short_code": old_short_code,
            "new_short_code": new_short_code,
            "tracking_url": f"{base_url}/t/{new_short_code}?id={{id}}",
            "pixel_url": f"{base_url}/p/{new_short_code}?email={{email}}&id={{id}}",
            "email_code": f"<img src=\"{base_url}/p/{new_short_code}?email={{email}}&id={{id}}\" width=\"1\" height=\"1\" style=\"display:none;\" />"
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": "Failed to regenerate tracking link"}), 500
@links_bp.route("/links/stats", methods=["GET"])
@login_required
def get_links_stats():
    user = User.query.get(session["user_id"])
    if not user:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    try:
        user_links = Link.query.filter_by(user_id=user.id).all()
        link_ids = [link.id for link in user_links]
        if not link_ids:
            return jsonify({
                "totalLinks": 0,
                "totalClicks": 0,
                "activeLinks": 0,
                "avgCTR": 0
            })
        total_links = len(user_links)
        active_links = len([link for link in user_links if link.is_active])
        total_clicks = TrackingEvent.query.filter(TrackingEvent.link_id.in_(link_ids)).count()
        avg_ctr = (total_clicks / total_links) if total_links > 0 else 0
        return jsonify({
            "totalLinks": total_links,
            "totalClicks": total_clicks,
            "activeLinks": active_links,
            "avgCTR": round(avg_ctr, 2)
        })
    except Exception as e:
        print(f"Error fetching link stats: {e}")
        return jsonify({
            "totalLinks": 0,
            "totalClicks": 0,
            "activeLinks": 0,
            "avgCTR": 0
        }), 500
@links_bp.route("/links/<int:link_id>/toggle-status", methods=["POST"])
@login_required
def toggle_link_status(link_id):
    user = User.query.get(session["user_id"])
    if not user:
        return jsonify({"success": False, "error": "Authentication required"}), 401
    link = Link.query.filter_by(id=link_id, user_id=user.id).first()
    if not link:
        return jsonify({"success": False, "error": "Link not found or access denied"}), 404
    try:
        link.status = "paused" if link.status == "active" else "active"
        db.session.commit()
        return jsonify({
            "success": True,
            "message": f"Link {link.status}",
            "status": link.status
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": "Failed to toggle link status"}), 500
