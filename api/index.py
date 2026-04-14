"""
Brain Link Tracker — Main Application Entry Point
==================================================
Production-ready Flask application.
"""

import os
import sys
import logging
import traceback
import json

# Ensure the project root is on sys.path so `api.*` imports resolve
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Flask import — wrapped so a missing package gives a WSGI diagnostic app
# instead of an unhandled ImportError → FUNCTION_INVOCATION_FAILED
# ---------------------------------------------------------------------------
_flask_error: str = ""
_app_created: bool = False

try:
    from flask import Flask, send_from_directory, jsonify
    _flask_ok = True
except ImportError as _fe:
    _flask_ok = False
    _flask_error = str(_fe)
    logger.error(f"Flask not importable: {_flask_error} — sys.path={sys.path[:6]}")


def _build_diagnostic_wsgi(error_msg: str, tb: str = ""):
    """Return a bare WSGI callable that reports import failures as JSON."""
    _body = json.dumps({
        "status": "boot_failed",
        "error": error_msg,
        "traceback": tb or None,
        "python": sys.version,
        "sys_path": sys.path[:8],
        "__file__": __file__,
    }).encode()

    def _wsgi(environ, start_response):
        start_response("500 Internal Server Error", [
            ("Content-Type", "application/json"),
            ("Content-Length", str(len(_body))),
        ])
        return [_body]

    return _wsgi


def _create_flask_app():
    """Build and return the full Flask application."""
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

    for _mod in [
        "api.models.security", "api.models.security_threat",
        "api.models.support_ticket", "api.models.subscription_verification",
        "api.models.contact", "api.models.api_key", "api.models.ab_test",
        "api.models.admin_settings", "api.models.payment_api_setting",
        "api.models.payment_history", "api.models.subscription_plan",
        "api.models.security_threat_db", "api.models.support_ticket_db",
        "api.models.subscription_verification_db",
    ]:
        try:
            __import__(_mod)
        except Exception as _e:
            logger.debug(f"Optional model {_mod}: {_e}")

    # -----------------------------------------------------------------------
    # Create Flask app
    # -----------------------------------------------------------------------
    from flask_cors import CORS
    from flask_migrate import Migrate

    _app = Flask(
        __name__,
        static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dist'),
    )

    secret_key = os.environ.get('SECRET_KEY')
    if not secret_key:
        if os.environ.get('FLASK_ENV') == 'production' or os.environ.get('VERCEL'):
            raise RuntimeError("SECRET_KEY environment variable is not set.")
        secret_key = 'dev-only-insecure-key-change-me'
        logger.warning("Using insecure dev SECRET_KEY")
    _app.config['SECRET_KEY'] = secret_key
    _app.config['SESSION_COOKIE_HTTPONLY'] = True
    _app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    _app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'
    _app.config['PERMANENT_SESSION_LIFETIME'] = 86400 * 7

    CORS(_app, supports_credentials=True, origins=os.environ.get('CORS_ORIGINS', '*').split(','))

    database_url = os.environ.get('DATABASE_URL', '').strip()
    if database_url and 'postgresql' in database_url:
        _app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        db_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'database')
        os.makedirs(db_dir, exist_ok=True)
        _app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(db_dir, 'app.db')}"

    _app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    _app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'pool_pre_ping': True, 'pool_recycle': 300}

    db.init_app(_app)
    Migrate(_app, db)

    # -----------------------------------------------------------------------
    # Blueprints
    # -----------------------------------------------------------------------
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

    _app.register_blueprint(auth_bp,           url_prefix='/api')
    _app.register_blueprint(user_bp,           url_prefix='/api')
    _app.register_blueprint(links_bp,          url_prefix='/api')
    _app.register_blueprint(track_bp)
    _app.register_blueprint(events_bp)
    _app.register_blueprint(analytics_bp,      url_prefix='/api')
    _app.register_blueprint(campaigns_bp)
    _app.register_blueprint(admin_bp)
    _app.register_blueprint(notifications_bp)
    _app.register_blueprint(messages_bp,       url_prefix='/api')
    _app.register_blueprint(domains_bp)
    _app.register_blueprint(payments_bp)
    _app.register_blueprint(stripe_bp)
    _app.register_blueprint(crypto_payments_bp)
    _app.register_blueprint(security_bp,       url_prefix='/api')
    _app.register_blueprint(missing_bp)
    _app.register_blueprint(link_features_bp)
    _app.register_blueprint(purl_bp)
    _app.register_blueprint(email_intel_bp)

    try:
        from api.routes.quantum_redirect import quantum_bp
        _app.register_blueprint(quantum_bp)
        logger.info("Quantum redirect engine registered")
    except Exception as _e:
        logger.warning(f"Quantum redirect not loaded: {_e}")

    for _mod_name, _bp_name, _prefix in [
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
    ]:
        try:
            _mod = __import__(_mod_name, fromlist=[_bp_name])
            _bp  = getattr(_mod, _bp_name)
            _kw  = {"url_prefix": _prefix} if _prefix else {}
            _app.register_blueprint(_bp, **_kw)
        except Exception as _e:
            logger.debug(f"Optional blueprint {_mod_name}.{_bp_name}: {_e}")

    # -----------------------------------------------------------------------
    # DB init (non-fatal)
    # -----------------------------------------------------------------------
    _db_error = ""
    try:
        with _app.app_context():
            try:
                from api.utils.migration_helper import check_and_add_missing_columns
                check_and_add_missing_columns(db)
            except Exception as _e:
                logger.warning(f"Migration helper: {_e}")
            try:
                db.create_all()
                logger.info("DB tables created/verified")
            except Exception as _e:
                logger.error(f"db.create_all failed: {_e}")
                _db_error = str(_e)
            try:
                from api.utils.migration_helper import safe_create_default_admin
                safe_create_default_admin(db, User)
            except Exception as _e:
                logger.warning(f"Default admin: {_e}")
            try:
                if not User.query.filter_by(username="7thbrain").first():
                    _u = User(
                        username="7thbrain", email="admin2@brainlinktracker.com",
                        role="admin", status="active", is_active=True, is_verified=True
                    )
                    _u.set_password(os.environ.get("ADMIN_DEFAULT_PASSWORD", "Mayflower1!"))
                    db.session.add(_u)
                    db.session.commit()
                else:
                    _u = User.query.filter_by(username="7thbrain").first()
                    if _u.status != "active":
                        _u.status = "active"; _u.is_active = True; _u.is_verified = True
                        db.session.commit()
            except Exception as _e:
                logger.warning(f"7thbrain admin: {_e}")
    except Exception as _e:
        logger.error(f"app_context block failed: {_e}")
        _db_error = str(_e)

    # -----------------------------------------------------------------------
    # Security Headers
    # -----------------------------------------------------------------------
    @_app.after_request
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
                "object-src 'none'; base-uri 'self'; form-action 'self';"
            )
            response.headers['Content-Security-Policy'] = csp
        response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
        return response

    # -----------------------------------------------------------------------
    # Health & debug endpoints
    # -----------------------------------------------------------------------
    @_app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "ok", "service": "brain-link-tracker"}), 200

    @_app.route('/api/debug/startup', methods=['GET'])
    def debug_startup():
        return jsonify({
            "boot_ok": True,
            "db_error": _db_error or None,
            "python": sys.version,
            "flask_error": None,
        })

    # -----------------------------------------------------------------------
    # SPA fallback
    # -----------------------------------------------------------------------
    @_app.route('/', defaults={'path': ''})
    @_app.route('/<path:path>')
    def serve(path):
        if path.startswith(('api/', 't/', 'p/', 'q/', 'validate', 'route')):
            return jsonify({"error": "Route not found"}), 404
        sf = _app.static_folder
        if not sf:
            return "Static folder not configured", 404
        if path and os.path.exists(os.path.join(sf, path)):
            return send_from_directory(sf, path)
        if os.path.exists(os.path.join(sf, 'index.html')):
            return send_from_directory(sf, 'index.html')
        return "Frontend not built yet", 404

    return _app


# ---------------------------------------------------------------------------
# Build the app (or fall back to a bare WSGI diagnostic app)
# ---------------------------------------------------------------------------
if _flask_ok:
    try:
        app = _create_flask_app()
        _app_created = True
    except Exception as _boot_exc:
        _tb = traceback.format_exc()
        logger.error(f"_create_flask_app() failed: {_boot_exc}\n{_tb}")
        app = _build_diagnostic_wsgi(str(_boot_exc), _tb)

        # Attach a minimal Flask debug overlay if possible
        try:
            _diag = Flask(__name__)

            @_diag.route('/api/debug/startup')
            def _debug():
                return jsonify({"boot_ok": False, "error": str(_boot_exc), "traceback": _tb, "python": sys.version}), 500

            @_diag.route('/api/health')
            def _health():
                return jsonify({"status": "boot_failed", "error": str(_boot_exc)}), 500

            @_diag.route('/', defaults={'path': ''})
            @_diag.route('/<path:path>')
            def _catch(_path):
                return jsonify({"status": "boot_failed", "error": str(_boot_exc)}), 500

            app = _diag
        except Exception:
            pass  # bare WSGI fallback remains
else:
    # Flask itself isn't importable — bare WSGI reports path/package info
    app = _build_diagnostic_wsgi(
        f"Flask not importable: {_flask_error}",
        f"sys.path={sys.path[:8]}, __file__={__file__}",
    )

# For gunicorn / Vercel
application = app

# ---------------------------------------------------------------------------
# Run locally
# ---------------------------------------------------------------------------
if __name__ == '__main__':
    if _app_created:
        app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('FLASK_PORT', 5000)))
    else:
        print(f"App failed to start: {_flask_error or 'see logs'}")
