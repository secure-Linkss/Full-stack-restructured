"""
User Settings API — Telegram/notification preferences
Routes: /api/settings (GET/PUT)
"""

from flask import Blueprint, request, jsonify, g
from api.database import db
from api.middleware.auth_decorators import login_required

settings_bp = Blueprint('settings', __name__)


@settings_bp.route('/api/settings', methods=['GET'])
@login_required
def get_user_settings():
    """Return current user's notification/integration settings."""
    u = g.user
    try:
        settings = {
            'telegram_enabled': bool(getattr(u, 'telegram_enabled', False)),
            'telegram_bot_token': getattr(u, 'telegram_bot_token', '') or '',
            'telegram_chat_id': getattr(u, 'telegram_chat_id', '') or '',
            'notification_types': {
                'campaign_alerts': True,
                'link_clicks': False,
                'security_threats': True,
                'bot_detections': True,
                'captured_data': True,
            },
            'notification_frequency': 'realtime',
        }
        return jsonify(settings), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@settings_bp.route('/api/settings', methods=['PUT', 'PATCH'])
@login_required
def update_user_settings():
    """Update current user's notification/integration settings."""
    u = g.user
    try:
        data = request.get_json() or {}

        if 'telegram_enabled' in data:
            u.telegram_enabled = bool(data['telegram_enabled'])
        if 'telegram_bot_token' in data and hasattr(u, 'telegram_bot_token'):
            u.telegram_bot_token = data['telegram_bot_token']
        if 'telegram_chat_id' in data:
            u.telegram_chat_id = data['telegram_chat_id']

        db.session.commit()
        return jsonify({'success': True, 'message': 'Settings updated.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
