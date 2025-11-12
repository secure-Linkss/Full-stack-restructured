# Production_config.py

"""
Production Configuration
Create config.py in your project root
"""

import os
from datetime import timedelta

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Session configuration
    SESSION_COOKIE_SECURE = True  # Only send cookie over HTTPS
    SESSION_COOKIE_HTTPONLY = True  # Prevent JavaScript access
    SESSION_COOKIE_SAMESITE = 'Lax'  # CSRF protection
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    
    # JWT configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Rate limiting
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'memory://')
    
    # CORS
    CORS_ORIGINS = os.environ.get('ALLOWED_ORIGINS', '').split(',')
    
    # Email configuration
    MAIL_SERVER = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('SMTP_PORT', 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get('SMTP_USER')
    MAIL_PASSWORD = os.environ.get('SMTP_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_FROM', 'noreply@brainlinktracker.com')
    
    # Stripe configuration
    STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
    STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY')
    STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    # Crypto payments
    ENABLE_CRYPTO_PAYMENTS = os.environ.get('ENABLE_CRYPTO_PAYMENTS', 'true').lower() == 'true'
    CRYPTO_WALLET_ADDRESS = os.environ.get('CRYPTO_WALLET_ADDRESS')
    
    # Telegram
    TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN_SYSTEM')
    
    # File upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///dev.db'
    SESSION_COOKIE_SECURE = False  # Allow HTTP in development

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    
    # Ensure all security settings are enabled
    if not SQLALCHEMY_DATABASE_URI:
        raise ValueError("DATABASE_URL must be set in production")
    
    if SECRET_KEY == 'dev-secret-key-change-in-production':
        raise ValueError("SECRET_KEY must be set in production")

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

# Usage in api/index.py:
"""
from config import config

app = Flask(__name__)
env = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(config[env])
"""