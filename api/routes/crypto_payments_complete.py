"""
Complete Crypto Payment Management System
Handles crypto payment submission, verification, and admin management
"""

from flask import Blueprint, request, jsonify
from functools import wraps
from src.database import db
from src.models.user import User
from api.models.crypto_payment_transaction import CryptoPaymentTransaction
from api.models.crypto_wallet_address import CryptoWalletAddress
from api.models.payment_api_setting import PaymentAPISetting
from api.models.payment_history import PaymentHistory
from api.models.subscription_plan import SubscriptionPlan
from src.models.notification import Notification
from src.models.audit_log import AuditLog
from datetime import datetime, timedelta
import os
import requests
import base64

crypto_payments_complete_bp = Blueprint("crypto_payments_complete", __name__)

# ============================================
# AUTHENTICATION DECORATORS
# ============================================

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

def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        if user.role not in ["main_admin", "admin"]:
            return jsonify({"error": "Admin access required"}), 403
        return f(user, *args, **kwargs)
    return decorated_function

def main_admin_required(f):
    """Decorator to require main admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        if user.role != "main_admin":
            return jsonify({"error": "Main admin access required"}), 403
        return f(user, *args, **kwargs)
    return decorated_function

# ============================================
# PUBLIC ENDPOINTS (Wallet Addresses & Plans)
# ============================================

@crypto_payments_complete_bp.route("/api/crypto-payments/wallets", methods=["GET"])
def get_crypto_wallets():
    """Get active crypto wallet addresses for payments (public endpoint)"""
    try:
        wallets = CryptoWalletAddress.query.filter_by(is_active=True).all()
        return jsonify({
            "success": True,
            "wallets": [wallet.to_dict() for wallet in wallets]
        }), 200
    except Exception as e:
        print(f"Error getting wallets: {e}")
        return jsonify({"error": "Failed to get wallet addresses"}), 500

@crypto_payments_complete_bp.route("/api/crypto-payments/plans", methods=["GET"])
def get_subscription_plans():
    """Get available subscription plans with pricing"""
    try:
        plans = SubscriptionPlan.query.filter_by(is_active=True).order_by(SubscriptionPlan.display_order).all()
        return jsonify({
            "success": True,
            "plans": [plan.to_dict() for plan in plans]
        }), 200
    except Exception as e:
        print(f"Error getting plans: {e}")
        return jsonify({"error": "Failed to get subscription plans"}), 500

# ============================================
# USER ENDPOINTS (Payment Submission & Status)
# ============================================

@crypto_payments_complete_bp.route("/api/crypto-payments/submit", methods=["POST"])
@login_required
def submit_crypto_payment(current_user):
    """Submit crypto payment proof for verification"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["plan_type", "billing_cycle", "currency", "transaction_hash", "amount_crypto", "amount_usd"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        plan_type = data["plan_type"]
        billing_cycle = data["billing_cycle"]
        currency = data["currency"].upper()
        transaction_hash = data["transaction_hash"]
        amount_crypto = data["amount_crypto"]
        amount_usd = data["amount_usd"]
        screenshot_base64 = data.get("screenshot")

        # Validate plan type
        if plan_type not in ["pro", "enterprise"]:
            return jsonify({"error": "Invalid plan type"}), 400

        # Validate currency
        if currency not in ["BTC", "ETH", "USDT", "LTC"]:
            return jsonify({"error": "Invalid currency"}), 400

        # Check if transaction hash already exists
        existing_tx = CryptoPaymentTransaction.query.filter_by(transaction_hash=transaction_hash).first()
        if existing_tx:
            return jsonify({"error": "Transaction hash already submitted"}), 400

        # Get wallet address for this currency
        wallet = CryptoWalletAddress.query.filter_by(currency=currency, is_active=True).first()
        if not wallet:
            return jsonify({"error": f"No active wallet found for {currency}"}), 400

        # Create crypto payment transaction
        crypto_tx = CryptoPaymentTransaction(
            user_id=current_user.id,
            plan_type=plan_type,
            currency=currency,
            wallet_address=wallet.wallet_address,
            transaction_hash=transaction_hash,
            amount_crypto=amount_crypto,
            amount_usd=amount_usd,
            screenshot_url=screenshot_base64 if screenshot_base64 else None,
            status='pending',
            metadata={
                'billing_cycle': billing_cycle,
                'submitted_at': datetime.utcnow().isoformat()
            }
        )
        db.session.add(crypto_tx)
        db.session.flush()

        # Create payment history record
        payment_record = PaymentHistory(
            user_id=current_user.id,
            payment_method='crypto',
            payment_type='subscription',
            plan_type=plan_type,
            billing_cycle=billing_cycle,
            amount=amount_usd,
            currency='USD',
            status='pending',
            crypto_transaction_id=crypto_tx.id,
            metadata={
                'crypto_currency': currency,
                'transaction_hash': transaction_hash
            }
        )
        db.session.add(payment_record)

        # Update user status to crypto_pending
        current_user.status = 'crypto_pending'

        # Notify admins
        admin_users = User.query.filter(User.role.in_(["admin", "main_admin"])).all()
        for admin in admin_users:
            notification = Notification(
                user_id=admin.id,
                title="New Crypto Payment Submission",
                message=f"User {current_user.username} submitted {currency} payment for {plan_type.title()} plan ({billing_cycle}). TX: {transaction_hash[:16]}...",
                type="info",
                priority="high",
                action_url=f"/admin/payments/crypto/{crypto_tx.id}"
            )
            db.session.add(notification)

        # Notify user
        user_notification = Notification(
            user_id=current_user.id,
            title="Payment Proof Submitted",
            message=f"Your {currency} payment proof has been submitted for review. You'll be notified once it's verified.",
            type="info",
            priority="medium"
        )
        db.session.add(user_notification)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Payment proof submitted successfully",
            "transaction_id": crypto_tx.id,
            "status": "pending"
        }), 200

    except Exception as e:
        print(f"Error submitting payment proof: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to submit payment proof"}), 500

@crypto_payments_complete_bp.route("/api/crypto-payments/status", methods=["GET"])
@login_required
def get_payment_status(current_user):
    """Get user's crypto payment status"""
    try:
        transactions = CryptoPaymentTransaction.query.filter_by(user_id=current_user.id).order_by(CryptoPaymentTransaction.created_at.desc()).all()
        return jsonify({
            "success": True,
            "transactions": [tx.to_dict() for tx in transactions]
        }), 200
    except Exception as e:
        print(f"Error getting payment status: {e}")
        return jsonify({"error": "Failed to get payment status"}), 500

@crypto_payments_complete_bp.route("/api/crypto-payments/history", methods=["GET"])
@login_required
def get_payment_history(current_user):
    """Get user's complete payment history"""
    try:
        history = PaymentHistory.query.filter_by(user_id=current_user.id).order_by(PaymentHistory.created_at.desc()).all()
        return jsonify({
            "success": True,
            "history": [record.to_dict() for record in history]
        }), 200
    except Exception as e:
        print(f"Error getting payment history: {e}")
        return jsonify({"error": "Failed to get payment history"}), 500

# ============================================
# ADMIN ENDPOINTS (Payment Verification)
# ============================================

@crypto_payments_complete_bp.route("/api/admin/crypto-payments/pending", methods=["GET"])
@admin_required
def get_pending_payments(current_user):
    """Get all pending crypto payment submissions (Admin only)"""
    try:
        pending = CryptoPaymentTransaction.query.filter_by(status='pending').order_by(CryptoPaymentTransaction.created_at.desc()).all()
        
        # Enrich with user data
        result = []
        for tx in pending:
            tx_dict = tx.to_dict()
            user = User.query.get(tx.user_id)
            if user:
                tx_dict['user'] = {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            result.append(tx_dict)
        
        return jsonify({
            "success": True,
            "pending_payments": result,
            "count": len(result)
        }), 200
    except Exception as e:
        print(f"Error getting pending payments: {e}")
        return jsonify({"error": "Failed to get pending payments"}), 500

@crypto_payments_complete_bp.route("/api/admin/crypto-payments/<int:transaction_id>", methods=["GET"])
@admin_required
def get_payment_details(current_user, transaction_id):
    """Get detailed information about a crypto payment (Admin only)"""
    try:
        tx = CryptoPaymentTransaction.query.get_or_404(transaction_id)
        user = User.query.get(tx.user_id)
        
        tx_dict = tx.to_dict()
        tx_dict['user'] = user.to_dict() if user else None
        
        return jsonify({
            "success": True,
            "transaction": tx_dict
        }), 200
    except Exception as e:
        print(f"Error getting payment details: {e}")
        return jsonify({"error": "Failed to get payment details"}), 500

@crypto_payments_complete_bp.route("/api/admin/crypto-payments/<int:transaction_id>/verify", methods=["POST"])
@admin_required
def verify_payment(current_user, transaction_id):
    """Verify and approve crypto payment (Admin only)"""
    try:
        data = request.get_json() or {}
        
        tx = CryptoPaymentTransaction.query.get_or_404(transaction_id)
        user = User.query.get(tx.user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if tx.status != 'pending':
            return jsonify({"error": "Payment already processed"}), 400
        
        # Get plan details
        plan = SubscriptionPlan.query.filter_by(plan_code=tx.plan_type).first()
        if not plan:
            return jsonify({"error": "Plan not found"}), 404
        
        # Calculate subscription duration
        billing_cycle = tx.metadata.get('billing_cycle', 'monthly')
        duration_days = {
            'monthly': 30,
            'quarterly': 90,
            'yearly': 365
        }.get(billing_cycle, 30)
        
        # Update transaction
        tx.status = 'confirmed'
        tx.verification_method = 'manual'
        tx.verified_by = current_user.id
        tx.verified_at = datetime.utcnow()
        tx.blockchain_confirmations = data.get('confirmations', 1)
        
        # Update user subscription
        user.plan_type = tx.plan_type
        user.status = 'active'
        user.is_active = True
        user.subscription_start_date = datetime.utcnow()
        user.subscription_end_date = datetime.utcnow() + timedelta(days=duration_days)
        user.subscription_expiry = user.subscription_end_date
        user.billing_cycle = billing_cycle
        user.payment_method = 'crypto'
        user.last_payment_date = datetime.utcnow()
        user.next_billing_date = user.subscription_end_date
        user.current_plan_limits = plan.limits
        
        # Update payment history
        payment_record = PaymentHistory.query.filter_by(crypto_transaction_id=tx.id).first()
        if payment_record:
            payment_record.status = 'completed'
        
        # Notify user
        notification = Notification(
            user_id=user.id,
            title="Payment Confirmed! 🎉",
            message=f"Your crypto payment has been confirmed! Your {tx.plan_type.title()} plan is now active until {user.subscription_end_date.strftime('%Y-%m-%d')}.",
            type="success",
            priority="high"
        )
        db.session.add(notification)
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Verified crypto payment for user {user.username} - {tx.plan_type} ({billing_cycle})",
            target_id=tx.id,
            target_type="crypto_payment",
            details=f"TX Hash: {tx.transaction_hash}, Amount: {tx.amount_usd} USD"
        )
        db.session.add(audit_log)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"Payment verified. User {user.username} upgraded to {tx.plan_type}",
            "user_id": user.id,
            "plan_type": tx.plan_type,
            "expiry_date": user.subscription_end_date.isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error verifying payment: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to verify payment"}), 500

@crypto_payments_complete_bp.route("/api/admin/crypto-payments/<int:transaction_id>/reject", methods=["POST"])
@admin_required
def reject_payment(current_user, transaction_id):
    """Reject crypto payment (Admin only)"""
    try:
        data = request.get_json()
        reason = data.get("reason", "Payment proof could not be verified")
        
        tx = CryptoPaymentTransaction.query.get_or_404(transaction_id)
        user = User.query.get(tx.user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if tx.status != 'pending':
            return jsonify({"error": "Payment already processed"}), 400
        
        # Update transaction
        tx.status = 'rejected'
        tx.rejection_reason = reason
        tx.verified_by = current_user.id
        tx.verified_at = datetime.utcnow()
        
        # Update user status back to pending
        user.status = 'pending'
        
        # Update payment history
        payment_record = PaymentHistory.query.filter_by(crypto_transaction_id=tx.id).first()
        if payment_record:
            payment_record.status = 'failed'
        
        # Notify user
        notification = Notification(
            user_id=user.id,
            title="Payment Rejected",
            message=f"Your crypto payment proof was rejected. Reason: {reason}. Please submit a new payment or contact support.",
            type="error",
            priority="high"
        )
        db.session.add(notification)
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Rejected crypto payment for user {user.username}",
            target_id=tx.id,
            target_type="crypto_payment",
            details=f"Reason: {reason}"
        )
        db.session.add(audit_log)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Payment rejected and user notified"
        }), 200
        
    except Exception as e:
        print(f"Error rejecting payment: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to reject payment"}), 500

# ============================================
# ADMIN ENDPOINTS (Wallet Management)
# ============================================

@crypto_payments_complete_bp.route("/api/admin/crypto-wallets", methods=["GET"])
@admin_required
def get_all_wallets(current_user):
    """Get all crypto wallet addresses (Admin only)"""
    try:
        wallets = CryptoWalletAddress.query.all()
        return jsonify({
            "success": True,
            "wallets": [wallet.to_dict() for wallet in wallets]
        }), 200
    except Exception as e:
        print(f"Error getting wallets: {e}")
        return jsonify({"error": "Failed to get wallet addresses"}), 500

@crypto_payments_complete_bp.route("/api/admin/crypto-wallets", methods=["POST"])
@main_admin_required
def create_or_update_wallet(current_user):
    """Create or update crypto wallet address (Main Admin only)"""
    try:
        data = request.get_json()
        
        currency = data.get("currency", "").upper()
        wallet_address = data.get("wallet_address", "")
        network = data.get("network", "mainnet")
        is_active = data.get("is_active", True)
        notes = data.get("notes", "")
        
        if not currency or not wallet_address:
            return jsonify({"error": "Currency and wallet address are required"}), 400
        
        # Check if wallet exists
        wallet = CryptoWalletAddress.query.filter_by(currency=currency).first()
        
        if wallet:
            # Update existing
            wallet.wallet_address = wallet_address
            wallet.network = network
            wallet.is_active = is_active
            wallet.notes = notes
            wallet.updated_by = current_user.id
            wallet.updated_at = datetime.utcnow()
            action = "updated"
        else:
            # Create new
            wallet = CryptoWalletAddress(
                currency=currency,
                wallet_address=wallet_address,
                network=network,
                is_active=is_active,
                notes=notes,
                updated_by=current_user.id
            )
            db.session.add(wallet)
            action = "created"
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"{action.title()} {currency} wallet address",
            target_id=wallet.id if wallet.id else None,
            target_type="crypto_wallet"
        )
        db.session.add(audit_log)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"Wallet address {action} successfully",
            "wallet": wallet.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Error managing wallet: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to manage wallet address"}), 500

@crypto_payments_complete_bp.route("/api/admin/crypto-wallets/<int:wallet_id>", methods=["DELETE"])
@main_admin_required
def delete_wallet(current_user, wallet_id):
    """Delete crypto wallet address (Main Admin only)"""
    try:
        wallet = CryptoWalletAddress.query.get_or_404(wallet_id)
        currency = wallet.currency
        
        db.session.delete(wallet)
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Deleted {currency} wallet address",
            target_id=wallet_id,
            target_type="crypto_wallet"
        )
        db.session.add(audit_log)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Wallet address deleted successfully"
        }), 200
        
    except Exception as e:
        print(f"Error deleting wallet: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to delete wallet address"}), 500

# ============================================
# ADMIN ENDPOINTS (API Settings Management)
# ============================================

@crypto_payments_complete_bp.route("/api/admin/payment-apis", methods=["GET"])
@admin_required
def get_payment_apis(current_user):
    """Get all payment API settings (Admin only)"""
    try:
        apis = PaymentAPISetting.query.all()
        # Don't include sensitive API keys for regular admins
        include_sensitive = current_user.role == "main_admin"
        return jsonify({
            "success": True,
            "apis": [api.to_dict(include_sensitive=include_sensitive) for api in apis]
        }), 200
    except Exception as e:
        print(f"Error getting payment APIs: {e}")
        return jsonify({"error": "Failed to get payment API settings"}), 500

@crypto_payments_complete_bp.route("/api/admin/payment-apis", methods=["POST"])
@main_admin_required
def create_or_update_payment_api(current_user):
    """Create or update payment API setting (Main Admin only)"""
    try:
        data = request.get_json()
        
        api_name = data.get("api_name")
        api_type = data.get("api_type", "blockchain_verification")
        api_key = data.get("api_key")
        api_url = data.get("api_url")
        supported_currencies = data.get("supported_currencies", [])
        is_active = data.get("is_active", False)
        priority = data.get("priority", 0)
        rate_limit = data.get("rate_limit_per_minute", 10)
        configuration = data.get("configuration", {})
        
        if not api_name:
            return jsonify({"error": "API name is required"}), 400
        
        # Check if API exists
        api = PaymentAPISetting.query.filter_by(api_name=api_name).first()
        
        if api:
            # Update existing
            if api_key:
                api.api_key = api_key
            api.api_type = api_type
            api.api_url = api_url
            api.supported_currencies = supported_currencies
            api.is_active = is_active
            api.priority = priority
            api.rate_limit_per_minute = rate_limit
            api.configuration = configuration
            api.updated_at = datetime.utcnow()
            action = "updated"
        else:
            # Create new
            api = PaymentAPISetting(
                api_name=api_name,
                api_type=api_type,
                api_key=api_key,
                api_url=api_url,
                supported_currencies=supported_currencies,
                is_active=is_active,
                priority=priority,
                rate_limit_per_minute=rate_limit,
                configuration=configuration
            )
            db.session.add(api)
            action = "created"
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"{action.title()} payment API: {api_name}",
            target_id=api.id if api.id else None,
            target_type="payment_api"
        )
        db.session.add(audit_log)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"Payment API {action} successfully",
            "api": api.to_dict(include_sensitive=True)
        }), 200
        
    except Exception as e:
        print(f"Error managing payment API: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to manage payment API"}), 500

@crypto_payments_complete_bp.route("/api/admin/payment-apis/<int:api_id>", methods=["DELETE"])
@main_admin_required
def delete_payment_api(current_user, api_id):
    """Delete payment API setting (Main Admin only)"""
    try:
        api = PaymentAPISetting.query.get_or_404(api_id)
        api_name = api.api_name
        
        db.session.delete(api)
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Deleted payment API: {api_name}",
            target_id=api_id,
            target_type="payment_api"
        )
        db.session.add(audit_log)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Payment API deleted successfully"
        }), 200
        
    except Exception as e:
        print(f"Error deleting payment API: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to delete payment API"}), 500

# ============================================
# ADMIN ENDPOINTS (Subscription Plans Management)
# ============================================

@crypto_payments_complete_bp.route("/api/admin/subscription-plans", methods=["GET"])
@admin_required
def get_all_plans(current_user):
    """Get all subscription plans (Admin only)"""
    try:
        plans = SubscriptionPlan.query.order_by(SubscriptionPlan.display_order).all()
        return jsonify({
            "success": True,
            "plans": [plan.to_dict() for plan in plans]
        }), 200
    except Exception as e:
        print(f"Error getting plans: {e}")
        return jsonify({"error": "Failed to get subscription plans"}), 500

@crypto_payments_complete_bp.route("/api/admin/subscription-plans/<int:plan_id>", methods=["PUT"])
@main_admin_required
def update_subscription_plan(current_user, plan_id):
    """Update subscription plan (Main Admin only)"""
    try:
        data = request.get_json()
        plan = SubscriptionPlan.query.get_or_404(plan_id)
        
        # Update fields
        if "plan_name" in data:
            plan.plan_name = data["plan_name"]
        if "plan_description" in data:
            plan.plan_description = data["plan_description"]
        if "price_monthly" in data:
            plan.price_monthly = data["price_monthly"]
        if "price_quarterly" in data:
            plan.price_quarterly = data["price_quarterly"]
        if "price_yearly" in data:
            plan.price_yearly = data["price_yearly"]
        if "features" in data:
            plan.features = data["features"]
        if "limits" in data:
            plan.limits = data["limits"]
        if "is_active" in data:
            plan.is_active = data["is_active"]
        if "is_featured" in data:
            plan.is_featured = data["is_featured"]
        if "display_order" in data:
            plan.display_order = data["display_order"]
        
        plan.updated_at = datetime.utcnow()
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Updated subscription plan: {plan.plan_code}",
            target_id=plan.id,
            target_type="subscription_plan"
        )
        db.session.add(audit_log)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Subscription plan updated successfully",
            "plan": plan.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Error updating plan: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to update subscription plan"}), 500