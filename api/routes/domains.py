"""
Domain Management Routes
Handles fetching and managing available domains for link shortening
"""

from flask import Blueprint, jsonify, request, session, g
from api.models.user import User
from functools import wraps
import os

domains_bp = Blueprint("domains", __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        
        user = User.query.get(session["user_id"])
        if not user:
            return jsonify({"error": "User not found"}), 401
        g.user = user
        return f(*args, **kwargs)
    return decorated_function

@domains_bp.route("/api/domains", methods=["GET"])
@login_required
def get_domains():
    """Get available domains for link shortening"""
    try:
        # Get Short.io domain from environment
        shortio_domain = os.environ.get("SHORTIO_DOMAIN", "Secure-links.short.gy")
        shortio_api_key = os.environ.get("SHORTIO_API_KEY")
        
        domains = [
            {
                "value": "vercel",
                "label": "Vercel Domain (Default)",
                "domain": request.host_url.rstrip('/'),
                "description": "Use your Vercel deployment domain",
                "enabled": True,
                "type": "internal"
            }
        ]
        
        # Add Short.io domain if API key is configured
        if shortio_api_key and shortio_domain:
            domains.append({
                "value": "shortio",
                "label": f"{shortio_domain}",
                "domain": f"https://{shortio_domain}",
                "description": "Professional short domain via Short.io",
                "enabled": True,
                "type": "shortio"
            })
        
        return jsonify({
            "success": True,
            "domains": domains,
            "default": "vercel"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
