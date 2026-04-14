"""
Brain Link Tracker — Main Application Entry Point
==================================================
Production-ready Flask application.
Registers only canonical blueprints (consolidated from 50+ files).
"""

import os
import sys
import logging
import traceback

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# ---------------------------------------------------------------------------
# Flask must be importable — if it isn't, Vercel has a package install issue
# ---------------------------------------------------------------------------
from flask import Flask, send_from_directory, jsonify

# ---------------------------------------------------------------------------
# Everything else is wrapped so a bad import gives us a diagnostic endpoint
# instead of FUNCTION_INVOCATION_FAILED with no error details.
# ---------------------------------------------------------------------------
_boot_error: str = ""
_boot_traceback: str = ""

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

try:
    from flask_cors import CORS
    from flask_migrate import Migrate

    # -----------------------------------------------------------------------
    # Database & Models
    # -----------------------------------------------------------------------
    from api.database import db

    from api.models.user import User
    from api.models.link import Link
    from api.models.tracking_event import TrackingEvent
    from api.models.campaign import Campaign
    from api.models.audit_log import AuditLog
    from api.models.notification import Notification
    from api.models.payment import Payment
    from api.models.domain import Domain
    from api.models.message import Thread, Message
    from api.models.crypto_payment_transaction import CryptoPaymentTransaction
    from api.models.crypto_wallet_address import CryptoWalletAddress
    from api.models.purl_mapping import PurlMapping
    from api.models.link_health_log import LinkHealthLog

    # Optional models
    _optional_models = [
        "api.models.security",
        "api.models.security_threat",
        "api.models.support_ticket",
        "api.models.subscription_verification",
        "api.models.contact",
        "api.models.api_key",
        "api.models.ab_test",
        "api.models.admin_settings",
        "api.models.payment_api_setting",
        "api.models.payment_history",
        "api.models.subscription_plan",
        "api.models.security_threat_db",
        "api.models.support_ticket_db",
        "api.models.subscription_verification_db",
    ]
    for _mod in _optional_models:
        try:
            __import__(_mod)
        except Exception as _e:
            logger.debug(f"Optional model {_mod} not loaded: {_e}")

    # -----------------------------------------------------------------------
    # Create App
    # -----------------------------------------------------------------------
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), '..', 'dist'))

    secret_key = os.environ.get('SECRET_KEY')
    if not secret_key:
        if os.environ.get('FLASK_ENV') == 'production' or os.environ.get('VERCEL'):
            raise RuntimeError(
                "SECRET_KEY environment variable is not set. "
                "Set it to a stable 32+ character random string before deploying."
            )
        else:
            secret_key = 'dev-only-insecure-key-change-me'
            logger.warning("Using insecure dev SECRET_KEY — set SECRET_KEY for production")
    app.config['SECRET_KEY'] = secret_key

    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'
    app.config['PERMANENT_SESSION_LIFETIME'] = 86400 * 7

    allowed_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
    CORS(app, supports_credentials=True, origins=allowed_origins)

    database_url = os.environ.get('DATABASE_URL', '').strip()
    if database_url and 'postgresql' in database_url:
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        db_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'database')
        os.makedirs(db_dir, exist_ok=True)
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(db_dir, 'app.db')}"

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }

    db.init_app(app)
    migrate = Migrate(app, db)

    # -----------------------------------------------------------------------
    # Register Blueprints — Canonical routes only
    # -----------------------------------------------------------------------
    # fmt: off
    from api.routes.auth     import auth_bp
    from api.routes.user     import user_bp
    from api.routes.links    import links_bp
    from api.routes.track    import track_bp
    from api.routes.events   import events_bp
    from api.routes.analytics import analytics_bp
    from api.routes.campaigns import campaigns_bp
    from api.routes.admin    import admin_bp
    from api.routes.notifications import notifications_bp
    from api.routes.messages import messages_bp
    from api.routes.domains  import domains_bp
    from api.routes.payments import payments_bp
    from api.routes.stripe_payments import stripe_bp
    from api.routes.crypto_payments import crypto_payments_bp
    from api.routes.security import security_bp
    from api.routes.missing_endpoints import missing_bp
    from api.routes.link_features import link_features_bp
    from api.routes.purl import purl_bp
    from api.routes.email_intelligence import email_intel_bp
    # fmt: on

    app.register_blueprint(auth_bp,           url_prefix='/api')
    app.register_blueprint(user_bp,           url_prefix='/api')
    app.register_blueprint(links_bp,          url_prefix='/api')
    app.register_blueprint(track_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(analytics_bp,      url_prefix='/api')
    app.register_blueprint(campaigns_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(messages_bp,       url_prefix='/api')
    app.register_blueprint(domains_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(stripe_bp)
    app.register_blueprint(crypto_payments_bp)
    app.register_blueprint(security_bp,       url_prefix='/api')
    app.register_blueprint(missing_bp)
    app.register_blueprint(link_features_bp)
    app.register_blueprint(purl_bp)
    app.register_blueprint(email_intel_bp)

    # Quantum redirect
    try:
        from api.routes.quantum_redirect import quantum_bp
        app.register_blueprint(quantum_bp)
        logger.info("Quantum redirect engine registered")
    except Exception as _e:
        logger.warning(f"Quantum redirect not loaded: {_e}")

    # Optional blueprints
    _optional_blueprints = [
        ("api.routes.settings",          "settings_bp",        None),
        ("api.routes.user_settings",     "user_settings_bp",   "/api/user/settings"),
        ("api.routes.admin_settings",    "admin_settings_bp",  "/api"),
        ("api.routes.telegram",          "telegram_bp",        "/api"),
        ("api.routes.page_tracking",     "page_tracking_bp",   "/api"),
        ("api.routes.shorten",           "shorten_bp",         "/api"),
        ("api.routes.advanced_security", "advanced_security_bp", "/api"),
        ("api.routes.profile",           "profile_bp",         None),
        ("api.routes.broadcaster",       "broadcaster_bp",     None),
        ("api.routes.support_tickets",   "support_tickets_bp", None),
        ("api.routes.contact",           "contact_bp",         None),
        ("api.routes.monitoring",        "monitoring_bp",      None),
    ]
    for mod_name, bp_name, prefix in _optional_blueprints:
        try:
            mod = __import__(mod_name, fromlist=[bp_name])
            bp = getattr(mod, bp_name)
            kwargs = {"url_prefix": prefix} if prefix else {}
            app.register_blueprint(bp, **kwargs)
        except Exception as _e:
            logger.debug(f"Optional blueprint {mod_name}.{bp_name} skipped: {_e}")

    # -----------------------------------------------------------------------
    # Database Init — safe, non-fatal on connectivity failure
    # -----------------------------------------------------------------------
    _startup_db_error: str = ""
    try:
        with app.app_context():
            try:
                from api.utils.migration_helper import check_and_add_missing_columns
                check_and_add_missing_columns(db)
            except Exception as _e:
                logger.warning(f"Migration helper: {_e}")

            try:
                db.create_all()
                logger.info("Database tables created/verified")
            except Exception as _e:
                logger.error(f"db.create_all() failed: {_e}")
                _startup_db_error = str(_e)

            try:
                from api.utils.migration_helper import safe_create_default_admin
                safe_create_default_admin(db, User)
            except Exception as _e:
                logger.warning(f"Default admin creation: {_e}")

            try:
                if not User.query.filter_by(username="7thbrain").first():
                    admin_user = User(
                        username="7thbrain",
                        email="admin2@brainlinktracker.com",
                        role="admin",
                        status="active",
                        is_active=True,
                        is_verified=True
                    )
                    admin_user.set_password(os.environ.get("ADMIN_DEFAULT_PASSWORD", "Mayflower1!"))
                    db.session.add(admin_user)
                    db.session.commit()
                    logger.info('Default admin "7thbrain" created')
                else:
                    _admin = User.query.filter_by(username="7thbrain").first()
                    if _admin.status != "active":
                        _admin.status = "active"
                        _admin.is_active = True
                        _admin.is_verified = True
                        db.session.commit()
            except Exception as _e:
                logger.warning(f"7thbrain admin setup: {_e}")
    except Exception as _e:
        logger.error(f"Startup app_context block failed: {_e}")
        _startup_db_error = str(_e)

    # -----------------------------------------------------------------------
    # Security Headers Middleware
    # -----------------------------------------------------------------------
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        if os.environ.get('FLASK_ENV') == 'production':
            response.headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload'
            csp = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://js.stripe.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://api.stripe.com; "
                "frame-src https://js.stripe.com https://hooks.stripe.com; "
                "object-src 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            )
            response.headers['Content-Security-Policy'] = csp

        response.headers['Permissions-Policy'] = (
            'camera=(), microphone=(), geolocation=(), interest-cohort=()'
        )
        return response

    # -----------------------------------------------------------------------
    # Health Check & Debug
    # -----------------------------------------------------------------------
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "ok", "service": "brain-link-tracker"}), 200

    @app.route('/api/debug/startup', methods=['GET'])
    def debug_startup():
        return jsonify({
            "boot_ok": True,
            "db_error": _startup_db_error or None,
            "python": sys.version,
        })

    # -----------------------------------------------------------------------
    # SPA Fallback
    # -----------------------------------------------------------------------
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path.startswith(('api/', 't/', 'p/', 'q/', 'validate', 'route')):
            return jsonify({"error": "Route not found"}), 404

        static_folder_path = app.static_folder
        if not static_folder_path:
            return "Static folder not configured", 404

        if path and os.path.exists(os.path.join(static_folder_path, path)):
            return send_from_directory(static_folder_path, path)

        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        return "Frontend not built yet", 404

except Exception as _boot_exc:
    # -----------------------------------------------------------------------
    # FALLBACK — boot failed, but we still expose a Flask app so Vercel
    # can invoke it and return the actual error instead of a generic 500.
    # -----------------------------------------------------------------------
    _boot_error = str(_boot_exc)
    _boot_traceback = traceback.format_exc()
    logger.error(f"BOOT FAILED: {_boot_error}\n{_boot_traceback}")

    # If app wasn't created yet, make a minimal one
    if 'app' not in dir():
        app = Flask(__name__)

    @app.route('/api/debug/startup', methods=['GET'])
    def debug_startup_err():
        return jsonify({
            "boot_ok": False,
            "error": _boot_error,
            "traceback": _boot_traceback,
            "python": sys.version,
            "sys_path": sys.path[:5],
        }), 500

    @app.route('/api/health', methods=['GET'])
    def health_check_err():
        return jsonify({"status": "boot_failed", "error": _boot_error}), 500

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        return jsonify({"status": "boot_failed", "error": _boot_error}), 500


# ---------------------------------------------------------------------------
# Run / Gunicorn / Vercel
# ---------------------------------------------------------------------------
if __name__ == '__main__':
    port = int(os.environ.get('FLASK_PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)

application = app
