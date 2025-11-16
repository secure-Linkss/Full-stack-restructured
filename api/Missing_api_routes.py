"""
Other Missing API Routes
Additional endpoints called by frontend components
"""
from flask import Blueprint, request, jsonify, session
from functools import wraps
from api.database import db
from api.models.user import User

missing_routes_bp = Blueprint('missing_api_routes', __name__)

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

@missing_routes_bp.route('/api/analytics/live-activity', methods=['GET'])
@login_required
def get_live_activity(current_user):
    """Get live activity data"""
    try:
        # Would get real-time activity
        # For now, return placeholder
        return jsonify({
            'online_visitors': 0,
            'recent_clicks': []
        })
    except Exception as e:
        print(f"Error fetching live activity: {e}")
        return jsonify({'error': str(e)}), 500

@missing_routes_bp.route('/api/tickets', methods=['GET'])
@login_required
def get_tickets(current_user):
    """Get support tickets"""
    try:
        # Would get support tickets
        # For now, return empty list
        return jsonify([])
    except Exception as e:
        print(f"Error fetching tickets: {e}")
        return jsonify({'error': str(e)}), 500

@missing_routes_bp.route('/api/api-keys', methods=['GET'])
@login_required
def get_api_keys_list(current_user):
    """Get API keys (alternative endpoint)"""
    try:
        from api.models.api_key import APIKey
        api_keys = APIKey.query.filter_by(user_id=current_user.id).all()
        
        return jsonify([{
            'id': key.id,
            'name': key.name,
            'key_prefix': key.key_prefix,
            'created_at': key.created_at.isoformat() if key.created_at else None
        } for key in api_keys])
    except Exception as e:
        print(f"Error fetching API keys: {e}")
        return jsonify({'error': str(e)}), 500
