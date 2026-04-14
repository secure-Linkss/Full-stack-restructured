"""
Stripe Payment Routes — Production Implementation
"""
import json
import os
import logging
import stripe
from flask import Blueprint, request, jsonify, session
from api.database import db
from api.models.user import User
from api.models.payment import Payment
from api.models.notification import Notification
from api.models.audit_log import AuditLog
from api.middleware.auth_decorators import login_required
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
stripe_bp = Blueprint('stripe', __name__, url_prefix='/api/payments/stripe')

# Initialise Stripe — only if key present
def _get_stripe():
    key = os.environ.get('STRIPE_SECRET_KEY')
    if key:
        stripe.api_key = key
        return stripe
    return None

PLAN_CONFIGS = {
    'weekly':    {'price': 35,  'duration_days': 7,   'price_id': os.environ.get('STRIPE_WEEKLY_PRICE_ID')},
    'biweekly':  {'price': 68,  'duration_days': 14,  'price_id': os.environ.get('STRIPE_BIWEEKLY_PRICE_ID')},
    'monthly':   {'price': 150, 'duration_days': 30,  'price_id': os.environ.get('STRIPE_MONTHLY_PRICE_ID')},
    'quarterly': {'price': 420, 'duration_days': 90,  'price_id': os.environ.get('STRIPE_QUARTERLY_PRICE_ID')},
    'pro':       {'price': 150, 'duration_days': 30,  'price_id': os.environ.get('STRIPE_PRO_PRICE_ID')},
    'enterprise':{'price': 500, 'duration_days': 365, 'price_id': os.environ.get('STRIPE_ENTERPRISE_PRICE_ID')},
}


@stripe_bp.route('/config', methods=['GET'])
def get_stripe_config():
    key = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
    if not key:
        return jsonify({'success': False, 'error': 'Stripe not configured'}), 503
    return jsonify({
        'publishableKey': key,
        'publishable_key': key,
        'pk': key,
        'success': True
    })


@stripe_bp.route('/create-checkout-session', methods=['POST'])
@login_required
def create_checkout_session():
    """Create a Stripe Checkout session and return the URL"""
    try:
        stripe_client = _get_stripe()
        if not stripe_client:
            return jsonify({'success': False, 'error': 'Stripe not configured'}), 503

        data = request.get_json() or {}
        plan_type = data.get('plan_type', 'monthly')
        user_id = session.get('user_id')

        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        plan = PLAN_CONFIGS.get(plan_type)
        if not plan:
            return jsonify({'success': False, 'error': 'Invalid plan type'}), 400

        price_id = plan.get('price_id')
        if not price_id:
            return jsonify({'success': False, 'error': f'Stripe price not configured for {plan_type}'}), 400

        app_url = os.environ.get('APP_URL', 'https://brainlinktracker.com')

        # Upsert Stripe customer
        if not user.stripe_customer_id:
            customer = stripe_client.Customer.create(
                email=user.email,
                name=user.username,
                metadata={'user_id': str(user.id)}
            )
            user.stripe_customer_id = customer.id
            db.session.commit()

        checkout_session = stripe_client.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{'price': price_id, 'quantity': 1}],
            mode='subscription',
            success_url=f"{app_url}/dashboard?session_id={{CHECKOUT_SESSION_ID}}&plan={plan_type}",
            cancel_url=f"{app_url}/settings",
            metadata={'user_id': str(user_id), 'plan_type': plan_type}
        )

        return jsonify({'success': True, 'url': checkout_session.url, 'sessionId': checkout_session.id})

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        return jsonify({'success': False, 'error': str(e.user_message)}), 400
    except Exception as e:
        logger.error(f"Checkout session error: {e}")
        return jsonify({'success': False, 'error': 'Failed to create checkout session'}), 500


@stripe_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks — MUST be CSRF-exempt (no session)"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    stripe_client = _get_stripe()

    if not stripe_client:
        return jsonify({'error': 'Stripe not configured'}), 503

    try:
        event = stripe_client.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        logger.warning("Invalid Stripe webhook payload")
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        logger.warning("Stripe webhook signature verification failed")
        return jsonify({'error': 'Invalid signature'}), 400

    event_type = event['type']
    logger.info(f"Stripe webhook received: {event_type}")

    if event_type == 'checkout.session.completed':
        _handle_checkout_completed(event['data']['object'])

    elif event_type == 'customer.subscription.deleted':
        _handle_subscription_cancelled(event['data']['object'])

    elif event_type == 'invoice.payment_failed':
        _handle_payment_failed(event['data']['object'])

    return jsonify({'success': True})


def _handle_checkout_completed(session_data):
    """Activate subscription on successful checkout"""
    try:
        user_id = int(session_data.get('metadata', {}).get('user_id', 0))
        plan_type = session_data.get('metadata', {}).get('plan_type', 'monthly')
        payment_intent = session_data.get('payment_intent', '')
        amount_total = session_data.get('amount_total', 0)

        user = User.query.get(user_id)
        if not user:
            logger.error(f"Stripe webhook: user {user_id} not found")
            return

        plan = PLAN_CONFIGS.get(plan_type, PLAN_CONFIGS['monthly'])
        duration = plan['duration_days']

        user.plan_type = plan_type
        user.status = 'active'
        user.is_active = True
        user.subscription_status = 'active'
        user.subscription_start_date = datetime.utcnow()
        user.subscription_expiry = datetime.utcnow() + timedelta(days=duration)
        user.subscription_end_date = user.subscription_expiry

        # Payment record
        payment = Payment(
            user_id=user_id,
            payment_type='stripe',
            currency='USD',
            amount=amount_total / 100,
            plan_type=plan_type,
            stripe_charge_id=payment_intent,
            status='confirmed',
            confirmed_at=datetime.utcnow()
        )
        db.session.add(payment)

        # Notification
        db.session.add(Notification(
            user_id=user_id,
            title="Subscription Activated 🎉",
            message=f"Your {plan_type.title()} plan is now active. Enjoy Brain Link Tracker!",
            type="success",
            priority="high"
        ))

        db.session.commit()
        logger.info(f"Stripe: user {user_id} upgraded to {plan_type}")
    except Exception as e:
        db.session.rollback()
        logger.error(f"_handle_checkout_completed error: {e}")


def _handle_subscription_cancelled(subscription_data):
    customer_id = subscription_data.get('customer')
    user = User.query.filter_by(stripe_customer_id=customer_id).first()
    if user:
        user.subscription_status = 'cancelled'
        db.session.add(Notification(
            user_id=user.id,
            title="Subscription Cancelled",
            message="Your subscription has been cancelled. You can resubscribe anytime.",
            type="warning",
            priority="high"
        ))
        db.session.commit()


def _handle_payment_failed(invoice_data):
    customer_id = invoice_data.get('customer')
    user = User.query.filter_by(stripe_customer_id=customer_id).first()
    if user:
        db.session.add(Notification(
            user_id=user.id,
            title="Payment Failed",
            message="Your subscription payment failed. Please update your payment method.",
            type="error",
            priority="high"
        ))
        db.session.commit()


@stripe_bp.route('/portal', methods=['POST'])
@login_required
def create_portal_session():
    """Create customer billing portal session"""
    try:
        stripe_client = _get_stripe()
        if not stripe_client:
            return jsonify({'success': False, 'error': 'Stripe not configured'}), 503

        user_id = session.get('user_id')
        user = User.query.get(user_id)

        if not user or not user.stripe_customer_id:
            return jsonify({'success': False, 'error': 'No active Stripe subscription found'}), 400

        app_url = os.environ.get('APP_URL', 'https://brainlinktracker.com')
        portal = stripe_client.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f"{app_url}/billing"
        )
        return jsonify({'success': True, 'url': portal.url})

    except Exception as e:
        logger.error(f"Portal session error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
