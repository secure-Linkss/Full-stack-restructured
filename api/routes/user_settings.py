from flask import g, Blueprint, request, jsonify
from api.database import db
from api.middleware.auth_decorators import login_required

user_settings_bp = Blueprint('user_settings', __name__)


@user_settings_bp.route('/appearance', methods=['GET'])
@login_required
def get_appearance_settings():
    current_user = g.user
    try:
        settings = {
            'theme': current_user.theme or 'dark',
            'background_url': current_user.background_url or '',
            'background_color': current_user.background_color or '',
        }
        return jsonify(settings), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch appearance settings'}), 500


@user_settings_bp.route('/appearance', methods=['PATCH'])
@login_required
def update_appearance_settings():
    current_user = g.user
    try:
        data = request.get_json() or {}
        if 'theme' in data:
            current_user.theme = data['theme']
        if 'background_url' in data:
            current_user.background_url = data['background_url'] or None
        if 'background_color' in data:
            current_user.background_color = data['background_color'] or None
        db.session.commit()
        return jsonify({'message': 'Appearance settings updated successfully', 'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update appearance settings'}), 500


@user_settings_bp.route('/billing', methods=['GET'])
@login_required
def get_billing_info():
    current_user = g.user
    try:
        invoices = []
        try:
            from api.models.payment import Payment
            inv_rows = Payment.query.filter_by(user_id=current_user.id).order_by(Payment.id.desc()).all()
            for inv in inv_rows:
                invoices.append({
                    'id': inv.id,
                    'date': inv.created_at.isoformat() if hasattr(inv, 'created_at') and inv.created_at else 'N/A',
                    'amount': getattr(inv, 'amount', 0),
                    'status': getattr(inv, 'status', 'N/A'),
                    'link': getattr(inv, 'invoice_url', '#') or '#',
                })
        except Exception:
            pass

        billing_info = {
            'plan': getattr(current_user, 'plan_type', None) or getattr(current_user, 'subscription_plan', None) or 'Free',
            'status': getattr(current_user, 'subscription_status', None) or 'Inactive',
            'next_billing_date': getattr(current_user, 'next_billing_date', None) or 'N/A',
            'payment_method': getattr(current_user, 'payment_method', None) or 'None on file',
            'invoices': invoices,
        }
        return jsonify(billing_info), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch billing information'}), 500
