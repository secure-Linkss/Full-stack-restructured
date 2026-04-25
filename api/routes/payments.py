"""
payments.py — Unified payment plans & subscription routes
"""
import os
import logging
from flask import g, Blueprint, request, jsonify, session
from api.database import db
from api.models.user import User
from api.models.payment import Payment
from api.middleware.auth_decorators import login_required
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
payments_bp = Blueprint("payments", __name__)

PLANS = {
    'weekly':    {'price': 35,  'duration_days': 7,   'name': 'Weekly'},
    'biweekly':  {'price': 68,  'duration_days': 14,  'name': 'Bi-Weekly'},
    'monthly':   {'price': 150, 'duration_days': 30,  'name': 'Monthly'},
    'quarterly': {'price': 420, 'duration_days': 90,  'name': 'Quarterly'},
    'pro':       {'price': 150, 'duration_days': 30,  'name': 'Pro'},
    'enterprise':{'price': 500, 'duration_days': 365, 'name': 'Enterprise'},
}


@payments_bp.route("/api/payments/plans", methods=["GET"])
def get_plans():
    """Public: list available subscription plans"""
    return jsonify({
        "success": True,
        "plans": [
            {"id": k, "name": v["name"], "price": v["price"], "duration_days": v["duration_days"]}
            for k, v in PLANS.items()
        ]
    }), 200


@payments_bp.route("/api/payments/subscription", methods=["GET"])
@login_required
def get_subscription_status():
    """Get current user subscription status"""
    user = User.query.get(g.user.id)
    return jsonify({
        "success": True,
        "plan_type": user.plan_type,
        "status": user.subscription_status,
        "subscription_expiry": user.subscription_expiry.isoformat() if user.subscription_expiry else None,
        "is_active": user.is_active,
        "days_remaining": (
            max(0, (user.subscription_expiry - datetime.utcnow()).days)
            if user.subscription_expiry else None
        )
    }), 200


@payments_bp.route("/api/payments/history", methods=["GET"])
@login_required
def get_payment_history():
    """Get all payments for current user"""
    user_id = g.user.id
    payments = Payment.query.filter_by(user_id=user_id).order_by(Payment.created_at.desc()).all()
    return jsonify({"success": True, "payments": [p.to_dict() for p in payments]}), 200


@payments_bp.route("/api/payments/subscribe/stripe", methods=["POST"])
@login_required
def subscribe_stripe():
    """Initiate Stripe checkout — delegates to stripe_bp"""
    data = request.get_json() or {}
    plan_type = data.get("plan_type")
    if plan_type not in PLANS:
        return jsonify({"success": False, "error": "Invalid plan type"}), 400

    # Forward to stripe blueprint logic
    from api.routes.stripe_payments import create_checkout_session
    return create_checkout_session()


@payments_bp.route("/api/payments/subscribe/crypto", methods=["POST"])
@login_required
def subscribe_crypto():
    """Get crypto wallet info for selected plan"""
    from api.models.crypto_wallet_address import CryptoWalletAddress
    data = request.get_json() or {}
    plan_type = data.get("plan_type")
    currency = data.get("currency", "ETH").upper()

    if plan_type not in PLANS:
        return jsonify({"success": False, "error": "Invalid plan type"}), 400

    wallet = CryptoWalletAddress.query.filter_by(currency=currency, is_active=True).first()
    plan = PLANS[plan_type]

    return jsonify({
        "success": True,
        "plan": {"id": plan_type, "price": plan["price"], "duration_days": plan["duration_days"]},
        "wallet": wallet.to_dict() if wallet else None,
        "instructions": (
            f"Send exactly ${plan['price']} USD worth of {currency} to the wallet address above, "
            "then submit your transaction hash via /api/crypto-payments/submit-proof"
        )
    }), 200
