from flask import Blueprint, request, jsonify, session, Response
from api.models.tracking_event import TrackingEvent
from api.models.link import Link
from api.database import db
from api.models.user import User
from functools import wraps
from datetime import datetime
import json
import base64
import re

events_bp = Blueprint("events", __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_detailed_status(event):
    """Generate detailed status description based on event data"""
    if event.status == "Blocked":
        if event.blocked_reason == "bot_detected":
            return "Bot detected and blocked by security filters"
        elif event.blocked_reason:
            return f"Access blocked: {event.blocked_reason}"
        else:
            return "Access blocked by security filters"
    elif event.status == "Bot":
        return "Bot detected and blocked by security filters"
    elif event.status == "Open":
        return "User clicked the tracking link"
    elif event.status == "Redirected":
        return "User clicked link and was successfully redirected to target page"
    elif event.status == "On Page":
        return "User landed on target page and is actively browsing"
    elif event.email_opened:
        return "Email tracking pixel loaded successfully"
    else:
        return "Tracking event processed"

def decode_hex_email(hex_email):
    """Decodes a hexadecimal encoded email back to normal string."""
    try:
        # Remove '0x' prefix if present
        if hex_email.startswith('0x'):
            hex_email = hex_email[2:]
        # Decode hex to bytes, then bytes to string
        return bytes.fromhex(hex_email).decode('utf-8')
    except Exception as e:
        print(f"Error decoding hex email: {e}")
        return None

@events_bp.route("/api/events", methods=["GET"])
@login_required
def get_events():
    """Get tracking events for user's links"""
    try:
        user_id = session.get("user_id")

        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 50, type=int)
        link_id_filter = request.args.get("link_id", type=int)
        search_query = request.args.get("search", type=str)

        query = db.session.query(TrackingEvent, Link.short_code).join(Link).filter(Link.user_id == user_id)

        if link_id_filter:
            query = query.filter(TrackingEvent.link_id == link_id_filter)
        
        if search_query:
            search_pattern = f"%{search_query}%"
            query = query.filter(
                (TrackingEvent.ip_address.ilike(search_pattern)) |
                (TrackingEvent.country.ilike(search_pattern)) |
                (TrackingEvent.city.ilike(search_pattern)) |
                (TrackingEvent.user_agent.ilike(search_pattern)) |
                (TrackingEvent.captured_email.ilike(search_pattern))
            )

        pagination = query.order_by(TrackingEvent.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        events_list = []
        for event, short_code in pagination.items:
            # Format timestamp for display
            timestamp_str = event.timestamp.strftime("%Y-%m-%d %H:%M:%S") if event.timestamp else "Unknown"
            
            # Create location string
            location_parts = []
            if event.city and event.city != "Unknown":
                location_parts.append(event.city)
            if event.region and event.region != "Unknown":
                location_parts.append(event.region)
            if event.zip_code and event.zip_code != "Unknown":
                location_parts.append(event.zip_code)
            if event.country and event.country != "Unknown":
                location_parts.append(event.country)
            location = ", ".join(location_parts) if location_parts else "Unknown Location"
            
            # Format browser and OS info
            browser_info = f"{event.browser or 'Unknown'}"
            if event.browser_version:
                browser_info += f" {event.browser_version}"
            
            os_info = f"{event.os or 'Unknown'}"
            if event.os_version:
                os_info += f" {event.os_version}"
            
            # Format session duration
            session_duration = "00:00:00"
            if event.session_duration:
                minutes, seconds = divmod(event.session_duration, 60)
                hours, minutes = divmod(minutes, 60)
                session_duration = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
            
            # Decode email if present and hex encoded
            decoded_email = event.captured_email
            if event.captured_email and re.match(r'^[0-9a-fA-F]+$', event.captured_email):
                decoded_email = decode_hex_email(event.captured_email)

            # Generate comprehensive status based on all stages
            status_parts = []
            if event.email_opened:
                status_parts.append("Open")
            if event.redirected:
                status_parts.append("Redirected")
            if event.on_page:
                status_parts.append("On Page")
            
            # If no specific stages are set, use the status field
            if not status_parts:
                if event.is_bot:
                    display_status = "Bot"
                elif event.blocked_reason:
                    display_status = "Blocked"
                else:
                    display_status = event.status or "Open"
            else:
                display_status = " - ".join(status_parts)
            
            events_list.append({
                "id": event.id,
                "uniqueId": event.unique_id or f"uid_{short_code}_{event.id:03d}",
                "timestamp": timestamp_str,
                "ip": event.ip_address or "Unknown",
                "location": location,
                "zipCode": event.zip_code or "Unknown",
                "region": event.region or "Unknown",
                "country": event.country or "Unknown",
                "city": event.city or "Unknown",
                "userAgent": event.user_agent or "Unknown",
                "browser": browser_info,
                "os": os_info,
                "device": event.device_type or "Unknown",
                "status": display_status,
                "detailedStatus": get_detailed_status(event),
                "linkShortCode": short_code or f"link_{event.link_id}",
                "linkId": event.link_id,
                "campaignId": f"camp_{event.link_id:03d}", # Placeholder, needs actual campaign ID
                "referrer": event.referrer or "direct",
                "isp": event.isp or "Unknown",
                "ispDetails": event.organization or event.isp or "Unknown ISP",
                "emailCaptured": decoded_email,
                "conversionValue": 0,  # This would need to be calculated based on business logic
                "sessionDuration": session_duration
            })
        
        return jsonify({
            "events": events_list,
            "total": pagination.total,
            "pages": pagination.pages,
            "current_page": page
        }), 200

    except Exception as e:
        print(f"Error fetching events: {e}")
        return jsonify({"error": str(e)}), 500

@events_bp.route("/api/events/live", methods=["GET"])
@login_required
def get_live_events():
    """Get recent live events"""
    try:
        user_id = session.get("user_id")

        events = db.session.query(TrackingEvent, Link.short_code).join(Link).filter(
            Link.user_id == user_id
        ).order_by(TrackingEvent.timestamp.desc()).limit(20).all()

        events_list = []
        for event, short_code in events:
            timestamp_str = event.timestamp.strftime("%Y-%m-%d %H:%M:%S") if event.timestamp else "Unknown"
            location_parts = []
            if event.city and event.city != "Unknown": location_parts.append(event.city)
            if event.country and event.country != "Unknown": location_parts.append(event.country)
            location = ", ".join(location_parts) if location_parts else "Unknown Location"
            
            decoded_email = event.captured_email
            if event.captured_email and re.match(r'^[0-9a-fA-F]+$', event.captured_email):
                decoded_email = decode_hex_email(event.captured_email)

            events_list.append({
                "id": event.id,
                "timestamp": timestamp_str,
                "ip": event.ip_address,
                "location": location,
                "status": event.status,
                "linkShortCode": short_code,
                "emailCaptured": decoded_email
            })

        return jsonify(events_list), 200

    except Exception as e:
        print(f"Error fetching live events: {e}")
        return jsonify({"error": str(e)}), 500

@events_bp.route("/api/events/<int:event_id>", methods=["DELETE"])
@login_required
def delete_event(event_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Authentication required"}), 401
    
    try:
        event = TrackingEvent.query.get(event_id)
        if not event:
            return jsonify({"error": "Event not found"}), 404
        
        link = Link.query.get(event.link_id)
        if not link or link.user_id != user_id:
            return jsonify({"error": "Access denied"}), 403
        
        db.session.delete(event)
        db.session.commit()
        
        return jsonify({"success": True, "message": "Event deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error deleting event: {e}")
        return jsonify({"error": "Failed to delete event"}), 500

# Pixel tracking endpoints (from the 00392b0 version, adapted)

@events_bp.route("/p/<short_code>")
def pixel_tracking(short_code):
    """Tracking pixel endpoint"""
    try:
        link = Link.query.filter_by(short_code=short_code).first()
        if not link:
            return _get_transparent_pixel()
        
        ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
        user_agent = request.headers.get("User-Agent", "")
        timestamp = datetime.utcnow()
        
        # Placeholder for geolocation and bot detection - these functions need to be implemented or imported
        # For now, using default values or simplified logic
        geo_data = {"country": "Unknown", "region": "Unknown", "city": "Unknown", "zip_code": "Unknown", "latitude": None, "longitude": None, "timezone": "Unknown", "isp": "Unknown", "organization": "Unknown", "as_number": "Unknown", "as_name": "Unknown", "is_mobile": False, "is_proxy": False, "is_hosting": False}
        is_bot = False # Placeholder
        
        event_status = "email_opened"
        block_reason = None
        
        captured_email = request.args.get("email")
        unique_id = request.args.get("id") or request.args.get("uid")
        
        # Placeholder for device info
        device_info = {"device_type": "Unknown", "browser": "Unknown", "browser_version": "Unknown", "os": "Unknown", "os_version": "Unknown"}
        
        event = TrackingEvent(
            link_id=link.id,
            timestamp=timestamp,
            ip_address=ip_address,
            user_agent=user_agent,
            country=geo_data["country"],
            region=geo_data["region"],
            city=geo_data["city"],
            zip_code=geo_data["zip_code"],
            latitude=geo_data["latitude"],
            longitude=geo_data["longitude"],
            timezone=geo_data["timezone"],
            isp=geo_data["isp"],
            organization=geo_data["organization"],
            as_number=geo_data["as_number"],
            device_type=device_info["device_type"],
            browser=device_info["browser"],
            browser_version=device_info["browser_version"],
            os=device_info["os"],
            os_version=device_info["os_version"],
            captured_email=captured_email,
            status=event_status,
            blocked_reason=block_reason,
            email_opened=True,
            redirected=False,
            on_page=False,
            unique_id=unique_id,
            is_bot=is_bot,
            referrer=request.headers.get("Referer", ""),
            page_views=1
        )
        
        db.session.add(event)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Pixel tracking error: {e}")
    
    return _get_transparent_pixel()

def _get_transparent_pixel():
    """Return a 1x1 transparent PNG pixel"""
    # 1x1 transparent PNG
    pixel_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
    
    response = Response(pixel_data, mimetype="image/png")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    return response

@events_bp.route("/track/page-landed", methods=["POST"])
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
            db.session.commit()
            return jsonify({"success": True, "message": "Page landed status updated"}), 200
        else:
            return jsonify({"success": False, "error": "No matching tracking event found"}), 404
    except Exception as e:
        db.session.rollback()
        print(f"Error updating page landed status: {e}")
        return jsonify({"success": False, "error": "Failed to update page landed status"}), 500

