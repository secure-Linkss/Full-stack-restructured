"""
Advanced Crypto Payment Processing Routes
Integrates Web3.py for transaction monitoring and confirmation checking
"""

from flask import Blueprint, request, jsonify
from functools import wraps
from api.database import db
from api.models.user import User
from api.models.notification import Notification
from api.models.audit_log import AuditLog
from api.models.payment import Payment
from api.services.crypto_monitor import crypto_monitor
from datetime import datetime, timedelta
import os

crypto_payments_advanced_bp = Blueprint("crypto_payments_advanced", __name__)

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

# In-memory storage for wallet addresses (should be in database in production)
CRYPTO_WALLETS = {
    'BTC': os.getenv('BTC_WALLET_ADDRESS', ''),
    'ETH': os.getenv('ETH_WALLET_ADDRESS', ''),
    'LTC': os.getenv('LTC_WALLET_ADDRESS', ''),
    'USDT': os.getenv('USDT_WALLET_ADDRESS', '')
}

# Wallet Management Routes

@crypto_payments_advanced_bp.route("/api/crypto-payments/wallets", methods=["GET"])
def get_crypto_wallets():
    """Get crypto wallet addresses for payments (public endpoint)"""
    try:
        # Only return wallet addresses, not sensitive data
        return jsonify({
            "wallets": {
                'BTC': CRYPTO_WALLETS.get('BTC', ''),
                'ETH': CRYPTO_WALLETS.get('ETH', ''),
                'LTC': CRYPTO_WALLETS.get('LTC', ''),
                'USDT': CRYPTO_WALLETS.get('USDT', '')
            }
        }), 200
    except Exception as e:
        print(f"Error getting wallets: {e}")
        return jsonify({"error": "Failed to get wallet addresses"}), 500

@crypto_payments_advanced_bp.route("/api/admin/crypto-payments/wallets", methods=["POST"])
@main_admin_required
def update_crypto_wallets(current_user):
    """Update crypto wallet addresses (Main Admin only)"""
    try:
        data = request.get_json()
        
        # Update wallets
        for currency in ["BTC", "ETH", "LTC", "USDT"]:
            if currency in data and data[currency]:
                CRYPTO_WALLETS[currency] = data[currency]
        
        # Log action
        try:
            audit_log = AuditLog(
                actor_id=current_user.id,
                action="Updated crypto wallet addresses",
                target_id=None,
                target_type="crypto_wallets"
            )
            db.session.add(audit_log)
            db.session.commit()
        except Exception as e:
            print(f"Error logging wallet update: {e}")
        
        return jsonify({
            "success": True,
            "message": "Wallet addresses updated successfully",
            "wallets": CRYPTO_WALLETS
        }), 200
    except Exception as e:
        print(f"Error updating wallets: {e}")
        return jsonify({"error": "Failed to update wallet addresses"}), 500

# Payment Submission and Tracking Routes

@crypto_payments_advanced_bp.route("/api/crypto-payments/submit-proof", methods=["POST"])
@login_required
def submit_payment_proof(current_user):
    """Submit crypto payment proof with transaction hash for verification"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(k in data for k in ["plan_type", "currency", "tx_hash", "amount"]):
            return jsonify({"error": "Missing required fields"}), 400
        
        plan_type = data["plan_type"]
        currency = data["currency"].upper()
        tx_hash = data["tx_hash"]
        amount = float(data["amount"])
        
        # Check transaction on blockchain
        tx_status = crypto_monitor.check_transaction(tx_hash, currency)
        
        if not tx_status['is_valid']:
            return jsonify({
                "error": "Invalid transaction hash",
                "details": tx_status.get('error', 'Transaction not found on blockchain')
            }), 400
        
        # Create payment record
        payment = Payment(
            user_id=current_user.id,
            payment_type="crypto",
            currency=currency,
            amount=amount,
            plan_type=plan_type,
            tx_hash=tx_hash,
            status="pending_confirmation",
            confirmations=tx_status.get('confirmations', 0),
            transaction_data=str(tx_status)
        )
        
        db.session.add(payment)
        db.session.commit()
        
        # Notify admins
        admin_users = User.query.filter(User.role.in_(["admin", "main_admin"])).all()
        for admin in admin_users:
            notification = Notification(
                user_id=admin.id,
                title="New Crypto Payment Submitted",
                message=f"User {current_user.username} submitted {amount} {currency} payment for {plan_type} plan. TX: {tx_hash}",
                type="info",
                priority="high"
            )
            db.session.add(notification)
        
        # Notify user
        is_confirmed, confirmations = crypto_monitor.is_payment_confirmed(tx_hash, currency)
        estimated_time = crypto_monitor.get_estimated_confirmation_time(currency, confirmations)
        
        user_notification = Notification(
            user_id=current_user.id,
            title="Payment Submitted for Verification",
            message=f"Your {currency} payment has been submitted. Current confirmations: {confirmations}. Estimated time to confirmation: {estimated_time}",
            type="info",
            priority="medium"
        )
        db.session.add(user_notification)
        
        db.session.commit()
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Submitted crypto payment: {amount} {currency}",
            target_id=payment.id,
            target_type="payment"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Payment proof submitted successfully",
            "payment": {
                "id": payment.id,
                "status": payment.status,
                "confirmations": confirmations,
                "estimated_confirmation_time": estimated_time,
                "is_confirmed": is_confirmed
            }
        }), 201
    except Exception as e:
        print(f"Error submitting payment proof: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to submit payment proof"}), 500

@crypto_payments_advanced_bp.route("/api/crypto-payments/check-status/<int:payment_id>", methods=["GET"])
@login_required
def check_payment_status(current_user, payment_id):
    """Check the status of a crypto payment"""
    try:
        payment = Payment.query.filter_by(id=payment_id, user_id=current_user.id).first_or_404()
        
        # Check current transaction status
        tx_status = crypto_monitor.check_transaction(payment.tx_hash, payment.currency)
        
        if tx_status['is_valid']:
            # Update payment record
            payment.confirmations = tx_status.get('confirmations', 0)
            
            # Check if confirmed
            is_confirmed, confirmations = crypto_monitor.is_payment_confirmed(payment.tx_hash, payment.currency)
            
            if is_confirmed and payment.status == "pending_confirmation":
                payment.status = "confirmed"
                db.session.commit()
                
                # Notify user
                notification = Notification(
                    user_id=current_user.id,
                    title="Payment Confirmed!",
                    message=f"Your {payment.currency} payment has been confirmed with {confirmations} confirmations.",
                    type="success",
                    priority="high"
                )
                db.session.add(notification)
                db.session.commit()
            
            estimated_time = crypto_monitor.get_estimated_confirmation_time(payment.currency, confirmations)
            
            return jsonify({
                "payment": {
                    "id": payment.id,
                    "status": payment.status,
                    "currency": payment.currency,
                    "amount": payment.amount,
                    "confirmations": confirmations,
                    "estimated_confirmation_time": estimated_time,
                    "is_confirmed": is_confirmed,
                    "created_at": payment.created_at.isoformat()
                }
            }), 200
        else:
            return jsonify({
                "error": "Unable to verify transaction",
                "details": tx_status.get('error', 'Transaction not found')
            }), 400
    except Exception as e:
        print(f"Error checking payment status: {e}")
        return jsonify({"error": "Failed to check payment status"}), 500

# Admin Payment Management Routes

@crypto_payments_advanced_bp.route("/api/admin/crypto-payments/pending", methods=["GET"])
@main_admin_required
def get_pending_payments(current_user):
    """Get pending crypto payment proofs for review (Main Admin only)"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        pending_payments = Payment.query.filter_by(
            payment_type="crypto",
            status="pending_confirmation"
        ).order_by(Payment.created_at.desc()).paginate(page=page, per_page=per_page)
        
        return jsonify({
            "payments": [{
                "id": p.id,
                "user_id": p.user_id,
                "user_username": User.query.get(p.user_id).username if p.user_id else None,
                "currency": p.currency,
                "amount": p.amount,
                "plan_type": p.plan_type,
                "tx_hash": p.tx_hash,
                "status": p.status,
                "confirmations": p.confirmations,
                "created_at": p.created_at.isoformat()
            } for p in pending_payments.items],
            "total": pending_payments.total,
            "pages": pending_payments.pages,
            "current_page": page
        }), 200
    except Exception as e:
        print(f"Error getting pending payments: {e}")
        return jsonify({"error": "Failed to get pending payments"}), 500

@crypto_payments_advanced_bp.route("/api/admin/crypto-payments/<int:payment_id>/confirm", methods=["POST"])
@main_admin_required
def confirm_payment(current_user, payment_id):
    """Confirm crypto payment and activate subscription"""
    try:
        payment = Payment.query.get_or_404(payment_id)
        user = User.query.get_or_404(payment.user_id)
        
        # Update payment status
        payment.status = "confirmed"
        payment.confirmed_at = datetime.utcnow()
        
        # Update user subscription
        user.plan_type = payment.plan_type
        user.status = "active"
        user.is_active = True
        user.subscription_expiry = datetime.utcnow() + timedelta(days=30)
        
        db.session.commit()
        
        # Notify user
        notification = Notification(
            user_id=user.id,
            title="Payment Confirmed by Admin",
            message=f"Your crypto payment has been confirmed! Your {payment.plan_type.title()} plan is now active.",
            type="success",
            priority="high"
        )
        db.session.add(notification)
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Confirmed crypto payment for user {user.username} - {payment.plan_type}",
            target_id=user.id,
            target_type="crypto_payment"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Payment confirmed and subscription activated"
        }), 200
    except Exception as e:
        print(f"Error confirming payment: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to confirm payment"}), 500

@crypto_payments_advanced_bp.route("/api/admin/crypto-payments/<int:payment_id>/reject", methods=["POST"])
@main_admin_required
def reject_payment(current_user, payment_id):
    """Reject a crypto payment"""
    try:
        data = request.get_json()
        payment = Payment.query.get_or_404(payment_id)
        user = User.query.get_or_404(payment.user_id)
        
        # Update payment status
        payment.status = "rejected"
        payment.rejection_reason = data.get("reason", "Payment rejected by admin")
        
        db.session.commit()
        
        # Notify user
        notification = Notification(
            user_id=user.id,
            title="Payment Rejected",
            message=f"Your crypto payment has been rejected. Reason: {payment.rejection_reason}",
            type="error",
            priority="high"
        )
        db.session.add(notification)
        
        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Rejected crypto payment for user {user.username}",
            target_id=user.id,
            target_type="crypto_payment"
        )
        db.session.add(audit_log)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Payment rejected"
        }), 200
    except Exception as e:
        print(f"Error rejecting payment: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to reject payment"}), 500

@crypto_payments_advanced_bp.route("/api/admin/crypto-payments/stats", methods=["GET"])
@main_admin_required
def get_crypto_payment_stats(current_user):
    """Get crypto payment statistics"""
    try:
        total_payments = Payment.query.filter_by(payment_type="crypto").count()
        confirmed_payments = Payment.query.filter_by(payment_type="crypto", status="confirmed").count()
        pending_payments = Payment.query.filter_by(payment_type="crypto", status="pending_confirmation").count()
        
        total_amount = db.session.query(db.func.sum(Payment.amount)).filter_by(payment_type="crypto", status="confirmed").scalar() or 0
        
        return jsonify({
            "stats": {
                "total_payments": total_payments,
                "confirmed_payments": confirmed_payments,
                "pending_payments": pending_payments,
                "total_amount": float(total_amount),
                "confirmation_rate": (confirmed_payments / total_payments * 100) if total_payments > 0 else 0
            }
        }), 200
    except Exception as e:
        print(f"Error getting crypto payment stats: {e}")
        return jsonify({"error": "Failed to get payment statistics"}), 500
