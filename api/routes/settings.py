'''
User Settings API - Personal user preferences and configurations
'''

from flask import Blueprint, request, jsonify
from functools import wraps
from src.database import db
from src.models.user import User

settings_bp = Blueprint('settings', __name__)

def get_current_user():
    """Get current user from token"""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        user = User.verify_token(token)
        if user:
            return user
    return None

def login_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        return f(user, *args, **kwargs)
    return decorated_function

@settings_bp.route('/user', methods=['GET'])
@login_required
def get_user_settings(current_user):
    """Get user's personal settings"""
    try:
        settings = {
            'preferred_payment_method': 'card',  # Default
            'telegram_personal_chat_id': current_user.telegram_chat_id or '',
            'telegram_personal_notifications_enabled': current_user.telegram_enabled or False,
            'slack_webhook_url': '',  # Store in user metadata if needed
            'slack_notifications_enabled': False,
            'cdn_enabled': False,
            'cdn_url': '',
            'cdn_provider': 'cloudflare'
        }
        
        return jsonify(settings), 200
    except Exception as e:
        print(f'Error fetching user settings: {e}')
        return jsonify({'error': 'Failed to fetch settings'}), 500

@settings_bp.route('/user', methods=['POST'])
@login_required
def update_user_settings(current_user):
    """Update user's personal settings"""
    try:
        data = request.get_json()
        
        # Update telegram settings
        if 'telegram_personal_chat_id' in data:
            current_user.telegram_chat_id = data['telegram_personal_chat_id']
        
        if 'telegram_personal_notifications_enabled' in data:
            current_user.telegram_enabled = data['telegram_personal_notifications_enabled']
        
        # Note: For slack, cdn, and other settings, you may want to add
        # a user_metadata JSON column to store additional settings
        
        db.session.commit()
        
        return jsonify({'message': 'Settings updated successfully'}), 200
    except Exception as e:
        print(f'Error updating user settings: {e}')
        db.session.rollback()
        return jsonify({'error': 'Failed to update settings'}), 500
