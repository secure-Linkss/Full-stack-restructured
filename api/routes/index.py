import os
import sys

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from api.config import config

# Import models and blueprints
from api.database import db
from api.models.user import User
from api.models.link import Link
from api.models.tracking_event import TrackingEvent
from api.models.campaign import Campaign
from api.models.audit_log import AuditLog
from api.models.security import SecuritySettings, BlockedIP, BlockedCountry
from api.models.support_ticket import SupportTicket
from api.models.subscription_verification import SubscriptionVerification
from api.models.notification import Notification
from api.models.domain import Domain
from api.models.security_threat import SecurityThreat
from api.models.security_threat_db import SecurityThreat as SecurityThreatDB
from api.models.support_ticket_db import SupportTicket as SupportTicketDB
from api.models.subscription_verification_db import SubscriptionVerification as SubscriptionVerificationDB

from api.api.user import user_bp
from api.api.auth import auth_bp
from api.api.links import links_bp
from api.api.track import track_bp
from api.api.events import events_bp
from api.api.analytics_complete import analytics_bp
from api.api.campaigns import campaigns_bp
from api.api.settings import settings_bp
from api.api.admin_complete import admin_complete_bp  # Use ONLY admin_complete
from api.api.admin_settings import admin_settings_bp
from api.api.security_complete import security_bp
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
app.config['SECRET_KEY'] = config.SECRET_KEY

# Enable CORS for all routes
CORS(app, supports_credentials=True)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = config.SQLALCHEMY_DATABASE_URI

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Database connection pooling for production
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = config.SQLALCHEMY_ENGINE_OPTIONS

db.init_app(app)
migrate = Migrate(app, db)

with app.app_context():
    db.create_all()
    
    # Create default admin users
    if not User.query.filter_by(username="Brain").first():
        admin_user = User(
            username="Brain",
            email="admin@brainlinktracker.com",
            role="main_admin",
            status="active",
            is_active=True,
            is_verified=True
        )
        admin_user.set_password("Mayflower1!!")
        db.session.add(admin_user)
        db.session.commit()
        print("Default admin user 'Brain' created.")
    
    if not User.query.filter_by(username="7thbrain").first():
        admin_user2 = User(
            username="7thbrain",
            email="admin2@brainlinktracker.com",
            role="admin",
            status="active",
            is_active=True,
            is_verified=True
        )
        admin_user2.set_password("Mayflower1!")
        db.session.add(admin_user2)
        db.session.commit()
        print("Default admin user '7thbrain' created.")

# ============================================================================
# CORRECTED BLUEPRINT REGISTRATION - NO DUPLICATES
# ============================================================================

# Core API routes - all with explicit /api prefix
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(links_bp, url_prefix='/api/links')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(campaigns_bp, url_prefix='/api/campaigns')
app.register_blueprint(settings_bp, url_prefix='/api/settings')

# Admin routes - ONLY use admin_complete_bp
app.register_blueprint(admin_complete_bp, url_prefix='/api/admin')
app.register_blueprint(admin_settings_bp, url_prefix='/api/admin/settings')

# Security routes
app.register_blueprint(security_bp, url_prefix='/api/security')
app.register_blueprint(advanced_security_bp, url_prefix='/api/security/advanced')

# Communication routes
app.register_blueprint(telegram_bp, url_prefix='/api/telegram')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
app.register_blueprint(broadcaster_bp, url_prefix='/api/broadcast')

# Tracking routes - NO prefix (use /t/, /p/, /track/ directly)
app.register_blueprint(track_bp)
app.register_blueprint(events_bp, url_prefix='/api/events')
app.register_blueprint(page_tracking_bp, url_prefix='/api/page-tracking')

# Utility routes
app.register_blueprint(shorten_bp, url_prefix='/api/shorten')
app.register_blueprint(quantum_bp)  # Has /q/, /validate, /route routes
app.register_blueprint(domains_bp, url_prefix='/api/domains')
app.register_blueprint(profile_bp, url_prefix='/api/profile')

# User management routes
app.register_blueprint(pending_users_bp, url_prefix='/api/pending-users')

# Payment routes
app.register_blueprint(payments_bp, url_prefix='/api/payments')
app.register_blueprint(crypto_payments_bp, url_prefix='/api/crypto-payments')
app.register_blueprint(stripe_bp, url_prefix='/api/stripe')

# Support routes
app.register_blueprint(support_tickets_bp, url_prefix='/api/support')

# ============================================================================
# HEALTH CHECK ENDPOINT
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    from datetime import datetime
    try:
        # Check database connection
        db.session.execute('SELECT 1')
        
        return {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected',
            'version': '1.0.0'
        }, 200
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }, 503

# ============================================================================
# STATIC FILE SERVING
# ============================================================================

@app.route('/', defaults={'path': ''}) 
@app.route('/<path:path>')
def serve(path):
    # Skip API routes
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

# For gunicorn/production
application = app
