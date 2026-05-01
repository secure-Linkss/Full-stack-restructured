from flask import Blueprint, request, jsonify, session, g
from api.models.link import Link
from api.database import db
from api.models.user import User
from api.middleware.auth_decorators import login_required
import string
import random
import requests
import os

shorten_bp = Blueprint("shorten", __name__)

def generate_short_code(length=8):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

@shorten_bp.route("/shorten", methods=["GET"])
@login_required
def get_shortened_links():
    """List all shortened links for the current user"""
    try:
        user_id = g.user.id
        links = Link.query.filter_by(user_id=user_id).order_by(Link.created_at.desc()).limit(100).all()
        base_url = request.host_url.rstrip('/')
        result = []
        for lnk in links:
            # Use stored Short.io URL if available, otherwise fall back to our tracker URL
            shortened_url = lnk.short_url or f"{base_url}/t/{lnk.short_code}"
            result.append({
                "id": lnk.id,
                "original_url": lnk.target_url or lnk.original_url or "",
                "short_code": lnk.short_code,
                "shortened_url": shortened_url,
                "click_count": lnk.total_clicks or 0,
                "status": lnk.status or "active",
                "created_at": lnk.created_at.isoformat() if lnk.created_at else None,
            })
        return jsonify({"success": True, "links": result, "total": len(result)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@shorten_bp.route("/shorten", methods=["POST"])
@login_required
def shorten_url():
    """Shorten URL (alias for creating link) with user authentication and Short.io integration"""
    try:
        user_id = g.user.id
        user = g.user

        if not user.can_create_link():
            return jsonify({"error": "Daily link limit reached"}), 403

        data = request.get_json()
        original_url = data.get("originalUrl")
        campaign_name = data.get("campaign_name", "Quick Link")

        if not original_url:
            return jsonify({"error": "Original URL is required"}), 400

        # Generate a short code
        short_code = generate_short_code()
        
        # Check if short code already exists
        while Link.query.filter_by(short_code=short_code).first():
            short_code = generate_short_code()
        
        # Our tracker URL — Short.io will redirect here so the quantum chain fires
        vercel_base = request.host_url.rstrip('/')
        tracker_url = f"{vercel_base}/t/{short_code}"

        shortened_url = None
        # Try to use Short.io API if available
        shortio_api_key = os.environ.get("SHORTIO_API_KEY")
        shortio_domain = os.environ.get("SHORTIO_DOMAIN", "secure-links.short.gy")

        if shortio_api_key and shortio_domain:
            try:
                shortio_response = requests.post(
                    "https://api.short.io/links",
                    headers={
                        "Authorization": shortio_api_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "originalURL": tracker_url,  # points to our tracker, not raw target
                        "domain": shortio_domain,
                        "path": short_code
                    },
                    timeout=10
                )

                if shortio_response.status_code in (200, 201):
                    shortio_data = shortio_response.json()
                    shortened_url = shortio_data.get("shortURL") or f"https://{shortio_domain}/{short_code}"
                else:
                    print(f"Short.io error {shortio_response.status_code}: {shortio_response.text}")
                    shortened_url = tracker_url

            except Exception as e:
                print(f"Short.io API error: {e}")
                shortened_url = tracker_url
        else:
            shortened_url = tracker_url

        # Create link record in database
        link = Link(
            user_id=user_id,
            target_url=original_url,
            short_code=short_code,
            short_url=shortened_url,  # store the Short.io URL (or fallback)
            campaign_name=campaign_name,
            status="active"
        )

        db.session.add(link)
        user.increment_link_usage()
        db.session.commit()

        return jsonify({
            "success": True,
            "shortenedUrl": shortened_url,
            "shortCode": link.short_code
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error shortening URL: {e}")
        return jsonify({"error": str(e)}), 500


@shorten_bp.route("/shorten/<int:link_id>", methods=["DELETE"])
@login_required
def delete_shortened_link(link_id):
    """Delete a shortened link"""
    try:
        user_id = g.user.id
        link = Link.query.filter_by(id=link_id, user_id=user_id).first()
        if not link:
            return jsonify({"error": "Link not found"}), 404
        db.session.delete(link)
        db.session.commit()
        return jsonify({"success": True, "message": "Link deleted"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@shorten_bp.route("/shorten/<int:link_id>/regenerate", methods=["POST"])
@login_required
def regenerate_short_code(link_id):
    """Regenerate the short code for a link"""
    try:
        user_id = g.user.id
        link = Link.query.filter_by(id=link_id, user_id=user_id).first()
        if not link:
            return jsonify({"error": "Link not found"}), 404
        new_code = generate_short_code()
        while Link.query.filter_by(short_code=new_code).first():
            new_code = generate_short_code()
        link.short_code = new_code
        db.session.commit()
        base_url = request.host_url.rstrip('/')
        return jsonify({"success": True, "short_code": new_code, "shortened_url": f"{base_url}/t/{new_code}"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
