from api.database import db
from datetime import datetime

class Thread(db.Model):
    __tablename__ = 'threads'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    admin_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Which admin is handling it
    subject = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), default='open')  # open, resolved, closed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', foreign_keys=[user_id], backref='user_threads')
    admin = db.relationship('User', foreign_keys=[admin_id], backref='admin_threads')
    messages = db.relationship('Message', backref='thread', lazy='dynamic', cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'admin_id': self.admin_id,
            'subject': self.subject,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user_email': self.user.email if self.user else None,
            'admin_email': self.admin.email if self.admin else None
        }

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(db.Integer, db.ForeignKey('threads.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    body = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    sender = db.relationship('User', foreign_keys=[sender_id])

    def to_dict(self):
        return {
            'id': self.id,
            'thread_id': self.thread_id,
            'sender_id': self.sender_id,
            'sender_role': self.sender.role if self.sender else None,
            'body': self.body,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
