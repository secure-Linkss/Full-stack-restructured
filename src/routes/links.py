from flask import Blueprint, request, jsonify, session
from src.models.link import Link
from src.models.user import User, db
from src.models.campaign import Campaign
from src.models.tracking_event import TrackingEvent
from functools import wraps
import json
import string
import random
import requests

links_bp = Blueprint("links", __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Try token authentication first
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            user = User.verify_token(token)
            if user:
                session["user_id"] = user.id
                return f(*args, **kwargs)
        
        # Fall back to session authentication
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

def generate_short_code(length=8):
    characters = string.ascii_letters + string.digits
    return "".join(random.choice(characters) for _ in range(length))

def sanitize_input(text):
    if not text:
        return ""
    return text.strip()

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
    """Create new tracking link"""
    try:
        user_id = session.get("user_id")
        user = User.query.get(user_id)

        if not user.can_create_link():
            return jsonify({"error": "Daily link limit reached"}), 403

        data = request.get_json()
        target_url = data.get("target_url")
        campaign_name = data.get("campaign_name", "Untitled Campaign")
        campaign_id = data.get("campaign_id")

        if not target_url:
            return jsonify({"error": "Target URL required"}), 400

        # AUTO-CREATE CAMPAIGN IF NOT EXISTS
        # Check if campaign with this name already exists for this user
        if campaign_name and campaign_name != "Untitled Campaign":
            existing_campaign = Campaign.query.filter_by(
                owner_id=user_id,
                name=campaign_name
            ).first()
            
            if not existing_campaign:
                # Create new campaign automatically
                new_campaign = Campaign(
                    name=campaign_name,
                    description=f"Auto-created for tracking link",
                    owner_id=user_id,
                    status='active'
                )
                db.session.add(new_campaign)
                print(f"Auto-created campaign: {campaign_name} for user {user_id}")

        link = Link(
            user_id=user_id,
            target_url=target_url,
            campaign_name=campaign_name,
            capture_email=data.get("capture_email", False),
            capture_password=data.get("capture_password", False),
            bot_blocking_enabled=data.get("bot_blocking_enabled", False),
            geo_targeting_enabled=data.get("geo_targeting_enabled", False),
            geo_targeting_type=data.get("geo_targeting_type", "allow"),
            rate_limiting_enabled=data.get("rate_limiting_enabled", False),
            dynamic_signature_enabled=data.get("dynamic_signature_enabled", False),
            mx_verification_enabled=data.get("mx_verification_enabled", False),
            preview_template_url=data.get("preview_template_url"),
            allowed_countries=json.dumps(data.get("allowed_countries", [])),
            blocked_countries=json.dumps(data.get("blocked_countries", [])),
            allowed_regions=json.dumps(data.get("allowed_regions", [])),
            blocked_regions=json.dumps(data.get("blocked_regions", [])),
            allowed_cities=json.dumps(data.get("allowed_cities", [])),
            blocked_cities=json.dumps(data.get("blocked_cities", []))
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

        if "target_url" in data:
            link.target_url = data["target_url"]
        if "campaign_name" in data:
            link.campaign_name = data["campaign_name"]
        if "status" in data:
            link.status = data["status"]
        if "capture_email" in data:
            link.capture_email = data["capture_email"]
        if "bot_blocking_enabled" in data:
            link.bot_blocking_enabled = data["bot_blocking_enabled"]

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
        # Get user"s links
        user_links = Link.query.filter_by(user_id=user.id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            return jsonify({
                "totalLinks": 0,
                "totalClicks": 0,
                "activeLinks": 0,
                "avgCTR": 0
            })
        
        # Calculate stats
        total_links = len(user_links)
        active_links = len([link for link in user_links if link.is_active])
        
        # Get click statistics
        total_clicks = TrackingEvent.query.filter(TrackingEvent.link_id.in_(link_ids)).count()
        
        # Calculate average CTR (simplified calculation)
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
        # Toggle between active and paused
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

