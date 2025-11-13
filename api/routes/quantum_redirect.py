"""
QUANTUM REDIRECT ROUTES
Super advanced 4-stage redirect system with cryptographic verification
"""

from flask import Blueprint, request, jsonify, redirect, g
from api.services.quantum_redirect import quantum_redirect
from api.models.link import Link
from api.models.tracking_event import TrackingEvent
from api.database import db
from api.models.user import User
from functools import wraps
import time
from datetime import datetime

quantum_bp = Blueprint('quantum', __name__)

def get_client_info():
    """Extract client information from request"""
    return {
        'ip': request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr),
        'user_agent': request.headers.get('User-Agent', ''),
        'referrer': request.headers.get('Referer', ''),
        'accept_language': request.headers.get('Accept-Language', ''),
        'accept_encoding': request.headers.get('Accept-Encoding', '')
    }

# NOTE: /t/ and /p/ routes are handled by track_bp in track.py
# This avoids route conflicts. Only /q/ routes are handled here.

@quantum_bp.route('/q/<string:short_code>')
def stage1_genesis_redirect(short_code):
    """
    Stage 1: Genesis Link - The public-facing URL
    Target: <100ms execution time
    """
    start_time = time.time()
    
    try:
        # Get client information
        client_info = get_client_info()
        
        # CRITICAL: Capture ALL original URL parameters
        original_params = dict(request.args)
        
        # Lookup link in database
        link = Link.query.filter_by(short_code=short_code).first()
        if not link:
            return jsonify({'error': 'Link not found'}), 404
        
        # Check if link is active
        if link.status != 'active':
            return jsonify({'error': 'Link is not active'}), 403
        
        # Process through quantum redirect system with original parameters
        result = quantum_redirect.stage1_genesis_link(
            link_id=str(link.id),
            user_ip=client_info['ip'],
            user_agent=client_info['user_agent'],
            referrer=client_info['referrer'],
            original_params=original_params  # Pass original parameters
        )
        
        if not result['success']:
            return jsonify({
                'error': result['error'],
                'stage': 'genesis_failed'
            }), 400
        
        # Log the genesis event in database
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
            timestamp=datetime.utcnow()
        )
        
        db.session.add(tracking_event)
        db.session.commit()
        
        # Redirect to validation hub
        return redirect(result['redirect_url'], code=302)
        
    except Exception as e:
        return jsonify({
            'error': f'Genesis stage failed: {str(e)}',
            'processing_time_ms': (time.time() - start_time) * 1000
        }), 500

@quantum_bp.route('/validate')
def stage2_validation_hub():
    """
    Stage 2: Validation Hub - Invisible security checkpoint
    Target: <150ms execution time
    """
    start_time = time.time()
    
    try:
        # Get genesis token from query parameters
        genesis_token = request.args.get('token')
        if not genesis_token:
            return jsonify({'error': 'Missing genesis token'}), 400
        
        # Get current client information
        client_info = get_client_info()
        
        # Process through validation hub (lenient_mode=True for development/proxies)
        result = quantum_redirect.stage2_validation_hub(
            genesis_token=genesis_token,
            current_ip=client_info['ip'],
            current_user_agent=client_info['user_agent'],
            lenient_mode=True
        )
        
        if not result['success']:
            # Log security violation
            if 'security_violation' in result:
                # Update tracking event with security violation
                tracking_event = TrackingEvent.query.filter_by(
                    quantum_click_id=result.get('click_id')
                ).first()
                
                if tracking_event:
                    tracking_event.quantum_stage = 'validation_failed'
                    tracking_event.quantum_security_violation = result['security_violation']
                    tracking_event.quantum_processing_time += result['processing_time_ms']
                    db.session.commit()
            
            return jsonify({
                'error': result['error'],
                'stage': 'validation_failed',
                'security_violation': result.get('security_violation')
            }), 403
        
        # Update tracking event with validation success
        tracking_event = TrackingEvent.query.filter_by(
            quantum_click_id=result['click_id']
        ).first()
        
        if tracking_event:
            tracking_event.quantum_stage = 'validation_passed'
            tracking_event.quantum_processing_time += result['processing_time_ms']
            db.session.commit()
        
        # Redirect to routing gateway
        return redirect(result['redirect_url'], code=302)
        
    except Exception as e:
        return jsonify({
            'error': f'Validation stage failed: {str(e)}',
            'processing_time_ms': (time.time() - start_time) * 1000
        }), 500

@quantum_bp.route('/route')
def stage3_routing_gateway():
    """
    Stage 3: Routing Gateway - Final director with tracking parameters
    Target: <100ms execution time
    """
    start_time = time.time()
    
    try:
        # Get transit token from query parameters
        transit_token = request.args.get('transit_token')
        if not transit_token:
            return jsonify({'error': 'Missing transit token'}), 400
        
        # Get additional tracking parameters from request
        tracking_params = {
            'utm_source': request.args.get('utm_source', 'quantum_redirect'),
            'utm_medium': request.args.get('utm_medium', 'verified_link'),
            'utm_campaign': request.args.get('utm_campaign', 'quantum_system')
        }
        
        # Process through routing gateway
        result = quantum_redirect.stage3_routing_gateway(
            transit_token=transit_token,
            tracking_params=tracking_params
        )
        
        if not result['success']:
            # Log routing failure
            if 'security_violation' in result:
                tracking_event = TrackingEvent.query.filter_by(
                    quantum_click_id=result.get('click_id')
                ).first()
                
                if tracking_event:
                    tracking_event.quantum_stage = 'routing_failed'
                    tracking_event.quantum_security_violation = result.get('security_violation')
                    tracking_event.quantum_processing_time += result['processing_time_ms']
                    db.session.commit()
            
            return jsonify({
                'error': result['error'],
                'stage': 'routing_failed'
            }), 403
        
        # Update tracking event with final success
        tracking_event = TrackingEvent.query.filter_by(
            quantum_click_id=result['click_id']
        ).first()
        
        if tracking_event:
            tracking_event.quantum_stage = 'routing_complete'
            tracking_event.quantum_final_url = result['final_url']
            tracking_event.quantum_processing_time += result['processing_time_ms']
            tracking_event.quantum_verified = True
            
            # Mark as successful conversion for analytics
            tracking_event.is_verified_human = True
            tracking_event.quantum_security_score = 100
            
            db.session.commit()
        
        # Final redirect to destination
        return redirect(result['final_url'], code=302)
        
    except Exception as e:
        return jsonify({
            'error': f'Routing stage failed: {str(e)}',
            'processing_time_ms': (time.time() - start_time) * 1000
        }), 500

@quantum_bp.route('/api/quantum/metrics')
def get_quantum_metrics():
    """Get quantum redirect system performance metrics"""
    try:
        metrics = quantum_redirect.get_performance_metrics()
        threat_analysis = quantum_redirect.analyze_security_threats()
        
        # Get database metrics
        total_quantum_events = TrackingEvent.query.filter(
            TrackingEvent.quantum_click_id.isnot(None)
        ).count()
        
        successful_quantum_events = TrackingEvent.query.filter(
            TrackingEvent.quantum_verified == True
        ).count()
        
        security_violations = TrackingEvent.query.filter(
            TrackingEvent.quantum_security_violation.isnot(None)
        ).count()
        
        return jsonify({
            'success': True,
            'quantum_metrics': metrics,
            'threat_analysis': threat_analysis,
            'database_metrics': {
                'total_quantum_events': total_quantum_events,
                'successful_quantum_events': successful_quantum_events,
                'security_violations': security_violations,
                'success_rate': (successful_quantum_events / total_quantum_events * 100) if total_quantum_events > 0 else 0
            },
            'system_status': {
                'operational': True,
                'performance': 'excellent' if metrics.get('success_rate_percentage', 0) > 95 else 'good',
                'security_level': 'maximum',
                'average_processing_time': f"{metrics.get('average_processing_time', 0):.2f}ms"
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get quantum metrics: {str(e)}'
        }), 500

@quantum_bp.route('/api/quantum/security-dashboard')
def get_quantum_security_dashboard():
    """Get comprehensive quantum security dashboard data"""
    try:
        threat_analysis = quantum_redirect.analyze_security_threats()
        
        # Get recent security events from database
        recent_violations = TrackingEvent.query.filter(
            TrackingEvent.quantum_security_violation.isnot(None)
        ).order_by(TrackingEvent.timestamp.desc()).limit(50).all()
        
        violation_details = []
        for event in recent_violations:
            violation_details.append({
                'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                'click_id': event.quantum_click_id,
                'violation_type': event.quantum_security_violation,
                'ip_address': event.ip_address,
                'user_agent': event.user_agent[:100] + '...' if len(event.user_agent) > 100 else event.user_agent,
                'stage': event.quantum_stage
            })
        
        # Get hourly violation patterns
        from sqlalchemy import func, extract
        hourly_violations = db.session.query(
            extract('hour', TrackingEvent.timestamp).label('hour'),
            func.count(TrackingEvent.id).label('count')
        ).filter(
            TrackingEvent.quantum_security_violation.isnot(None)
        ).group_by(extract('hour', TrackingEvent.timestamp)).all()
        
        hourly_pattern = [0] * 24
        for hour, count in hourly_violations:
            if hour is not None:
                hourly_pattern[int(hour)] = count
        
        return jsonify({
            'success': True,
            'threat_analysis': threat_analysis,
            'recent_violations': violation_details,
            'hourly_violation_pattern': hourly_pattern,
            'security_recommendations': threat_analysis.get('recommendations', []),
            'system_security_status': {
                'threat_level': threat_analysis.get('threat_level', 'unknown'),
                'total_violations': threat_analysis.get('total_violations', 0),
                'security_effectiveness': 'high' if threat_analysis.get('threat_level') == 'low' else 'medium'
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get security dashboard: {str(e)}'
        }), 500

@quantum_bp.route('/api/quantum/test-redirect')
def test_quantum_redirect():
    """Test endpoint for quantum redirect system"""
    try:
        # Create a test link for demonstration
        test_link = Link.query.filter_by(short_code='test123').first()
        if not test_link:
            test_link = Link(
                user_id=1,  # Assuming user ID 1 exists
                target_url='https://example.com/test-destination',
                short_code='test123',
                status='active'
            )
            db.session.add(test_link)
            db.session.commit()
        
        # Generate test quantum redirect URL
        quantum_url = f"/q/{test_link.short_code}"
        
        return jsonify({
            'success': True,
            'test_quantum_url': quantum_url,
            'instructions': 'Click the quantum URL to test the 4-stage redirect system',
            'expected_stages': [
                '1. Genesis Link (this URL)',
                '2. Validation Hub (/validate)',
                '3. Routing Gateway (/route)',
                '4. Final Destination (target URL)'
            ],
            'security_features': [
                'Cryptographic JWT verification',
                'IP address validation',
                'User-Agent verification',
                'Replay attack prevention',
                'Multi-stage token validation'
            ]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to create test redirect: {str(e)}'
        }), 500
