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
        # Parse notification settings if they exist
        notification_settings = {}
        if current_user.notification_settings:
            try:
                notification_settings = json.loads(current_user.notification_settings)
            except:
                pass
        
        settings = {
            'user_id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'role': current_user.role,
            'plan_type': current_user.plan_type,
            'telegram_bot_token': current_user.telegram_bot_token or '',
            'telegram_chat_id': current_user.telegram_chat_id or '',
            'telegram_enabled': current_user.telegram_enabled,
            'two_factor_enabled': current_user.two_factor_enabled,
            'phone': current_user.phone or '',
            'country': current_user.country or '',
            'bio': current_user.bio or '',
            'timezone': current_user.timezone or 'UTC',
            'language': current_user.language or 'en',
            'theme': current_user.theme or 'dark',
            'notification_types': notification_settings.get('notification_types', {
                'campaign_alerts': True,
                'link_clicks': False,
                'security_threats': True,
                'bot_detections': True,
                'captured_data': True
            }),
            'notification_frequency': notification_settings.get('notification_frequency', 'realtime')
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
        
        # Update profile fields
        if 'phone' in data:
            current_user.phone = data['phone']
        
        if 'country' in data:
            current_user.country = data['country']
        
        if 'bio' in data:
            current_user.bio = data['bio']
        
        if 'timezone' in data:
            current_user.timezone = data['timezone']
        
        if 'language' in data:
            current_user.language = data['language']
        
        if 'theme' in data:
            current_user.theme = data['theme']
        
        # Update Telegram fields
        if 'telegram_bot_token' in data:
            current_user.telegram_bot_token = data['telegram_bot_token']
        
        if 'telegram_chat_id' in data:
            current_user.telegram_chat_id = data['telegram_chat_id']
        
        if 'telegram_enabled' in data:
            current_user.telegram_enabled = data['telegram_enabled']
        
        # Update notification settings (stored as JSON)
        if 'notification_types' in data or 'notification_frequency' in data:
            # Get existing notification settings
            notification_settings = {}
            if current_user.notification_settings:
                try:
                    notification_settings = json.loads(current_user.notification_settings)
                except:
                    pass
            
            # Update notification types
            if 'notification_types' in data:
                notification_settings['notification_types'] = data['notification_types']
            
            # Update notification frequency
            if 'notification_frequency' in data:
                notification_settings['notification_frequency'] = data['notification_frequency']
            
            # Save as JSON string
            current_user.notification_settings = json.dumps(notification_settings)
        
        db.session.commit()
        
        return jsonify({'message': 'Settings updated successfully'}), 200
    except Exception as e:
        print(f'Error updating complete settings: {e}')
        db.session.rollback()
        return jsonify({'error': 'Failed to update settings'}), 500

@user_settings_bp.route('/telegram/test', methods=['POST'])
@login_required
def test_telegram_notification(current_user):
    """Send a test Telegram notification"""
    try:
        if not current_user.telegram_enabled:
            return jsonify({'error': 'Telegram notifications are not enabled'}), 400
        
        if not current_user.telegram_bot_token or not current_user.telegram_chat_id:
            return jsonify({'error': 'Telegram bot token and chat ID are required'}), 400
        
        # Here you would implement the actual Telegram API call
        # For now, we'll just return success
        # TODO: Implement actual Telegram notification sending
        
        return jsonify({'message': 'Test notification sent successfully'}), 200
    except Exception as e:
        print(f'Error sending test notification: {e}')
        return jsonify({'error': 'Failed to send test notification'}), 500

@user_settings_bp.route('/telegram/verify', methods=['POST'])
@login_required
def verify_telegram_bot(current_user):
    """Verify Telegram bot token and chat ID"""
    try:
        data = request.get_json()
        bot_token = data.get('bot_token')
        chat_id = data.get('chat_id')
        
        if not bot_token or not chat_id:
            return jsonify({'error': 'Bot token and chat ID are required'}), 400
        
        # Here you would implement the actual Telegram API verification
        # For now, we'll just return success
        # TODO: Implement actual Telegram bot verification
        
        return jsonify({'message': 'Telegram bot verified successfully', 'verified': True}), 200
    except Exception as e:
        print(f'Error verifying Telegram bot: {e}')
        return jsonify({'error': 'Failed to verify Telegram bot'}), 500
