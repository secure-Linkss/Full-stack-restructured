# Link_expiry_enforcement.py

"""
Link Expiry Enforcement in Redirect
Update your link redirect endpoint in src/api/track.py
"""

from flask import Blueprint, redirect, jsonify
from datetime import datetime
from src.models.link import Link
from src.database import db

track_bp = Blueprint("track", __name__)

@track_bp.route("/t/<short_code>")
def redirect_link(short_code):
    """Redirect short link with expiry check"""
    try:
        # Find the link
        link = Link.query.filter_by(short_code=short_code).first()
        
        if not link:
            return jsonify({"error": "Link not found"}), 404
        
        # Check if link is active
        if not link.is_active:
            return jsonify({"error": "This link has been deactivated"}), 410
        
        # Check if link has expired
        if link.expires_at and link.expires_at < datetime.utcnow():
            # Automatically deactivate expired link
            link.is_active = False
            db.session.commit()
            return jsonify({"error": "This link has expired"}), 410
        
        # Check click limit
        if link.click_limit and link.click_count >= link.click_limit:
            link.is_active = False
            db.session.commit()
            return jsonify({"error": "This link has reached its click limit"}), 410
        
        # Check if user's subscription is active
        if link.user:
            if link.user.status == 'expired':
                return jsonify({"error": "Link owner's subscription has expired"}), 403
            
            if not link.user.is_active:
                return jsonify({"error": "Link owner's account is inactive"}), 403
        
        # Track the click (your existing tracking code)
        link.click_count += 1
        link.last_clicked_at = datetime.utcnow()
        
        # Create tracking event
        from src.models.tracking_event import TrackingEvent
        tracking_event = TrackingEvent(
            link_id=link.id,
            user_id=link.user_id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            referer=request.headers.get('Referer')
        )
        db.session.add(tracking_event)
        db.session.commit()
        
        # Redirect to original URL
        return redirect(link.original_url, code=302)
        
    except Exception as e:
        print(f"Redirect error: {e}")
        return jsonify({"error": "An error occurred"}), 500