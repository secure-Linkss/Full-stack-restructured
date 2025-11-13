"""
Profile Management Routes
Complete implementation for user profile, avatar, password reset, and subscription management
"""

from flask import Blueprint, request, jsonify
from api.database import db
from api.models.user import User
from werkzeug.security import generate_password_hash
from functools import wraps
import jwt
import os
from datetime import datetime, timedelta
import secrets

profile_bp = Blueprint('profile', __name__)

# JWT secret key
SECRET_KEY = os.environ.get('SECRET_KEY', 'ej5B3Amppi4gjpbC65te6rJuvJzgVCWW_xfB-ZLR1TE')

def token_required(f):
    """Decorator to require authentication token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'message': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

@profile_bp.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get current user profile"""
    try:
        # Calculate subscription days remaining
        days_remaining = None
        if current_user.subscription_end_date:
            delta = current_user.subscription_end_date - datetime.utcnow()
            days_remaining = max(0, delta.days)
        
        profile_data = {
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'role': current_user.role,
            'status': current_user.status,
            'avatar': current_user.avatar,
            'profile_picture': current_user.profile_picture,
            'subscription_plan': current_user.subscription_plan or 'free',
            'subscription_status': current_user.subscription_status or 'active',
            'subscription_end_date': current_user.subscription_end_date.isoformat() if current_user.subscription_end_date else None,
            'subscription_days_remaining': days_remaining,
            'created_at': current_user.created_at.isoformat() if current_user.created_at else None,
            'last_login': current_user.last_login.isoformat() if current_user.last_login else None
        }
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@profile_bp.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update user profile"""
    try:
        data = request.get_json()
        
        # Update allowed fields
        if 'email' in data and data['email']:
            # Check if email is already taken by another user
            existing = User.query.filter(User.email == data['email'], User.id != current_user.id).first()
            if existing:
                return jsonify({'error': 'Email already in use'}), 400
            current_user.email = data['email']
        
        if 'username' in data and data['username']:
            # Check if username is already taken
            existing = User.query.filter(User.username == data['username'], User.id != current_user.id).first()
            if existing:
                return jsonify({'error': 'Username already in use'}), 400
            current_user.username = data['username']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': current_user.id,
                'username': current_user.username,
                'email': current_user.email
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@profile_bp.route('/api/profile/avatar', methods=['POST'])
@token_required
def update_avatar(current_user):
    """Update user avatar"""
    try:
        data = request.get_json()
        
        if 'avatar_url' not in data:
            return jsonify({'error': 'Avatar URL is required'}), 400
        
        current_user.avatar = data['avatar_url']
        current_user.profile_picture = data['avatar_url']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Avatar updated successfully',
            'avatar': current_user.avatar
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@profile_bp.route('/api/profile/password', methods=['POST'])
@token_required
def change_password(current_user):
    """Change user password"""
    try:
        data = request.get_json()
        
        if 'current_password' not in data or 'new_password' not in data:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        # Verify current password
        if not current_user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Validate new password
        new_password = data['new_password']
        if len(new_password) < 8:
            return jsonify({'error': 'New password must be at least 8 characters'}), 400
        
        # Update password
        current_user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@profile_bp.route('/api/profile/password-reset-request', methods=['POST'])
def request_password_reset():
    """Request password reset token"""
    try:
        data = request.get_json()
        
        if 'email' not in data:
            return jsonify({'error': 'Email is required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            # Return success even if user not found (security best practice)
            return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
        
        db.session.commit()
        
        # In production, send email with reset link
        # For now, return token (remove this in production)
        return jsonify({
            'message': 'Password reset token generated',
            'reset_token': reset_token  # Remove this in production
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@profile_bp.route('/api/profile/password-reset', methods=['POST'])
def reset_password():
    """Reset password using token"""
    try:
        data = request.get_json()
        
        if 'token' not in data or 'new_password' not in data:
            return jsonify({'error': 'Token and new password are required'}), 400
        
        user = User.query.filter_by(reset_token=data['token']).first()
        
        if not user:
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        
        # Check token expiry
        if user.reset_token_expiry < datetime.utcnow():
            return jsonify({'error': 'Reset token has expired'}), 400
        
        # Validate new password
        new_password = data['new_password']
        if len(new_password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400
        
        # Update password and clear reset token
        user.set_password(new_password)
        user.reset_token = None
        user.reset_token_expiry = None
        
        db.session.commit()
        
        return jsonify({'message': 'Password reset successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@profile_bp.route('/api/profile/subscription', methods=['GET'])
@token_required
def get_subscription_info(current_user):
    """Get detailed subscription information"""
    try:
        days_remaining = None
        is_expired = False
        
        if current_user.subscription_end_date:
            delta = current_user.subscription_end_date - datetime.utcnow()
            days_remaining = delta.days
            is_expired = days_remaining < 0
            days_remaining = max(0, days_remaining)
        
        subscription_info = {
            'plan': current_user.subscription_plan or 'free',
            'status': current_user.subscription_status or 'active',
            'end_date': current_user.subscription_end_date.isoformat() if current_user.subscription_end_date else None,
            'days_remaining': days_remaining,
            'is_expired': is_expired,
            'features': get_plan_features(current_user.subscription_plan or 'free')
        }
        
        return jsonify(subscription_info), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_plan_features(plan):
    """Get features for a subscription plan"""
    plans = {
        'free': {
            'max_links': 10,
            'max_campaigns': 2,
            'analytics_retention_days': 30,
            'custom_domains': False,
            'api_access': False
        },
        'pro': {
            'max_links': 100,
            'max_campaigns': 20,
            'analytics_retention_days': 365,
            'custom_domains': True,
            'api_access': True
        },
        'enterprise': {
            'max_links': -1,  # Unlimited
            'max_campaigns': -1,  # Unlimited
            'analytics_retention_days': -1,  # Unlimited
            'custom_domains': True,
            'api_access': True
        }
    }
    
    return plans.get(plan, plans['free'])
