from flask import Blueprint, request, jsonify
from api.database import db
from api.models.tracking_event import TrackingEvent
from datetime import datetime

page_tracking_bp = Blueprint("page_tracking", __name__)


def _find_event(uid):
    """Find tracking event by unique_id or quantum_click_id."""
    event = TrackingEvent.query.filter_by(unique_id=uid).first()
    if not event:
        event = TrackingEvent.query.filter_by(quantum_click_id=uid).first()
    return event


@page_tracking_bp.route("/track/page-view", methods=["POST"])
def track_page_view():
    """Track when user reaches the landing page (on_page status).
    Accepts uid = unique_id OR quantum_click_id (bridge passes quantum_click_id).
    Returns 200 even if event not found — beacon calls should never fail visibly.
    """
    try:
        data = request.get_json(silent=True) or {}
        uid = data.get("uid")

        if not uid:
            return jsonify({"success": True, "message": "No uid provided"})

        event = _find_event(uid)
        if not event:
            return jsonify({"success": True, "message": "Event not found"})

        event.on_page = True
        event.status = "on_page"
        event.page_views = (event.page_views or 0) + 1

        if "duration" in data:
            event.session_duration = data["duration"]

        db.session.commit()
        return jsonify({"success": True, "message": "Page view tracked"})

    except Exception:
        db.session.rollback()
        return jsonify({"success": True, "message": "Beacon received"})


@page_tracking_bp.route("/track/email-open", methods=["POST"])
def track_email_open():
    """Track when email is opened via pixel tracking"""
    try:
        data = request.get_json(silent=True) or {}
        uid = data.get("uid")
        email = data.get("email")

        if not uid:
            return jsonify({"success": False, "error": "Missing unique ID"}), 400

        event = _find_event(uid)
        if not event:
            return jsonify({"success": False, "error": "Tracking event not found"}), 404

        event.email_opened = True
        if event.status == "opened":
            event.status = "email_opened"

        if email:
            event.captured_email = email

        db.session.commit()
        return jsonify({"success": True, "message": "Email open tracked"})

    except Exception:
        db.session.rollback()
        return jsonify({"success": False, "error": "Internal server error"}), 500


@page_tracking_bp.route("/track/session-end", methods=["POST"])
def track_session_end():
    """Track when user session ends"""
    try:
        data = request.get_json(silent=True) or {}
        uid = data.get("uid")
        duration = data.get("duration", 0)

        if not uid:
            return jsonify({"success": False, "error": "Missing unique ID"}), 400

        event = _find_event(uid)
        if not event:
            return jsonify({"success": False, "error": "Tracking event not found"}), 404

        event.session_duration = duration
        db.session.commit()
        return jsonify({"success": True, "message": "Session end tracked"})

    except Exception:
        db.session.rollback()
        return jsonify({"success": False, "error": "Internal server error"}), 500
