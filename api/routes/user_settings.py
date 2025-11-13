'''
User Settings Complete API - Extended user configuration
'''

from flask import Blueprint, request, jsonify
from functools import wraps
from api.database import db
from api.models.user import User
import json

user_settings_bp = Blueprint('user_settings', __name__)

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

@user_settings_bp.route('/complete', methods=['GET'])
@login_required
def get_complete_settings(current_user):
    """Get all user settings"""
    try:
        settings = {
            'user_id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'role': current_user.role,
            'plan_type': current_user.plan_type,
            'telegram_chat_id': current_user.telegram_chat_id or '',
            'telegram_enabled': current_user.telegram_enabled,
            'two_factor_enabled': current_user.two_factor_enabled,
            'phone': current_user.phone or '',
            'country': current_user.country or ''
        }
        
        return jsonify(settings), 200
    except Exception as e:
        print(f'Error fetching complete settings: {e}')
        return jsonify({'error': 'Failed to fetch settings'}), 500

@user_settings_bp.route('/complete', methods=['POST'])
@login_required
def update_complete_settings(current_user):
    """Update all user settings"""
    try:
        data = request.get_json()
        
        # Update allowed fields
        if 'phone' in data:
            current_user.phone = data['phone']
        
        if 'country' in data:
            current_user.country = data['country']
        
        if 'telegram_chat_id' in data:
            current_user.telegram_chat_id = data['telegram_chat_id']
        
        if 'telegram_enabled' in data:
            current_user.telegram_enabled = data['telegram_enabled']
        
        db.session.commit()
        
        return jsonify({'message': 'Settings updated successfully'}), 200
    except Exception as e:
        print(f'Error updating complete settings: {e}')
        db.session.rollback()
        return jsonify({'error': 'Failed to update settings'}), 500
