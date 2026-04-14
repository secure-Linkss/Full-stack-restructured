from api.database import db
from datetime import datetime
import uuid
import json
import logging

logger = logging.getLogger(__name__)


class Link(db.Model):
    __tablename__ = 'links'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete='CASCADE'), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey("campaigns.id", ondelete='SET NULL'), nullable=True)

    # Core URL fields
    target_url = db.Column(db.Text, nullable=False)  # original_url alias
    original_url = db.Column(db.Text, nullable=True)  # compat alias
    short_code = db.Column(db.String(50), unique=True, nullable=False)
    short_url = db.Column(db.Text, nullable=True)
    custom_slug = db.Column(db.String(100), nullable=True)
    domain = db.Column(db.String(255), nullable=True)  # associated custom domain

    # Metadata
    title = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    campaign_name = db.Column(db.String(255), default="Untitled Campaign")
    tags = db.Column(db.Text, nullable=True)  # JSON array
    status = db.Column(db.String(50), default="active")  # active, paused, expired, archived
    # Channel Adaptive Mode™ — email | linkedin | sms | general
    channel_type = db.Column(db.String(20), default='general', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Click tracking
    total_clicks = db.Column(db.Integer, default=0)
    click_count = db.Column(db.Integer, default=0)
    unique_clicks = db.Column(db.Integer, default=0)
    real_visitors = db.Column(db.Integer, default=0)
    blocked_attempts = db.Column(db.Integer, default=0)
    last_clicked_at = db.Column(db.DateTime, nullable=True)

    # Expiration / limits
    expires_at = db.Column(db.DateTime, nullable=True)
    click_limit = db.Column(db.Integer, nullable=True)
    expiration_action = db.Column(db.String(50), default='disable')  # disable, redirect
    expiration_redirect_url = db.Column(db.Text, nullable=True)

    # Capture features
    capture_email = db.Column(db.Boolean, default=False)
    capture_password = db.Column(db.Boolean, default=False)

    # Security features
    bot_blocking_enabled = db.Column(db.Boolean, default=False)
    geo_targeting_enabled = db.Column(db.Boolean, default=False)
    geo_targeting_type = db.Column(db.String(20), default="allow")
    rate_limiting_enabled = db.Column(db.Boolean, default=False)
    dynamic_signature_enabled = db.Column(db.Boolean, default=False)
    mx_verification_enabled = db.Column(db.Boolean, default=False)

    # Facebook Pixel / analytics
    facebook_pixel_id = db.Column(db.String(100), nullable=True)
    enable_facebook_pixel = db.Column(db.Boolean, default=False)

    # Retargeting pixels
    google_ads_pixel = db.Column(db.String(100), nullable=True)
    enable_google_ads_pixel = db.Column(db.Boolean, default=False)
    tiktok_pixel = db.Column(db.String(100), nullable=True)
    enable_tiktok_pixel = db.Column(db.Boolean, default=False)

    # Open Graph metadata
    og_title = db.Column(db.String(255), nullable=True)
    og_description = db.Column(db.Text, nullable=True)
    og_image_url = db.Column(db.Text, nullable=True)

    # Dynamic routing rules (JSON array of rule objects)
    routing_rules = db.Column(db.Text, nullable=True)

    # Link health monitoring
    health_status = db.Column(db.String(20), default='unknown')  # active, warning, down, unknown
    health_response_code = db.Column(db.Integer, nullable=True)
    health_last_checked = db.Column(db.DateTime, nullable=True)

    # Template
    preview_template_url = db.Column(db.String(500), nullable=True)
    qr_code_url = db.Column(db.Text, nullable=True)

    # Geo-targeting lists (JSON strings)
    allowed_countries = db.Column(db.Text, nullable=True)
    blocked_countries = db.Column(db.Text, nullable=True)
    allowed_regions = db.Column(db.Text, nullable=True)
    blocked_regions = db.Column(db.Text, nullable=True)
    allowed_cities = db.Column(db.Text, nullable=True)
    blocked_cities = db.Column(db.Text, nullable=True)

    # Metadata JSON
    metadata_json = db.Column(db.Text, nullable=True)

    # Relationships
    threats = db.relationship("SecurityThreat", lazy=True, overlaps="security_threat_reports")
    tracking_events = db.relationship("TrackingEvent", backref="link", lazy="dynamic")

    def __init__(self, user_id, target_url, short_code=None, campaign_name="Untitled Campaign",
                 campaign_id=None, status="active", capture_email=False, capture_password=False,
                 bot_blocking_enabled=False, geo_targeting_enabled=False, geo_targeting_type="allow",
                 rate_limiting_enabled=False, dynamic_signature_enabled=False,
                 mx_verification_enabled=False, preview_template_url=None,
                 allowed_countries=None, blocked_countries=None,
                 allowed_regions=None, blocked_regions=None,
                 allowed_cities=None, blocked_cities=None,
                 title=None, description=None, domain=None, custom_slug=None,
                 expires_at=None, click_limit=None, tags=None,
                 facebook_pixel_id=None, enable_facebook_pixel=False,
                 google_ads_pixel=None, enable_google_ads_pixel=False,
                 tiktok_pixel=None, enable_tiktok_pixel=False,
                 og_title=None, og_description=None, og_image_url=None,
                 routing_rules=None,
                 expiration_action='disable', expiration_redirect_url=None):
        self.user_id = user_id
        self.target_url = target_url
        self.original_url = target_url  # keep in sync
        self.short_code = short_code if short_code else self.generate_short_code()
        self.campaign_name = campaign_name
        self.campaign_id = campaign_id
        self.status = status
        self.capture_email = capture_email
        self.capture_password = capture_password
        self.bot_blocking_enabled = bot_blocking_enabled
        self.geo_targeting_enabled = geo_targeting_enabled
        self.geo_targeting_type = geo_targeting_type
        self.rate_limiting_enabled = rate_limiting_enabled
        self.dynamic_signature_enabled = dynamic_signature_enabled
        self.mx_verification_enabled = mx_verification_enabled
        self.preview_template_url = preview_template_url
        self.allowed_countries = allowed_countries
        self.blocked_countries = blocked_countries
        self.allowed_regions = allowed_regions
        self.blocked_regions = blocked_regions
        self.allowed_cities = allowed_cities
        self.blocked_cities = blocked_cities
        self.title = title
        self.description = description
        self.domain = domain
        self.custom_slug = custom_slug
        self.expires_at = expires_at
        self.click_limit = click_limit
        self.tags = json.dumps(tags) if tags and isinstance(tags, list) else tags
        self.facebook_pixel_id = facebook_pixel_id
        self.enable_facebook_pixel = enable_facebook_pixel
        self.google_ads_pixel = google_ads_pixel
        self.enable_google_ads_pixel = enable_google_ads_pixel
        self.tiktok_pixel = tiktok_pixel
        self.enable_tiktok_pixel = enable_tiktok_pixel
        self.og_title = og_title
        self.og_description = og_description
        self.og_image_url = og_image_url
        self.routing_rules = routing_rules
        self.expiration_action = expiration_action
        self.expiration_redirect_url = expiration_redirect_url

    def generate_short_code(self):
        return str(uuid.uuid4())[:8]

    @property
    def is_active(self):
        """Check if link is active and not expired"""
        if self.status != "active":
            return False
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        if self.click_limit and self.total_clicks >= self.click_limit:
            return False
        return True

    def check_and_expire(self):
        """Check if link should be expired and handle expiration"""
        if self.expires_at and self.expires_at < datetime.utcnow():
            self.status = 'expired'
            db.session.commit()
            return True
        if self.click_limit and self.total_clicks >= self.click_limit:
            self.status = 'expired'
            db.session.commit()
            return True
        return False

    def increment_click(self):
        """Thread-safe click increment"""
        self.total_clicks = (self.total_clicks or 0) + 1
        self.click_count = (self.click_count or 0) + 1
        self.last_clicked_at = datetime.utcnow()

    def to_dict(self, base_url=""):
        tracking_url = f"{base_url}/t/{self.short_code}?id={{id}}"
        pixel_url = f"{base_url}/p/{self.short_code}?email={{email}}&id={{id}}"
        email_code = f'<img src="{pixel_url}" width="1" height="1" style="display:none;" />'

        # Parse JSON fields safely
        def safe_json_parse(val):
            if not val:
                return []
            try:
                return json.loads(val) if isinstance(val, str) else val
            except (json.JSONDecodeError, TypeError):
                return []

        return {
            "id": self.id,
            "user_id": self.user_id,
            "campaign_id": self.campaign_id,
            "target_url": self.target_url,
            "original_url": self.original_url or self.target_url,
            "short_code": self.short_code,
            "short_url": self.short_url or f"{base_url}/t/{self.short_code}",
            "custom_slug": self.custom_slug,
            "domain": self.domain,
            "title": self.title,
            "description": self.description,
            "campaign_name": self.campaign_name,
            "tags": safe_json_parse(self.tags),
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "total_clicks": self.total_clicks or 0,
            "click_count": self.click_count or 0,
            "unique_clicks": self.unique_clicks or 0,
            "real_visitors": self.real_visitors or 0,
            "blocked_attempts": self.blocked_attempts or 0,
            "last_clicked_at": self.last_clicked_at.isoformat() if self.last_clicked_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "click_limit": self.click_limit,
            "expiration_action": self.expiration_action,
            "capture_email": self.capture_email,
            "capture_password": self.capture_password,
            "bot_blocking_enabled": self.bot_blocking_enabled,
            "geo_targeting_enabled": self.geo_targeting_enabled,
            "geo_targeting_type": self.geo_targeting_type,
            "rate_limiting_enabled": self.rate_limiting_enabled,
            "dynamic_signature_enabled": self.dynamic_signature_enabled,
            "mx_verification_enabled": self.mx_verification_enabled,
            "facebook_pixel_id": self.facebook_pixel_id,
            "enable_facebook_pixel": self.enable_facebook_pixel,
            "google_ads_pixel": self.google_ads_pixel,
            "enable_google_ads_pixel": self.enable_google_ads_pixel,
            "tiktok_pixel": self.tiktok_pixel,
            "enable_tiktok_pixel": self.enable_tiktok_pixel,
            "og_title": self.og_title,
            "og_description": self.og_description,
            "og_image_url": self.og_image_url,
            "routing_rules": safe_json_parse(self.routing_rules) if self.routing_rules else [],
            "health_status": self.health_status or "unknown",
            "health_response_code": self.health_response_code,
            "health_last_checked": self.health_last_checked.isoformat() if self.health_last_checked else None,
            "preview_template_url": self.preview_template_url,
            "qr_code_url": self.qr_code_url,
            "tracking_url": tracking_url,
            "pixel_url": pixel_url,
            "email_code": email_code,
            "allowed_countries": safe_json_parse(self.allowed_countries),
            "blocked_countries": safe_json_parse(self.blocked_countries),
            "allowed_regions": safe_json_parse(self.allowed_regions),
            "blocked_regions": safe_json_parse(self.blocked_regions),
            "allowed_cities": safe_json_parse(self.allowed_cities),
            "blocked_cities": safe_json_parse(self.blocked_cities),
        }