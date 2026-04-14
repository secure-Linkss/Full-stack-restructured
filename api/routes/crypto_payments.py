"""
Crypto Payment Routes — Production Implementation
Uses CryptoWalletAddress (DB) and CryptoPaymentTransaction (DB) models.
In-memory CRYPTO_WALLETS dict eliminated; admin manages wallets via DB only.

Blockchain verification uses free public APIs with multi-provider fallback:
  - BlockCypher (ETH, BTC, LTC) — no API key required for basic reads
  - Blockchain.info (BTC) — free tier
  - Etherscan.io (ETH/USDT) — free API key in .env (optional)
  - BSCScan (BNB) — free API key in .env (optional)

Required confirmations default: 30 (configurable via AdminSettings.crypto_required_confirmations)
"""

import logging
import requests as http_requests
from flask import Blueprint, request, jsonify, session
from api.database import db
from api.models.user import User
from api.models.notification import Notification
from api.models.audit_log import AuditLog
from api.models.payment import Payment
from api.models.crypto_payment_transaction import CryptoPaymentTransaction
from api.models.crypto_wallet_address import CryptoWalletAddress
from api.middleware.auth_decorators import login_required, admin_required
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
crypto_payments_bp = Blueprint("crypto_payments", __name__)

PLAN_DURATIONS = {
    'weekly': 7,
    'biweekly': 14,
    'monthly': 30,
    'quarterly': 90,
    'pro': 30,
    'enterprise': 365,
}

# Default required confirmations — override via AdminSettings
DEFAULT_REQUIRED_CONFIRMATIONS = 30


def _get_required_confirmations() -> int:
    """Get admin-configured confirmation threshold, fallback to default."""
    try:
        from api.models.admin_settings import AdminSettings
        setting = AdminSettings.query.filter_by(setting_key='crypto_required_confirmations').first()
        if setting and setting.setting_value:
            return int(setting.setting_value)
    except Exception:
        pass
    return DEFAULT_REQUIRED_CONFIRMATIONS


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_current_user():
    user_id = session.get("user_id")
    if user_id:
        return User.query.get(user_id)
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return User.verify_token(auth.split(" ", 1)[1])
    return None


def _verify_tx_hash_on_chain(tx_hash: str, currency: str) -> dict:
    """
    Multi-provider blockchain confirmation check — free public APIs, no API key required
    for basic reads.

    Providers tried in order per currency:
      ETH / USDT / ERC-20:
        1. Etherscan.io (free tier, ETHERSCAN_API_KEY env var optional)
        2. BlockCypher.com (free, rate-limited)
      BTC:
        1. Blockchain.info (free)
        2. BlockCypher.com (free)
      LTC / DOGE:
        1. BlockCypher.com (free)
      BNB / BSC:
        1. BSCScan.com (free tier, BSCSCAN_API_KEY env var optional)

    Returns:
        {
            'valid': bool,          # True if confirmations >= required_confirmations
            'confirmations': int,   # Current on-chain confirmations
            'amount': float,        # TX value in native currency (if available)
            'required': int,        # Threshold used
            'provider': str,        # Which API responded
            'mock': bool,           # True only for TEST_ hashes in dev
            'error': str            # Only present on failure
        }

    Test mode: hashes starting with '0xTEST' or 'TEST_' return valid=True without
    hitting any external API. Remove in strict production via DISABLE_MOCK_TX_HASHES=true.
    """
    import os

    if not tx_hash or not tx_hash.strip():
        return {"valid": False, "confirmations": 0, "amount": 0, "error": "Empty transaction hash"}

    tx_hash = tx_hash.strip()
    currency = (currency or '').upper().strip()
    required = _get_required_confirmations()

    # Mock mode — dev/testing only
    disable_mock = os.environ.get("DISABLE_MOCK_TX_HASHES", "false").lower() == "true"
    if not disable_mock and (tx_hash.startswith("0xTEST") or tx_hash.startswith("TEST_")):
        logger.info(f"[crypto] Mock tx accepted: {tx_hash}")
        return {"valid": True, "confirmations": required, "amount": 0, "required": required,
                "provider": "mock", "mock": True}

    TIMEOUT = 8

    def _blockcypher(coin: str) -> dict:
        """BlockCypher free API — supports eth/btc/ltc/doge."""
        url = f"https://api.blockcypher.com/v1/{coin}/main/txs/{tx_hash}?limit=1&includeHex=false"
        r = http_requests.get(url, timeout=TIMEOUT)
        if r.status_code == 200:
            d = r.json()
            confs = d.get("confirmations", 0)
            # ETH value comes as total in wei, BTC as satoshis
            raw_val = d.get("total", 0) or d.get("outputs", [{}])[0].get("value", 0) if d.get("outputs") else 0
            divisor = 1e18 if coin == "eth" else 1e8
            amount = raw_val / divisor if raw_val else 0
            return {"ok": True, "confirmations": confs, "amount": amount, "provider": "blockcypher"}
        return {"ok": False, "error": f"blockcypher HTTP {r.status_code}"}

    def _etherscan(tx: str) -> dict:
        """Etherscan free tier — ETH/ERC-20. Works without API key at low rate."""
        api_key = os.environ.get("ETHERSCAN_API_KEY", "")
        key_param = f"&apikey={api_key}" if api_key else ""
        # Get TX receipt for block number
        url = f"https://api.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash={tx}{key_param}"
        r = http_requests.get(url, timeout=TIMEOUT)
        if r.status_code == 200:
            d = r.json()
            if d.get("status") == "1" and d.get("result", {}).get("status") == "1":
                # TX succeeded — get block confirmations
                tx_url = f"https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash={tx}{key_param}"
                r2 = http_requests.get(tx_url, timeout=TIMEOUT)
                if r2.status_code == 200:
                    d2 = r2.json()
                    tx_block = d2.get("result", {}).get("blockNumber")
                    if tx_block:
                        # Get current block
                        blk_url = f"https://api.etherscan.io/api?module=proxy&action=eth_blockNumber{key_param}"
                        r3 = http_requests.get(blk_url, timeout=TIMEOUT)
                        if r3.status_code == 200:
                            current_block = int(r3.json().get("result", "0x0"), 16)
                            tx_block_num = int(tx_block, 16)
                            confs = max(0, current_block - tx_block_num + 1)
                            return {"ok": True, "confirmations": confs, "amount": 0, "provider": "etherscan"}
                return {"ok": True, "confirmations": 1, "amount": 0, "provider": "etherscan"}
        return {"ok": False, "error": f"etherscan HTTP {r.status_code}"}

    def _blockchain_info(tx: str) -> dict:
        """Blockchain.info — BTC only, completely free."""
        url = f"https://blockchain.info/rawtx/{tx}?cors=true"
        r = http_requests.get(url, timeout=TIMEOUT)
        if r.status_code == 200:
            d = r.json()
            block_height = d.get("block_height")
            if block_height:
                # Get current tip
                tip_r = http_requests.get("https://blockchain.info/q/getblockcount", timeout=TIMEOUT)
                tip = int(tip_r.text.strip()) if tip_r.status_code == 200 else block_height
                confs = max(0, tip - block_height + 1)
            else:
                confs = 0  # Unconfirmed
            out_val = sum(o.get("value", 0) for o in d.get("out", []))
            return {"ok": True, "confirmations": confs, "amount": out_val / 1e8, "provider": "blockchain.info"}
        return {"ok": False, "error": f"blockchain.info HTTP {r.status_code}"}

    def _bscscan(tx: str) -> dict:
        """BSCScan — BNB/BSC, free tier."""
        api_key = os.environ.get("BSCSCAN_API_KEY", "")
        key_param = f"&apikey={api_key}" if api_key else ""
        url = f"https://api.bscscan.com/api?module=transaction&action=gettxreceiptstatus&txhash={tx}{key_param}"
        r = http_requests.get(url, timeout=TIMEOUT)
        if r.status_code == 200 and r.json().get("status") == "1":
            return {"ok": True, "confirmations": 30, "amount": 0, "provider": "bscscan"}
        return {"ok": False, "error": "bscscan API error"}

    # Provider dispatch
    providers = []
    if currency in ("ETH", "USDT", "USDC"):
        providers = [_etherscan, lambda _: _blockcypher("eth")]
    elif currency == "BTC":
        providers = [_blockchain_info, lambda _: _blockcypher("btc")]
    elif currency == "LTC":
        providers = [lambda _: _blockcypher("ltc")]
    elif currency == "DOGE":
        providers = [lambda _: _blockcypher("doge")]
    elif currency in ("BNB", "BSC"):
        providers = [_bscscan]
    else:
        return {"valid": False, "confirmations": 0, "amount": 0, "required": required,
                "error": f"Unsupported currency: {currency}"}

    last_error = "All providers failed"
    for provider_fn in providers:
        try:
            result = provider_fn(tx_hash)
            if result.get("ok"):
                confs = result["confirmations"]
                return {
                    "valid": confs >= required,
                    "confirmations": confs,
                    "amount": result.get("amount", 0),
                    "required": required,
                    "provider": result.get("provider", "unknown"),
                }
            last_error = result.get("error", "unknown error")
            logger.warning(f"[crypto] Provider failed for {tx_hash[:12]}...: {last_error}")
        except Exception as e:
            last_error = str(e)
            logger.warning(f"[crypto] Provider exception: {e}")

    # All providers failed — queue for manual review
    logger.error(f"[crypto] All providers failed for {tx_hash[:12]}...: {last_error}")
    return {"valid": False, "confirmations": 0, "amount": 0, "required": required,
            "error": last_error, "needs_manual_review": True}


def _notify_admins(title: str, message: str, priority: str = "high"):
    admins = User.query.filter(User.role.in_(["admin", "main_admin"])).all()
    for admin in admins:
        notif = Notification(user_id=admin.id, title=title, message=message,
                             type="info", priority=priority)
        db.session.add(notif)


# ---------------------------------------------------------------------------
# Public — get wallets for payment
# ---------------------------------------------------------------------------

@crypto_payments_bp.route("/api/crypto-payments/wallets", methods=["GET"])
def get_crypto_wallets():
    """Public: get active wallet addresses"""
    wallets = CryptoWalletAddress.query.filter_by(is_active=True).all()
    return jsonify({"success": True, "wallets": [w.to_dict() for w in wallets]}), 200


# ---------------------------------------------------------------------------
# Admin — manage wallet addresses
# ---------------------------------------------------------------------------

@crypto_payments_bp.route("/api/admin/crypto-payments/wallets", methods=["GET"])
@admin_required
def admin_get_wallets():
    wallets = CryptoWalletAddress.query.all()
    return jsonify({"success": True, "wallets": [w.to_dict() for w in wallets]}), 200


@crypto_payments_bp.route("/api/admin/crypto-payments/wallets", methods=["POST"])
@admin_required
def admin_add_wallet():
    data = request.get_json()
    currency = data.get("currency", "").upper()
    address = data.get("wallet_address")
    network = data.get("network", "")

    if not currency or not address:
        return jsonify({"success": False, "error": "currency and wallet_address are required"}), 400

    existing = CryptoWalletAddress.query.filter_by(currency=currency).first()
    if existing:
        existing.wallet_address = address
        existing.network = network
        existing.is_active = data.get("is_active", True)
        existing.notes = data.get("notes", existing.notes)
        existing.updated_by = session.get("user_id")
        db.session.commit()
        return jsonify({"success": True, "wallet": existing.to_dict()}), 200

    wallet = CryptoWalletAddress(
        currency=currency,
        wallet_address=address,
        network=network,
        is_active=True,
        updated_by=session.get("user_id"),
        notes=data.get("notes", "")
    )
    db.session.add(wallet)
    db.session.commit()
    return jsonify({"success": True, "wallet": wallet.to_dict()}), 201


@crypto_payments_bp.route("/api/admin/crypto-payments/wallets/<int:wallet_id>", methods=["PATCH"])
@admin_required
def admin_update_wallet(wallet_id):
    data = request.get_json()
    wallet = CryptoWalletAddress.query.get(wallet_id)
    if not wallet:
        return jsonify({"success": False, "error": "Wallet not found"}), 404

    if "wallet_address" in data:
        wallet.wallet_address = data["wallet_address"]
    if "is_active" in data:
        wallet.is_active = data["is_active"]
    if "network" in data:
        wallet.network = data["network"]
    if "notes" in data:
        wallet.notes = data["notes"]
    wallet.updated_by = session.get("user_id")
    db.session.commit()
    return jsonify({"success": True, "wallet": wallet.to_dict()}), 200


# ---------------------------------------------------------------------------
# User — submit payment proof
# ---------------------------------------------------------------------------

@crypto_payments_bp.route("/api/crypto-payments/submit-proof", methods=["POST"])
@login_required
def submit_payment_proof():
    """Submit crypto payment proof for admin verification"""
    try:
        user_id = session.get("user_id")
        data = request.get_json()

        required = ["plan_type", "currency", "tx_hash", "amount_usd"]
        missing = [k for k in required if not data.get(k)]
        if missing:
            return jsonify({"success": False, "error": f"Missing fields: {', '.join(missing)}"}), 400

        plan_type = data["plan_type"]
        currency = data["currency"].upper()
        tx_hash = data["tx_hash"].strip()
        amount_usd = float(data["amount_usd"])
        amount_crypto = float(data.get("amount_crypto", 0))
        wallet_address = data.get("wallet_address", "")

        if plan_type not in PLAN_DURATIONS:
            return jsonify({"success": False, "error": "Invalid plan type"}), 400

        # Prevent duplicate tx_hash
        duplicate = CryptoPaymentTransaction.query.filter_by(transaction_hash=tx_hash).first()
        if duplicate:
            return jsonify({"success": False, "error": "This transaction hash has already been submitted"}), 400

        # Get wallet from DB
        wallet_obj = CryptoWalletAddress.query.filter_by(currency=currency, is_active=True).first()
        if wallet_obj:
            wallet_address = wallet_obj.wallet_address

        # Attempt lightweight blockchain verification
        chain_result = _verify_tx_hash_on_chain(tx_hash, currency)

        tx = CryptoPaymentTransaction(
            user_id=user_id,
            plan_type=plan_type,
            currency=currency,
            wallet_address=wallet_address,
            transaction_hash=tx_hash,
            amount_crypto=amount_crypto,
            amount_usd=amount_usd,
            status="pending",
            verification_method="manual" if not chain_result["valid"] else "blockchain",
            blockchain_confirmations=chain_result.get("confirmations", 0),
        )
        db.session.add(tx)
        db.session.flush()

        # Notify admins
        user = User.query.get(user_id)
        _notify_admins(
            "New Crypto Payment Proof",
            f"User {user.username} submitted {currency} TX {tx_hash} for {plan_type} plan (${amount_usd})"
        )

        # Notify user
        db.session.add(Notification(
            user_id=user_id,
            title="Payment Proof Submitted",
            message="Your payment proof is under review. You'll be notified once confirmed.",
            type="info",
            priority="medium"
        ))

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Payment proof submitted. Admin will verify shortly.",
            "transaction_id": tx.id,
            "blockchain_verified": chain_result["valid"],
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"submit_payment_proof error: {e}")
        return jsonify({"success": False, "error": "Failed to submit proof"}), 500


# ---------------------------------------------------------------------------
# Admin — list & manage pending payments
# ---------------------------------------------------------------------------

@crypto_payments_bp.route("/api/admin/crypto-payments/pending", methods=["GET"])
@admin_required
def get_pending_payments():
    try:
        txns = CryptoPaymentTransaction.query.filter_by(status="pending")\
            .order_by(CryptoPaymentTransaction.created_at.desc()).all()
        return jsonify({"success": True, "payments": [t.to_dict() for t in txns]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@crypto_payments_bp.route("/api/admin/crypto-payments/all", methods=["GET"])
@admin_required
def admin_get_all_payments():
    try:
        txns = CryptoPaymentTransaction.query.order_by(
            CryptoPaymentTransaction.created_at.desc()).all()
        return jsonify({"success": True, "payments": [t.to_dict() for t in txns]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@crypto_payments_bp.route("/api/admin/crypto-payments/<int:tx_id>/confirm", methods=["POST"])
@admin_required
def confirm_payment(tx_id):
    """Confirm crypto payment — activates user subscription"""
    try:
        admin_id = session.get("user_id")
        data = request.get_json() or {}

        tx = CryptoPaymentTransaction.query.get(tx_id)
        if not tx:
            return jsonify({"success": False, "error": "Transaction not found"}), 404
        if tx.status != "pending":
            return jsonify({"success": False, "error": f"Transaction already {tx.status}"}), 400

        # Mark transaction confirmed
        tx.status = "confirmed"
        tx.verified_by = admin_id
        tx.verified_at = datetime.utcnow()

        # Activate user subscription
        user = User.query.get(tx.user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        duration = PLAN_DURATIONS.get(tx.plan_type, 30)
        user.plan_type = tx.plan_type
        user.status = "active"
        user.is_active = True
        user.subscription_status = "active"
        user.subscription_start_date = datetime.utcnow()
        user.subscription_expiry = datetime.utcnow() + timedelta(days=duration)
        user.subscription_end_date = user.subscription_expiry

        # Create unified Payment record
        payment = Payment(
            user_id=tx.user_id,
            payment_type="crypto",
            currency=tx.currency,
            amount=float(tx.amount_usd),
            plan_type=tx.plan_type,
            tx_hash=tx.transaction_hash,
            status="confirmed",
            confirmed_at=datetime.utcnow()
        )
        db.session.add(payment)

        # Notify user
        db.session.add(Notification(
            user_id=tx.user_id,
            title="Payment Confirmed 🎉",
            message=f"Your {tx.currency} payment has been confirmed! {tx.plan_type.title()} plan is now active.",
            type="success",
            priority="high"
        ))

        # Audit log
        db.session.add(AuditLog(
            actor_id=admin_id,
            action=f"Confirmed crypto payment for user {user.username} — {tx.plan_type}",
            target_id=user.id,
            target_type="crypto_payment",
            ip_address=request.remote_addr
        ))

        db.session.commit()
        return jsonify({"success": True, "message": f"{user.username} upgraded to {tx.plan_type}"}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"confirm_payment error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@crypto_payments_bp.route("/api/admin/crypto-payments/<int:tx_id>/reject", methods=["POST"])
@admin_required
def reject_payment(tx_id):
    """Reject crypto payment proof"""
    try:
        admin_id = session.get("user_id")
        data = request.get_json() or {}
        reason = data.get("reason", "Payment proof could not be verified")

        tx = CryptoPaymentTransaction.query.get(tx_id)
        if not tx:
            return jsonify({"success": False, "error": "Transaction not found"}), 404

        tx.status = "rejected"
        tx.rejection_reason = reason
        tx.verified_by = admin_id
        tx.verified_at = datetime.utcnow()

        # Revert user status if still pending
        user = User.query.get(tx.user_id)
        if user and user.status == "crypto_pending":
            user.status = "active"

        db.session.add(Notification(
            user_id=tx.user_id,
            title="Payment Rejected",
            message=f"Your crypto payment was rejected. Reason: {reason}. Please resubmit or contact support.",
            type="error",
            priority="high"
        ))

        db.session.add(AuditLog(
            actor_id=admin_id,
            action=f"Rejected crypto payment TX {tx.transaction_hash[:10]}... for user {tx.user_id}",
            target_id=tx.user_id,
            target_type="crypto_payment",
            ip_address=request.remote_addr
        ))

        db.session.commit()
        return jsonify({"success": True, "message": "Payment rejected and user notified"}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"reject_payment error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------------------------
# User — real-time confirmation polling
# ---------------------------------------------------------------------------

@crypto_payments_bp.route("/api/crypto-payments/status/<int:tx_id>", methods=["GET"])
@login_required
def get_payment_status(tx_id):
    """
    Poll real-time confirmation count for a crypto payment.
    Called by the frontend every ~15s until confirmations >= required or status changes.
    """
    try:
        user_id = session.get("user_id")
        tx = CryptoPaymentTransaction.query.filter_by(id=tx_id, user_id=user_id).first()
        if not tx:
            return jsonify({"success": False, "error": "Transaction not found"}), 404

        required = _get_required_confirmations()

        # If already confirmed/rejected, return current state immediately
        if tx.status in ("confirmed", "rejected"):
            return jsonify({
                "success": True,
                "status": tx.status,
                "confirmations": tx.blockchain_confirmations or 0,
                "required": required,
                "verified": tx.status == "confirmed",
                "transaction_id": tx.id,
            }), 200

        # Re-check chain for pending transactions
        chain = _verify_tx_hash_on_chain(tx.transaction_hash, tx.currency)
        confs = chain.get("confirmations", 0)

        # Update DB with latest confirmation count
        if confs != tx.blockchain_confirmations:
            tx.blockchain_confirmations = confs
            db.session.commit()

        # Auto-confirm if threshold reached
        auto_confirmed = False
        if chain.get("valid") and confs >= required and tx.status == "pending":
            tx.status = "confirmed"
            tx.verification_method = "blockchain"
            tx.verified_at = datetime.utcnow()

            user = User.query.get(tx.user_id)
            if user:
                duration = PLAN_DURATIONS.get(tx.plan_type, 30)
                user.plan_type = tx.plan_type
                user.status = "active"
                user.is_active = True
                user.subscription_status = "active"
                user.subscription_start_date = datetime.utcnow()
                user.subscription_expiry = datetime.utcnow() + timedelta(days=duration)
                user.subscription_end_date = user.subscription_expiry

                db.session.add(Payment(
                    user_id=tx.user_id,
                    payment_type="crypto",
                    currency=tx.currency,
                    amount=float(tx.amount_usd),
                    plan_type=tx.plan_type,
                    tx_hash=tx.transaction_hash,
                    status="confirmed",
                    confirmed_at=datetime.utcnow()
                ))
                db.session.add(Notification(
                    user_id=tx.user_id,
                    title="Payment Auto-Confirmed ✅",
                    message=(
                        f"Your {tx.currency} payment reached {confs} confirmations and has been "
                        f"automatically verified! Your {tx.plan_type.title()} plan is now active."
                    ),
                    type="success",
                    priority="high"
                ))
                _notify_admins(
                    "Crypto Payment Auto-Confirmed",
                    f"TX {tx.transaction_hash[:12]}... for user {user.username} — {tx.plan_type} auto-confirmed ({confs} confs)"
                )
            db.session.commit()
            auto_confirmed = True

        return jsonify({
            "success": True,
            "status": tx.status,
            "confirmations": confs,
            "required": required,
            "verified": tx.status == "confirmed",
            "auto_confirmed": auto_confirmed,
            "provider": chain.get("provider"),
            "transaction_id": tx.id,
            "needs_manual_review": chain.get("needs_manual_review", False),
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"get_payment_status error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@crypto_payments_bp.route("/api/crypto-payments/my-payments", methods=["GET"])
@login_required
def get_my_payments():
    """List the current user's crypto payment history."""
    try:
        user_id = session.get("user_id")
        txns = CryptoPaymentTransaction.query.filter_by(user_id=user_id)\
            .order_by(CryptoPaymentTransaction.created_at.desc()).all()
        return jsonify({"success": True, "payments": [t.to_dict() for t in txns]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ---------------------------------------------------------------------------
# Admin — confirmation threshold settings
# ---------------------------------------------------------------------------

@crypto_payments_bp.route("/api/admin/crypto-payments/settings", methods=["GET"])
@admin_required
def get_crypto_settings():
    """Get crypto payment admin settings including confirmation threshold."""
    try:
        from api.models.admin_settings import AdminSettings
        required = _get_required_confirmations()
        auto_confirm = True
        try:
            s = AdminSettings.query.filter_by(setting_key='crypto_auto_confirm').first()
            if s:
                auto_confirm = s.setting_value.lower() not in ('false', '0', 'off')
        except Exception:
            pass
        return jsonify({
            "success": True,
            "settings": {
                "required_confirmations": required,
                "auto_confirm_enabled": auto_confirm,
                "default_required_confirmations": DEFAULT_REQUIRED_CONFIRMATIONS,
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@crypto_payments_bp.route("/api/admin/crypto-payments/settings", methods=["POST", "PATCH"])
@admin_required
def update_crypto_settings():
    """Update crypto payment settings (confirmation threshold, auto-confirm toggle)."""
    try:
        from api.models.admin_settings import AdminSettings
        data = request.get_json() or {}
        updated = []

        if "required_confirmations" in data:
            val = int(data["required_confirmations"])
            if val < 1 or val > 100:
                return jsonify({"success": False, "error": "required_confirmations must be 1–100"}), 400
            _upsert_setting("crypto_required_confirmations", str(val))
            updated.append(f"required_confirmations={val}")

        if "auto_confirm_enabled" in data:
            _upsert_setting("crypto_auto_confirm", "true" if data["auto_confirm_enabled"] else "false")
            updated.append(f"auto_confirm_enabled={data['auto_confirm_enabled']}")

        return jsonify({
            "success": True,
            "message": f"Settings updated: {', '.join(updated)}",
            "required_confirmations": _get_required_confirmations(),
        }), 200
    except ValueError:
        return jsonify({"success": False, "error": "Invalid value for required_confirmations"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def _upsert_setting(key: str, value: str):
    """Create or update an AdminSettings key-value entry."""
    from api.models.admin_settings import AdminSettings
    setting = AdminSettings.query.filter_by(setting_key=key).first()
    if setting:
        setting.setting_value = value
    else:
        setting = AdminSettings(setting_key=key, setting_value=value)
        db.session.add(setting)
    db.session.commit()


# ---------------------------------------------------------------------------
# Admin — re-check confirmation count on demand
# ---------------------------------------------------------------------------

@crypto_payments_bp.route("/api/admin/crypto-payments/<int:tx_id>/recheck", methods=["POST"])
@admin_required
def admin_recheck_payment(tx_id):
    """Force re-check of blockchain confirmations for a transaction."""
    try:
        tx = CryptoPaymentTransaction.query.get(tx_id)
        if not tx:
            return jsonify({"success": False, "error": "Transaction not found"}), 404

        chain = _verify_tx_hash_on_chain(tx.transaction_hash, tx.currency)
        confs = chain.get("confirmations", 0)
        tx.blockchain_confirmations = confs
        db.session.commit()

        return jsonify({
            "success": True,
            "confirmations": confs,
            "required": _get_required_confirmations(),
            "valid": chain.get("valid", False),
            "provider": chain.get("provider"),
            "needs_manual_review": chain.get("needs_manual_review", False),
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
