"""
Input Sanitization and Validation Utilities for Brain Link Tracker
"""

import re
import bleach
from urllib.parse import urlparse
from flask import jsonify

# Allowed HTML tags for rich text (if needed)
ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li']
ALLOWED_ATTRIBUTES = {'a': ['href', 'title']}

def sanitize_string(text, max_length=255):
    """Sanitize a string input"""
    if not text:
        return ""
    
    # Remove any HTML tags
    text = bleach.clean(text, tags=[], strip=True)
    
    # Limit length
    if len(text) > max_length:
        text = text[:max_length]
    
    return text.strip()

def sanitize_html(html_content):
    """Sanitize HTML content while preserving allowed tags"""
    if not html_content:
        return ""
    
    return bleach.clean(
        html_content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True
    )

def sanitize_url(url):
    """Validate and sanitize URL"""
    if not url:
        return None
    
    # Remove any whitespace
    url = url.strip()
    
    # Check if URL has a scheme, add http:// if missing
    if not url.startswith(('http://', 'https://')):
        url = 'http://' + url
    
    # Parse URL to validate
    try:
        parsed = urlparse(url)
        if not all([parsed.scheme, parsed.netloc]):
            return None
        
        # Only allow http and https
        if parsed.scheme not in ['http', 'https']:
            return None
        
        return url
    except:
        return None

def validate_email(email):
    """Validate email address format"""
    if not email:
        return False
    
    # Basic email regex
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_username(username):
    """Validate username format"""
    if not username:
        return False, "Username is required"
    
    if len(username) < 3:
        return False, "Username must be at least 3 characters"
    
    if len(username) > 50:
        return False, "Username must be less than 50 characters"
    
    # Allow alphanumeric, underscore, and hyphen
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return False, "Username can only contain letters, numbers, underscores, and hyphens"
    
    return True, ""

def validate_password(password):
    """Validate password strength"""
    if not password:
        return False, "Password is required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    # Check for at least one uppercase letter
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    # Check for at least one lowercase letter
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    # Check for at least one digit
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    # Check for at least one special character
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, ""

def sanitize_link_data(data):
    """Sanitize link creation/update data"""
    sanitized = {}
    
    # Required fields
    if 'original_url' in data:
        sanitized['original_url'] = sanitize_url(data['original_url'])
        if not sanitized['original_url']:
            return None, "Invalid URL format"
    
    # Optional fields
    if 'title' in data:
        sanitized['title'] = sanitize_string(data['title'], max_length=255)
    
    if 'description' in data:
        sanitized['description'] = sanitize_string(data['description'], max_length=1000)
    
    if 'tags' in data and isinstance(data['tags'], list):
        sanitized['tags'] = [sanitize_string(tag, max_length=50) for tag in data['tags']]
    
    if 'click_limit' in data:
        try:
            sanitized['click_limit'] = int(data['click_limit'])
            if sanitized['click_limit'] < 0:
                return None, "Click limit must be non-negative"
        except (ValueError, TypeError):
            return None, "Invalid click limit"
    
    return sanitized, None

def sanitize_campaign_data(data):
    """Sanitize campaign creation/update data"""
    sanitized = {}
    
    if 'name' in data:
        sanitized['name'] = sanitize_string(data['name'], max_length=255)
        if not sanitized['name']:
            return None, "Campaign name is required"
    
    if 'description' in data:
        sanitized['description'] = sanitize_string(data['description'], max_length=2000)
    
    if 'budget' in data:
        try:
            sanitized['budget'] = float(data['budget'])
            if sanitized['budget'] < 0:
                return None, "Budget must be non-negative"
        except (ValueError, TypeError):
            return None, "Invalid budget value"
    
    if 'tags' in data and isinstance(data['tags'], list):
        sanitized['tags'] = [sanitize_string(tag, max_length=50) for tag in data['tags']]
    
    return sanitized, None

def validate_request_data(required_fields, data):
    """Validate that required fields are present in request data"""
    missing = []
    for field in required_fields:
        if field not in data or not data[field]:
            missing.append(field)
    
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    
    return True, ""

# XSS Prevention
def prevent_xss(text):
    """Prevent XSS attacks by encoding special characters"""
    if not text:
        return ""
    
    # Use bleach to clean the text
    return bleach.clean(text, tags=[], strip=True)

# SQL Injection Prevention (use with SQLAlchemy parameterized queries)
def validate_sql_safe(text):
    """Check if text is safe for SQL (should always use parameterized queries instead)"""
    dangerous_patterns = [
        r"('|(--)|;|\/\*|\*\/|xp_|sp_|exec|execute|select|insert|update|delete|drop|create|alter)",
        r"(union|from|where|order by|group by)"
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, str(text), re.IGNORECASE):
            return False
    
    return True
