# Https_redirect.py

"""
HTTPS Redirect Middleware
Add this to api/index.py to force HTTPS in production
"""

from flask import request, redirect

def force_https():
    """Redirect HTTP to HTTPS in production"""
    if request.url.startswith('http://') and not request.is_secure:
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)

# Add to your Flask app
@app.before_request
def before_request():
    # Only enforce HTTPS in production
    if app.config['ENV'] == 'production':
        redirect_response = force_https()
        if redirect_response:
            return redirect_response

# Alternative: Use Flask-Talisman for comprehensive security headers
"""
from flask_talisman import Talisman

# Initialize Talisman
Talisman(app, 
         force_https=True,
         strict_transport_security=True,
         content_security_policy={
             'default-src': "'self'",
             'script-src': ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
             'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
             'font-src': ["'self'", "https://fonts.gstatic.com"],
             'img-src': ["'self'", "data:", "https:"],
         })
"""

# Installation:
# pip install flask-talisman