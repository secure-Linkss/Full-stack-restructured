"""
Input validation and sanitization utilities
"""
import re
import bleach
from typing import Tuple

def validate_email(email: str) -> bool:
    """
    Validate email format using regex
    
    Args:
        email: Email address to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not email or not isinstance(email, str):
        return False
    
    # RFC 5322 compliant email regex (simplified)
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_pattern, email.strip()))

def validate_password(password: str) -> Tuple[bool, str]:
    """
    Validate password strength
    
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    
    Args:
        password: Password to validate
        
    Returns:
        Tuple[bool, str]: (is_valid, message)
    """
    if not password or not isinstance(password, str):
        return False, "Password is required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"
    
    return True, "Password is strong"

def sanitize_string(input_str: str, max_length: int = 255) -> str:
    """
    Sanitize string input to prevent XSS and injection attacks
    
    Args:
        input_str: String to sanitize
        max_length: Maximum allowed length
        
    Returns:
        str: Sanitized string
    """
    if not input_str:
        return ""
    
    if not isinstance(input_str, str):
        input_str = str(input_str)
    
    # Remove leading/trailing whitespace
    sanitized = input_str.strip()
    
    # Limit length
    sanitized = sanitized[:max_length]
    
    # Use bleach to clean HTML/script tags
    sanitized = bleach.clean(sanitized, tags=[], strip=True)
    
    return sanitized

def validate_username(username: str) -> Tuple[bool, str]:
    """
    Validate username format
    
    Requirements:
    - 3-30 characters
    - Alphanumeric and underscores only
    - Must start with a letter
    
    Args:
        username: Username to validate
        
    Returns:
        Tuple[bool, str]: (is_valid, message)
    """
    if not username or not isinstance(username, str):
        return False, "Username is required"
    
    username = username.strip()
    
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"
    
    if len(username) > 30:
        return False, "Username must be at most 30 characters long"
    
    if not re.match(r'^[a-zA-Z][a-zA-Z0-9_]*$', username):
        return False, "Username must start with a letter and contain only letters, numbers, and underscores"
    
    return True, "Username is valid"

def validate_url(url: str) -> Tuple[bool, str]:
    """
    Validate URL format
    
    Args:
        url: URL to validate
        
    Returns:
        Tuple[bool, str]: (is_valid, message)
    """
    if not url or not isinstance(url, str):
        return False, "URL is required"
    
    url = url.strip()
    
    # Basic URL pattern
    url_pattern = r'^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$'
    
    if not re.match(url_pattern, url):
        return False, "Invalid URL format. Must start with http:// or https://"
    
    if len(url) > 2048:
        return False, "URL is too long (max 2048 characters)"
    
    return True, "URL is valid"

def validate_phone(phone: str) -> Tuple[bool, str]:
    """
    Validate phone number format (international format)
    
    Args:
        phone: Phone number to validate
        
    Returns:
        Tuple[bool, str]: (is_valid, message)
    """
    if not phone or not isinstance(phone, str):
        return False, "Phone number is required"
    
    phone = phone.strip()
    
    # Remove common separators
    phone_clean = re.sub(r'[\s\-\(\)\.]', '', phone)
    
    # Check if it's a valid international format
    # Should start with + and have 7-15 digits
    if not re.match(r'^\+?[1-9]\d{6,14}$', phone_clean):
        return False, "Invalid phone number format. Use international format (e.g., +1234567890)"
    
    return True, "Phone number is valid"

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal and other attacks
    
    Args:
        filename: Filename to sanitize
        
    Returns:
        str: Sanitized filename
    """
    if not filename:
        return "unnamed"
    
    # Remove path separators
    filename = filename.replace('/', '').replace('\\', '')
    
    # Remove any non-alphanumeric characters except dots, hyphens, and underscores
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
    
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:250] + ('.' + ext if ext else '')
    
    return filename

def validate_plan_type(plan_type: str) -> Tuple[bool, str]:
    """
    Validate subscription plan type
    
    Args:
        plan_type: Plan type to validate
        
    Returns:
        Tuple[bool, str]: (is_valid, message)
    """
    valid_plans = ['free', 'weekly', 'biweekly', 'monthly', 'quarterly', 'pro', 'enterprise']
    
    if not plan_type or not isinstance(plan_type, str):
        return False, "Plan type is required"
    
    plan_type = plan_type.strip().lower()
    
    if plan_type not in valid_plans:
        return False, f"Invalid plan type. Must be one of: {', '.join(valid_plans)}"
    
    return True, "Plan type is valid"