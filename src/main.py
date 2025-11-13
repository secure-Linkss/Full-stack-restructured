import os
import sys

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Import models and blueprints
from src.database import db
from src.models.user import User
from src.models.link import Link
from src.models.tracking_event import TrackingEvent
from src.models.campaign import Campaign
from src.models.audit_log import AuditLog
from src.models.security import SecuritySettings, BlockedIP, BlockedCountry
from src.models.support_ticket import SupportTicket
from src.models.subscription_verification import SubscriptionVerification
from src.models.notification import Notification
from src.models.domain import Domain
from src.models.security_threat import SecurityThreat
from src.models.security_threat_db import SecurityThreat as SecurityThreatDB
from src.models.support_ticket_db import SupportTicket as SupportTicketDB
from src.models.subscription_verification_db import SubscriptionVerification as SubscriptionVerificationDB

# Import from src.api instead of src.routes - CRITICAL FIX
from api.user import user_bp
from api.auth import auth_bp
from api.links import links_bp
from api.track import track_bp
from api.events import events_bp
from api.analytics import analytics_bp
from api.campaigns import campaigns_bp
from api.settings import settings_bp
from api.admin import admin_bp
from api.admin_complete import admin_complete_bp
from api.admin_settings import admin_settings_bp
from api.security import security_bp
from api.telegram import telegram_bp
from api.page_tracking import page_tracking_bp
from api.shorten import shorten_bp
from api.notifications import notifications_bp
from api.quantum_redirect import quantum_bp
from api.advanced_security import advanced_security_bp
from api.domains import domains_bp
from api.profile import profile_bp
from api.broadcaster import broadcaster_bp
from api.pending_users import pending_users_bp
from api.payments import payments_bp
from api.crypto_payments import crypto_payments_bp
from api.support_tickets import support_tickets_bp
from api.stripe_payments import stripe_bp


app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), '..', 'dist'))
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'ej5B3Amppi4gjpbC65te6rJuvJzgVCWW_xfB-ZLR1TE')

# Enable CORS for all routes
CORS(app, supports_credentials=True)

# Database configuration - use SQLite for testing
database_url = os.environ.get('DATABASE_URL')
if database_url and 'postgresql' in database_url:
    # Production - PostgreSQL (Neon)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # Development/Testing - SQLite fallback
    os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'src', 'database'), exist_ok=True)
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), '..', 'src', 'database', 'app.db')}"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
migrate = Migrate(app, db)

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

# FIXED: Register blueprints with correct prefixes
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(links_bp, url_prefix='/api')
app.register_blueprint(analytics_bp, url_prefix='/api')
app.register_blueprint(campaigns_bp)  # Already has /api in routes
app.register_blueprint(settings_bp)  # Already has /api in routes
app.register_blueprint(admin_bp)  # Already has /api in routes
app.register_blueprint(admin_complete_bp)  # Already has /api in routes
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
# FIXED: Added /api prefix to payments blueprint
app.register_blueprint(payments_bp, url_prefix='/api')  # Payment processing routes
app.register_blueprint(crypto_payments_bp)  # Crypto payment routes - has /api in blueprint
app.register_blueprint(support_tickets_bp)  # Support ticket system - has /api in blueprint
# FIXED: Added /api prefix to stripe blueprint
app.register_blueprint(stripe_bp, url_prefix='/api/stripe')  # Stripe payment processing

@app.route('/', defaults={'path': ''}) 
@app.route('/<path:path>')
def serve(path):
    # Skip API routes - let them be handled by blueprints
    if path.startswith('api/') or path.startswith('t/') or path.startswith('p/') or path.startswith('q/'):
        return "Route not found", 404
    
    static_folder_path = app.static_folder
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
