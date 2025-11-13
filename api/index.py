import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, request, redirect
from api.config.production import config # Import the config dictionary
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_apscheduler import APScheduler
# Rate limiting import
try:
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    RATE_LIMITING_AVAILABLE = True
except ImportError:
    print("⚠ Flask-Limiter not installed. Rate limiting disabled.")
    RATE_LIMITING_AVAILABLE = False

# Import database FIRST - prevents circular dependencies
from api.database import db

# Import models in dependency order
# Base models (no foreign keys)
from api.models.user import User
from api.models.admin_settings import AdminSettings
from api.models.api_key import APIKey

# Models with foreign keys to User
from api.models.link import Link
from api.models.campaign import Campaign
from api.models.notification import Notification
from api.models.audit_log import AuditLog
from api.models.domain import Domain

# Tracking and Analytics models
from api.models.tracking_event import TrackingEvent
from api.models.ab_test import ABTest

# Security models
from api.models.security import SecuritySettings, BlockedIP, BlockedCountry
from api.models.security_threat import SecurityThreat
from api.models.security_threat_db import SecurityThreat as SecurityThreatDB

# Support and Subscription models
from api.models.support_ticket import SupportTicket
from api.models.support_ticket_db import SupportTicket as SupportTicketDB, SupportTicketComment
from api.models.subscription_verification import SubscriptionVerification
from api.models.subscription_verification_db import SubscriptionVerification as SubscriptionVerificationDB, SubscriptionHistory

# Import blueprints from api.api (routes are in api folder)
from api.api.user import user_bp
from api.api.auth import auth_bp
from api.api.links import links_bp
from api.api.track import track_bp
from api.api.events import events_bp
from api.api.analytics import analytics_bp
from api.api.campaigns import campaigns_bp
from api.api.settings import settings_bp
from api.api.admin import admin_bp
from api.api.admin_complete import admin_complete_bp
from api.api.admin_settings import admin_settings_bp
from api.api.security import security_bp
from api.api.telegram import telegram_bp
from api.api.page_tracking import page_tracking_bp
from api.api.shorten import shorten_bp
from api.api.notifications import notifications_bp
from api.api.quantum_redirect import quantum_bp
from api.api.advanced_security import advanced_security_bp
from api.api.domains import domains_bp
from api.api.profile import profile_bp
from api.api.broadcaster import broadcaster_bp
from api.api.pending_users import pending_users_bp
from api.api.payments import payments_bp
from api.api.crypto_payments import crypto_payments_bp
from api.api.support_tickets import support_tickets_bp
from api.api.stripe_payments import stripe_bp


app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), '..', 'dist'))

# Load configuration based on environment
env = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(config[env])

# ============================================
# PRODUCTION-READY CORS CONFIGURATION
# ============================================
# Get allowed origins from environment variable
ALLOWED_ORIGINS = os.environ.get(
    'ALLOWED_ORIGINS',
    'http://localhost:3000,http://localhost:5173,http://localhost:5000'
).split(',')

# Production-ready CORS configuration
CORS(app,
     origins=ALLOWED_ORIGINS,
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
     max_age=3600
)

# ============================================
# RATE LIMITING CONFIGURATION
# ============================================
if RATE_LIMITING_AVAILABLE:
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"],
        storage_uri=os.environ.get("REDIS_URL", "memory://")
    )
    print("✓ Rate limiting enabled")
else:
    limiter = None
    print("⚠ Rate limiting disabled - install Flask-Limiter to enable")

# Database configuration is now handled by the config object
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Already set in config object
db.init_app(app)
migrate = Migrate(app, db)

# ============================================
# HTTPS REDIRECT MIDDLEWARE (Production)
# ============================================
@app.before_request
def force_https():
    """Redirect HTTP to HTTPS in production"""
    # Only enforce HTTPS if not in development
    if os.environ.get('FLASK_ENV') == 'production':
        if request.url.startswith('http://') and not request.is_secure:
            url = request.url.replace('http://', 'https://', 1)
            return redirect(url, code=301)

# ============================================
# APSCHEDULER INITIALIZATION
# ============================================
scheduler = APScheduler()
scheduler.init_app(app)

# Import cron jobs after app is initialized
from api.cron.subscription_expiry import check_subscription_expiry
from api.cron.link_expiry import check_link_expiry

# Add jobs to the scheduler
scheduler.add_job(id='check_subscription_expiry', func=check_subscription_expiry, trigger='interval', hours=1, misfire_grace_time=3600)
scheduler.add_job(id='check_link_expiry', func=check_link_expiry, trigger='interval', hours=1, misfire_grace_time=3600)

# Start the scheduler
scheduler.start()
print("✓ APScheduler started with cron jobs.")

with app.app_context():
    db.create_all()
    
    # Create default admin user if not exists
    if not User.query.filter_by(username="Brain").first():
        admin_user = User(username="Brain", email="admin@brainlinktracker.com", role="main_admin", status="active", is_active=True, is_verified=True)
        admin_user.set_password("Mayflower1!!")
        db.session.add(admin_user)
        db.session.commit()
        print("Default admin user \"Brain\" created.")
    else:
        # Update existing admin user to active status
        admin_user = User.query.filter_by(username="Brain").first()
        if admin_user.status != "active":
            admin_user.status = "active"
            admin_user.is_active = True
            admin_user.is_verified = True
            db.session.commit()
            print("Default admin user \"Brain\" updated to active status.")
    
    # Create default admin user "7thbrain" if not exists
    if not User.query.filter_by(username="7thbrain").first():
        admin_user2 = User(username="7thbrain", email="admin2@brainlinktracker.com", role="admin", status="active", is_active=True, is_verified=True)
        admin_user2.set_password("Mayflower1!")
        db.session.add(admin_user2)
        db.session.commit()
        print("Default admin user \"7thbrain\" created.")
    else:
        # Update existing admin user to active status
        admin_user2 = User.query.filter_by(username="7thbrain").first()
        if admin_user2.status != "active":
            admin_user2.status = "active"
            admin_user2.is_active = True
            admin_user2.is_verified = True
            db.session.commit()
            print("Default admin user \"7thbrain\" updated to active status.")

# Register blueprints - DO NOT add /api prefix if route already has it
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(links_bp, url_prefix='/api')
app.register_blueprint(analytics_bp, url_prefix='/api')
app.register_blueprint(campaigns_bp)  # Already has /api in routes
app.register_blueprint(settings_bp)  # Already has /api in routes
app.register_blueprint(admin_bp)  # Already has /api in routes - CRITICAL FIX
app.register_blueprint(admin_complete_bp)  # Already has /api in routes - CRITICAL FIX
app.register_blueprint(admin_settings_bp, url_prefix='/api')
app.register_blueprint(security_bp, url_prefix='/api')
app.register_blueprint(telegram_bp, url_prefix='/api')
app.register_blueprint(page_tracking_bp, url_prefix='/api')
app.register_blueprint(shorten_bp, url_prefix='/api')
app.register_blueprint(notifications_bp)  # Has /api prefix in routes
app.register_blueprint(quantum_bp)  # No prefix - has /q/, /validate, /route routes
app.register_blueprint(advanced_security_bp, url_prefix='/api')
app.register_blueprint(domains_bp)  # Has /api in routes
app.register_blueprint(profile_bp)  # Profile management routes
app.register_blueprint(track_bp)  # No prefix - has /t/, /p/, /track routes
app.register_blueprint(events_bp)  # No prefix - has /api/ in blueprint
app.register_blueprint(broadcaster_bp)  # Global broadcaster routes - has /api in blueprint
app.register_blueprint(pending_users_bp)  # Pending users routes - has /api in blueprint
app.register_blueprint(payments_bp)  # Payment processing routes - has /api in blueprint
app.register_blueprint(crypto_payments_bp)  # Crypto payment routes - has /api in blueprint
app.register_blueprint(support_tickets_bp)  # Support ticket system - has /api in blueprint
app.register_blueprint(stripe_bp)  # Stripe payment processing

# Apply rate limiting to specific blueprints if available
if RATE_LIMITING_AVAILABLE and limiter:
    # Authentication endpoints - stricter limits
    limiter.limit("5 per minute")(auth_bp)
    
    # Admin endpoints - moderate limits
    limiter.limit("100 per hour")(admin_bp)
    limiter.limit("100 per hour")(admin_complete_bp)
    
    # Link creation - prevent abuse
    limiter.limit("20 per minute")(links_bp)
    
    print("✓ Rate limiting applied to sensitive endpoints")

@app.route('/', defaults={'path': ''}) 
@app.route('/<path:path>')
def serve(path):
    # Skip API routes - let them be handled by blueprints
    if path.startswith('api/') or path.startswith('t/') or path.startswith('p/') or path.startswith('q/'):
        return "Route not found", 404
    
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)

# For gunicorn
application = app
