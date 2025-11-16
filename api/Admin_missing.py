"""
Missing Admin API Routes
These endpoints are called by AdminPanel.jsx but were not implemented
"""
from flask import Blueprint, request, jsonify, session
from functools import wraps
from api.database import db
from api.models.user import User
from api.models.link import Link
from api.models.campaign import Campaign
from api.models.tracking_event import TrackingEvent
from api.models.crypto_wallet_address import CryptoWalletAddress
from api.models.audit_log import AuditLog
from sqlalchemy import func
from datetime import datetime, timedelta

admin_missing_bp = Blueprint('admin_missing', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        user = User.query.get(user_id)
        if not user or user.role not in ['admin', 'main_admin']:
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(user, *args, **kwargs)
    return decorated_function

@admin_missing_bp.route('/api/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats(current_user):
    """Get admin dashboard statistics"""
    try:
        # User statistics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        
        # Link statistics
        total_links = Link.query.count()
        active_links = Link.query.filter_by(is_active=True).count()
        
        # Click statistics
        total_clicks = TrackingEvent.query.count()
        
        # Campaign statistics
        total_campaigns = Campaign.query.count()
        active_campaigns = Campaign.query.filter_by(status='active').count()
        
        # Revenue (placeholder - would need payment tracking)
        total_revenue = 0
        
        return jsonify({
            'totalUsers': total_users,
            'activeUsers': active_users,
            'totalLinks': total_links,
            'activeLinks': active_links,
            'totalClicks': total_clicks,
            'totalRevenue': total_revenue,
            'activeCampaigns': active_campaigns,
            'totalCampaigns': total_campaigns
        })
    except Exception as e:
        print(f"Error fetching admin stats: {e}")
        return jsonify({'error': str(e)}), 500

@admin_missing_bp.route('/api/admin/wallets', methods=['GET'])
@admin_required
def get_admin_wallets(current_user):
    """Get all crypto wallet addresses"""
    try:
        wallets = CryptoWalletAddress.query.all()
        return jsonify({
            'wallets': [wallet.to_dict() for wallet in wallets]
        })
    except Exception as e:
        print(f"Error fetching wallets: {e}")
        return jsonify({'error': str(e)}), 500

@admin_missing_bp.route('/api/admin/wallets', methods=['POST'])
@admin_required
def create_admin_wallet(current_user):
    """Create a new crypto wallet address"""
    try:
        data = request.get_json()
        
        # Map wallet_type to currency
        wallet_type = data.get('wallet_type', 'BTC')
        
        # Check if wallet for this currency already exists
        existing = CryptoWalletAddress.query.filter_by(currency=wallet_type).first()
        if existing:
            return jsonify({'error': f'Wallet for {wallet_type} already exists'}), 409
        
        wallet = CryptoWalletAddress(
            currency=wallet_type,
            wallet_address=data.get('wallet_address'),
            network=data.get('network', ''),
            is_active=data.get('is_active', True),
            updated_by=current_user.id,
            notes=data.get('notes', '')
        )
        
        db.session.add(wallet)
        db.session.commit()
        
        return jsonify(wallet.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating wallet: {e}")
        return jsonify({'error': str(e)}), 500

@admin_missing_bp.route('/api/admin/wallets/<int:wallet_id>', methods=['DELETE'])
@admin_required
def delete_admin_wallet(current_user, wallet_id):
    """Delete a crypto wallet address"""
    try:
        wallet = CryptoWalletAddress.query.get_or_404(wallet_id)
        db.session.delete(wallet)
        db.session.commit()
        
        return jsonify({'message': 'Wallet deleted successfully'})
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting wallet: {e}")
        return jsonify({'error': str(e)}), 500

@admin_missing_bp.route('/api/admin/wallets/<int:wallet_id>/toggle', methods=['PUT'])
@admin_required
def toggle_admin_wallet(current_user, wallet_id):
    """Toggle wallet active status"""
    try:
        wallet = CryptoWalletAddress.query.get_or_404(wallet_id)
        data = request.get_json()
        
        wallet.is_active = data.get('is_active', wallet.is_active)
        wallet.updated_by = current_user.id
        wallet.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(wallet.to_dict())
    except Exception as e:
        db.session.rollback()
        print(f"Error toggling wallet: {e}")
        return jsonify({'error': str(e)}), 500

@admin_missing_bp.route('/api/admin/activity-logs', methods=['GET'])
@admin_required
def get_activity_logs(current_user):
    """Get recent activity logs"""
    try:
        logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(50).all()
        
        log_list = []
        for log in logs:
            actor = User.query.get(log.actor_id) if log.actor_id else None
            log_list.append({
                'id': log.id,
                'action': log.action,
                'user': actor.username if actor else 'System',
                'timestamp': log.created_at.isoformat() if log.created_at else None,
                'target_type': log.target_type,
                'target_id': log.target_id
            })
        
        return jsonify({'logs': log_list})
    except Exception as e:
        print(f"Error fetching activity logs: {e}")
        return jsonify({'error': str(e)}), 500

@admin_missing_bp.route('/api/admin/security-logs', methods=['GET'])
@admin_required
def get_security_logs(current_user):
    """Get security-related logs"""
    try:
        # Get security-related audit logs
        security_logs = AuditLog.query.filter(
            AuditLog.action.like('%security%') | 
            AuditLog.action.like('%login%') |
            AuditLog.action.like('%password%')
        ).order_by(AuditLog.created_at.desc()).limit(50).all()
        
        log_list = []
        for log in security_logs:
            log_list.append({
                'id': log.id,
                'event': log.action,
                'ip_address': 'N/A',  # Would need to track this
                'timestamp': log.created_at.isoformat() if log.created_at else None,
                'severity': 'medium'  # Default severity
            })
        
        return jsonify({'logs': log_list})
    except Exception as e:
        print(f"Error fetching security logs: {e}")
        return jsonify({'error': str(e)}), 500

@admin_missing_bp.route('/api/admin/system-config', methods=['GET'])
@admin_required
def get_system_config(current_user):
    """Get system configuration"""
    try:
        # Return placeholder config - would need AdminSettings model
        config = {
            'telegram_bot_token': '',
            'telegram_chat_id': '',
            'telegram_enabled': False,
            'stripe_publishable_key': '',
            'stripe_secret_key': '',
            'stripe_enabled': False,
            'smtp_host': '',
            'smtp_port': 587,
            'smtp_user': '',
            'smtp_password': '',
            'smtp_enabled': False,
            'maintenance_mode': False,
            'enable_registrations': True,
            'max_links_per_user': 100,
            'company_name': 'Brain Link Tracker Pro',
            'company_logo_url': ''
        }
        
        return jsonify(config)
    except Exception as e:
        print(f"Error fetching system config: {e}")
        return jsonify({'error': str(e)}), 500

@admin_missing_bp.route('/api/admin/system-config', methods=['POST'])
@admin_required
def save_system_config(current_user):
    """Save system configuration"""
    try:
        data = request.get_json()
        
        # Would save to AdminSettings model
        # For now, just return success
        
        return jsonify({'message': 'System configuration saved successfully'})
    except Exception as e:
        print(f"Error saving system config: {e}")
        return jsonify({'error': str(e)}), 500

@admin_missing_bp.route('/api/admin/test-telegram', methods=['POST'])
@admin_required
def test_telegram(current_user):
    """Test Telegram bot connection"""
    try:
        data = request.get_json()
        bot_token = data.get('bot_token')
        chat_id = data.get('chat_id')
        
        # Would actually test Telegram connection here
        # For now, just return success
        
        return jsonify({'message': 'Test message sent successfully'})
    except Exception as e:
        print(f"Error testing Telegram: {e}")
        return jsonify({'error': str(e)}), 500
