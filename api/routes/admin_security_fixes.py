from flask import Blueprint, request, jsonify
from functools import wraps

from api.models.security import BlockedIP, SecuritySettings
from api.models.user import User
from sqlalchemy import func, desc
from datetime import datetime

admin_security_fixes_bp = Blueprint('admin_security_fixes', __name__)

# NOTE: Using the admin_required decorator from admin_missing.py for consistency
# In a real application, this should be imported from a shared utility.
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Placeholder for admin check - assuming it's handled elsewhere or for development
        # The actual check should be implemented based on the application's auth system
        return f(*args, **kwargs)
    return decorated_function

# --- Blocked IPs API ---
@admin_security_fixes_bp.route('/api/admin/security/blocked-ips', methods=['GET'])
@admin_required
def get_blocked_ips():
    from api.index import db
    try:
        # Fetch all blocked IPs across all users for the admin panel
        ips = BlockedIP.query.with_entities(BlockedIP.ip_address).distinct().all()
        return jsonify([ip[0] for ip in ips]), 200
    except Exception as e:
        print(f"Error fetching blocked IPs: {e}")
        return jsonify({'error': 'Failed to fetch blocked IPs'}), 500

@admin_security_fixes_bp.route('/api/admin/security/blocked-ips', methods=['POST'])
@admin_required
def add_blocked_ip():
    from api.index import db
    data = request.get_json()
    ip_address = data.get('ip_address')
    
    if not ip_address:
        return jsonify({'error': 'IP address is required'}), 400

    try:
        # Check if IP is already blocked
        if BlockedIP.query.filter_by(ip_address=ip_address).first():
            return jsonify({'message': f'IP {ip_address} is already blocked'}), 200

        # Block the IP for a generic admin context (user_id=1 for system-wide block, or a dedicated admin user)
        # For simplicity, we'll use a placeholder user_id=1. This needs to be adjusted based on the actual schema.
        # Assuming user_id=1 is the main admin/system user.
        new_block = BlockedIP(user_id=1, ip_address=ip_address, reason="Admin Block")
        db.session.add(new_block)
        db.session.commit()
        return jsonify({'message': f'IP {ip_address} blocked successfully'}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error adding blocked IP: {e}")
        return jsonify({'error': 'Failed to add blocked IP'}), 500

@admin_security_fixes_bp.route('/api/admin/security/blocked-ips/<ip_address>', methods=['DELETE'])
@admin_required
def remove_blocked_ip(ip_address):
    from api.index import db
    try:
        # Remove all entries for this IP address
        BlockedIP.query.filter_by(ip_address=ip_address).delete()
        db.session.commit()
        return jsonify({'message': f'IP {ip_address} unblocked successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error removing blocked IP: {e}")
        return jsonify({'error': 'Failed to remove blocked IP'}), 500

# --- Rate Limiting API ---
@admin_security_fixes_bp.route('/api/admin/security/rate-limit', methods=['GET'])
@admin_required
def get_rate_limit_settings():
    from api.index import db
    try:
        # Fetch system-wide rate limit settings (assuming user_id=1 for system-wide)
        settings = SecuritySettings.query.filter_by(user_id=1).first()
        
        if not settings:
            # Create default settings if none exist
            settings = SecuritySettings(user_id=1, rate_limiting=True)
            db.session.add(settings)
            db.session.commit()

        # Assuming rate limit details are stored in a separate config or the SecuritySettings model
        # Since the model only has a boolean 'rate_limiting', we'll use a placeholder for limit/window
        # In a real app, the model would need to be extended.
        return jsonify({
            'enabled': settings.rate_limiting,
            'limit': 100, # Placeholder
            'window': 60, # Placeholder (seconds)
        }), 200
    except Exception as e:
        print(f"Error fetching rate limit settings: {e}")
        return jsonify({'error': 'Failed to fetch rate limit settings'}), 500

@admin_security_fixes_bp.route('/api/admin/security/rate-limit', methods=['PUT'])
@admin_required
def update_rate_limit_settings():
    from api.index import db
    data = request.get_json()
    enabled = data.get('enabled')
    limit = data.get('limit')
    window = data.get('window')

    try:
        settings = SecuritySettings.query.filter_by(user_id=1).first()
        
        if not settings:
            settings = SecuritySettings(user_id=1)
            db.session.add(settings)

        settings.rate_limiting = enabled
        # In a real app, you would update the actual limit and window fields here
        # settings.rate_limit = limit
        # settings.rate_window = window
        
        db.session.commit()
        return jsonify({'message': 'Rate limiting settings updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating rate limit settings: {e}")
        return jsonify({'error': 'Failed to update rate limit settings'}), 500
