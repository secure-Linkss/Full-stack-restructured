"""
Support Ticket Database Model
SQLAlchemy model for customer support system
"""

from api.database import db
from datetime import datetime

class SupportTicket(db.Model):
    __tablename__ = 'support_tickets'

    id = db.Column(db.Integer, primary_key=True)
    ticket_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    subject = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='open', index=True)  # open, in_progress, closed, resolved
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, urgent
    category = db.Column(db.String(50), nullable=True)  # technical, billing, general, bug_report
    
    # User information
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    user_email = db.Column(db.String(255), nullable=False)
    user_name = db.Column(db.String(255), nullable=True)
    
    # Assignment
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    assigned_at = db.Column(db.DateTime, nullable=True)
    
    # Resolution
    resolution = db.Column(db.Text, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Closure
    closed_at = db.Column(db.DateTime, nullable=True)
    closed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Metadata
    source = db.Column(db.String(50), default='web')  # web, email, api
    tags = db.Column(db.JSON, nullable=True)  # Array of tags
    attachments = db.Column(db.JSON, nullable=True)  # Array of attachment info
    
    # Customer satisfaction
    satisfaction_rating = db.Column(db.Integer, nullable=True)  # 1-5 stars
    satisfaction_feedback = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    first_response_at = db.Column(db.DateTime, nullable=True)
    last_activity_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='support_tickets')
    assigned_user = db.relationship('User', foreign_keys=[assigned_to])
    resolver = db.relationship('User', foreign_keys=[resolved_by])
    closer = db.relationship('User', foreign_keys=[closed_by])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.ticket_number:
            # Generate ticket number: TKT-YYYYMMDD-NNNN
            import secrets
            date_str = datetime.utcnow().strftime('%Y%m%d')
            random_suffix = secrets.token_hex(2).upper()
            self.ticket_number = f'TKT-{date_str}-{random_suffix}'

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_number': self.ticket_number,
            'subject': self.subject,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'category': self.category,
            'user_id': self.user_id,
            'user_email': self.user_email,
            'user_name': self.user_name,
            'assigned_to': self.assigned_to,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'resolution': self.resolution,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolved_by': self.resolved_by,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
            'closed_by': self.closed_by,
            'source': self.source,
            'tags': self.tags,
            'attachments': self.attachments,
            'satisfaction_rating': self.satisfaction_rating,
            'satisfaction_feedback': self.satisfaction_feedback,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'first_response_at': self.first_response_at.isoformat() if self.first_response_at else None,
            'last_activity_at': self.last_activity_at.isoformat() if self.last_activity_at else None
        }

    def __repr__(self):
        return f'<SupportTicket {self.ticket_number}: {self.subject[:50]}>'


class SupportTicketComment(db.Model):
    __tablename__ = 'support_ticket_comments'

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('support_tickets.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    author_name = db.Column(db.String(255), nullable=False)
    author_email = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_internal = db.Column(db.Boolean, default=False)  # Internal staff notes
    is_solution = db.Column(db.Boolean, default=False)  # Marked as solution
    
    # Metadata
    attachments = db.Column(db.JSON, nullable=True)
    edited_at = db.Column(db.DateTime, nullable=True)
    edited_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    ticket = db.relationship('SupportTicket', backref='comments')
    author = db.relationship('User', foreign_keys=[author_id])
    editor = db.relationship('User', foreign_keys=[edited_by])

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'author_id': self.author_id,
            'author_name': self.author_name,
            'author_email': self.author_email,
            'content': self.content,
            'is_internal': self.is_internal,
            'is_solution': self.is_solution,
            'attachments': self.attachments,
            'edited_at': self.edited_at.isoformat() if self.edited_at else None,
            'edited_by': self.edited_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<SupportTicketComment {self.id} for Ticket {self.ticket_id}>'