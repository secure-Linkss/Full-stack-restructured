from api.database import db
from datetime import datetime
import secrets
import hashlib
import json

class APIKey(db.Model):
    __tablename__ = 'api_keys'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    key_hash = db.Column(db.String(255), nullable=False, unique=True)
    key_prefix = db.Column(db.String(20), nullable=False)  # First 8 chars for display
    last_used_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    permissions = db.Column(db.Text, nullable=True)  # JSON string of permissions
    usage_count = db.Column(db.Integer, default=0)

    @staticmethod
    def generate_key():
        """Generate a new API key"""
        return f"blk_{secrets.token_urlsafe(32)}"

    @staticmethod
    def hash_key(key):
        """Hash an API key for storage"""
        return hashlib.sha256(key.encode()).hexdigest()

    def verify_key(self, key):
        """Verify if provided key matches this record"""
        return self.key_hash == self.hash_key(key)

    @property
    def status(self):
        if not self.is_active:
            return 'revoked'
        if self.expires_at and self.expires_at < datetime.utcnow():
            return 'expired'
        return 'active'

    def get_permissions(self):
        if not self.permissions:
            return []
        try:
            return json.loads(self.permissions)
        except Exception:
            return []

    def set_permissions(self, perms):
        self.permissions = json.dumps(perms)

    def to_dict(self, include_key=False):
        perms = self.get_permissions()
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'key_prefix': self.key_prefix,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'last_used': self.last_used_at.isoformat() if self.last_used_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active,
            'status': self.status,
            'permissions': perms,
            'usage_count': self.usage_count or 0,
        }
        return data


# Alias for backward-compatible imports
ApiKey = APIKey