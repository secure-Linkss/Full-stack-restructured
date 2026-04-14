from flask import Blueprint, jsonify, request, session, g
from api.database import db
from api.models.user import User
from api.models.domain import Domain
from api.models.tracking_event import TrackingEvent
from api.models.link import Link
from api.middleware.auth_decorators import login_required, admin_required
import os
import secrets
import logging
import requests as http_requests
from datetime import datetime, timedelta
from sqlalchemy import func

import dns.resolver

logger = logging.getLogger(__name__)

domains_bp = Blueprint("domains_routes", __name__)

@domains_bp.route("/api/domains", methods=["GET"])
@login_required
def get_user_domains():
    """Get available domains for the user"""
    try:
        user_id = session.get("user_id")
        
        # Get global active domains (created by admin or system, meant for everyone)
        global_domains = Domain.query.filter_by(is_active=True, created_by=None).all()
        
        # Get user's custom domains
        user_domains = Domain.query.filter_by(created_by=user_id).all()
        
        domains_list = [d.to_dict() for d in global_domains + user_domains]
        
        return jsonify({
            "success": True,
            "domains": domains_list
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@domains_bp.route("/api/domains/custom", methods=["POST"])
@login_required
def add_custom_domain():
    """User adds a custom domain"""
    try:
        data = request.get_json()
        domain_name = data.get("domain")
        
        if not domain_name:
            return jsonify({"success": False, "error": "Domain is required"}), 400
            
        domain_name = domain_name.lower().strip()
        
        # Check if domain already exists
        existing = Domain.query.filter_by(domain=domain_name).first()
        if existing:
            return jsonify({"success": False, "error": "Domain already registered"}), 400
            
        verification_token = f"blt-verify-{secrets.token_hex(16)}"
        
        domain = Domain(
            domain=domain_name,
            domain_type="custom",
            created_by=session.get("user_id"),
            verification_token=verification_token,
            is_active=False,
            is_verified=False
        )
        
        db.session.add(domain)
        db.session.commit()
        
        return jsonify({
            "success": True, 
            "domain": domain.to_dict(),
            "verification_instruction": f"Add a TXT record to your domain's DNS: Name: @ or {domain_name}, Value: {verification_token}"
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@domains_bp.route("/api/domains/<int:domain_id>/verify", methods=["POST"])
@login_required
def verify_domain(domain_id):
    """Verify DNS ownership of a custom domain"""
    try:
        user_id = session.get("user_id")
        domain = Domain.query.filter_by(id=domain_id, created_by=user_id).first()
        
        if not domain:
            return jsonify({"success": False, "error": "Domain not found or unauthorized"}), 404
            
        if domain.is_verified:
            return jsonify({"success": True, "message": "Domain already verified", "domain": domain.to_dict()}), 200
            
        # Perform DNS lookup for TXT record
        try:
            answers = dns.resolver.resolve(domain.domain, 'TXT')
            txt_records = [txt_string.decode('utf-8') for rdata in answers for txt_string in rdata.strings]
            
            if domain.verification_token in txt_records:
                domain.is_verified = True
                domain.is_active = True
                domain.verified_at = db.func.now()
                db.session.commit()
                return jsonify({"success": True, "message": "Domain successfully verified", "domain": domain.to_dict()}), 200
            else:
                return jsonify({"success": False, "error": "Verification token not found in DNS TXT records. Note that DNS propagation may take up to 24 hours."}), 400
                
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.exception.Timeout):
             return jsonify({"success": False, "error": "Could not fetch DNS records. Ensure domain points to an active DNS server."}), 400
             
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@domains_bp.route("/api/domains/<int:domain_id>", methods=["DELETE"])
@login_required
def delete_domain(domain_id):
    """Delete a custom domain"""
    try:
        user_id = session.get("user_id")
        domain = Domain.query.filter_by(id=domain_id, created_by=user_id).first()
        
        if not domain:
            return jsonify({"success": False, "error": "Domain not found or unauthorized"}), 404
            
        db.session.delete(domain)
        db.session.commit()
        
        return jsonify({"success": True, "message": "Domain deleted"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

# Admin endpoints for domain management
@domains_bp.route("/api/admin/domains", methods=["GET"])
@admin_required
def admin_get_domains():
    """Admin: Get all domains"""
    try:
        domains = Domain.query.all()
        return jsonify({
            "success": True,
            "domains": [d.to_dict() for d in domains]
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@domains_bp.route("/api/admin/domains", methods=["POST"])
@admin_required
def admin_add_domain():
    """Admin: Add a global domain"""
    try:
        data = request.get_json()
        domain_name = data.get("domain")
        domain_type = data.get("domain_type", "custom")
        description = data.get("description", "")
        
        if not domain_name:
            return jsonify({"success": False, "error": "Domain is required"}), 400
            
        existing = Domain.query.filter_by(domain=domain_name).first()
        if existing:
            return jsonify({"success": False, "error": "Domain already registered"}), 400
            
        domain = Domain(
            domain=domain_name,
            domain_type=domain_type,
            description=description,
            is_active=True,
            is_verified=True,
            created_by=None # Global domain
        )
        
        db.session.add(domain)
        db.session.commit()
        
        return jsonify({"success": True, "domain": domain.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@domains_bp.route("/api/admin/domains/<int:domain_id>/status", methods=["PATCH"])
@admin_required
def admin_update_domain_status(domain_id):
    """Admin: Update domain status"""
    try:
        data = request.get_json()
        is_active = data.get("is_active")

        domain = Domain.query.get(domain_id)
        if not domain:
            return jsonify({"success": False, "error": "Domain not found"}), 404

        if is_active is not None:
            domain.is_active = is_active

        db.session.commit()
        return jsonify({"success": True, "domain": domain.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


# ── Domain health check ───────────────────────────────────────────────────────

def _check_domain_reachable(domain_name: str) -> dict:
    """Perform an HTTP HEAD check; return status dict."""
    for scheme in ("https", "http"):
        try:
            resp = http_requests.head(
                f"{scheme}://{domain_name}",
                timeout=5,
                allow_redirects=True,
                headers={"User-Agent": "BrainLinkTracker-HealthBot/1.0"},
            )
            return {
                "reachable": resp.status_code < 500,
                "status_code": resp.status_code,
                "scheme": scheme,
            }
        except Exception:
            continue
    return {"reachable": False, "status_code": None, "scheme": None}


@domains_bp.route("/api/domains/<int:domain_id>/health", methods=["GET"])
@login_required
def check_domain_health(domain_id):
    """Live reachability + DNS health check for a domain."""
    user_id = session.get("user_id")
    domain = Domain.query.filter(
        (Domain.id == domain_id) &
        ((Domain.created_by == user_id) | (Domain.created_by == None))  # noqa: E711
    ).first()
    if not domain:
        return jsonify({"success": False, "error": "Domain not found"}), 404

    http_result = _check_domain_reachable(domain.domain)

    dns_ok = False
    try:
        dns.resolver.resolve(domain.domain, "A")
        dns_ok = True
    except Exception:
        pass

    health_score = 0
    if dns_ok:
        health_score += 50
    if http_result["reachable"]:
        health_score += 50

    return jsonify({
        "success": True,
        "domain": domain.domain,
        "health_score": health_score,
        "dns_resolves": dns_ok,
        "http_reachable": http_result["reachable"],
        "http_status_code": http_result.get("status_code"),
        "checked_at": datetime.utcnow().isoformat(),
    }), 200


# ── Abuse / spam detection ────────────────────────────────────────────────────

@domains_bp.route("/api/admin/domains/<int:domain_id>/abuse-report", methods=["GET"])
@admin_required
def domain_abuse_report(domain_id, current_user=None):  # noqa: ARG001 — injected by @admin_required
    """Return bot/spam ratio and recent suspicious events for a domain."""
    domain = Domain.query.get(domain_id)
    if not domain:
        return jsonify({"success": False, "error": "Domain not found"}), 404

    since = datetime.utcnow() - timedelta(days=7)

    # Links on this domain
    domain_links = Link.query.filter(
        Link.target_url.ilike(f"%{domain.domain}%")
    ).all()
    link_ids = [l.id for l in domain_links]

    total_events = 0
    bot_events = 0
    honeypot_events = 0

    if link_ids:
        total_events = (
            TrackingEvent.query
            .filter(TrackingEvent.link_id.in_(link_ids), TrackingEvent.timestamp >= since)
            .count()
        )
        bot_events = (
            TrackingEvent.query
            .filter(TrackingEvent.link_id.in_(link_ids),
                    TrackingEvent.timestamp >= since,
                    TrackingEvent.is_bot == True)  # noqa: E712
            .count()
        )
        honeypot_events = (
            TrackingEvent.query
            .filter(TrackingEvent.link_id.in_(link_ids),
                    TrackingEvent.timestamp >= since,
                    TrackingEvent.status == "honeypot")
            .count()
        )

    bot_ratio = round(bot_events / total_events * 100, 1) if total_events else 0
    risk = "high" if bot_ratio > 60 else "medium" if bot_ratio > 30 else "low"

    return jsonify({
        "success": True,
        "domain": domain.domain,
        "period_days": 7,
        "total_events": total_events,
        "bot_events": bot_events,
        "honeypot_events": honeypot_events,
        "bot_ratio_pct": bot_ratio,
        "risk_level": risk,
    }), 200


@domains_bp.route("/api/admin/domains/<int:domain_id>/flag", methods=["POST"])
@admin_required
def admin_flag_domain(domain_id, current_user=None):  # noqa: ARG001 — injected by @admin_required
    """Admin: flag/suspend/blacklist a domain."""
    data = request.get_json() or {}
    action = data.get("action", "flag")  # flag | suspend | blacklist | reinstate

    domain = Domain.query.get(domain_id)
    if not domain:
        return jsonify({"success": False, "error": "Domain not found"}), 404

    action_map = {
        "flag":      {"is_active": True,  "notes": "flagged"},
        "suspend":   {"is_active": False, "notes": "suspended"},
        "blacklist": {"is_active": False, "notes": "blacklisted"},
        "reinstate": {"is_active": True,  "notes": "reinstated"},
    }
    if action not in action_map:
        return jsonify({"success": False, "error": f"Unknown action: {action}"}), 400

    domain.is_active = action_map[action]["is_active"]
    try:
        domain.notes = action_map[action]["notes"]
    except Exception:
        pass
    db.session.commit()

    return jsonify({"success": True, "action": action, "domain": domain.to_dict()}), 200
