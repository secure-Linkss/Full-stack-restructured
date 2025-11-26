"""
Stripe Payment Routes
Handles Stripe payment processing, checkout sessions, and webhooks
"""
from flask import Blueprint, request, jsonify, session
from api.database import db
from api.models.user import User
from api.models.payment import Payment
from api.models.subscription_verification import SubscriptionVerification
import os
import stripe
from datetime import datetime, timedelta

stripe_bp = Blueprint('stripe', __name__, url_prefix='/api/payments/stripe')

# Initialize Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

@stripe_bp.route('/config', methods=['GET'])
def get_stripe_config():
    """Get Stripe publishable key"""
    try:
        return jsonify({
            'publishableKey': os.environ.get('STRIPE_PUBLISHABLE_KEY'),
            'success': True
        })
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@stripe_bp.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    """Create a Stripe checkout session"""
    try:
        data = request.get_json()
        plan_type = data.get('plan_type', 'pro')
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'Not authenticated', 'success': False}), 401
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found', 'success': False}), 404
        
        # Get price ID based on plan
        price_id = os.environ.get('STRIPE_PRO_PRICE_ID') if plan_type == 'pro' else os.environ.get('STRIPE_ENTERPRISE_PRICE_ID')
        
        if not price_id:
            return jsonify({'error': 'Plan price not configured', 'success': False}), 400
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer_email=user.email,
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{os.environ.get('APP_URL')}/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.environ.get('APP_URL')}/settings",
            metadata={
                'user_id': user_id,
                'plan_type': plan_type
            }
        )
        
        return jsonify({
            'sessionId': checkout_session.id,
            'success': True
        })
    
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@stripe_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhooks"""
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session_data = event['data']['object']
        user_id = session_data.get('metadata', {}).get('user_id')
        plan_type = session_data.get('metadata', {}).get('plan_type', 'pro')
        
        if user_id:
            user = User.query.get(user_id)
            if user:
                # Create a record in the unified Payment model
                new_payment = Payment(
                    user_id=user_id,
                    payment_type='stripe',
                    currency='USD', # Assuming Stripe uses USD
                    amount=session_data.get('amount_total') / 100, # Stripe uses cents
                    plan_type=plan_type,
                    stripe_charge_id=session_data.get('payment_intent'),
                    status='confirmed',
                    confirmed_at=datetime.utcnow()
                )
                db.session.add(new_payment)
                db.session.commit()
                
                # Update user subscription
                user.plan_type = plan_type
                user.subscription_status = 'active'
                user.subscription_start_date = datetime.utcnow()
                user.subscription_end_date = datetime.utcnow() + timedelta(days=30)
                
                # Create subscription verification record
                verification = SubscriptionVerification(
                    user_id=user_id,
                    plan_type=plan_type,
                    payment_method='stripe',
                    payment_status='completed',
                    amount=session_data.get('amount_total', 0) / 100,
                    transaction_id=session_data.get('payment_intent'),
                    metadata=json.dumps(session_data)
                )
                
                db.session.add(verification)
                db.session.commit()
    
    return jsonify({'success': True})

@stripe_bp.route('/portal', methods=['POST'])
def create_portal_session():
    """Create a customer portal session"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated', 'success': False}), 401
        
        user = User.query.get(user_id)
        if not user or not user.stripe_customer_id:
            return jsonify({'error': 'No active subscription', 'success': False}), 400
        
        portal_session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f"{os.environ.get('APP_URL')}/settings"
        )
        
        return jsonify({
            'url': portal_session.url,
            'success': True
        })
    
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500
