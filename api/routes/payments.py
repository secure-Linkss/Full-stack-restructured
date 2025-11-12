from flask import Blueprint, request, jsonify
from src.database import db
from src.models.user import User
from functools import wraps
from datetime import datetime, timedelta
import os

payments_bp = Blueprint("payments", __name__)

# FIXED: Added token_required decorator
def get_current_user():
    """Get current user from token"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        user = User.verify_token(token)
        if user:
            return user
    return None

def token_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        return f(user, *args, **kwargs)
    return decorated_function

# Define plan details
PLANS = {
    'weekly': {'price': 35, 'duration_days': 7, 'stripe_price_id': os.environ.get('STRIPE_WEEKLY_PRICE_ID')},
    'biweekly': {'price': 68, 'duration_days': 14, 'stripe_price_id': os.environ.get('STRIPE_BIWEEKLY_PRICE_ID')},
    'monthly': {'price': 150, 'duration_days': 30, 'stripe_price_id': os.environ.get('STRIPE_MONTHLY_PRICE_ID')},
    'quarterly': {'price': 420, 'duration_days': 90, 'stripe_price_id': os.environ.get('STRIPE_QUARTERLY_PRICE_ID')},
}

@payments_bp.route("/payments/plans", methods=["GET"])
def get_plans():
    """Returns the list of available subscription plans."""
    # Return only the safe plan details, excluding sensitive keys
    safe_plans = {k: {'price': v['price'], 'duration_days': v['duration_days']} for k, v in PLANS.items()}
    return jsonify({"plans": safe_plans}), 200

@payments_bp.route("/payments/subscription", methods=["GET"])
@token_required
def get_subscription_status(current_user):
    """Returns the current user's subscription status."""
    return jsonify({
        "plan_type": current_user.plan_type,
        "status": current_user.status,
        "subscription_expiry": current_user.subscription_expiry.isoformat() if current_user.subscription_expiry else None,
        "is_active": current_user.is_active
    }), 200

@payments_bp.route("/payments/subscribe/crypto", methods=["POST"])
@token_required
def subscribe_crypto(current_user):
    """Initiates a crypto payment process (mock/placeholder)."""
    data = request.get_json()
    plan_type = data.get('plan_type')
    
    if plan_type not in PLANS:
        return jsonify({"error": "Invalid plan type"}), 400

    # In a real application, this would call a crypto payment gateway API
    # and return a payment address and amount.
    
    # For now, we'll simulate a pending verification ID
    verification_id = f"CRYPTO_PENDING_{current_user.id}_{datetime.utcnow().timestamp()}"
    
    # Update user status to pending verification
    current_user.status = 'crypto_pending'
    db.session.commit()

    return jsonify({
        "msg": "Crypto payment initiated. Waiting for verification.",
        "verification_id": verification_id
    }), 200

@payments_bp.route("/payments/crypto/verify", methods=["POST"])
@token_required
def verify_crypto_payment(current_user):
    """Verifies a crypto payment (mock/placeholder)."""
    # In a real application, this would handle the uploaded screenshot/proof
    # and wait for manual or automated confirmation.
    
    # For now, we'll simulate success and activate the user
    
    if current_user.status != 'crypto_pending':
        return jsonify({"error": "No pending crypto payment to verify"}), 400

    # Simulate successful verification
    plan_type = 'monthly'  # Assuming monthly for this mock
    duration_days = PLANS[plan_type]['duration_days']
    
    current_user.plan_type = plan_type
    current_user.status = 'active'
    current_user.is_active = True
    current_user.subscription_expiry = datetime.utcnow() + timedelta(days=duration_days)
    
    db.session.commit()

    return jsonify({"msg": "Crypto payment verified and subscription activated!"}), 200

@payments_bp.route("/payments/subscribe/stripe", methods=["POST"])
@token_required
def subscribe_stripe(current_user):
    """Placeholder for Stripe subscription initiation."""
    data = request.get_json()
    plan_type = data.get('plan_type')
    
    if plan_type not in PLANS:
        return jsonify({"error": "Invalid plan type"}), 400

    # In a real application, this would call the Stripe API to create a checkout session
    # and return the session URL for the frontend to redirect to.
    
    # For now, we'll return a placeholder success
    return jsonify({"msg": "Stripe checkout session created (placeholder)"}), 200
