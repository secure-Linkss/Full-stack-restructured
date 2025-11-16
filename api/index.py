import os
import sys

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Import models and blueprints
from api.models.user import db, User
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

from api.routes.user import user_bp
from api.routes.auth import auth_bp
from api.routes.links import links_bp
from api.routes.track import track_bp
from api.routes.events import events_bp
from api.routes.analytics import analytics_bp
from api.routes.campaigns import campaigns_bp
from api.routes.settings import settings_bp
from api.routes.admin import admin_bp
from api.routes.admin_complete import admin_complete_bp
from api.routes.admin_settings import admin_settings_bp
from api.routes.security import security_bp
from api.routes.telegram import telegram_bp
from api.routes.page_tracking import page_tracking_bp
from api.routes.shorten import shorten_bp
from api.routes.notifications import notifications_bp
from api.routes.quantum_redirect import quantum_bp
from api.routes.advanced_security import advanced_security_bp
from api.routes.domains import domains_bp
from api.routes.profile import profile_bp
from api.routes.broadcaster import broadcaster_bp
from api.routes.pending_users import pending_users_bp
from api.routes.payments import payments_bp
from api.routes.crypto_payments import crypto_payments_bp
from api.routes.support_tickets import support_tickets_bp
from api.routes.admin_missing import admin_missing_bp
from api.routes.user_missing import user_missing_bp
from api.routes.missing_api_routes import missing_routes_bp

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
app.register_blueprint(admin_missing_bp)  # Missing admin routes
app.register_blueprint(user_missing_bp)  # Missing user routes
app.register_blueprint(missing_routes_bp)  # Missing API routes

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
