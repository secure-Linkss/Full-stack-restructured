"""
Crypto Payment Management
Manual crypto payment processing with proof verification
"""

from flask import Blueprint, request, jsonify, send_file
from functools import wraps
from src.database import db
from src.models.user import User
from src.models.notification import Notification
from src.models.audit_log import AuditLog
from datetime import datetime, timedelta
import os
import io
import base64

crypto_payments_bp = Blueprint("crypto_payments", __name__)

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
CRYPTO_WALLETS = {}

@crypto_payments_bp.route("/api/crypto-payments/wallets", methods=["GET"])
def get_crypto_wallets():
    """Get crypto wallet addresses for payments (public endpoint)"""
    try:
        return jsonify({"wallets": CRYPTO_WALLETS}), 200
    except Exception as e:
        print(f"Error getting wallets: {e}")
        return jsonify({"error": "Failed to get wallet addresses"}), 500

@crypto_payments_bp.route("/api/crypto-payments/wallets", methods=["POST"])
@main_admin_required
def update_crypto_wallets(current_user):
    """Update crypto wallet addresses (Main Admin only)"""
    try:
        data = request.get_json()

        # Update wallets
        for currency in ["BTC", "ETH", "LTC", "USDT"]:
            if currency in data:
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

@crypto_payments_bp.route("/api/crypto-payments/submit-proof", methods=["POST"])
@login_required
def submit_payment_proof(current_user):
    """Submit payment proof for verification"""
    try:
        data = request.get_json()

        # Validate required fields
        if not all(k in data for k in ["plan_type", "currency", "tx_hash", "amount"]):
            return jsonify({"error": "Missing required fields"}), 400

        plan_type = data["plan_type"]
        currency = data["currency"]
        tx_hash = data["tx_hash"]
        amount = data["amount"]
        screenshot_base64 = data.get("screenshot")

        # Save payment proof to database (simplified - should have dedicated table)
        # For now, create a notification for admins to review
        admin_users = User.query.filter(User.role.in_(["admin", "main_admin"])).all()

        for admin in admin_users:
            notification = Notification(
                user_id=admin.id,
                title="New Crypto Payment Proof",
                message=f"User {current_user.username} submitted payment proof: {plan_type} plan via {currency}. TX: {tx_hash}. Amount: ${amount}",
                type="info",
                priority="high"
            )
            db.session.add(notification)

        # Create notification for user
        user_notification = Notification(
            user_id=current_user.id,
            title="Payment Proof Submitted",
            message=f"Your payment proof has been submitted for review. You'll be notified once it's verified.",
            type="info",
            priority="medium"
        )
        db.session.add(user_notification)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Payment proof submitted successfully. It will be reviewed by an admin."
        }), 200

    except Exception as e:
        print(f"Error submitting payment proof: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to submit payment proof"}), 500

@crypto_payments_bp.route("/api/crypto-payments/pending", methods=["GET"])
@main_admin_required
def get_pending_payments(current_user):
    """Get pending crypto payment proofs for review (Main Admin only)"""
    try:
        # This would query a dedicated payments table
        # For now, return empty list
        pending_payments = []

        return jsonify({"payments": pending_payments}), 200
    except Exception as e:
        print(f"Error getting pending payments: {e}")
        return jsonify({"error": "Failed to get pending payments"}), 500

@crypto_payments_bp.route("/api/crypto-payments/confirm/<int:user_id>", methods=["POST"])
@main_admin_required
def confirm_payment(current_user, user_id):
    """Confirm crypto payment and activate subscription"""
    try:
        data = request.get_json()
        plan_type = data.get("plan_type", "pro")

        user = User.query.get_or_404(user_id)

        # Update user subscription
        user.plan_type = plan_type
        user.status = "active"
        user.is_active = True
        user.subscription_expiry = datetime.utcnow() + timedelta(days=30)

        db.session.commit()

        # Notify user
        notification = Notification(
            user_id=user.id,
            title="Payment Confirmed",
            message=f"Your crypto payment has been confirmed! Your {plan_type.title()} plan is now active.",
            type="success",
            priority="high"
        )
        db.session.add(notification)

        # Log action
        audit_log = AuditLog(
            actor_id=current_user.id,
            action=f"Confirmed crypto payment for user {user.username} - {plan_type}",
            target_id=user.id,
            target_type="crypto_payment"
        )
        db.session.add(audit_log)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": f"Payment confirmed. User {user.username} upgraded to {plan_type}"
        }), 200

    except Exception as e:
        print(f"Error confirming payment: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to confirm payment"}), 500

@crypto_payments_bp.route("/api/crypto-payments/reject/<int:user_id>", methods=["POST"])
@main_admin_required
def reject_payment(current_user, user_id):
    """Reject crypto payment proof"""
    try:
        data = request.get_json()
        reason = data.get("reason", "Payment proof could not be verified")

        user = User.query.get_or_404(user_id)

        # Notify user
        notification = Notification(
            user_id=user.id,
            title="Payment Rejected",
            message=f"Your crypto payment proof was rejected. Reason: {reason}",
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
            "message": "Payment rejected and user notified"
        }), 200

    except Exception as e:
        print(f"Error rejecting payment: {e}")
        db.session.rollback()
        return jsonify({"error": "Failed to reject payment"}), 500
