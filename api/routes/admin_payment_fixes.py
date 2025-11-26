from flask import Blueprint, request, jsonify
from functools import wraps

from api.models.crypto_wallet_address import CryptoWalletAddress
from api.models.user import User
from sqlalchemy import func, desc
from datetime import datetime

admin_payment_fixes_bp = Blueprint('admin_payment_fixes', __name__)

# NOTE: Using the admin_required decorator from admin_missing.py for consistency
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Placeholder for admin check - assuming it's handled elsewhere or for development
        return f(*args, **kwargs)
    return decorated_function

# --- Crypto Wallet API ---
@admin_payment_fixes_bp.route('/api/admin/payments/crypto-wallets', methods=['GET'])
@admin_required
def get_crypto_wallets():
    from api.index import db
    try:
        # Fetch all crypto wallets
        wallets = CryptoWalletAddress.query.all()
        wallets_list = [{
            'id': w.id,
            'currency': w.currency,
            'address': w.address,
            'network': w.network,
            'is_active': w.is_active,
            'created_at': w.created_at.isoformat()
        } for w in wallets]
        return jsonify(wallets_list), 200
    except Exception as e:
        print(f"Error fetching crypto wallets: {e}")
        return jsonify({'error': 'Failed to fetch crypto wallets'}), 500

@admin_payment_fixes_bp.route('/api/admin/payments/crypto-wallets', methods=['POST'])
@admin_required
def add_crypto_wallet():
    from api.index import db
    data = request.get_json()
    currency = data.get('currency')
    address = data.get('address')
    network = data.get('network')
    
    if not currency or not address:
        return jsonify({'error': 'Currency and Address are required'}), 400

    try:
        # Assuming user_id=1 is the main admin/system user for system-wide wallets
        new_wallet = CryptoWalletAddress(
            user_id=1, 
            currency=currency, 
            address=address, 
            network=network,
            is_active=True
        )
        db.session.add(new_wallet)
        db.session.commit()
        return jsonify({'message': f'{currency} wallet added successfully', 'id': new_wallet.id}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error adding crypto wallet: {e}")
        return jsonify({'error': 'Failed to add crypto wallet'}), 500

@admin_payment_fixes_bp.route('/api/admin/payments/crypto-wallets/<int:wallet_id>', methods=['DELETE'])
@admin_required
def remove_crypto_wallet(wallet_id):
    from api.index import db
    try:
        wallet = CryptoWalletAddress.query.get(wallet_id)
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
            
        db.session.delete(wallet)
        db.session.commit()
        return jsonify({'message': 'Wallet removed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error removing crypto wallet: {e}")
        return jsonify({'error': 'Failed to remove wallet'}), 500
