"""
Payment Processing - Stripe Integration
Handles card payments, subscriptions, and webhooks
"""

from flask import Blueprint, request, jsonify
from functools import wraps
import os
import stripe
from src.database import db
from src.models.user import User
from src.models.audit_log import AuditLog
from src.models.notification import Notification
from datetime import datetime, timedelta

payments_bp = Blueprint("payments", __name__)

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")

def get_current_user():
    """Get current user from token"""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        user = User.verify_token(token)
        if user:
            return user
    return None

def login_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        return f(user, *args, **kwargs)
    return decorated_function

# Subscription Plans Configuration
PLANS = {
    "free": {
        "name": "Free",
        "price": 0,
        "features": ["Basic tracking", "Up to 10 links", "7 days data retention"],
        "limits": {"links": 10, "clicks": 1000}
    },
    "pro": {
        "name": "Pro",
        "price": 29.99,
        "stripe_price_id": os.environ.get("STRIPE_PRO_PRICE_ID", ""),
        "features": ["Advanced tracking", "Unlimited links", "90 days data retention", "Custom domains", "Email support"],
        "limits": {"links": -1, "clicks": -1}
    },
    "enterprise": {
        "name": "Enterprise",
        "price": 99.99,
        "stripe_price_id": os.environ.get("STRIPE_ENTERPRISE_PRICE_ID", ""),
        "features": ["Everything in Pro", "White label", "Priority support", "API access", "Custom integrations"],
        "limits": {"links": -1, "clicks": -1}
    }
}

@payments_bp.route("/api/payments/plans", methods=["GET"])
def get_plans():
    """Get available subscription plans"""
    return jsonify({"plans": PLANS}), 200

@payments_bp.route("/api/payments/create-checkout-session", methods=["POST"])
@login_required
def create_checkout_session(current_user):
    """Create Stripe checkout session for subscription"""
    try:
        data = request.get_json()
        plan_type = data.get("plan_type")

        if plan_type not in ["pro", "enterprise"]:
            return jsonify({"error": "Invalid plan type"}), 400

        if not stripe.api_key:
            return jsonify({"error": "Stripe not configured"}), 503

        plan = PLANS[plan_type]

        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price": plan["stripe_price_id"],
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=data.get("success_url", request.host_url + "payment/success?session_id={CHECKOUT_SESSION_ID}"),
            cancel_url=data.get("cancel_url", request.host_url + "payment/cancel"),
            client_reference_id=str(current_user.id),
            customer_email=current_user.email,
            metadata={
                "user_id": current_user.id,
                "plan_type": plan_type
            }
        )

        return jsonify({
            "sessionId": checkout_session.id,
            "url": checkout_session.url
        }), 200

    except stripe.error.StripeError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Error creating checkout session: {e}")
        return jsonify({"error": "Failed to create checkout session"}), 500

@payments_bp.route("/api/payments/create-payment-intent", methods=["POST"])
@login_required
def create_payment_intent(current_user):
    """Create one-time payment intent"""
    try:
        data = request.get_json()
        plan_type = data.get("plan_type")

        if plan_type not in ["pro", "enterprise"]:
            return jsonify({"error": "Invalid plan type"}), 400

        if not stripe.api_key:
            return jsonify({"error": "Stripe not configured"}), 503

        plan = PLANS[plan_type]
        amount = int(plan["price"] * 100)  # Convert to cents

        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency="usd",
            metadata={
                "user_id": current_user.id,
                "plan_type": plan_type
            }
        )

        return jsonify({
            "clientSecret": intent.client_secret
        }), 200

    except stripe.error.StripeError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Error creating payment intent: {e}")
        return jsonify({"error": "Failed to create payment intent"}), 500

@payments_bp.route("/api/payments/webhook", methods=["POST"])
def stripe_webhook():
    """Handle Stripe webhook events"""
    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

    if not webhook_secret:
        return jsonify({"error": "Webhook secret not configured"}), 500

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        return jsonify({"error": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError as e:
        return jsonify({"error": "Invalid signature"}), 400

    # Handle the event
    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        # Payment successful - activate subscription
        session = data
        user_id = session.get("metadata", {}).get("user_id")
        plan_type = session.get("metadata", {}).get("plan_type")

        if user_id:
            user = User.query.get(int(user_id))
            if user:
                user.plan_type = plan_type
                user.status = "active"
                user.is_active = True
                user.subscription_expiry = datetime.utcnow() + timedelta(days=30)
                db.session.commit()

                # Create notification
                notification = Notification(
                    user_id=user.id,
                    title="Payment Successful",
                    message=f"Your {plan_type.title()} plan is now active. Welcome!",
                    type="success",
                    priority="high"
                )
                db.session.add(notification)
                db.session.commit()

                print(f"Subscription activated for user {user.username} - {plan_type}")

    elif event_type == "payment_intent.succeeded":
        # One-time payment successful
        intent = data
        user_id = intent.get("metadata", {}).get("user_id")
        plan_type = intent.get("metadata", {}).get("plan_type")

        if user_id:
            user = User.query.get(int(user_id))
            if user:
                user.plan_type = plan_type
                user.status = "active"
                user.is_active = True
                user.subscription_expiry = datetime.utcnow() + timedelta(days=30)
                db.session.commit()

                notification = Notification(
                    user_id=user.id,
                    title="Payment Successful",
                    message=f"Your {plan_type.title()} plan is now active!",
                    type="success",
                    priority="high"
                )
                db.session.add(notification)
                db.session.commit()

    elif event_type == "customer.subscription.deleted":
        # Subscription cancelled
        subscription = data
        customer_id = subscription.get("customer")

        # Find user by Stripe customer ID (would need to store this)
        print(f"Subscription cancelled for customer {customer_id}")

    elif event_type == "invoice.payment_failed":
        # Payment failed
        invoice = data
        customer_id = invoice.get("customer")
        print(f"Payment failed for customer {customer_id}")

    return jsonify({"status": "success"}), 200

@payments_bp.route("/api/payments/subscription", methods=["GET"])
@login_required
def get_subscription(current_user):
    """Get current user's subscription details"""
    try:
        subscription_data = {
            "plan_type": current_user.plan_type,
            "status": current_user.status,
            "subscription_expiry": current_user.subscription_expiry.isoformat() if current_user.subscription_expiry else None,
            "is_active": current_user.is_active,
            "plan_details": PLANS.get(current_user.plan_type, PLANS["free"])
        }

        return jsonify(subscription_data), 200
    except Exception as e:
        print(f"Error getting subscription: {e}")
        return jsonify({"error": "Failed to get subscription"}), 500

@payments_bp.route("/api/payments/cancel-subscription", methods=["POST"])
@login_required
def cancel_subscription(current_user):
    """Cancel user's subscription"""
    try:
        # This would cancel the Stripe subscription
        # For now, we'll downgrade to free
        current_user.plan_type = "free"
        current_user.subscription_expiry = None
        db.session.commit()

        notification = Notification(
            user_id=current_user.id,
            title="Subscription Cancelled",
            message="Your subscription has been cancelled. You've been downgraded to the Free plan.",
            type="info",
            priority="medium"
        )
        db.session.add(notification)
        db.session.commit()

        return jsonify({"message": "Subscription cancelled successfully"}), 200

    except Exception as e:
        print(f"Error cancelling subscription: {e}")
        return jsonify({"error": "Failed to cancel subscription"}), 500

@payments_bp.route("/api/payments/payment-history", methods=["GET"])
@login_required
def get_payment_history(current_user):
    """Get user's payment history"""
    try:
        # This would query payment records from database
        # For now, return empty list
        history = []

        return jsonify({"payments": history}), 200
    except Exception as e:
        print(f"Error getting payment history: {e}")
        return jsonify({"error": "Failed to get payment history"}), 500
