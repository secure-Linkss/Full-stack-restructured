"""
Advanced Security Routes
Enterprise-grade security endpoints with AI-powered threat detection
"""

from flask import Blueprint, request, jsonify, session, g
from datetime import datetime, timedelta
from functools import wraps
import json
import time

# Import the advanced security system
from ..services.advanced_security_system import advanced_security, ThreatLevel, SecurityAction

advanced_security_bp = Blueprint('advanced_security', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Set user in g for use in routes
        from ..models.user import User
        g.user = User.query.get(session['user_id'])
        if not g.user:
            return jsonify({'error': 'User not found'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

@advanced_security_bp.route('/api/security/advanced/analyze', methods=['POST'])
@login_required
def analyze_threat():
    """Comprehensive threat analysis endpoint"""
    try:
        request_data = request.get_json()
        
        # Extract request information
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        user_agent = request.headers.get('User-Agent', '')
        
        # Prepare analysis data
        analysis_data = {
            'ip_address': client_ip,
            'user_agent': user_agent,
            'timestamp': datetime.utcnow().isoformat(),
            'url': request_data.get('url', ''),
            'method': request.method,
            'referrer': request.headers.get('Referer', ''),
            'fingerprint': request_data.get('fingerprint', {}),
            'params': request_data.get('params', {}),
            'headers': dict(request.headers),
            'country': request_data.get('country', ''),
            'timezone': request_data.get('timezone', ''),
            'direct_access': request_data.get('direct_access', False)
        }
        
        # Perform comprehensive threat analysis
        threat = advanced_security.analyze_request(analysis_data)
        
        return jsonify({
            'success': True,
            'threat_analysis': threat.to_dict(),
            'processing_time_ms': time.time() * 1000 - float(threat.timestamp.timestamp()) * 1000,
            'recommendations': {
                'action': threat.recommended_action.value,
                'mitigation_steps': threat.mitigation_steps,
                'threat_level': threat.threat_level.value,
                'confidence': threat.confidence_score
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@advanced_security_bp.route('/api/security/advanced/dashboard', methods=['GET'])
@login_required
def security_dashboard():
    """Advanced security dashboard with comprehensive metrics"""
    try:
        # Get comprehensive security dashboard data
        dashboard_data = advanced_security.get_security_dashboard()
        
        return jsonify({
            'success': True,
            'dashboard': dashboard_data,
            'timestamp': datetime.utcnow().isoformat(),
            'system_status': {
                'monitoring_active': advanced_security.is_monitoring,
                'total_profiles': len(advanced_security.security_profiles),
                'active_threats': len(advanced_security.active_threats),
                'blocked_ips': len(advanced_security.blocked_ips),
                'quarantined_ips': len(advanced_security.quarantined_ips),
                'whitelisted_ips': len(advanced_security.whitelisted_ips)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@advanced_security_bp.route('/api/security/advanced/threats', methods=['GET'])
@login_required
def get_threats():
    """Get recent threats with filtering options"""
    try:
        # Get query parameters
        limit = int(request.args.get('limit', 50))
        threat_level = request.args.get('threat_level')
        hours = int(request.args.get('hours', 24))
        
        # Filter threats
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        recent_threats = [
            threat for threat in advanced_security.active_threats
            if threat.timestamp >= cutoff_time
        ]
        
        # Apply threat level filter
        if threat_level:
            try:
                level_filter = ThreatLevel(threat_level)
                recent_threats = [
                    threat for threat in recent_threats
                    if threat.threat_level == level_filter
                ]
            except ValueError:
                pass
        
        # Sort by threat score (highest first) and limit
        recent_threats.sort(key=lambda x: x.confidence_score, reverse=True)
        recent_threats = recent_threats[:limit]
        
        return jsonify({
            'success': True,
            'threats': [threat.to_dict() for threat in recent_threats],
            'total_count': len(recent_threats),
            'filters_applied': {
                'hours': hours,
                'threat_level': threat_level,
                'limit': limit
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@advanced_security_bp.route('/api/security/advanced/ip-reputation/<ip_address>', methods=['GET'])
@login_required
def get_ip_reputation(ip_address):
    """Get detailed reputation information for IP address"""
    try:
        # Check if request is allowed
        is_allowed, reason = advanced_security.is_request_allowed(ip_address)
        
        # Get security profile
        profile = advanced_security.security_profiles.get(ip_address)
        
        # Get recent threats from this IP
        recent_threats = [
            threat for threat in advanced_security.active_threats
            if threat.ip_address == ip_address
            and (datetime.utcnow() - threat.timestamp).total_seconds() <= 86400  # Last 24 hours
        ]
        
        profile_data = None
        if profile:
            profile_data = {
                'ip_address': profile.ip_address,
                'first_seen': profile.first_seen.isoformat(),
                'last_seen': profile.last_seen.isoformat(),
                'total_requests': profile.total_requests,
                'blocked_requests': profile.blocked_requests,
                'threat_score': profile.threat_score,
                'reputation_score': profile.reputation_score,
                'geographic_consistency': profile.geographic_consistency,
                'device_consistency': profile.device_consistency,
                'attack_history': [attack.value for attack in profile.attack_history]
            }
        
        return jsonify({
            'success': True,
            'ip_address': ip_address,
            'is_allowed': is_allowed,
            'reason': reason,
            'reputation': {
                'profile': profile_data,
                'recent_threats': [threat.to_dict() for threat in recent_threats],
                'status': {
                    'is_blocked': ip_address in advanced_security.blocked_ips,
                    'is_quarantined': ip_address in advanced_security.quarantined_ips,
                    'is_whitelisted': ip_address in advanced_security.whitelisted_ips
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@advanced_security_bp.route('/api/security/advanced/whitelist', methods=['POST'])
@login_required
def whitelist_ip():
    """Add IP address to whitelist"""
    try:
        data = request.get_json()
        ip_address = data.get('ip_address')
        reason = data.get('reason', 'Manual whitelist by admin')
        
        if not ip_address:
            return jsonify({
                'success': False,
                'error': 'IP address is required'
            }), 400
        
        # Add to whitelist
        advanced_security.whitelist_ip(ip_address, reason)
        
        return jsonify({
            'success': True,
            'message': f'IP {ip_address} added to whitelist',
            'reason': reason,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@advanced_security_bp.route('/api/security/advanced/blacklist', methods=['POST'])
@login_required
def blacklist_ip():
    """Add IP address to blacklist"""
    try:
        data = request.get_json()
        ip_address = data.get('ip_address')
        reason = data.get('reason', 'Manual blacklist by admin')
        
        if not ip_address:
            return jsonify({
                'success': False,
                'error': 'IP address is required'
            }), 400
        
        # Add to blacklist
        advanced_security.blacklist_ip(ip_address, reason)
        
        return jsonify({
            'success': True,
            'message': f'IP {ip_address} added to blacklist',
            'reason': reason,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@advanced_security_bp.route('/api/security/advanced/unblock', methods=['POST'])
@login_required
def unblock_ip():
    """Remove IP address from blocked/quarantined lists"""
    try:
        data = request.get_json()
        ip_address = data.get('ip_address')
        
        if not ip_address:
            return jsonify({
                'success': False,
                'error': 'IP address is required'
            }), 400
        
        # Remove from blocked and quarantined lists
        advanced_security.blocked_ips.discard(ip_address)
        advanced_security.quarantined_ips.discard(ip_address)
        
        return jsonify({
            'success': True,
            'message': f'IP {ip_address} unblocked',
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@advanced_security_bp.route('/api/security/advanced/honeypots', methods=['GET'])
@login_required
def get_honeypots():
    """Get active honeypot information"""
    try:
        honeypots = []
        
        for ip, honeypot_data in advanced_security.honeypot_manager.active_honeypots.items():
            honeypots.append({
                'target_ip': ip,
                'honeypot_id': honeypot_data['id'],
                'deployed_at': honeypot_data['deployed_at'].isoformat(),
                'interactions': honeypot_data['interactions'],
                'type': honeypot_data['type']
            })
        
        return jsonify({
            'success': True,
            'active_honeypots': honeypots,
            'total_count': len(honeypots),
            'interactions_summary': {
                ip: len(interactions) 
                for ip, interactions in advanced_security.honeypot_manager.honeypot_interactions.items()
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@advanced_security_bp.route('/api/security/advanced/statistics', methods=['GET'])
@login_required
def get_security_statistics():
    """Get comprehensive security statistics"""
    try:
        stats = advanced_security.security_stats.copy()
        
        # Calculate additional metrics
        if stats['response_time_ms']:
            stats['avg_response_time_ms'] = sum(stats['response_time_ms']) / len(stats['response_time_ms'])
            stats['max_response_time_ms'] = max(stats['response_time_ms'])
            stats['min_response_time_ms'] = min(stats['response_time_ms'])
        else:
            stats['avg_response_time_ms'] = 0
            stats['max_response_time_ms'] = 0
            stats['min_response_time_ms'] = 0
        
        # Remove the deque object (not JSON serializable)
        del stats['response_time_ms']
        
        # Add system health metrics
        stats['system_health'] = {
            'monitoring_active': advanced_security.is_monitoring,
            'total_security_profiles': len(advanced_security.security_profiles),
            'active_threats_count': len(advanced_security.active_threats),
            'blocked_ips_count': len(advanced_security.blocked_ips),
            'quarantined_ips_count': len(advanced_security.quarantined_ips),
            'whitelisted_ips_count': len(advanced_security.whitelisted_ips)
        }
        
        # Calculate threat detection rates
        if stats['total_requests'] > 0:
            stats['threat_detection_rate'] = (stats['threats_detected'] / stats['total_requests']) * 100
            stats['threat_block_rate'] = (stats['threats_blocked'] / stats['total_requests']) * 100
        else:
            stats['threat_detection_rate'] = 0
            stats['threat_block_rate'] = 0
        
        return jsonify({
            'success': True,
            'statistics': stats,
            'timestamp': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@advanced_security_bp.route('/api/security/advanced/config', methods=['GET', 'POST'])
@login_required
def security_config():
    """Get or update security configuration"""
    try:
        if request.method == 'GET':
            return jsonify({
                'success': True,
                'config': advanced_security.config,
                'timestamp': datetime.utcnow().isoformat()
            })
        
        elif request.method == 'POST':
            data = request.get_json()
            
            # Update configuration
            for key, value in data.items():
                if key in advanced_security.config:
                    advanced_security.config[key] = value
            
            return jsonify({
                'success': True,
                'message': 'Security configuration updated',
                'updated_config': advanced_security.config,
                'timestamp': datetime.utcnow().isoformat()
            })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@advanced_security_bp.route('/api/security/advanced/test', methods=['POST'])
@login_required
def test_security_system():
    """Test the advanced security system with sample data"""
    try:
        # Generate test threat data
        test_data = {
            'ip_address': '192.168.1.100',
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'url': '/test-security',
            'method': 'POST',
            'fingerprint': {
                'canvas': 'test_canvas_fingerprint',
                'webgl': 'test_webgl_fingerprint',
                'audio': 'test_audio_fingerprint'
            },
            'country': 'US',
            'timezone': 'America/New_York'
        }
        
        # Analyze test request
        threat = advanced_security.analyze_request(test_data)
        
        return jsonify({
            'success': True,
            'test_result': {
                'threat_analysis': threat.to_dict(),
                'system_response': 'Security system functioning correctly',
                'test_timestamp': datetime.utcnow().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@advanced_security_bp.route('/api/security/advanced/export', methods=['GET'])
@login_required
def export_security_data():
    """Export security data for analysis"""
    try:
        export_format = request.args.get('format', 'json')
        hours = int(request.args.get('hours', 24))
        
        # Get recent threats
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        recent_threats = [
            threat.to_dict() for threat in advanced_security.active_threats
            if threat.timestamp >= cutoff_time
        ]
        
        # Get security profiles
        profiles = {}
        for ip, profile in advanced_security.security_profiles.items():
            profiles[ip] = {
                'ip_address': profile.ip_address,
                'first_seen': profile.first_seen.isoformat(),
                'last_seen': profile.last_seen.isoformat(),
                'total_requests': profile.total_requests,
                'blocked_requests': profile.blocked_requests,
                'threat_score': profile.threat_score,
                'reputation_score': profile.reputation_score
            }
        
        export_data = {
            'export_timestamp': datetime.utcnow().isoformat(),
            'export_period_hours': hours,
            'threats': recent_threats,
            'security_profiles': profiles,
            'system_statistics': {
                'total_threats': len(recent_threats),
                'blocked_ips': list(advanced_security.blocked_ips),
                'quarantined_ips': list(advanced_security.quarantined_ips),
                'whitelisted_ips': list(advanced_security.whitelisted_ips)
            }
        }
        
        if export_format == 'json':
            return jsonify({
                'success': True,
                'export_data': export_data
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Only JSON export format is currently supported'
            }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Error handlers
@advanced_security_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404

@advanced_security_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500
