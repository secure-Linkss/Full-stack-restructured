from flask import Blueprint, request, jsonify, session
from functools import wraps
from api.database import db
from api.models.user import User
from api.models.audit_log import AuditLog
from api.models.domain import Domain

admin_settings_bp = Blueprint('admin_settings', __name__)

def login_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return f(user, *args, **kwargs)
    return decorated_function

def log_admin_action(actor_id, action, target_id=None, target_type=None):
    """Log admin actions to audit_logs"""
    audit_log = AuditLog(
        actor_id=actor_id,
        action=action,
        target_id=target_id,
        target_type=target_type
    )
    db.session.add(audit_log)
    db.session.commit()

@admin_settings_bp.route('/password', methods=['PATCH'])
@login_required
def change_password(current_user):
    """Change user's password"""
    data = request.get_json()
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')
    
    if not all([current_password, new_password, confirm_password]):
        return jsonify({'error': 'All password fields are required'}), 400
    
    # Verify current password
    if not current_user.check_password(current_password):
        return jsonify({'error': 'Current password is incorrect'}), 400
    
    # Validate new password
    if new_password != confirm_password:
        return jsonify({'error': 'New passwords do not match'}), 400
    
    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
    
    # Update password
    current_user.set_password(new_password)
    db.session.commit()
    
    # Log action
    log_admin_action(current_user.id, f"Changed password", current_user.id, 'user')
    
    return jsonify({'message': 'Password changed successfully'})

@admin_settings_bp.route('/profile', methods=['PATCH'])
@login_required
def update_profile(current_user):
    """Update user's profile"""
    data = request.get_json()
    
    # Main Admin username is fixed
    if current_user.role == 'main_admin' and 'username' in data:
        return jsonify({'error': 'Main admin username cannot be changed'}), 403
    
    # Update allowed fields
    if 'email' in data and current_user.role != 'main_admin':
        # Check if email already exists
        existing_user = User.query.filter(User.email == data['email'], User.id != current_user.id).first()
        if existing_user:
            return jsonify({'error': 'Email already exists'}), 400
        current_user.email = data['email']
    
    if 'username' in data and current_user.role != 'main_admin':
        # Check if username already exists
        existing_user = User.query.filter(User.username == data['username'], User.id != current_user.id).first()
        if existing_user:
            return jsonify({'error': 'Username already exists'}), 400
        current_user.username = data['username']
    
    # Update other profile fields
    if 'telegram_bot_token' in data:
        current_user.telegram_bot_token = data['telegram_bot_token']
    if 'telegram_chat_id' in data:
        current_user.telegram_chat_id = data['telegram_chat_id']
    if 'telegram_enabled' in data:
        current_user.telegram_enabled = data['telegram_enabled']
    
    db.session.commit()
    
    # Log action
    log_admin_action(current_user.id, f"Updated profile", current_user.id, 'user')
    
    return jsonify(current_user.to_dict())

@admin_settings_bp.route('/profile', methods=['GET'])
@login_required
def get_profile(current_user):
    """Get user's profile"""
    return jsonify(current_user.to_dict(include_sensitive=True))

# ==================== DOMAIN MANAGEMENT ROUTES ====================

@admin_settings_bp.route('/domains', methods=['GET'])
@login_required
def get_domains(current_user):
    """Get all domains"""
    if not current_user.is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        domains = Domain.query.all()
        return jsonify([domain.to_dict() for domain in domains]), 200
    except Exception as e:
        print(f'Error fetching domains: {e}')
        return jsonify({'error': 'Failed to fetch domains'}), 500

@admin_settings_bp.route('/domains', methods=['POST'])
@login_required
def add_domain(current_user):
    """Add a new domain"""
    if not current_user.is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('domain'):
            return jsonify({'error': 'Domain name is required'}), 400
        
        # Check if domain already exists
        existing = Domain.query.filter_by(domain=data['domain']).first()
        if existing:
            return jsonify({'error': 'Domain already exists'}), 400
        
        # Create new domain
        domain = Domain(
            domain=data['domain'],
            domain_type=data.get('domain_type', 'custom'),
            description=data.get('description', ''),
            is_active=data.get('is_active', True),
            api_key=data.get('api_key', ''),
            api_secret=data.get('api_secret', '')
        )
        
        db.session.add(domain)
        db.session.commit()
        
        # Log action
        log_admin_action(current_user.id, f"Added domain: {domain.domain}", domain.id, 'domain')
        
        return jsonify(domain.to_dict()), 201
    except Exception as e:
        print(f'Error adding domain: {e}')
        db.session.rollback()
        return jsonify({'error': 'Failed to add domain'}), 500

@admin_settings_bp.route('/domains/<int:domain_id>', methods=['PUT'])
@login_required
def update_domain(current_user, domain_id):
    """Update a domain"""
    if not current_user.is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        domain = Domain.query.get(domain_id)
        if not domain:
            return jsonify({'error': 'Domain not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'domain' in data:
            # Check if new domain name already exists
            existing = Domain.query.filter(
                Domain.domain == data['domain'],
                Domain.id != domain_id
            ).first()
            if existing:
                return jsonify({'error': 'Domain already exists'}), 400
            domain.domain = data['domain']
        
        if 'domain_type' in data:
            domain.domain_type = data['domain_type']
        if 'description' in data:
            domain.description = data['description']
        if 'is_active' in data:
            domain.is_active = data['is_active']
        if 'api_key' in data:
            domain.api_key = data['api_key']
        if 'api_secret' in data:
            domain.api_secret = data['api_secret']
        
        db.session.commit()
        
        # Log action
        log_admin_action(current_user.id, f"Updated domain: {domain.domain}", domain.id, 'domain')
        
        return jsonify(domain.to_dict()), 200
    except Exception as e:
        print(f'Error updating domain: {e}')
        db.session.rollback()
        return jsonify({'error': 'Failed to update domain'}), 500

@admin_settings_bp.route('/domains/<int:domain_id>', methods=['DELETE'])
@login_required
def delete_domain(current_user, domain_id):
    """Delete a domain"""
    if not current_user.is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        domain = Domain.query.get(domain_id)
        if not domain:
            return jsonify({'error': 'Domain not found'}), 404
        
        domain_name = domain.domain
        
        # Check if domain has active links
        # TODO: Add check for active links using this domain
        
        db.session.delete(domain)
        db.session.commit()
        
        # Log action
        log_admin_action(current_user.id, f"Deleted domain: {domain_name}", domain_id, 'domain')
        
        return jsonify({'message': 'Domain deleted successfully'}), 200
    except Exception as e:
        print(f'Error deleting domain: {e}')
        db.session.rollback()
        return jsonify({'error': 'Failed to delete domain'}), 500

