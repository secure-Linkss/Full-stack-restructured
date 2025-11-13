import os
from typing import Optional
from datetime import timedelta


class ConfigError(Exception):
    """Custom exception for configuration errors"""
    pass


class Config:
    """
    Secure configuration class with validation
    All sensitive data MUST come from environment variables
    """
    
    def __init__(self):
        # Required environment variables
        self.SECRET_KEY = self._get_required_env('SECRET_KEY')
        self.DATABASE_URL = self._get_required_env('DATABASE_URL')
        
        # Optional but recommended
        self.SHORTIO_API_KEY = os.environ.get('SHORTIO_API_KEY')
        self.SHORTIO_DOMAIN = os.environ.get('SHORTIO_DOMAIN', 'Secure-links.short.gy')
        
        # Flask configuration
        self.FLASK_ENV = os.environ.get('FLASK_ENV', 'production')
        self.FLASK_DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
        self.FLASK_PORT = int(os.environ.get('FLASK_PORT', '5000'))
        
        # Security settings
        self.SESSION_COOKIE_SECURE = self.FLASK_ENV == 'production'
        self.SESSION_COOKIE_HTTPONLY = True
        self.SESSION_COOKIE_SAMESITE = 'Lax'
        self.PERMANENT_SESSION_LIFETIME = timedelta(days=7)
        
        # JWT settings
        self.JWT_SECRET_KEY = self.SECRET_KEY
        self.JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
        
        # Database settings
        self.SQLALCHEMY_DATABASE_URI = self.DATABASE_URL
        self.SQLALCHEMY_TRACK_MODIFICATIONS = False
        self.SQLALCHEMY_ENGINE_OPTIONS = {
            'pool_size': int(os.environ.get('DB_POOL_SIZE', '10')),
            'pool_recycle': int(os.environ.get('DB_POOL_RECYCLE', '3600')),
            'pool_pre_ping': True,
            'max_overflow': int(os.environ.get('DB_MAX_OVERFLOW', '20'))
        }
        
        # CORS settings
        self.CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
        
        # Rate limiting
        self.RATELIMIT_ENABLED = os.environ.get('RATELIMIT_ENABLED', 'True').lower() == 'true'
        self.RATELIMIT_STORAGE_URL = os.environ.get('RATELIMIT_STORAGE_URL', 'memory://')
        
        # Email settings (optional)
        self.SMTP_HOST = os.environ.get('SMTP_HOST')
        self.SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
        self.SMTP_USER = os.environ.get('SMTP_USER')
        self.SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
        self.SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL', 'noreply@brainlinktracker.com')
        
        # Telegram settings (optional)
        self.TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN_SYSTEM')
        
        # Stripe settings (optional)
        self.STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
        self.STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY')
        self.STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
        
        # Crypto payment settings (optional)
        self.ENABLE_CRYPTO_PAYMENTS = os.environ.get('ENABLE_CRYPTO_PAYMENTS', 'false').lower() == 'true'
        
        # Logging
        self.LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
        self.LOG_FILE = os.environ.get('LOG_FILE', 'logs/brainlink.log')
        
        # Validate configuration
        self.validate()
    
    def _get_required_env(self, key: str) -> str:
        """Get required environment variable or raise error"""
        value = os.environ.get(key)
        if not value:
            raise ConfigError(
                f"Required environment variable '{key}' is not set. "
                f"Please set it in your .env file or environment."
            )
        return value
    
    def validate(self):
        """Validate all configuration values"""
        errors = []
        
        # Validate SECRET_KEY
        if len(self.SECRET_KEY) < 32:
            errors.append("SECRET_KEY must be at least 32 characters long")
        
        # Validate DATABASE_URL
        if not self.DATABASE_URL.startswith('postgresql://'):
            errors.append("DATABASE_URL must be a PostgreSQL connection string")
        
        # Validate production settings
        if self.FLASK_ENV == 'production':
            if self.FLASK_DEBUG:
                errors.append("DEBUG must be False in production")
            
            if not self.SESSION_COOKIE_SECURE:
                errors.append("SESSION_COOKIE_SECURE must be True in production")
        
        # Validate email settings if configured
        if self.SMTP_HOST and not self.SMTP_USER:
            errors.append("SMTP_USER is required when SMTP_HOST is set")
        
        # Validate Stripe settings if configured
        if self.STRIPE_SECRET_KEY:
            if self.FLASK_ENV == 'production' and 'test' in self.STRIPE_SECRET_KEY:
                errors.append("Using Stripe test keys in production environment")
        
        if errors:
            raise ConfigError(
                "Configuration validation failed:\n" + 
                "\n".join(f"  - {error}" for error in errors)
            )
    
    def to_dict(self) -> dict:
        """Return configuration as dictionary (excluding sensitive data)"""
        return {
            'FLASK_ENV': self.FLASK_ENV,
            'FLASK_DEBUG': self.FLASK_DEBUG,
            'FLASK_PORT': self.FLASK_PORT,
            'DATABASE_CONFIGURED': bool(self.DATABASE_URL),
            'SHORTIO_CONFIGURED': bool(self.SHORTIO_API_KEY),
            'SMTP_CONFIGURED': bool(self.SMTP_HOST and self.SMTP_USER),
            'TELEGRAM_CONFIGURED': bool(self.TELEGRAM_BOT_TOKEN),
            'STRIPE_CONFIGURED': bool(self.STRIPE_SECRET_KEY),
            'CRYPTO_PAYMENTS_ENABLED': self.ENABLE_CRYPTO_PAYMENTS,
            'RATELIMIT_ENABLED': self.RATELIMIT_ENABLED,
            'LOG_LEVEL': self.LOG_LEVEL
        }


# Create global config instance
try:
    config = Config()
    print("✅ Configuration loaded and validated successfully")
except ConfigError as e:
    print(f"❌ Configuration Error: {e}")
    raise


# Example .env.template file content
ENV_TEMPLATE = """
# ============================================================================
# Brain Link Tracker - Environment Configuration
# ============================================================================
# Copy this file to .env and fill in your actual values
# NEVER commit .env to version control!

# ============================================================================
# REQUIRED SETTINGS
# ============================================================================

# Secret key for Flask sessions and JWT (minimum 32 characters)
# Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-secret-key-here-minimum-32-characters

# PostgreSQL database connection string
DATABASE_URL=postgresql://username:password@host:port/database

# ============================================================================
# OPTIONAL SETTINGS
# ============================================================================

# Short.io API configuration
SHORTIO_API_KEY=your-shortio-api-key
SHORTIO_DOMAIN=your-domain.short.gy

# Flask configuration
FLASK_ENV=production
FLASK_DEBUG=False
FLASK_PORT=5000

# Database pool settings
DB_POOL_SIZE=10
DB_POOL_RECYCLE=3600
DB_MAX_OVERFLOW=20

# CORS origins (comma-separated)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate limiting
RATELIMIT_ENABLED=True
RATELIMIT_STORAGE_URL=redis://localhost:6379

# Email/SMTP settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@brainlinktracker.com

# Telegram bot
TELEGRAM_BOT_TOKEN_SYSTEM=your-telegram-bot-token

# Stripe payment processing
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Crypto payments
ENABLE_CRYPTO_PAYMENTS=false

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/brainlink.log
"""


if __name__ == '__main__':
    # Print configuration template
    print(ENV_TEMPLATE)
    
    # Print current configuration (safe values only)
    print("\n" + "="*80)
    print("Current Configuration:")
    print("="*80)
    for key, value in config.to_dict().items():
        print(f"{key}: {value}")
