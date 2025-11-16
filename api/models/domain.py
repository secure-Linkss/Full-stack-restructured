"""
Domain Model
Manages custom domains for short link generation
"""

from src.database import db
from datetime import datetime

class Domain(db.Model):
    __tablename__ = 'domains'

    id = db.Column(db.Integer, primary_key=True)
    domain = db.Column(db.String(255), unique=True, nullable=False, index=True)
    domain_type = db.Column(db.String(50), nullable=False, default='custom')  # custom, shortio, vercel
    description = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, default=True, index=True)
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(255), nullable=True)
    
    # API Integration Details
    api_key = db.Column(db.String(500), nullable=True)  # For short.io or other services
    api_secret = db.Column(db.String(500), nullable=True)  # Encrypted
    
    # Domain Statistics
    total_links = db.Column(db.Integer, default=0)
    total_clicks = db.Column(db.Integer, default=0)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    verified_at = db.Column(db.DateTime, nullable=True)
    
    # Owner Information
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Relationship
    creator = db.relationship('User', backref='domains', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id,
            'domain': self.domain,
            'domain_type': self.domain_type,
            'description': self.description,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'total_links': self.total_links,
            'total_clicks': self.total_clicks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None
        }

    def __repr__(self):
        return f'<Domain {self.domain}>'

