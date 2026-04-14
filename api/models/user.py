from api.database import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date, timedelta
import hashlib as _hashlib

# Determine the best available hash method at import time.
# scrypt requires OpenSSL 1.1.1+ compiled into Python's hashlib.
# Fall back to pbkdf2:sha256 which is always available.
_HASH_METHOD = 'pbkdf2:sha256'
try:
    _hashlib.scrypt(b'test', salt=b'salt', n=2, r=8, p=1)
    _HASH_METHOD = 'scrypt'
except (AttributeError, OSError):
    pass  # hashlib.scrypt not available — use pbkdf2:sha256
import jwt
import os
import logging

logger = logging.getLogger(__name__)

# Secret key must come from environment - no hardcoded fallback in production
def _get_secret_key():
    key = os.environ.get('SECRET_KEY')
    if not key:
        if os.environ.get('FLASK_ENV') == 'production':
            raise RuntimeError("SECRET_KEY must be set in production environment")
        key = 'dev-only-insecure-key-change-me'
        logger.warning("Using insecure dev SECRET_KEY - set SECRET_KEY env var for production")
    return key


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    settings = db.Column(db.Text, nullable=True)
    notification_settings = db.Column(db.Text, nullable=True)
    preferences = db.Column(db.Text, nullable=True)
    user_metadata = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Roles and tracking
    role = db.Column(db.String(20), default='member')  # member, admin, main_admin
    status = db.Column(db.String(20), default='pending')  # pending, active, suspended, expired, crypto_pending
    last_login = db.Column(db.DateTime)
    last_ip = db.Column(db.String(45))
    login_count = db.Column(db.Integer, default=0)
    failed_login_attempts = db.Column(db.Integer, default=0)
    last_failed_login = db.Column(db.DateTime, nullable=True)
    account_locked_until = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(255), nullable=True)

    # Subscription and usage
    plan_type = db.Column(db.String(50), default='free')  # free, weekly, biweekly, monthly, quarterly, pro, enterprise
    subscription_expiry = db.Column(db.DateTime, nullable=True)
    daily_link_limit = db.Column(db.Integer, default=10)
    daily_link_count = db.Column(db.Integer, default=0)
    links_used_today = db.Column(db.Integer, default=0)
    last_reset_date = db.Column(db.Date, default=date.today)
    last_link_reset = db.Column(db.DateTime, default=datetime.utcnow)

    # Stripe integration
    stripe_customer_id = db.Column(db.String(255), nullable=True)
    stripe_subscription_id = db.Column(db.String(255), nullable=True)
    subscription_status = db.Column(db.String(50), default='active')  # active, cancelled, expired
    subscription_start_date = db.Column(db.DateTime, nullable=True)
    subscription_end_date = db.Column(db.DateTime, nullable=True)
    subscription_plan = db.Column(db.String(50), nullable=True)

    # Telegram integration
    telegram_bot_token = db.Column(db.String(255), nullable=True)
    telegram_chat_id = db.Column(db.String(255), nullable=True)
    telegram_enabled = db.Column(db.Boolean, default=False)

    # Profile fields
    avatar = db.Column(db.String(500), nullable=True)
    profile_picture = db.Column(db.String(500), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    timezone = db.Column(db.String(50), default='UTC')
    language = db.Column(db.String(10), default='en')
    theme = db.Column(db.String(20), default='dark')

    # Password reset
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)  # alias for compat

    # Security / 2FA
    two_factor_enabled = db.Column(db.Boolean, default=False)
    two_factor_secret = db.Column(db.String(255), nullable=True)
    backup_codes = db.Column(db.Text, nullable=True)

    # Activity tracking
    last_activity_at = db.Column(db.DateTime, nullable=True)
    session_count = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f'<User {self.username}>'

    # ---------- password helpers ----------
    @property
    def password(self):
        return self.password_hash

    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password, method=_HASH_METHOD)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method=_HASH_METHOD)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    # ---------- role helpers ----------
    def is_admin(self):
        return self.role in ['admin', 'main_admin']

    def is_main_admin(self):
        return self.role == 'main_admin'

    # ---------- link usage ----------
    def can_create_link(self):
        if self.plan_type in ('pro', 'enterprise'):
            return True
        today = date.today()
        if self.last_reset_date != today:
            self.links_used_today = 0
            self.daily_link_count = 0
            self.last_reset_date = today
            db.session.commit()
        return self.links_used_today < self.daily_link_limit

    def increment_link_usage(self):
        self.links_used_today += 1
        self.daily_link_count += 1
        db.session.commit()

    # ---------- account lockout ----------
    MAX_FAILED_ATTEMPTS = 5
    LOCKOUT_DURATION_MINUTES = 30

    def record_failed_login(self):
        self.failed_login_attempts += 1
        self.last_failed_login = datetime.utcnow()
        if self.failed_login_attempts >= self.MAX_FAILED_ATTEMPTS:
            self.account_locked_until = datetime.utcnow() + timedelta(minutes=self.LOCKOUT_DURATION_MINUTES)
        db.session.commit()

    def is_account_locked(self):
        if self.account_locked_until and self.account_locked_until > datetime.utcnow():
            return True
        if self.account_locked_until and self.account_locked_until <= datetime.utcnow():
            self.account_locked_until = None
            self.failed_login_attempts = 0
            db.session.commit()
        return False

    def record_successful_login(self, ip_address=None):
        self.last_login = datetime.utcnow()
        self.last_ip = ip_address
        self.login_count += 1
        self.failed_login_attempts = 0
        self.account_locked_until = None
        db.session.commit()

    # ---------- 2FA ----------
    def verify_2fa_token(self, token):
        if not self.two_factor_secret:
            return False
        try:
            import pyotp
            totp = pyotp.TOTP(self.two_factor_secret)
            return totp.verify(token, valid_window=1)
        except Exception:
            return False

    # ---------- JWT ----------
    def generate_token(self):
        payload = {
            'user_id': self.id,
            'role': self.role,
            'exp': datetime.utcnow() + timedelta(days=30),
            'iat': datetime.utcnow(),
        }
        return jwt.encode(payload, _get_secret_key(), algorithm='HS256')

    @staticmethod
    def verify_token(token):
        try:
            payload = jwt.decode(token, _get_secret_key(), algorithms=['HS256'])
            return User.query.get(payload['user_id'])
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    # ---------- serialisation ----------
    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'role': self.role,
            'status': self.status,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'plan_type': self.plan_type,
            'subscription_expiry': self.subscription_expiry.isoformat() if self.subscription_expiry else None,
            'subscription_status': self.subscription_status,
            'daily_link_limit': self.daily_link_limit,
            'links_used_today': self.links_used_today,
            'last_reset_date': self.last_reset_date.isoformat() if self.last_reset_date else None,
            'telegram_enabled': self.telegram_enabled,
            'two_factor_enabled': self.two_factor_enabled,
            'phone': self.phone,
            'country': self.country,
            'avatar': self.avatar,
            'timezone': self.timezone,
            'language': self.language,
            'theme': self.theme,
        }
        if include_sensitive:
            data.update({
                'last_login': self.last_login.isoformat() if self.last_login else None,
                'last_ip': self.last_ip,
                'login_count': self.login_count,
                'failed_login_attempts': self.failed_login_attempts,
                'last_failed_login': self.last_failed_login.isoformat() if self.last_failed_login else None,
                'account_locked_until': self.account_locked_until.isoformat() if self.account_locked_until else None,
                'stripe_customer_id': self.stripe_customer_id,
                'stripe_subscription_id': self.stripe_subscription_id,
            })
        return data
