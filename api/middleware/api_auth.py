from functools import wraps
from flask import request, jsonify
from src.models.api_key import APIKey
from src.models.user import User
from datetime import datetime

def require_api_key(f):
    """
    Decorator to require API key authentication
    Usage: @require_api_key
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check for API key in Authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'API key required'}), 401
        
        # Extract API key
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Invalid authorization format. Use: Bearer <api_key>'}), 401
        
        api_key_value = auth_header.split(' ')[1]
        
        # Verify API key
        key_hash = APIKey.hash_key(api_key_value)
        api_key = APIKey.query.filter_by(key_hash=key_hash, is_active=True).first()
        
        if not api_key:
            return jsonify({'error': 'Invalid or inactive API key'}), 401
        
        # Check expiration
        if api_key.expires_at and api_key.expires_at < datetime.utcnow():
            return jsonify({'error': 'API key expired'}), 401
        
        # Update last used timestamp
        api_key.last_used_at = datetime.utcnow()
        from src.database import db
        db.session.commit()
        
        # Get user
        user = User.query.get(api_key.user_id)
        if not user or not user.is_active:
            return jsonify({'error': 'User account inactive'}), 401
        
        # Add user to request context
        request.current_user = user
        request.api_key = api_key
        
        return f(*args, **kwargs)
    
    return decorated_function

def optional_api_key(f):
    """
    Decorator for optional API key authentication
    If API key is provided, it will be validated
    If not provided, request continues without authentication
    Usage: @optional_api_key
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if auth_header and auth_header.startswith('Bearer '):
            api_key_value = auth_header.split(' ')[1]
            key_hash = APIKey.hash_key(api_key_value)
            api_key = APIKey.query.filter_by(key_hash=key_hash, is_active=True).first()
            
            if api_key and (not api_key.expires_at or api_key.expires_at >= datetime.utcnow()):
                # Update last used
                api_key.last_used_at = datetime.utcnow()
                from src.database import db
                db.session.commit()
                
                # Get user
                user = User.query.get(api_key.user_id)
                if user and user.is_active:
                    request.current_user = user
                    request.api_key = api_key
        
        return f(*args, **kwargs)
    
    return decorated_function

def check_api_permissions(required_permissions):
    """
    Decorator to check if API key has required permissions
    Usage: @check_api_permissions(['read:links', 'write:links'])
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'api_key'):
                return jsonify({'error': 'API key required'}), 401
            
            api_key = request.api_key
            
            # If no permissions set, allow all
            if not api_key.permissions:
                return f(*args, **kwargs)
            
            import json
            try:
                key_permissions = json.loads(api_key.permissions)
            except:
                key_permissions = []
            
            # Check if all required permissions are present
            for permission in required_permissions:
                if permission not in key_permissions:
                    return jsonify({
                        'error': f'Missing required permission: {permission}'
                    }), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator