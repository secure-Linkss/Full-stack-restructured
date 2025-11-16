from flask import Blueprint, request, jsonify, session, g
from datetime import datetime, timedelta
import json
from src.models.user import User, db
from src.models.security import SecuritySettings, BlockedIP, BlockedCountry
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
from src.services.threat_intelligence import threat_intel
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
        events_query = db.session.query(TrackingEvent.id, TrackingEvent.timestamp, TrackingEvent.ip_address, TrackingEvent.user_agent, Link.campaign_name, Link.short_code).join(Link, TrackingEvent.link_id == Link.id).filter(Link.user_id == g.user.id).order_by(TrackingEvent.timestamp.desc()).limit(50)
        
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
        return jsonify({"error": "Failed to fetch security data"}), 500

@security_bp.route("/security/settings", methods=["GET"])
@require_auth
def get_security_settings():
    """Get security settings"""
    try:
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
            settings = {
                "botProtection": True,
                "ipBlocking": True,
                "rateLimiting": True,
                "geoBlocking": False,
                "vpnDetection": True,
                "suspiciousActivityDetection": True
            }
        return jsonify(settings)
    except Exception as e:
        print(f"Error fetching security settings: {e}")
        return jsonify({"error": "Failed to fetch security settings"}), 500

@security_bp.route("/security/settings", methods=["PUT"])
@require_auth
def update_security_settings():
    """Update security settings"""
    try:
        data = request.get_json()
        
        settings = SecuritySettings.query.filter_by(user_id=g.user.id).first()
        
        if not settings:
            settings = SecuritySettings(user_id=g.user.id)
            db.session.add(settings)
        
        settings.bot_protection = data.get("botProtection", settings.bot_protection)
        settings.ip_blocking = data.get("ipBlocking", settings.ip_blocking)
        settings.rate_limiting = data.get("rateLimiting", settings.rate_limiting)
        settings.geo_blocking = data.get("geoBlocking", settings.geo_blocking)
        settings.vpn_detection = data.get("vpnDetection", settings.vpn_detection)
        settings.suspicious_activity_detection = data.get("suspiciousActivityDetection", settings.suspicious_activity_detection)
        
        db.session.commit()
        
        return jsonify({"success": True})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating security settings: {e}")
        return jsonify({"error": "Failed to update settings"}), 500

@security_bp.route("/security/blocked-ips", methods=["GET"])
@require_auth
def get_blocked_ips():
    """Get all blocked IPs"""
    try:
        blocked_ips = BlockedIP.query.filter_by(user_id=g.user.id).order_by(BlockedIP.blocked_at.desc()).all()
        blocked_ips_data = [{
            "ip": ip.ip_address,
            "reason": ip.reason,
            "blockedAt": ip.blocked_at.isoformat(),
            "attempts": ip.attempt_count
        } for ip in blocked_ips]
        return jsonify(blocked_ips_data)
    except Exception as e:
        print(f"Error fetching blocked IPs: {e}")
        return jsonify({"error": "Failed to fetch blocked IPs"}), 500

@security_bp.route("/security/blocked-ips", methods=["POST"])
@require_auth
def add_blocked_ip():
    """Add a new blocked IP address"""
    try:
        data = request.get_json()
        ip = data.get("ip")
        reason = data.get("reason", "Manual block")
        
        if not ip:
            return jsonify({"error": "IP address is required"}), 400
        
        blocked_ip = BlockedIP(user_id=g.user.id, ip_address=ip, reason=reason)
        db.session.add(blocked_ip)
        db.session.commit()
        
        return jsonify({"success": True})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error adding blocked IP: {e}")
        return jsonify({"error": "Failed to add blocked IP"}), 500

@security_bp.route("/security/blocked-ips/<ip>", methods=["DELETE"])
@require_auth
def remove_blocked_ip(ip):
    """Remove a blocked IP address"""
    try:
        blocked_ip = BlockedIP.query.filter_by(user_id=g.user.id, ip_address=ip).first()
        if blocked_ip:
            db.session.delete(blocked_ip)
            db.session.commit()
        
        return jsonify({"success": True})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error removing blocked IP: {e}")
        return jsonify({"error": "Failed to remove blocked IP"}), 500

@security_bp.route("/security/blocked-countries", methods=["GET"])
@require_auth
def get_blocked_countries():
    """Get all blocked countries"""
    try:
        blocked_countries = BlockedCountry.query.filter_by(user_id=g.user.id).order_by(BlockedCountry.blocked_at.desc()).all()
        blocked_countries_data = [{
            "country": country.country,
            "code": country.country_code,
            "reason": country.reason,
            "blockedAt": country.blocked_at.isoformat()
        } for country in blocked_countries]
        return jsonify(blocked_countries_data)
    except Exception as e:
        print(f"Error fetching blocked countries: {e}")
        return jsonify({"error": "Failed to fetch blocked countries"}), 500

@security_bp.route("/security/blocked-countries", methods=["POST"])
@require_auth
def add_blocked_country():
    """Add a new blocked country"""
    try:
        data = request.get_json()
        country = data.get("country")
        code = data.get("code", country[:2].upper() if country else "")
        reason = data.get("reason", "Manual block")
        
        if not country:
            return jsonify({"error": "Country is required"}), 400
        
        blocked_country = BlockedCountry(user_id=g.user.id, country=country, country_code=code, reason=reason)
        db.session.add(blocked_country)
        db.session.commit()
        
        return jsonify({"success": True})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error adding blocked country: {e}")
        return jsonify({"error": "Failed to add blocked country"}), 500

@security_bp.route("/security/blocked-countries/<country>", methods=["DELETE"])
@require_auth
def remove_blocked_country(country):
    """Remove a blocked country"""
    try:
        blocked_country = BlockedCountry.query.filter_by(user_id=g.user.id, country=country).first()
        if blocked_country:
            db.session.delete(blocked_country)
            db.session.commit()
        
        return jsonify({"success": True})
        
    except Exception as e:
        db.session.rollback()
        print(f"Error removing blocked country: {e}")
        return jsonify({"error": "Failed to remove blocked country"}), 500

@security_bp.route("/security/events", methods=["GET"])
@require_auth
def get_security_events():
    """Get security events"""
    try:
        events_query = db.session.query(TrackingEvent.id, TrackingEvent.timestamp, TrackingEvent.ip_address, TrackingEvent.user_agent, Link.campaign_name, Link.short_code).join(Link, TrackingEvent.link_id == Link.id).filter(Link.user_id == g.user.id).order_by(TrackingEvent.timestamp.desc()).limit(50)
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
        return jsonify(events_data)
    except Exception as e:
        print(f"Error fetching security events: {e}")
        return jsonify({"error": "Failed to fetch security events"}), 500

@security_bp.route("/api/notifications", methods=["GET"])
@require_auth
def get_notifications():
    """Get live notifications from recent activities"""
    try:
        notifications = []
        
        # Get recent tracking events for notifications
        events_query = db.session.query(TrackingEvent.id, TrackingEvent.timestamp, TrackingEvent.ip_address, TrackingEvent.user_agent, Link.campaign_name, Link.short_code).join(Link, TrackingEvent.link_id == Link.id).filter(Link.user_id == g.user.id).order_by(TrackingEvent.timestamp.desc()).limit(20)
        
        events = events_query.all()
        
        for event in events:
            message = ""
            event_type = "new_click"
            if "bot" in event.user_agent.lower() or "crawler" in event.user_agent.lower():
                message = f"Bot attempt blocked on tracking link"
                event_type = "bot_blocked"
            elif "curl" in event.user_agent.lower() or "python" in event.user_agent.lower():
                message = f"Suspicious activity detected on campaign \"{event.campaign_name}\""
                event_type = "suspicious_activity"
            else:
                message = f"New click detected on campaign \"{event.campaign_name}\""
            
            # Calculate time ago
            event_time = event.timestamp
            now = datetime.utcnow()
            time_diff = now - event_time
            
            if time_diff.total_seconds() < 60:
                time_ago = f"{int(time_diff.total_seconds())} seconds ago"
            elif time_diff.total_seconds() < 3600:
                time_ago = f"{int(time_diff.total_seconds() // 60)} minutes ago"
            elif time_diff.total_seconds() < 86400:
                time_ago = f"{int(time_diff.total_seconds() // 3600)} hours ago"
            else:
                time_ago = f"{time_diff.days} days ago"
            
            notifications.append({
                "id": event.id,
                "message": message,
                "timestamp": event.timestamp.isoformat(),
                "timeAgo": time_ago,
                "type": event_type
            })
        
        return jsonify({
            "notifications": notifications,
            "count": len(notifications)
        })
        
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return jsonify({"error": "Failed to fetch notifications"}), 500



@security_bp.route("/api/security/threat-analysis", methods=["POST"])
@require_auth
def analyze_threat():
    """Advanced threat analysis endpoint"""
    try:
        request_data = request.get_json()
        
        # Enhance request data with additional context
        enhanced_data = {
            **request_data,
            'timestamp': datetime.now().timestamp(),
            'headers': dict(request.headers),
            'remote_addr': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', ''),
        }
        
        # Perform advanced threat analysis
        analysis_result = threat_intel.analyze_threat_level(enhanced_data)
        
        # Log the analysis result
        print(f"Threat Analysis Result: {analysis_result}")
        
        return jsonify({
            'success': True,
            'analysis': analysis_result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error in threat analysis: {e}")
        return jsonify({'error': str(e)}), 500

@security_bp.route("/api/security/honeypot-config", methods=["GET"])
@require_auth
def get_honeypot_config():
    """Get honeypot trap configuration"""
    try:
        honeypot_config = threat_intel.generate_honeypot_traps()
        
        return jsonify({
            'success': True,
            'honeypot_config': honeypot_config
        })
        
    except Exception as e:
        print(f"Error getting honeypot config: {e}")
        return jsonify({'error': str(e)}), 500

@security_bp.route("/api/security/fingerprint-analysis", methods=["POST"])
@require_auth
def analyze_fingerprint():
    """Analyze browser fingerprint entropy and uniqueness"""
    try:
        fingerprint_data = request.get_json()
        
        # Calculate fingerprint entropy
        entropy = threat_intel.analyze_fingerprint_entropy(fingerprint_data)
        
        # Determine if fingerprint is suspicious
        is_suspicious = entropy < 3.0  # Low entropy indicates bot-like behavior
        
        return jsonify({
            'success': True,
            'entropy': entropy,
            'is_suspicious': is_suspicious,
            'risk_level': 'high' if is_suspicious else 'low'
        })
        
    except Exception as e:
        print(f"Error in fingerprint analysis: {e}")
        return jsonify({'error': str(e)}), 500

@security_bp.route("/api/security/advanced-events", methods=["GET"])
@require_auth
def get_advanced_security_events():
    """Get advanced security events with threat intelligence"""
    try:
        # Get recent tracking events
        recent_events = TrackingEvent.query.filter(
            TrackingEvent.timestamp >= datetime.now() - timedelta(days=7)
        ).order_by(TrackingEvent.timestamp.desc()).limit(100).all()
        
        enhanced_events = []
        for event in recent_events:
            # Prepare data for threat analysis
            event_data = {
                'ip_address': event.ip_address,
                'user_agent': event.user_agent,
                'country': event.country,
                'device_type': event.device_type,
                'browser': event.browser,
                'isp': event.isp,
                'organization': event.organization,
                'timestamp': event.timestamp.timestamp() if event.timestamp else 0,
                'session_duration': event.session_duration or 0,
                'is_bot': event.is_bot
            }
            
            # Perform threat analysis
            threat_analysis = threat_intel.analyze_threat_level(event_data)
            
            # Combine event data with threat analysis
            enhanced_event = {
                'id': event.id,
                'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                'ip_address': event.ip_address,
                'country': event.country,
                'city': event.city,
                'device_type': event.device_type,
                'browser': event.browser,
                'threat_score': threat_analysis['total_threat_score'],
                'risk_level': threat_analysis['risk_level'],
                'recommended_action': threat_analysis['recommended_action'],
                'threat_indicators': threat_analysis['threat_indicators'],
                'is_bot': event.is_bot
            }
            
            enhanced_events.append(enhanced_event)
        
        return jsonify({
            'success': True,
            'events': enhanced_events,
            'total_events': len(enhanced_events)
        })
        
    except Exception as e:
        print(f"Error getting advanced security events: {e}")
        return jsonify({'error': str(e)}), 500

@security_bp.route("/api/security/threat-dashboard", methods=["GET"])
@require_auth
def get_threat_dashboard():
    """Get comprehensive threat intelligence dashboard data"""
    try:
        # Get recent events for analysis
        recent_events = TrackingEvent.query.filter(
            TrackingEvent.timestamp >= datetime.now() - timedelta(days=1)
        ).all()
        
        # Analyze threat patterns
        threat_stats = {
            'total_requests': len(recent_events),
            'blocked_requests': 0,
            'high_risk_requests': 0,
            'bot_requests': sum(1 for e in recent_events if e.is_bot),
            'unique_ips': len(set(e.ip_address for e in recent_events if e.ip_address)),
            'top_threat_countries': [],
            'threat_score_distribution': {'low': 0, 'medium': 0, 'high': 0, 'critical': 0},
            'hourly_threat_pattern': [0] * 24
        }
        
        country_threats = {}
        
        for event in recent_events:
            # Analyze each event
            event_data = {
                'ip_address': event.ip_address,
                'user_agent': event.user_agent,
                'country': event.country,
                'device_type': event.device_type,
                'browser': event.browser,
                'timestamp': event.timestamp.timestamp() if event.timestamp else 0
            }
            
            threat_analysis = threat_intel.analyze_threat_level(event_data)
            risk_level = threat_analysis['risk_level']
            
            # Update statistics
            if threat_analysis['recommended_action'] == 'block':
                threat_stats['blocked_requests'] += 1
            
            if risk_level in ['high', 'critical']:
                threat_stats['high_risk_requests'] += 1
            
            if risk_level in threat_stats['threat_score_distribution']:
                threat_stats['threat_score_distribution'][risk_level] += 1
            
            # Track country threats
            if event.country:
                if event.country not in country_threats:
                    country_threats[event.country] = {'count': 0, 'avg_threat_score': 0}
                country_threats[event.country]['count'] += 1
                country_threats[event.country]['avg_threat_score'] += threat_analysis['total_threat_score']
            
            # Hourly pattern
            if event.timestamp:
                hour = event.timestamp.hour
                threat_stats['hourly_threat_pattern'][hour] += 1
        
        # Calculate average threat scores for countries
        for country_data in country_threats.values():
            if country_data['count'] > 0:
                country_data['avg_threat_score'] /= country_data['count']
        
        # Get top threat countries
        threat_stats['top_threat_countries'] = sorted(
            [{'country': k, **v} for k, v in country_threats.items()],
            key=lambda x: x['avg_threat_score'],
            reverse=True
        )[:10]
        
        return jsonify({
            'success': True,
            'threat_stats': threat_stats,
            'last_updated': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error getting threat dashboard: {e}")
        return jsonify({'error': str(e)}), 500

@security_bp.route("/api/security/logs", methods=["GET"])
@require_auth
def get_security_logs():
    """Get security logs for the authenticated user"""
    try:
        user_id = session.get("user_id")
        period = request.args.get("period", "7")
        days = int(period)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get user's links
        from src.models.link import Link
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
        
        # Calculate metrics
        total_threats = len([e for e in events if e.is_bot or e.status == "blocked"])
        blocked_ips_list = list(set([e.ip_address for e in events if e.status == "blocked"]))
        blocked_ips = len(blocked_ips_list)
        suspicious_activity = len([e for e in events if e.is_bot])
        secure_connections = len([e for e in events if e.status == "active"])
        
        # Recent events
        recent_events = []
        for event in sorted(events, key=lambda x: x.timestamp, reverse=True)[:20]:
            severity = "high" if event.status == "blocked" else "medium" if event.is_bot else "low"
            recent_events.append({
                "type": "Bot Detected" if event.is_bot else "Blocked Access" if event.status == "blocked" else "Normal Access",
                "ip": event.ip_address or "Unknown",
                "timestamp": event.timestamp.strftime("%Y-%m-%d %H:%M") if event.timestamp else "Unknown",
                "status": event.status or "active",
                "severity": severity
            })
        
        # Threat types
        threat_types = {
            "Bot Traffic": len([e for e in events if e.is_bot]),
            "Blocked IPs": blocked_ips,
            "Suspicious Patterns": len([e for e in events if e.is_bot and e.status != "blocked"]),
            "Failed Attempts": len([e for e in events if e.status == "blocked"])
        }
        
        total_threat_count = sum(threat_types.values())
        threats_by_type = [
            {
                "type": threat_type,
                "count": count,
                "percentage": round((count / total_threat_count * 100) if total_threat_count > 0 else 0, 1)
            }
            for threat_type, count in threat_types.items()
        ]
        
        # IP logs
        ip_stats = {}
        for event in events:
            ip = event.ip_address or "Unknown"
            if ip not in ip_stats:
                ip_stats[ip] = {
                    "requests": 0,
                    "country": event.country or "Unknown",
                    "blocked": event.status == "blocked"
                }
            ip_stats[ip]["requests"] += 1
        
        ip_logs = [
            {
                "ip": ip,
                "requests": data["requests"],
                "country": data["country"],
                "blocked": data["blocked"]
            }
            for ip, data in sorted(ip_stats.items(), key=lambda x: x[1]["requests"], reverse=True)[:20]
        ]
        
        return jsonify({
            "totalThreats": total_threats,
            "blockedIPs": blocked_ips,
            "suspiciousActivity": suspicious_activity,
            "secureConnections": secure_connections,
            "recentEvents": recent_events,
            "threatsByType": threats_by_type,
            "ipLogs": ip_logs
        })
        
    except Exception as e:
        print(f"Error fetching security logs: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to fetch security logs: {str(e)}"}), 500
