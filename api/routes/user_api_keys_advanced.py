"""
Advanced User API Key Management Routes
Full CRUD operations for user API key generation and management
"""

from flask import Blueprint, request, jsonify
from functools import wraps
from api.database import db
from api.models.user import User
from api.models.api_key import APIKey
from api.models.audit_log import AuditLog
from datetime import datetime, timedelta
import secrets
import hashlib

user_api_keys_advanced_bp = Blueprint("user_api_keys_advanced", __name__)

def get_current_user():
    """Get current user from token"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
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
            return jsonify({"error": "Authentication required"}), 401
        return f(user, *args, **kwargs)
    return decorated_function

def generate_api_key():
    """Generate a secure API key"""
    return secrets.token_urlsafe(32)

def hash_api_key(api_key):
    """Hash an API key for storage"""
    return hashlib.sha256(api_key.encode()).hexdigest()

# User API Key Routes

@user_api_keys_advanced_bp.route("/api/user/api-keys", methods=["GET"])
@login_required
def get_user_api_keys(current_user):
    """Get all API keys for the current user"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        api_keys = APIKey.query.filter_by(user_id=current_user.id).order_by(
            APIKey.created_at.desc()
        ).paginate(page=page, per_page=per_page)
        
        return jsonify({
            "api_keys": [{
                "id": k.id,
                "name": k.name,
                "key_prefix": k.key_prefix,
                "status": k.status,
                "created_at": k.created_at.isoformat(),
                "last_used": k.last_used.isoformat() if k.last_used else None,
                "expires_at": k.expires_at.isoformat() if k.expires_at else None,
                "permissions": k.permissions.split(',') if k.permissions else []
            } for k in api_keys.items],
            "total": api_keys.total,
            "pages": api_keys.pages,
            "current_page": page
        }), 200
    except Exception as e:
        print(f"Error getting user API keys: {e}")
        return jsonify({"error": "Failed to get API keys"}), 500

@user_api_keys_advanced_bp.route("/api/user/api-keys", methods=["POST"])
@login_required
def create_user_api_key(current_user):
    """Create a new API key for the current user"""
    try:
        data = request.get_json()
        
        if not data.get("name"):
            return jsonify({"error": "API key name is required"}), 400
        
        # Generate new API key
        api_key = generate_api_key()
        key_hash = hash_api_key(api_key)
        key_prefix = api_key[:8]  # Store first 8 characters as prefix
        
        # Determine expiration
        expires_at = None
        if data.get("expires_in_days"):
            expires_at = datetime.utcnow() + timedelta(days=int(data["expires_in_days"]))
        
        # Create API key record
        api_key_record = APIKey(
            user_id=current_user.id,
            name=data.get("name"),
            key_hash=key_hash,
            key_prefix=key_prefix,
            status="active",
            permissions=",".join(data.get("permissions", ["read:links", "read:analytics"])),
            expires_at=expires_at
        )
        
        db.session.add(api_key_record)
        db.session.commit()
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Created API key: {data.get('name')}",
            target_id=api_key_record.id,
            target_type="api_key"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "API key created successfully",
            "api_key": {
                "id": api_key_record.id,
                "name": api_key_record.name,
                "key": api_key,  # Only return the full key once
                "key_prefix": key_prefix,
                "status": api_key_record.status,
                "permissions": api_key_record.permissions.split(','),
                "expires_at": api_key_record.expires_at.isoformat() if api_key_record.expires_at else None,
                "created_at": api_key_record.created_at.isoformat()
            },
            "warning": "Make sure to copy your API key now. You won't be able to see it again!"
        }), 201
    except Exception as e:
        print(f"Error creating API key: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to create API key"}), 500

@user_api_keys_advanced_bp.route("/api/user/api-keys/<int:key_id>", methods=["GET"])
@login_required
def get_user_api_key_detail(current_user, key_id):
    """Get detailed information about a specific API key"""
    try:
        api_key = APIKey.query.filter_by(id=key_id, user_id=current_user.id).first_or_404()
        
        return jsonify({
            "api_key": {
                "id": api_key.id,
                "name": api_key.name,
                "key_prefix": api_key.key_prefix,
                "status": api_key.status,
                "permissions": api_key.permissions.split(',') if api_key.permissions else [],
                "created_at": api_key.created_at.isoformat(),
                "last_used": api_key.last_used.isoformat() if api_key.last_used else None,
                "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None,
                "usage_count": api_key.usage_count or 0
            }
        }), 200
    except Exception as e:
        print(f"Error getting API key detail: {e}")
        return jsonify({"error": "Failed to get API key details"}), 500

@user_api_keys_advanced_bp.route("/api/user/api-keys/<int:key_id>", methods=["PUT"])
@login_required
def update_user_api_key(current_user, key_id):
    """Update an API key"""
    try:
        api_key = APIKey.query.filter_by(id=key_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        if "name" in data:
            api_key.name = data["name"]
        if "status" in data:
            api_key.status = data["status"]
        if "permissions" in data:
            api_key.permissions = ",".join(data["permissions"])
        
        db.session.commit()
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Updated API key: {api_key.name}",
            target_id=api_key.id,
            target_type="api_key"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "API key updated successfully",
            "api_key": {
                "id": api_key.id,
                "name": api_key.name,
                "status": api_key.status,
                "permissions": api_key.permissions.split(','),
                "updated_at": datetime.utcnow().isoformat()
            }
        }), 200
    except Exception as e:
        print(f"Error updating API key: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to update API key"}), 500

@user_api_keys_advanced_bp.route("/api/user/api-keys/<int:key_id>/revoke", methods=["POST"])
@login_required
def revoke_user_api_key(current_user, key_id):
    """Revoke an API key"""
    try:
        api_key = APIKey.query.filter_by(id=key_id, user_id=current_user.id).first_or_404()
        api_key.status = "revoked"
        api_key.revoked_at = datetime.utcnow()
        db.session.commit()
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Revoked API key: {api_key.name}",
            target_id=api_key.id,
            target_type="api_key"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "API key revoked successfully"
        }), 200
    except Exception as e:
        print(f"Error revoking API key: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to revoke API key"}), 500

@user_api_keys_advanced_bp.route("/api/user/api-keys/<int:key_id>", methods=["DELETE"])
@login_required
def delete_user_api_key(current_user, key_id):
    """Delete an API key"""
    try:
        api_key = APIKey.query.filter_by(id=key_id, user_id=current_user.id).first_or_404()
        
        db.session.delete(api_key)
        db.session.commit()
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Deleted API key: {api_key.name}",
            target_id=key_id,
            target_type="api_key"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "API key deleted successfully"
        }), 200
    except Exception as e:
        print(f"Error deleting API key: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to delete API key"}), 500

@user_api_keys_advanced_bp.route("/api/user/api-keys/usage-stats", methods=["GET"])
@login_required
def get_api_key_usage_stats(current_user):
    """Get usage statistics for all API keys"""
    try:
        api_keys = APIKey.query.filter_by(user_id=current_user.id).all()
        
        total_usage = sum(k.usage_count or 0 for k in api_keys)
        active_keys = len([k for k in api_keys if k.status == "active"])
        
        return jsonify({
            "stats": {
                "total_keys": len(api_keys),
                "active_keys": active_keys,
                "total_usage": total_usage,
                "keys": [{
                    "name": k.name,
                    "usage_count": k.usage_count or 0,
                    "last_used": k.last_used.isoformat() if k.last_used else None
                } for k in api_keys]
            }
        }), 200
    except Exception as e:
        print(f"Error getting API key usage stats: {e}")
        return jsonify({"error": "Failed to get usage statistics"}), 500
