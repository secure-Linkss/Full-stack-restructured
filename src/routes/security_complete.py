"""
COMPLETE SECURITY ROUTES with ALL Required Endpoints
====================================================
This file provides all security endpoints needed by the frontend:
- /api/security/logs (for Security.jsx component)
- /api/security (existing endpoint)

All routes filter by current user_id
"""

from flask import Blueprint, request, jsonify, session, g
from datetime import datetime, timedelta
import json
from src.models.user import User, db
from src.models.security import SecuritySettings, BlockedIP, BlockedCountry
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
from functools import wraps

security_bp = Blueprint("security", __name__)

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Not authenticated"}), 401
        
        user = User.query.get(session["user_id"])
        if not user:
            return jsonify({"error": "User not found"}), 401
        g.user = user
        return f(*args, **kwargs)
    
    return decorated_function

def get_date_range(period_param):
    """Extract days from period parameter"""
    try:
        if isinstance(period_param, str):
            if period_param.endswith('d'):
                days = int(period_param[:-1])
            else:
                days = int(period_param)
        else:
            days = int(period_param)
    except:
        days = 7  # Default
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    return start_date, end_date, days

@security_bp.route("/api/security/logs", methods=["GET"])
@require_auth
def get_security_logs():
    """Security Logs - Used by Security.jsx component"""
    user_id = g.user.id
    
    try:
        period = request.args.get("period", "7")
        start_date, end_date, days = get_date_range(period)
        
        # Get user's links
        user_links = Link.query.filter_by(user_id=user_id).all()
        link_ids = [link.id for link in user_links]
        
        if not link_ids:
            return jsonify({
                "totalThreats": 0,
                "blockedIPs": 0,
                "suspiciousActivity": 0,
                "secureConnections": 0,
                "recentEvents": [],
                "threatsByType": [],
                "ipLogs": []
            })
        
        # Get tracking events
        events = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.timestamp >= start_date,
            TrackingEvent.timestamp <= end_date
        ).all()
        
        # Analyze events for threats
        total_threats = 0
        suspicious_activity = 0
        secure_connections = 0
        recent_events = []
        threat_types = {"Bot Detected": 0, "Suspicious Activity": 0, "Unusual Access": 0, "Rate Limit Exceeded": 0}
        
        for event in events:
            user_agent = (event.user_agent or "").lower()
            event_type = "normal_access"
            severity = "low"
            status = "allowed"
            
            # Bot detection
            if any(bot in user_agent for bot in ["bot", "crawler", "spider", "scraper"]):
                event_type = "bot_detected"
                severity = "high"
                status = "blocked"
                total_threats += 1
                threat_types["Bot Detected"] += 1
            # Suspicious tools
            elif any(tool in user_agent for tool in ["curl", "python", "wget", "postman"]):
                event_type = "suspicious_activity"
                severity = "medium"
                suspicious_activity += 1
                threat_types["Suspicious Activity"] += 1
            # Normal access
            else:
                event_type = "normal_access"
                severity = "low"
                status = "allowed"
                secure_connections += 1
            
            recent_events.append({
                "type": event_type,
                "ip": event.ip_address or "Unknown",
                "timestamp": event.timestamp.strftime("%Y-%m-%d %H:%M:%S") if event.timestamp else "Unknown",
                "status": status,
                "severity": severity
            })
        
        # Sort by timestamp (most recent first)
        recent_events.sort(key=lambda x: x["timestamp"], reverse=True)
        recent_events = recent_events[:20]  # Limit to 20 most recent
        
        # Get blocked IPs
        blocked_ips = BlockedIP.query.filter_by(user_id=user_id).order_by(BlockedIP.blocked_at.desc()).all()
        blocked_ips_count = len(blocked_ips)
        
        # IP activity logs
        ip_stats = {}
        for event in events:
            ip = event.ip_address or "Unknown"
            if ip not in ip_stats:
                ip_stats[ip] = {
                    "ip": ip,
                    "country": event.country or "Unknown",
                    "requests": 0,
                    "blocked": False
                }
            ip_stats[ip]["requests"] += 1
        
        # Check if IPs are blocked
        blocked_ip_addresses = {ip.ip_address for ip in blocked_ips}
        for ip_data in ip_stats.values():
            if ip_data["ip"] in blocked_ip_addresses:
                ip_data["blocked"] = True
        
        ip_logs = list(ip_stats.values())
        ip_logs.sort(key=lambda x: x["requests"], reverse=True)
        ip_logs = ip_logs[:20]  # Top 20 IPs
        
        # Threat types breakdown
        total_threat_events = sum(threat_types.values())
        threats_by_type = []
        for threat_type, count in threat_types.items():
            percentage = (count / total_threat_events * 100) if total_threat_events > 0 else 0
            threats_by_type.append({
                "type": threat_type,
                "count": count,
                "percentage": round(percentage, 1)
            })
        
        return jsonify({
            "totalThreats": total_threats,
            "blockedIPs": blocked_ips_count,
            "suspiciousActivity": suspicious_activity,
            "secureConnections": secure_connections,
            "recentEvents": recent_events,
            "threatsByType": threats_by_type,
            "ipLogs": ip_logs
        })
    
    except Exception as e:
        print(f"Error in security logs: {e}")
        return jsonify({"error": str(e)}), 500


@security_bp.route("/api/security", methods=["GET"])
@require_auth
def get_security_data():
    """Get comprehensive security data including settings, blocked IPs, countries, and events"""
    try:
        # Get security settings
        settings_obj = SecuritySettings.query.filter_by(user_id=g.user.id).first()
        if settings_obj:
            settings = {
                "botProtection": settings_obj.bot_protection,
                "ipBlocking": settings_obj.ip_blocking,
                "rateLimiting": settings_obj.rate_limiting,
                "geoBlocking": settings_obj.geo_blocking,
                "vpnDetection": settings_obj.vpn_detection,
                "suspiciousActivityDetection": settings_obj.suspicious_activity_detection
            }
        else:
            # Default settings
            settings = {
                "botProtection": True,
                "ipBlocking": True,
                "rateLimiting": True,
                "geoBlocking": False,
                "vpnDetection": True,
                "suspiciousActivityDetection": True
            }
        
        # Get blocked IPs
        blocked_ips = BlockedIP.query.filter_by(user_id=g.user.id).order_by(BlockedIP.blocked_at.desc()).all()
        blocked_ips_data = [{
            "ip": ip.ip_address,
            "reason": ip.reason,
            "blockedAt": ip.blocked_at.isoformat(),
            "attempts": ip.attempt_count
        } for ip in blocked_ips]
        
        # Get blocked countries
        blocked_countries = BlockedCountry.query.filter_by(user_id=g.user.id).order_by(BlockedCountry.blocked_at.desc()).all()
        blocked_countries_data = [{
            "country": country.country,
            "code": country.country_code,
            "reason": country.reason,
            "blockedAt": country.blocked_at.isoformat()
        } for country in blocked_countries]
        
        # Get security events from tracking_event table
        events_query = db.session.query(
            TrackingEvent.id, 
            TrackingEvent.timestamp, 
            TrackingEvent.ip_address, 
            TrackingEvent.user_agent, 
            Link.campaign_name, 
            Link.short_code
        ).join(
            Link, TrackingEvent.link_id == Link.id
        ).filter(
            Link.user_id == g.user.id
        ).order_by(
            TrackingEvent.timestamp.desc()
        ).limit(50)
        
        events = events_query.all()

        events_data = []
        for event in events:
            event_type = "normal_access"
            severity = "low"
            if "bot" in event.user_agent.lower() or "crawler" in event.user_agent.lower():
                event_type = "bot_detected"
                severity = "high"
            elif "curl" in event.user_agent.lower() or "python" in event.user_agent.lower():
                event_type = "suspicious_activity"
                severity = "medium"
            
            events_data.append({
                "id": event.id,
                "type": event_type,
                "ip": event.ip_address,
                "userAgent": event.user_agent,
                "timestamp": event.timestamp.isoformat(),
                "action": "allowed",
                "severity": severity
            })
        
        return jsonify({
            "settings": settings,
            "blockedIPs": blocked_ips_data,
            "blockedCountries": blocked_countries_data,
            "events": events_data
        })
    
    except Exception as e:
        print(f"Error fetching security data: {e}")
        return jsonify({"error": str(e)}), 500


@security_bp.route("/api/security/settings", methods=["PUT"])
@require_auth
def update_security_settings():
    """Update security settings"""
    try:
        data = request.get_json()
        
        settings = SecuritySettings.query.filter_by(user_id=g.user.id).first()
        if not settings:
            settings = SecuritySettings(user_id=g.user.id)
            db.session.add(settings)
        
        settings.bot_protection = data.get("botProtection", True)
        settings.ip_blocking = data.get("ipBlocking", True)
        settings.rate_limiting = data.get("rateLimiting", True)
        settings.geo_blocking = data.get("geoBlocking", False)
        settings.vpn_detection = data.get("vpnDetection", True)
        settings.suspicious_activity_detection = data.get("suspiciousActivityDetection", True)
        
        db.session.commit()
        
        return jsonify({"message": "Security settings updated successfully"})
    
    except Exception as e:
        print(f"Error updating security settings: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
