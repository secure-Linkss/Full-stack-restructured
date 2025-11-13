'''
User Model - Core user authentication and management
'''

from api.database import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
import os
import pyotp # For 2FA generation and verification
import base64

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Role and Status
    role = db.Column(db.String(50), default='member', nullable=False)  # main_admin, admin, assistant_admin, member
    # Updated status options to include 'crypto_pending'
    status = db.Column(db.String(50), default='pending', nullable=False)  # pending, active, suspended, expired, crypto_pending
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    
    # Subscription - Updated plan_type options
    plan_type = db.Column(db.String(50), default='free', nullable=False)  # free, weekly, biweekly, monthly, quarterly, pro, enterprise
    subscription_expiry = db.Column(db.DateTime, nullable=True)
    stripe_customer_id = db.Column(db.String(255), nullable=True)
    stripe_subscription_id = db.Column(db.String(255), nullable=True)
    # New fields from schema
    subscription_status = db.Column(db.String(50), nullable=True)
    subscription_start_date = db.Column(db.DateTime, nullable=True)
    subscription_end_date = db.Column(db.DateTime, nullable=True)
    
    # Contact Info
    phone = db.Column(db.String(20), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    
    # Telegram Integration
    telegram_bot_token = db.Column(db.String(255), nullable=True)
    telegram_chat_id = db.Column(db.String(255), nullable=True)
    telegram_enabled = db.Column(db.Boolean, default=False)
    
    # Security
    two_factor_enabled = db.Column(db.Boolean, default=False)
    two_factor_secret = db.Column(db.String(255), nullable=True)
    verification_token = db.Column(db.String(255), nullable=True)
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)
    
    # Login Tracking
    last_login = db.Column(db.DateTime, nullable=True)
    last_ip = db.Column(db.String(45), nullable=True)
    login_count = db.Column(db.Integer, default=0)
    failed_login_attempts = db.Column(db.Integer, default=0)
    last_failed_login = db.Column(db.DateTime, nullable=True)
    
    # Usage Limits
    daily_link_limit = db.Column(db.Integer, default=100)
    daily_link_count = db.Column(db.Integer, default=0)
    last_link_reset = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    links = db.relationship('Link', backref='owner', lazy='dynamic', cascade='all, delete-orphan')
    campaigns = db.relationship('Campaign', foreign_keys='Campaign.owner_id', lazy='dynamic', cascade='all, delete-orphan', overlaps='owner')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def set_password(self, password):
        '''Hash and set password'''
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        '''Verify password'''
        return check_password_hash(self.password_hash, password)
    
    def generate_token(self, expires_in=86400):
        '''Generate JWT token (default 24 hours)'''
        payload = {
            'user_id': self.id,
            'username': self.username,
            'role': self.role,
            'exp': datetime.utcnow() + timedelta(seconds=expires_in)
        }
        # CRITICAL FIX: Removed hardcoded fallback secret key
        secret_key = os.environ.get('SECRET_KEY')
        if not secret_key:
            raise ValueError("SECRET_KEY environment variable is not set. Cannot generate token.")
        return jwt.encode(payload, secret_key, algorithm='HS256')
    
    @staticmethod
    def verify_token(token):
        '''Verify JWT token and return user'''
        try:
            # CRITICAL FIX: Removed hardcoded fallback secret key
            secret_key = os.environ.get('SECRET_KEY')
            if not secret_key:
                raise ValueError("SECRET_KEY environment variable is not set. Cannot verify token.")
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            return User.query.get(payload['user_id'])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None
    
    def can_create_link(self):
        '''Check if user can create more links today'''
        # Reset daily count if needed
        if self.last_link_reset.date() < datetime.utcnow().date():
            self.daily_link_count = 0
            self.last_link_reset = datetime.utcnow()
            db.session.commit()
        
        # Updated limits to reflect new plan types
        limits = {
            'free': 10,
            'weekly': 1000,
            'biweekly': 1000,
            'monthly': 5000,
            'quarterly': 10000,
            'pro': 10000,
            'enterprise': 50000
        }
        limit = limits.get(self.plan_type, 10)
        return self.daily_link_count < limit
    
    def increment_link_usage(self):
        '''Increment daily link count'''
        self.daily_link_count += 1
        db.session.commit()
    
    def generate_2fa_secret(self):
        '''Generate a new 2FA secret'''
        self.two_factor_secret = base64.b32encode(os.urandom(10)).decode('utf-8')
        db.session.commit()
        return self.two_factor_secret

    def verify_2fa_token(self, token):
        '''Verify a 2FA token'''
        if not self.two_factor_secret:
            return False
        totp = pyotp.TOTP(self.two_factor_secret)
        return totp.verify(token)

    def to_dict(self, include_sensitive=False):
        '''Convert user to dictionary'''
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'status': self.status,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'plan_type': self.plan_type,
            'subscription_expiry': self.subscription_expiry.isoformat() if self.subscription_expiry else None,
            'subscription_status': self.subscription_status,
            'subscription_start_date': self.subscription_start_date.isoformat() if self.subscription_start_date else None,
            'subscription_end_date': self.subscription_end_date.isoformat() if self.subscription_end_date else None,
            'phone': self.phone,
            'country': self.country,
            'telegram_enabled': self.telegram_enabled,
            'two_factor_enabled': self.two_factor_enabled,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'login_count': self.login_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_sensitive:
            data.update({
                'telegram_bot_token': self.telegram_bot_token,
                'telegram_chat_id': self.telegram_chat_id,
                'stripe_customer_id': self.stripe_customer_id,
                'stripe_subscription_id': self.stripe_subscription_id,
                'daily_link_limit': self.daily_link_limit,
                'daily_link_count': self.daily_link_count
            })
        
        return data
    
    def __repr__(self):
        return f'<User {self.username}>'
