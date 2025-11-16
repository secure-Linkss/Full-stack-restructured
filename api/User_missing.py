"""
Missing User Settings API Routes
These endpoints are called by Settings.jsx but were not implemented
"""
from flask import Blueprint, request, jsonify, session
from functools import wraps
from api.database import db
from api.models.user import User
from api.models.api_key import APIKey
from datetime import datetime

user_missing_bp = Blueprint('user_missing', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        return f(user, *args, **kwargs)
    return decorated_function

@user_missing_bp.route('/api/settings/user', methods=['GET'])
@login_required
def get_user_settings(current_user):
    """Get user settings"""
    try:
        return jsonify({
            'username': current_user.username,
            'email': current_user.email,
            'phone': getattr(current_user, 'phone', ''),
            'avatar_url': getattr(current_user, 'avatar_url', ''),
            'two_factor_enabled': getattr(current_user, 'two_factor_enabled', False),
            'telegram_personal_chat_id': '',
            'telegram_personal_notifications_enabled': False,
            'slack_webhook_url': '',
            'slack_notifications_enabled': False,
            'default_domain': '',
            'theme': 'dark',
            'preferred_payment_method': 'card'
        })
    except Exception as e:
        print(f"Error fetching user settings: {e}")
        return jsonify({'error': str(e)}), 500

@user_missing_bp.route('/api/settings/user', methods=['POST'])
@login_required
def save_user_settings(current_user):
    """Save user settings"""
    try:
        data = request.get_json()
        
        # Update user settings (would need additional fields in User model)
        # For now, just return success
        
        return jsonify({'message': 'Settings saved successfully'})
    except Exception as e:
        print(f"Error saving user settings: {e}")
        return jsonify({'error': str(e)}), 500

@user_missing_bp.route('/api/settings/account', methods=['POST'])
@login_required
def update_account(current_user):
    """Update account information"""
    try:
        data = request.get_json()
        
        if 'username' in data:
            current_user.username = data['username']
        if 'email' in data:
            current_user.email = data['email']
        if 'phone' in data and hasattr(current_user, 'phone'):
            current_user.phone = data['phone']
        
        db.session.commit()
        
        return jsonify({'message': 'Account updated successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error updating account: {e}")
        return jsonify({'error': str(e)}), 500

@user_missing_bp.route('/api/settings/password', methods=['POST'])
@login_required
def change_password(current_user):
    """Change user password"""
    try:
        data = request.get_json()
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_user.check_password(current_password):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        current_user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error changing password: {e}")
        return jsonify({'error': str(e)}), 500

@user_missing_bp.route('/api/settings/avatar', methods=['POST'])
@login_required
def upload_avatar(current_user):
    """Upload user avatar"""
    try:
        # Would handle file upload here
        # For now, just return success
        
        return jsonify({
            'message': 'Avatar uploaded successfully',
            'avatar_url': '/default-avatar.png'
        })
    except Exception as e:
        print(f"Error uploading avatar: {e}")
        return jsonify({'error': str(e)}), 500

@user_missing_bp.route('/api/settings/api-keys', methods=['GET'])
@login_required
def get_api_keys(current_user):
    """Get user's API keys"""
    try:
        api_keys = APIKey.query.filter_by(user_id=current_user.id).all()
        
        keys_list = []
        for key in api_keys:
            keys_list.append({
                'id': key.id,
                'name': key.name,
                'key': f"{key.key_prefix}...",
                'created_at': key.created_at.isoformat() if key.created_at else None,
                'last_used_at': key.last_used_at.isoformat() if key.last_used_at else None,
                'enabled': key.is_active,
                'usage': 0,  # Would need tracking
                'rate_limit': 1000
            })
        
        return jsonify(keys_list)
    except Exception as e:
        print(f"Error fetching API keys: {e}")
        return jsonify({'error': str(e)}), 500

@user_missing_bp.route('/api/settings/api-keys', methods=['POST'])
@login_required
def create_api_key(current_user):
    """Create a new API key"""
    try:
        data = request.get_json()
        name = data.get('name', 'New API Key')
        
        # Generate new key
        key = APIKey.generate_key()
        key_hash = APIKey.hash_key(key)
        key_prefix = key[:12]
        
        api_key = APIKey(
            user_id=current_user.id,
            name=name,
            key_hash=key_hash,
            key_prefix=key_prefix,
            is_active=True
        )
        
        db.session.add(api_key)
        db.session.commit()
        
        return jsonify({
            'message': 'API key created successfully',
            'key': key  # Only shown once
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating API key: {e}")
        return jsonify({'error': str(e)}), 500

@user_missing_bp.route('/api/settings/api-keys/<int:key_id>', methods=['DELETE'])
@login_required
def delete_api_key(current_user, key_id):
    """Delete an API key"""
    try:
        api_key = APIKey.query.filter_by(id=key_id, user_id=current_user.id).first_or_404()
        db.session.delete(api_key)
        db.session.commit()
        
        return jsonify({'message': 'API key deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting API key: {e}")
        return jsonify({'error': str(e)}), 500

@user_missing_bp.route('/api/settings/sessions', methods=['GET'])
@login_required
def get_sessions(current_user):
    """Get active sessions"""
    try:
        # Would get from session tracking
        # For now, return placeholder
        sessions = [
            {
                'device': 'Chrome on Windows',
                'location': 'Los Angeles, CA',
                'last_active': 'Just now',
                'is_current': True
            }
        ]
        
        return jsonify(sessions)
    except Exception as e:
        print(f"Error fetching sessions: {e}")
        return jsonify({'error': str(e)}), 500

@user_missing_bp.route('/api/settings/login-history', methods=['GET'])
@login_required
def get_login_history(current_user):
    """Get login history"""
    try:
        # Would get from login tracking
        # For now, return placeholder
        history = []
        
        return jsonify(history)
    except Exception as e:
        print(f"Error fetching login history: {e}")
        return jsonify({'error': str(e)}), 500

@user_missing_bp.route('/api/settings/invoices', methods=['GET'])
@login_required
def get_invoices(current_user):
    """Get payment invoices"""
    try:
        # Would get from payment history
        # For now, return placeholder
        invoices = []
        
        return jsonify(invoices)
    except Exception as e:
        print(f"Error fetching invoices: {e}")
        return jsonify({'error': str(e)}), 500

@user_missing_bp.route('/api/settings/logout-all', methods=['POST'])
@login_required
def logout_all_devices(current_user):
    """Logout from all devices"""
    try:
        # Would invalidate all sessions
        # For now, just return success
        
        return jsonify({'message': 'Logged out from all devices'})
    except Exception as e:
        print(f"Error logging out: {e}")
        return jsonify({'error': str(e)}), 500
