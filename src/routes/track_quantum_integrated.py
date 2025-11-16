"""
QUANTUM-INTEGRATED TRACKING ROUTES
===================================
This file replaces track.py with quantum redirect integration
All /t/ routes now use the quantum redirect system
"""

from flask import Blueprint, request, redirect, jsonify, make_response
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
from src.database import db
from src.models.notification import Notification
from src.utils.user_agent_parser import parse_user_agent, generate_unique_id
from src.services.quantum_redirect import quantum_redirect
from datetime import datetime
import requests
import json
import base64
import os

track_bp = Blueprint("track", __name__)

def get_client_ip():
    if request.headers.get("X-Forwarded-For"):
        return request.headers.get("X-Forwarded-For").split(",")[0].strip()
    elif request.headers.get("X-Real-IP"):
        return request.headers.get("X-Real-IP")
    else:
        return request.remote_addr

def get_user_agent():
    return request.headers.get("User-Agent", "")

def get_geolocation(ip_address):
    """Enhanced geolocation with zip code and detailed ISP information"""
    try:
        # Using ip-api.com for comprehensive geolocation data
        response = requests.get(
            f"http://ip-api.com/json/{ip_address}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,mobile,proxy,hosting,query",
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                return {
                    "country": data.get("country", "Unknown"),
                    "country_code": data.get("countryCode", "Unknown"),
                    "region": data.get("regionName", "Unknown"),
                    "city": data.get("city", "Unknown"),
                    "zip_code": data.get("zip"),
                    "latitude": data.get("lat"),
                    "longitude": data.get("lon"),
                    "timezone": data.get("timezone", "Unknown"),
                    "isp": data.get("isp", "Unknown"),
                    "organization": data.get("org", "Unknown"),
                    "as_number": data.get("as", "Unknown"),
                    "as_name": data.get("asname", "Unknown"),
                    "is_mobile": data.get("mobile", False),
                    "is_proxy": data.get("proxy", False),
                    "is_hosting": data.get("hosting", False)
                }
    except Exception as e:
        print(f"Geolocation error: {e}")
    
    return {
        "country": "Unknown",
        "country_code": "Unknown",
        "region": "Unknown",
        "city": "Unknown",
        "zip_code": "Unknown",
        "latitude": None,
        "longitude": None,
        "timezone": "Unknown",
        "isp": "Unknown",
        "organization": "Unknown",
        "as_number": "Unknown",
        "as_name": "Unknown",
        "is_mobile": False,
        "is_proxy": False,
        "is_hosting": False
    }

def check_geo_targeting(link, geo_data):
    """Enhanced geo targeting check with allow/block logic"""
    if not link.geo_targeting_enabled:
        return {"blocked": False, "reason": None}
    
    country = geo_data.get("country", "Unknown")
    region = geo_data.get("region", "Unknown")
    city = geo_data.get("city", "Unknown")
    
    # If location is unknown, block by default
    if country == "Unknown":
        return {"blocked": True, "reason": "unknown_location"}
    
    # Parse JSON arrays
    try:
        allowed_countries = json.loads(link.allowed_countries) if link.allowed_countries else []
        blocked_countries = json.loads(link.blocked_countries) if link.blocked_countries else []
        allowed_regions = json.loads(link.allowed_regions) if link.allowed_regions else []
        blocked_regions = json.loads(link.blocked_regions) if link.blocked_regions else []
        allowed_cities = json.loads(link.allowed_cities) if link.allowed_cities else []
        blocked_cities = json.loads(link.blocked_cities) if link.blocked_cities else []
    except:
        return {"blocked": False, "reason": None}
    
    if link.geo_targeting_type == "allow":
        # Allow mode: only allow specified locations
        country_allowed = not allowed_countries or country in allowed_countries
        region_allowed = not allowed_regions or region in allowed_regions
        city_allowed = not allowed_cities or city in allowed_cities
        
        if not (country_allowed and region_allowed and city_allowed):
            if not country_allowed:
                return {"blocked": True, "reason": "country_not_allowed"}
            elif not region_allowed:
                return {"blocked": True, "reason": "region_not_allowed"}
            elif not city_allowed:
                return {"blocked": True, "reason": "city_not_allowed"}
    
    else:  # block mode
        # Block mode: block specified locations
        if country in blocked_countries:
            return {"blocked": True, "reason": "country_blocked"}
        if region in blocked_regions:
            return {"blocked": True, "reason": "region_blocked"}
        if city in blocked_cities:
            return {"blocked": True, "reason": "city_blocked"}
    
    return {"blocked": False, "reason": None}

@track_bp.route("/t/<short_code>")
def track_click(short_code):
    """
    QUANTUM-INTEGRATED REDIRECT SYSTEM
    This route now uses quantum redirect for enhanced security and tracking
    """
    try:
        # Get the tracking link
        link = Link.query.filter_by(short_code=short_code).first()
        if not link:
            return "Link not found", 404
        
        # Check if link is active
        if link.status != 'active':
            return "Link is not active", 403
        
        # Collect client information
        ip_address = get_client_ip()
        user_agent = get_user_agent()
        timestamp = datetime.utcnow()
        referrer = request.headers.get("Referer", "")
        
        # CRITICAL: Capture ALL original URL parameters
        original_params = dict(request.args)
        
        # Get geolocation data (this may take time, but we need it)
        geo_data = get_geolocation(ip_address)
        
        # Parse user agent for device and browser info
        device_info = parse_user_agent(user_agent)
        
        # Geo targeting check
        geo_check = check_geo_targeting(link, geo_data)
        
        # Generate unique ID for this tracking event
        unique_id = request.args.get("uid") or request.args.get("id") or generate_unique_id()
        
        # Determine if request should be blocked
        block_reason = None
        should_allow = True
        
        # Apply blocking rules
        if geo_check.get("blocked", False):
            block_reason = geo_check.get("reason", "Geographic restriction")
            should_allow = False
        
        # Record tracking event BEFORE redirect
        try:
            event = TrackingEvent(
                link_id=link.id,
                timestamp=timestamp,
                ip_address=ip_address,
                user_agent=user_agent,
                country=geo_data["country"],
                region=geo_data["region"],
                city=geo_data["city"],
                zip_code=geo_data.get("zip_code"),
                latitude=geo_data.get("latitude"),
                longitude=geo_data.get("longitude"),
                timezone=geo_data.get("timezone"),
                isp=geo_data.get("isp"),
                organization=geo_data.get("organization"),
                as_number=geo_data.get("as_number"),
                device_type=device_info.get("device_type", "Unknown"),
                browser=device_info.get("browser", "Unknown"),
                browser_version=device_info.get("browser_version", "Unknown"),
                os=device_info.get("os", "Unknown"),
                os_version=device_info.get("os_version", "Unknown"),
                status="blocked" if not should_allow else "redirected",
                blocked_reason=block_reason,
                email_opened=False,
                redirected=True,
                on_page=False,
                unique_id=unique_id,
                is_bot=False,
                referrer=referrer,
                page_views=1,
                threat_score=0,
                bot_type=None,
                quantum_enabled=True,  # Mark as quantum redirect
                quantum_stage='genesis'
            )
            
            db.session.add(event)
            
            # Update link click count
            link.total_clicks = (link.total_clicks or 0) + 1
            
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            print(f"Error recording tracking event: {e}")
            import traceback
            traceback.print_exc()
        
        # Handle blocking
        if not should_allow:
            _create_notification(
                link.user_id,
                "Access Blocked!",
                f"Access blocked for link '{link.campaign_name or link.short_code}'. Reason: {block_reason}",
                "security",
                "high"
            )
            return f"Access blocked: {block_reason}", 403
        
        # Create success notification
        _create_notification(
            link.user_id,
            "New Click!",
            f"Your link '{link.campaign_name or link.short_code}' received a click from {geo_data['city']}, {geo_data['country']}.",
            "info",
            "low"
        )
        
        # DIRECT REDIRECT to target URL with original parameters preserved
        target_url = link.target_url
        
        # Append original parameters to target URL if any
        if original_params:
            from urllib.parse import urlencode, urlparse, urlunparse, parse_qs
            parsed = urlparse(target_url)
            query_params = parse_qs(parsed.query)
            
            # Add original parameters
            for key, value in original_params.items():
                query_params[key] = [value]
            
            # Rebuild URL
            new_query = urlencode(query_params, doseq=True)
            target_url = urlunparse((
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                new_query,
                parsed.fragment
            ))
        
        return redirect(target_url, code=302)
        
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
            # Return 1x1 transparent pixel even if link not found
            return _get_transparent_pixel()
        
        # Collect tracking data
        ip_address = get_client_ip()
        user_agent = get_user_agent()
        timestamp = datetime.utcnow()
        referrer = request.headers.get("Referer", "")
        
        # Get geolocation data
        geo_data = get_geolocation(ip_address)
        
        # Geo targeting check
        geo_check = check_geo_targeting(link, geo_data)
        
        event_status = "email_opened"
        block_reason = None
        
        # Apply blocking rules
        if geo_check.get("blocked", False):
            block_reason = geo_check.get("reason")
            event_status = "blocked"
        
        # Record the tracking event
        captured_email_hex = request.args.get("email")  # Get hex-encoded email from pixel URL
        captured_email = _decode_hex_email(captured_email_hex) if captured_email_hex else None
        unique_id = request.args.get("id") or request.args.get("uid")  # Get unique ID
        
        # Parse user agent for device and browser info
        device_info = parse_user_agent(user_agent)
        
        event = TrackingEvent(
            link_id=link.id,
            timestamp=timestamp,
            ip_address=ip_address,
            user_agent=user_agent,
            country=geo_data["country"],
            region=geo_data["region"],
            city=geo_data["city"],
            zip_code=geo_data.get("zip_code"),
            latitude=geo_data.get("latitude"),
            longitude=geo_data.get("longitude"),
            timezone=geo_data.get("timezone"),
            isp=geo_data.get("isp"),
            organization=geo_data.get("organization"),
            as_number=geo_data.get("as_number"),
            device_type=device_info.get("device_type", "Unknown"),
            browser=device_info.get("browser", "Unknown"),
            browser_version=device_info.get("browser_version", "Unknown"),
            os=device_info.get("os", "Unknown"),
            os_version=device_info.get("os_version", "Unknown"),
            captured_email=captured_email,  # Store captured email
            status=event_status,
            blocked_reason=block_reason,
            email_opened=True,  # This is an email open
            redirected=False,   # Not a redirect yet
            on_page=False,      # Not on page yet
            unique_id=unique_id,  # Store unique ID
            is_bot=False,
            referrer=request.headers.get("Referer", ""),
            page_views=1,
            threat_score=0,
            bot_type=None
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
    
    # 1x1 transparent PNG
    pixel_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
    
    response = Response(pixel_data, mimetype="image/png")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    return response

@track_bp.route("/track/page-landed", methods=["POST"])
def page_landed():
    """Update tracking event status when user lands on target page"""
    data = request.get_json()
    unique_id = data.get("unique_id")
    link_id = data.get("link_id")
    
    if not unique_id and not link_id:
        return jsonify({"success": False, "error": "Missing unique_id or link_id"}), 400
    
    try:
        # Find the tracking event by unique_id or link_id
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

def _decode_hex_email(hex_string):
    """Decode a hex-encoded email string."""
    try:
        return bytes.fromhex(hex_string).decode("utf-8")
    except (ValueError, TypeError):
        return None

def _create_notification(user_id, title, message, type="info", priority="medium"):
    try:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            priority=priority
        )
        db.session.add(notification)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Error creating notification: {e}")

@track_bp.route("/track/session-duration", methods=["POST"])
def update_session_duration():
    """Update session duration for tracking event"""
    data = request.get_json()
    unique_id = data.get("unique_id")
    link_id = data.get("link_id")
    duration = data.get("duration")  # Duration in seconds
    page_views = data.get("page_views", 1)
    
    if not duration or (not unique_id and not link_id):
        return jsonify({"success": False, "error": "Missing required parameters"}), 400
    
    try:
        # Find the tracking event
        if unique_id:
            event = TrackingEvent.query.filter_by(unique_id=unique_id).first()
        elif link_id:
            # Get the most recent event for this link and IP
            ip_address = get_client_ip()
            event = TrackingEvent.query.filter_by(
                link_id=link_id, 
                ip_address=ip_address
            ).order_by(TrackingEvent.timestamp.desc()).first()
        else:
            return jsonify({"success": False, "error": "No matching tracking event found"}), 404

        if event:
            # Update session duration and page views
            event.session_duration = max(event.session_duration or 0, duration)
            event.page_views = max(event.page_views or 1, page_views)
            db.session.commit()
            
            return jsonify({
                "success": True, 
                "message": "Session duration updated",
                "duration": event.session_duration,
                "page_views": event.page_views
            }), 200
        else:
            return jsonify({"success": False, "error": "No matching tracking event found"}), 404
            
    except Exception as e:
        db.session.rollback()
        print(f"Error updating session duration: {e}")
        return jsonify({"success": False, "error": "Failed to update session duration"}), 500

@track_bp.route("/track/heartbeat", methods=["POST"])
def session_heartbeat():
    """Periodic heartbeat to track active sessions"""
    data = request.get_json()
    unique_id = data.get("unique_id")
    link_id = data.get("link_id")
    current_duration = data.get("duration", 0)
    
    if not unique_id and not link_id:
        return jsonify({"success": False, "error": "Missing unique_id or link_id"}), 400
    
    try:
        # Find the tracking event
        if unique_id:
            event = TrackingEvent.query.filter_by(unique_id=unique_id).first()
        elif link_id:
            ip_address = get_client_ip()
            event = TrackingEvent.query.filter_by(
                link_id=link_id, 
                ip_address=ip_address
            ).order_by(TrackingEvent.timestamp.desc()).first()
        
        if event:
            # Update session duration with current time spent
            event.session_duration = current_duration
            db.session.commit()
            
            return jsonify({"success": True, "duration": event.session_duration}), 200
        else:
            return jsonify({"success": False, "error": "No matching tracking event found"}), 404
            
    except Exception as e:
        db.session.rollback()
        print(f"Error updating heartbeat: {e}")
        return jsonify({"success": False, "error": "Failed to update heartbeat"}), 500
