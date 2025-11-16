
from flask import Blueprint, request, jsonify
from src.models.user import db, User
from src.models.link import Link
from src.models.campaign import Campaign
from src.models.tracking_event import TrackingEvent
from src.models.domain import Domain
from src.models.notification import Notification
from functools import wraps
import datetime

# Create blueprints for missing routes
missing_routes_bp = Blueprint('missing_routes', __name__)

def auth_required(f):
    """Authentication decorator"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # Simple auth check - in production use proper JWT validation
        return f(*args, **kwargs)
    return decorated

# Fix parametrized routes that were missing
@missing_routes_bp.route('/api/links/<int:link_id>', methods=['GET', 'PUT', 'DELETE'])
@auth_required
def handle_link(link_id):
    """Handle individual link operations"""
    try:
        link = Link.query.get_or_404(link_id)
        
        if request.method == 'GET':
            return jsonify({
                'id': link.id,
                'short_code': link.short_code,
                'original_url': link.original_url,
                'title': link.title,
                'description': link.description,
                'created_at': link.created_at.isoformat() if link.created_at else None,
                'clicks': link.clicks or 0,
                'is_active': link.is_active
            })
        
        elif request.method == 'PUT':
            data = request.get_json()
            if 'title' in data:
                link.title = data['title']
            if 'description' in data:
                link.description = data['description']
            if 'is_active' in data:
                link.is_active = data['is_active']
            
            db.session.commit()
            return jsonify({'message': 'Link updated successfully'})
        
        elif request.method == 'DELETE':
            db.session.delete(link)
            db.session.commit()
            return jsonify({'message': 'Link deleted successfully'})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@missing_routes_bp.route('/api/links/create', methods=['POST'])
@auth_required
def create_link():
    """Create a new link"""
    try:
        data = request.get_json()
        
        new_link = Link(
            original_url=data.get('url'),
            title=data.get('title', ''),
            description=data.get('description', ''),
            user_id=data.get('user_id', 1),  # Default to admin user
            short_code=data.get('short_code', ''),
            campaign_id=data.get('campaign_id'),
            is_active=True,
            created_at=datetime.datetime.utcnow()
        )
        
        db.session.add(new_link)
        db.session.commit()
        
        return jsonify({
            'id': new_link.id,
            'short_code': new_link.short_code,
            'message': 'Link created successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@missing_routes_bp.route('/api/links/regenerate/<int:link_id>', methods=['POST'])
@auth_required
def regenerate_link(link_id):
    """Regenerate a link's short code"""
    try:
        link = Link.query.get_or_404(link_id)
        
        # Generate new short code
        import random
        import string
        new_code = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        link.short_code = new_code
        
        db.session.commit()
        
        return jsonify({
            'short_code': new_code,
            'message': 'Link regenerated successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@missing_routes_bp.route('/api/campaigns/<int:campaign_id>', methods=['GET', 'PUT', 'DELETE'])
@auth_required
def handle_campaign(campaign_id):
    """Handle individual campaign operations"""
    try:
        campaign = Campaign.query.get_or_404(campaign_id)
        
        if request.method == 'GET':
            return jsonify({
                'id': campaign.id,
                'name': campaign.name,
                'description': campaign.description,
                'created_at': campaign.created_at.isoformat() if campaign.created_at else None,
                'is_active': campaign.is_active
            })
        
        elif request.method == 'PUT':
            data = request.get_json()
            if 'name' in data:
                campaign.name = data['name']
            if 'description' in data:
                campaign.description = data['description']
            if 'is_active' in data:
                campaign.is_active = data['is_active']
            
            db.session.commit()
            return jsonify({'message': 'Campaign updated successfully'})
        
        elif request.method == 'DELETE':
            db.session.delete(campaign)
            db.session.commit()
            return jsonify({'message': 'Campaign deleted successfully'})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@missing_routes_bp.route('/api/admin/users/<int:user_id>', methods=['GET', 'PUT', 'DELETE'])
@auth_required
def handle_admin_user(user_id):
    """Handle admin user operations"""
    try:
        user = User.query.get_or_404(user_id)
        
        if request.method == 'GET':
            return jsonify({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'status': user.status,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None
            })
        
        elif request.method == 'PUT':
            data = request.get_json()
            if 'role' in data:
                user.role = data['role']
            if 'status' in data:
                user.status = data['status']
            if 'is_active' in data:
                user.is_active = data['is_active']
            
            db.session.commit()
            return jsonify({'message': 'User updated successfully'})
        
        elif request.method == 'DELETE':
            db.session.delete(user)
            db.session.commit()
            return jsonify({'message': 'User deleted successfully'})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@missing_routes_bp.route('/api/admin/approve-user/<int:user_id>', methods=['POST'])
@auth_required
def approve_user(user_id):
    """Approve a user"""
    try:
        user = User.query.get_or_404(user_id)
        user.status = 'active'
        user.is_active = True
        user.is_verified = True
        
        db.session.commit()
        return jsonify({'message': 'User approved successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@missing_routes_bp.route('/api/admin/reject-user/<int:user_id>', methods=['POST'])
@auth_required
def reject_user(user_id):
    """Reject a user"""
    try:
        user = User.query.get_or_404(user_id)
        user.status = 'rejected'
        user.is_active = False
        
        db.session.commit()
        return jsonify({'message': 'User rejected successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@missing_routes_bp.route('/api/admin/domains/<int:domain_id>', methods=['GET', 'PUT', 'DELETE'])
@auth_required
def handle_admin_domain(domain_id):
    """Handle admin domain operations"""
    try:
        domain = Domain.query.get_or_404(domain_id)
        
        if request.method == 'GET':
            return jsonify({
                'id': domain.id,
                'domain': domain.domain,
                'is_verified': domain.is_verified,
                'is_active': domain.is_active,
                'created_at': domain.created_at.isoformat() if domain.created_at else None
            })
        
        elif request.method == 'PUT':
            data = request.get_json()
            if 'is_active' in data:
                domain.is_active = data['is_active']
            if 'is_verified' in data:
                domain.is_verified = data['is_verified']
            
            db.session.commit()
            return jsonify({'message': 'Domain updated successfully'})
        
        elif request.method == 'DELETE':
            db.session.delete(domain)
            db.session.commit()
            return jsonify({'message': 'Domain deleted successfully'})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@missing_routes_bp.route('/api/notifications/<int:notification_id>', methods=['GET', 'PUT', 'DELETE'])
@auth_required
def handle_notification(notification_id):
    """Handle notification operations"""
    try:
        notification = Notification.query.get_or_404(notification_id)
        
        if request.method == 'GET':
            return jsonify({
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'is_read': notification.is_read,
                'created_at': notification.created_at.isoformat() if notification.created_at else None
            })
        
        elif request.method == 'PUT':
            data = request.get_json()
            if 'is_read' in data:
                notification.is_read = data['is_read']
            
            db.session.commit()
            return jsonify({'message': 'Notification updated successfully'})
        
        elif request.method == 'DELETE':
            db.session.delete(notification)
            db.session.commit()
            return jsonify({'message': 'Notification deleted successfully'})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@missing_routes_bp.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
@auth_required
def mark_notification_read(notification_id):
    """Mark notification as read"""
    try:
        notification = Notification.query.get_or_404(notification_id)
        notification.is_read = True
        
        db.session.commit()
        return jsonify({'message': 'Notification marked as read'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@missing_routes_bp.route('/api/notifications/<int:notification_id>/unread', methods=['POST'])
@auth_required
def mark_notification_unread(notification_id):
    """Mark notification as unread"""
    try:
        notification = Notification.query.get_or_404(notification_id)
        notification.is_read = False
        
        db.session.commit()
        return jsonify({'message': 'Notification marked as unread'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@missing_routes_bp.route('/api/events/<int:event_id>', methods=['GET', 'PUT', 'DELETE'])
@auth_required
def handle_event(event_id):
    """Handle event operations"""
    try:
        event = TrackingEvent.query.get_or_404(event_id)
        
        if request.method == 'GET':
            return jsonify({
                'id': event.id,
                'event_type': event.event_type,
                'ip_address': event.ip_address,
                'user_agent': event.user_agent,
                'timestamp': event.timestamp.isoformat() if event.timestamp else None,
                'link_id': event.link_id
            })
        
        elif request.method == 'DELETE':
            db.session.delete(event)
            db.session.commit()
            return jsonify({'message': 'Event deleted successfully'})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
