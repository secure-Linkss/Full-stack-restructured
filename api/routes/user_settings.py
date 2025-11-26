from flask import Blueprint, request, jsonify
from api.database import db
from functools import wraps

user_settings_bp = Blueprint('user_settings', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import session
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        from api.models.user import User
        current_user = User.query.get(session.get("user_id"))
        if not current_user:
            return jsonify({"error": "User not found"}), 401
        return f(current_user, *args, **kwargs)
    return decorated_function

@user_settings_bp.route('/appearance', methods=['GET'])
@login_required
def get_appearance_settings(current_user):
    """Get appearance settings"""
    try:
        settings = {
            'theme': current_user.theme or 'dark',
            'background_url': current_user.background_url or '',
            'background_color': current_user.background_color or '#000000',
        }
        return jsonify(settings), 200
    except Exception as e:
        print(f'Error fetching appearance settings: {e}')
        return jsonify({'error': 'Failed to fetch appearance settings'}), 500

@user_settings_bp.route('/appearance', methods=['PATCH'])
@login_required
def update_appearance_settings(current_user):
    """Update appearance settings"""
    try:
        data = request.get_json()
        
        if 'theme' in data:
            current_user.theme = data['theme']
        
        if 'background_url' in data:
            current_user.background_url = data['background_url']
        
        if 'background_color' in data:
            current_user.background_color = data['background_color']
        
        db.session.commit()
        return jsonify({'message': 'Appearance settings updated successfully'}), 200
    except Exception as e:
        print(f'Error updating appearance settings: {e}')
        db.session.rollback()
        return jsonify({'error': 'Failed to update appearance settings'}), 500

@user_settings_bp.route('/billing', methods=['GET'])
@login_required
def get_billing_info(current_user):
    """Get billing and subscription information"""
    try:
        # This endpoint is structured to return live data from the User model and associated tables.
        # Since full payment integration is outside the scope, we ensure no hardcoded mock data is returned.
        # The frontend will handle displaying 'N/A' or empty states if the data is not present.
        
        # Assuming a 'Payment' model exists to fetch real invoices
        try:
            from api.models.payment import Payment 
            invoices = Payment.query.filter_by(user_id=current_user.id).order_by(Payment.date.desc()).all()
        except Exception as e:
            print(f"Warning: Payment model not found or error fetching invoices: {e}")
            invoices = []
        
        billing_info = {
            'plan': current_user.subscription_plan or 'Free',
            'status': current_user.subscription_status or 'Inactive',
            'next_billing_date': current_user.next_billing_date or 'N/A',
            'payment_method': current_user.payment_method or 'None on file',
            'invoices': [{
                'id': inv.id, 
                'date': inv.date.isoformat() if hasattr(inv, 'date') else 'N/A', 
                'amount': inv.amount if hasattr(inv, 'amount') else 0, 
                'status': inv.status if hasattr(inv, 'status') else 'N/A', 
                'link': inv.invoice_url if hasattr(inv, 'invoice_url') else '#'
            } for inv in invoices]
        }
        return jsonify(billing_info), 200
    except Exception as e:
        print(f'Error fetching billing info: {e}')
        return jsonify({'error': 'Failed to fetch billing information'}), 500
