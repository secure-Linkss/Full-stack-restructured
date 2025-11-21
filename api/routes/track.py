"""
QUANTUM-INTEGRATED TRACKING ROUTES
===================================
This file replaces track.py with quantum redirect integration
All /t/ routes now use the quantum redirect system
"""

from flask import Blueprint, request, redirect, jsonify, make_response
from api.models.link import Link
from api.models.tracking_event import TrackingEvent
from api.database import db
from api.models.notification import Notification
from api.utils.user_agent_parser import parse_user_agent, generate_unique_id
from api.services.quantum_redirect import quantum_redirect
from datetime import datetime
import requests
import json
import base64
import os
import time

track_bp = Blueprint("track", __name__)

def get_client_info():
    """Extract client information from request"""
    return {
        'ip': request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr),
        'user_agent': request.headers.get('User-Agent', ''),
        'referrer': request.headers.get('Referer', ''),
        'accept_language': request.headers.get('Accept-Language', ''),
        'accept_encoding': request.headers.get('Accept-Encoding', '')
    }

@track_bp.route("/t/<short_code>")
def track_click(short_code):
    """
    QUANTUM-INTEGRATED REDIRECT SYSTEM
    This route now uses the 4-stage quantum redirect system for enhanced security and tracking.
    Stage 1: Genesis Link -> Redirects to Validation Hub
    """
    start_time = time.time()
    
    try:
        # Get the tracking link
        link = Link.query.filter_by(short_code=short_code).first()
        if not link:
            return "Link not found", 404
        
        # Check if link is active
        if link.status != 'active':
            return "Link is not active", 403

        # --- CRITICAL: Link Expiry and Click Limit Enforcement ---
        now = datetime.utcnow()
        
        # Check if link has expired
        if link.expires_at and link.expires_at < now:
            link.status = 'expired'
            db.session.commit()
            if link.expiration_action == 'redirect' and link.expiration_redirect_url:
                return redirect(link.expiration_redirect_url, code=302)
            return "This link has expired", 410
        
        # Check click limit
        if link.click_limit and link.click_count >= link.click_limit:
            link.status = 'limit_reached'
            db.session.commit()
            if link.expiration_action == 'redirect' and link.expiration_redirect_url:
                return redirect(link.expiration_redirect_url, code=302)
            return "This link has reached its click limit", 410
        # --- END Link Expiry and Click Limit Enforcement ---
        
        # Get client information
        client_info = get_client_info()
        
        # CRITICAL: Capture ALL original URL parameters
        original_params = dict(request.args)
        
        # Process through quantum redirect system (Stage 1)
        result = quantum_redirect.stage1_genesis_link(
            link_id=str(link.id),
            user_ip=client_info['ip'],
            user_agent=client_info['user_agent'],
            referrer=client_info['referrer'],
            original_params=original_params
        )
        
        if not result['success']:
            # Fallback to direct redirect if quantum fails (though it shouldn't)
            # But log the failure
            print(f"Quantum Genesis Failed: {result.get('error')}")
            return f"Redirect failed: {result.get('error')}", 500
        
        # Log the genesis event in database
        # Note: The quantum service returns a 'click_id' which we use to track the flow
        tracking_event = TrackingEvent(
            link_id=link.id,
            ip_address=client_info['ip'],
            user_agent=client_info['user_agent'],
            referrer=client_info['referrer'],
            country='Unknown',  # Will be updated in later stages
            city='Unknown',
            device_type='Unknown',
            browser='Unknown',
            os='Unknown',
            quantum_click_id=result['click_id'],
            quantum_stage='genesis',
            quantum_processing_time=result['processing_time_ms'],
            timestamp=datetime.utcnow(),
            quantum_enabled=True,
            status='redirected' # Initial status
        )
        
        # Update link click count
        link.total_clicks = (link.total_clicks or 0) + 1
        
        db.session.add(tracking_event)
        db.session.commit()
        
        # Redirect to validation hub (Stage 2)
        # The URL returned by stage1_genesis_link is relative (e.g., /validate?token=...)
        return redirect(result['redirect_url'], code=302)
        
    except Exception as e:
        print(f"Error in track_click: {str(e)}")
        import traceback
        traceback.print_exc()
        return "Internal server error", 500

@track_bp.route("/p/<short_code>")
def pixel_track(short_code):
    """Tracking pixel endpoint"""
    try:
        link = Link.query.filter_by(short_code=short_code).first()
        if not link:
            return _get_transparent_pixel()
        
        # Collect tracking data
        client_info = get_client_info()
        timestamp = datetime.utcnow()
        
        # Record the tracking event
        captured_email_hex = request.args.get("email")
        captured_email = _decode_hex_email(captured_email_hex) if captured_email_hex else None
        unique_id = request.args.get("id") or request.args.get("uid")
        
        event = TrackingEvent(
            link_id=link.id,
            timestamp=timestamp,
            ip_address=client_info['ip'],
            user_agent=client_info['user_agent'],
            captured_email=captured_email,
            status="email_opened",
            email_opened=True,
            unique_id=unique_id,
            referrer=client_info['referrer'],
            page_views=1,
            quantum_enabled=False # Pixel tracking doesn't use quantum redirect
        )
        
        db.session.add(event)
        db.session.commit()
        
    except Exception as e:
        db.session.rollback()
        print(f"Pixel tracking error: {e}")
    
    return _get_transparent_pixel()

def _get_transparent_pixel():
    """Return a 1x1 transparent PNG pixel"""
    from flask import Response
    pixel_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
    response = Response(pixel_data, mimetype="image/png")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

def _decode_hex_email(hex_string):
    """Decode a hex-encoded email string."""
    try:
        return bytes.fromhex(hex_string).decode("utf-8")
    except (ValueError, TypeError):
        return None

@track_bp.route("/track/page-landed", methods=["POST"])
def page_landed():
    """Update tracking event status when user lands on target page"""
    data = request.get_json()
    unique_id = data.get("unique_id")
    link_id = data.get("link_id")
    
    if not unique_id and not link_id:
        return jsonify({"success": False, "error": "Missing unique_id or link_id"}), 400
    
    try:
        if unique_id:
            event = TrackingEvent.query.filter_by(unique_id=unique_id).first()
        elif link_id:
            event = TrackingEvent.query.filter_by(link_id=link_id).order_by(TrackingEvent.timestamp.desc()).first()
        else:
            return jsonify({"success": False, "error": "No matching tracking event found"}), 404

        if event:
            event.on_page = True
            event.status = "on_page"
            db.session.commit()
            return jsonify({"success": True, "message": "Page landed status updated"}), 200
        else:
            return jsonify({"success": False, "error": "No matching tracking event found"}), 404
    except Exception as e:
        db.session.rollback()
        print(f"Error updating page landed status: {e}")
        return jsonify({"success": False, "error": "Failed to update page landed status"}), 500
