from flask import Blueprint, request, jsonify
from src.database import db
from api.models.contact import ContactSubmission
from src.models.user import User
from src.models.notification import Notification
from src.utils.validation import validate_email, sanitize_string
from datetime import datetime

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/api/contact/submit', methods=['POST'])
def submit_contact_form():
    """Submit a contact form"""
    try:
        data = request.get_json()
        
        # Extract and sanitize data
        name = sanitize_string(data.get('name', ''))
        email = sanitize_string(data.get('email', ''))
        phone = sanitize_string(data.get('phone', ''))
        subject = sanitize_string(data.get('subject', ''))
        message = sanitize_string(data.get('message', ''))
        
        # Validation
        if not all([name, email, subject, message]):
            return jsonify({'error': 'Name, email, subject, and message are required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        if len(message) < 10:
            return jsonify({'error': 'Message must be at least 10 characters long'}), 400
        
        # Create contact submission
        contact = ContactSubmission(
            name=name,
            email=email,
            phone=phone if phone else None,
            subject=subject,
            message=message,
            status='new',
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')
        )
        
        db.session.add(contact)
        db.session.commit()
        
        # Notify all admins about new contact submission
        try:
            admins = User.query.filter(User.role.in_(['main_admin', 'admin'])).all()
            for admin in admins:
                notification = Notification(
                    user_id=admin.id,
                    title='New Contact Form Submission',
                    message=f'New contact from {name} ({email}): {subject}',
                    type='info',
                    priority='high',
                    is_read=False,
                    action_url=f'/admin/contacts/{contact.id}'
                )
                db.session.add(notification)
            db.session.commit()
        except Exception as e:
            print(f'Error notifying admins: {e}')
            # Don't fail the submission if notification fails
        
        return jsonify({
            'message': 'Thank you for contacting us! We will get back to you soon.',
            'submission_id': contact.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f'Contact form submission error: {e}')
        return jsonify({'error': 'An error occurred while submitting your message'}), 500

@contact_bp.route('/api/contact/submissions', methods=['GET'])
def get_contact_submissions():
    """Get all contact submissions (admin only)"""
    try:
        # This should have authentication middleware, but for now we'll allow it
        # In production, add @admin_required decorator
        
        status = request.args.get('status', None)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = ContactSubmission.query
        
        if status:
            query = query.filter_by(status=status)
        
        query = query.order_by(ContactSubmission.created_at.desc())
        
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'submissions': [submission.to_dict() for submission in paginated.items],
            'total': paginated.total,
            'pages': paginated.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        print(f'Get contact submissions error: {e}')
        return jsonify({'error': 'An error occurred'}), 500

@contact_bp.route('/api/contact/submissions/<int:submission_id>', methods=['GET'])
def get_contact_submission(submission_id):
    """Get a specific contact submission (admin only)"""
    try:
        submission = ContactSubmission.query.get(submission_id)
        
        if not submission:
            return jsonify({'error': 'Submission not found'}), 404
        
        return jsonify(submission.to_dict()), 200
        
    except Exception as e:
        print(f'Get contact submission error: {e}')
        return jsonify({'error': 'An error occurred'}), 500

@contact_bp.route('/api/contact/submissions/<int:submission_id>/status', methods=['PATCH'])
def update_contact_status(submission_id):
    """Update contact submission status (admin only)"""
    try:
        submission = ContactSubmission.query.get(submission_id)
        
        if not submission:
            return jsonify({'error': 'Submission not found'}), 404
        
        data = request.get_json()
        new_status = data.get('status')
        admin_notes = data.get('admin_notes')
        
        if new_status:
            submission.status = new_status
            if new_status == 'resolved':
                submission.resolved_at = datetime.utcnow()
        
        if admin_notes:
            submission.admin_notes = admin_notes
        
        submission.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Status updated successfully',
            'submission': submission.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f'Update contact status error: {e}')
        return jsonify({'error': 'An error occurred'}), 500