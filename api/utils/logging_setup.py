# Logging_setup.py

"""
Production Logging Configuration
Add this to api/index.py or create src/utils/logging_config.py
"""

import logging
import os
from logging.handlers import RotatingFileHandler
from flask import request, g, jsonify
import time

def setup_logging(app):
    """Configure production-ready logging"""
    
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.mkdir('logs')
    
    # File handler for general logs
    file_handler = RotatingFileHandler(
        'logs/brainlinktracker.log',
        maxBytes=10240000,  # 10MB
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    
    # File handler for errors
    error_handler = RotatingFileHandler(
        'logs/errors.log',
        maxBytes=10240000,
        backupCount=10
    )
    error_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    error_handler.setLevel(logging.ERROR)
    app.logger.addHandler(error_handler)
    
    # Set log level based on environment
    if app.config['ENV'] == 'production':
        app.logger.setLevel(logging.INFO)
    else:
        app.logger.setLevel(logging.DEBUG)
    
    app.logger.info('Brain Link Tracker startup')

def log_request_info():
    """Log information about each request"""
    g.start_time = time.time()
    app.logger.info(f'Request: {request.method} {request.path}')

def log_response_info(response):
    """Log information about each response"""
    if hasattr(g, 'start_time'):
        elapsed = time.time() - g.start_time
        app.logger.info(
            f'Response: {response.status_code} '
            f'[{elapsed:.3f}s] {request.method} {request.path}'
        )
    return response

# Add to Flask app
# NOTE: 'app' is assumed to be defined in the context where this code is added.
# app.before_request(log_request_info)
# app.after_request(log_response_info)

# Error handler
# NOTE: 'app' is assumed to be defined in the context where this code is added.
# @app.errorhandler(Exception)
def handle_exception(e):
    """Log unhandled exceptions"""
    # NOTE: 'app' is assumed to be defined in the context where this code is added.
    # app.logger.error(f'Unhandled exception: {str(e)}', exc_info=True)
    return jsonify({"error": "An internal error occurred"}), 500

# Optional: Sentry integration for error tracking
"""
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN'),
    integrations=[FlaskIntegration()],
    traces_sample_rate=1.0,
    environment=os.environ.get('FLASK_ENV', 'development')
)
"""

# Installation:
# pip install sentry-sdk[flask]