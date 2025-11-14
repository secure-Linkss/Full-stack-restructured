import os
import sys

# DON'T CHANGE THIS !!!
# This ensures the project root is in the path for imports like 'api.database'
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy.exc import OperationalError
import logging

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
from api.models.security_threat import SecurityThreat as SecurityThreatDB
from api.models.support_ticket import SupportTicket as SupportTicketDB
from api.models.subscription_verification import SubscriptionVerification as SubscriptionVerificationDB

# Import routes
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
from api.routes.stripe_payments import stripe_bp


# --- PRODUCTION-READY APP INITIALIZATION ---
# Get the absolute path of the project's root directory (one level up from /api)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Initialize Flask app, pointing static_folder to the 'dist' directory in the project root
app = Flask(__name__, static_folder=os.path.join(BASE_DIR, 'dist'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load SECRET_KEY from environment variables. A default is provided for local dev,
# but you MUST set this in production (e.g., in Railway).
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a-strong-default-secret-key-for-development')

# CORS Configuration - Restrict to allowed origins in production
allowed_origins = os.environ.get('ALLOWED_ORIGINS', '*')
if allowed_origins != '*':
    allowed_origins = [origin.strip() for origin in allowed_origins.split(',')]
CORS(app, supports_credentials=True, origins=allowed_origins)

# --- DATABASE CONNECTION FIX (MANUS'S IMPROVED VERSION) ---
database_url = os.environ.get('DATABASE_URL')
if database_url:
    # Production - PostgreSQL (or other DB via URL)
    # The 'psycopg2' library is required for PostgreSQL.
    # The URL is often modified to fit SQLAlchemy's format (e.g., postgres:// -> postgresql://)
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    logger.info("Using PostgreSQL database (Production)")
else:
    # Development/Testing - SQLite fallback
    # Note: This path is relative to the project root (BASE_DIR)
    db_path = os.path.join(BASE_DIR, 'src', 'database', 'app.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
    logger.info("Using SQLite database (Development)")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
}

db.init_app(app)
migrate = Migrate(app, db)


# --- SECURE DATABASE SEEDING FUNCTION ---
def create_default_users():
    """Creates default admin users if they don't exist, using passwords from environment variables."""
    with app.app_context():
        try:
            # Attempt to create all tables if they don't exist
            db.create_all()
            logger.info("Database tables created/verified successfully")
            
            # --- Default Admin 1: "Brain" ---
            ADMIN_USERNAME = "Brain"
            ADMIN_PASSWORD = os.environ.get('DEFAULT_ADMIN_PASSWORD')

            if not User.query.filter_by(username=ADMIN_USERNAME).first():
                if not ADMIN_PASSWORD:
                    logger.warning(f"DEFAULT_ADMIN_PASSWORD environment variable not set. Cannot create user '{ADMIN_USERNAME}'.")
                else:
                    admin_user = User(
                        username=ADMIN_USERNAME,
                        email="admin@brainlinktracker.com",
                        role="main_admin",
                        status="active",
                        is_active=True,
                        is_verified=True
                    )
                    admin_user.set_password(ADMIN_PASSWORD)
                    db.session.add(admin_user)
                    db.session.commit()
                    logger.info(f"Default admin user '{ADMIN_USERNAME}' created successfully")
            else:
                # Update existing admin user to active status (optional cleanup logic)
                admin_user = User.query.filter_by(username=ADMIN_USERNAME).first()
                if admin_user.status != "active":
                    admin_user.status = "active"
                    admin_user.is_active = True
                    admin_user.is_verified = True
                    db.session.commit()
                    logger.info(f"Default admin user '{ADMIN_USERNAME}' updated to active status")

            # --- Default Admin 2: "7thbrain" ---
            ADMIN_USERNAME_2 = "7thbrain"
            ADMIN_PASSWORD_2 = os.environ.get('DEFAULT_ADMIN_PASSWORD_2')

            if not User.query.filter_by(username=ADMIN_USERNAME_2).first():
                if not ADMIN_PASSWORD_2:
                    logger.warning(f"DEFAULT_ADMIN_PASSWORD_2 environment variable not set. Cannot create user '{ADMIN_USERNAME_2}'.")
                else:
                    admin_user2 = User(
                        username=ADMIN_USERNAME_2,
                        email="admin2@brainlinktracker.com",
                        role="admin",
                        status="active",
                        is_active=True,
                        is_verified=True
                    )
                    admin_user2.set_password(ADMIN_PASSWORD_2)
                    db.session.add(admin_user2)
                    db.session.commit()
                    logger.info(f"Default admin user '{ADMIN_USERNAME_2}' created successfully")
            else:
                # Update existing admin user to active status (optional cleanup logic)
                admin_user2 = User.query.filter_by(username=ADMIN_USERNAME_2).first()
                if admin_user2.status != "active":
                    admin_user2.status = "active"
                    admin_user2.is_active = True
                    admin_user2.is_verified = True
                    db.session.commit()
                    logger.info(f"Default admin user '{ADMIN_USERNAME_2}' updated to active status")
        
        except OperationalError as e:
            logger.error(f"Database Operational Error: {e}")
            logger.error("This usually means the database is not yet ready or the connection string is wrong.")
            logger.error("Ensure your DATABASE_URL is correct and the database service is running.")
        except Exception as e:
            logger.error(f"An unexpected error occurred during database setup: {e}")


# --- Run seeding function on app context ---
# NOTE: This is generally discouraged in production, but kept here to maintain original functionality.
# For a true production setup, use 'flask db upgrade' as a separate release command.
create_default_users()


# Register blueprints with correct prefixes
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(links_bp, url_prefix='/api')
app.register_blueprint(analytics_bp, url_prefix='/api')
app.register_blueprint(campaigns_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(admin_complete_bp)
app.register_blueprint(admin_settings_bp, url_prefix='/api')
app.register_blueprint(security_bp, url_prefix='/api')
app.register_blueprint(telegram_bp, url_prefix='/api')
app.register_blueprint(page_tracking_bp, url_prefix='/api')
app.register_blueprint(shorten_bp, url_prefix='/api')
app.register_blueprint(notifications_bp)
app.register_blueprint(quantum_bp)
app.register_blueprint(advanced_security_bp, url_prefix='/api')
app.register_blueprint(domains_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(track_bp)
app.register_blueprint(events_bp)
app.register_blueprint(broadcaster_bp)
app.register_blueprint(pending_users_bp)
app.register_blueprint(payments_bp, url_prefix='/api')
app.register_blueprint(crypto_payments_bp)
app.register_blueprint(support_tickets_bp)
app.register_blueprint(stripe_bp, url_prefix='/api/stripe')


# --- HEALTH CHECK ENDPOINT ---
@app.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': os.environ.get('RAILWAY_DEPLOYMENT_ID', 'local')
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }), 500


# --- CORRECTED SPA ROUTING ---
@app.route('/', defaults={'path': ''}) 
@app.route('/<path:path>')
def serve(path):
    """
    Serve static files and handle SPA routing.
    - API routes are handled by blueprints
    - Static files (CSS, JS, images) are served directly
    - All other routes serve index.html for client-side routing
    """
    # Skip API routes - let them be handled by blueprints
    if path.startswith('api/') or path.startswith('t/') or path.startswith('p/') or path.startswith('q/') or path.startswith('health'):
        return "Route not found", 404
    
    static_folder_path = app.static_folder
    
    # 1. Check if the path is a file that exists in the dist folder (e.g., app.css, favicon.ico)
    full_path = os.path.join(static_folder_path, path)
    if path != "" and os.path.exists(full_path) and not os.path.isdir(full_path):
        return send_from_directory(static_folder_path, path)
    
    # 2. For all other routes (like /features, /pricing, /dashboard), serve index.html
    # This allows the frontend router (React Router, Vue Router, etc.) to handle the routing.
    index_path = os.path.join(static_folder_path, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(static_folder_path, 'index.html')
    else:
        # Fallback if index.html is missing (should not happen in a successful build)
        logger.error("Frontend build not found (index.html missing in dist folder)")
        return "Frontend build not found. Please run 'pnpm run build' to generate the dist folder.", 500


if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=port)

# For gunicorn
application = app
