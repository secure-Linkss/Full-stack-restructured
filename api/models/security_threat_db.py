"""
Security Threat Database Model
SQLAlchemy model for security threat tracking
"""

from src.database import db
from datetime import datetime

class SecurityThreat(db.Model):
    __tablename__ = 'security_threats'

    id = db.Column(db.Integer, primary_key=True)
    threat_type = db.Column(db.String(50), nullable=False, index=True)  # bot, proxy, vpn, etc.
    severity = db.Column(db.String(20), nullable=False, default='medium')  # low, medium, high, critical
    ip_address = db.Column(db.String(45), nullable=False, index=True)
    user_agent = db.Column(db.Text, nullable=True)
    request_path = db.Column(db.String(500), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    link_id = db.Column(db.Integer, db.ForeignKey('links.id'), nullable=True)
    description = db.Column(db.Text, nullable=True)
    threat_metadata = db.Column(db.JSON, nullable=True)  # Additional threat data
    action_taken = db.Column(db.String(100), nullable=True)  # blocked, logged, flagged
    blocked = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='active')  # active, resolved, ignored
    resolved_at = db.Column(db.DateTime, nullable=True)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='security_threat_reports')
    link = db.relationship('Link', foreign_keys=[link_id], backref=db.backref('security_threat_reports', overlaps='threats'))
    resolver = db.relationship('User', foreign_keys=[resolved_by])

    def to_dict(self):
        return {
            'id': self.id,
            'threat_type': self.threat_type,
            'severity': self.severity,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'request_path': self.request_path,
            'user_id': self.user_id,
            'link_id': self.link_id,
            'description': self.description,
            'metadata': self.threat_metadata,
            'action_taken': self.action_taken,
            'blocked': self.blocked,
            'status': self.status,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolved_by': self.resolved_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'timestamp': self.created_at.isoformat() if self.created_at else None  # Compatibility
        }

    def __repr__(self):
        return f'<SecurityThreat {self.threat_type} from {self.ip_address}>'


class IPBlocklist(db.Model):
    __tablename__ = 'ip_blocklist'

    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(45), nullable=False, unique=True, index=True)
    ip_range = db.Column(db.String(50), nullable=True)  # CIDR notation for ranges
    reason = db.Column(db.String(255), nullable=False)
    blocked_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=True)
    is_permanent = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Statistics
    blocked_requests = db.Column(db.Integer, default=0)
    last_blocked_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    blocked_by_user = db.relationship('User', backref='ip_blocks_created')

    def to_dict(self):
        return {
            'id': self.id,
            'ip_address': self.ip_address,
            'ip_range': self.ip_range,
            'reason': self.reason,
            'blocked_by': self.blocked_by,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_permanent': self.is_permanent,
            'is_active': self.is_active,
            'blocked_requests': self.blocked_requests,
            'last_blocked_at': self.last_blocked_at.isoformat() if self.last_blocked_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<IPBlocklist {self.ip_address}>'