from api.database import db
from datetime import datetime

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default="info")  # info, warning, error, success, security
    notification_type = db.Column(db.String(50), default="system")  # payment, tracking, domain, admin, system
    read = db.Column(db.Boolean, default=False)
    is_read = db.Column(db.Boolean, default=False)  # Alias for compat
    priority = db.Column(db.String(50), default="medium")  # low, medium, high
    action_url = db.Column(db.String(500), nullable=True)  # Optional deep link
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('notifications', lazy='dynamic'))

    def __repr__(self):
        return f"<Notification {self.id} for user {self.user_id}: {self.title}>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "message": self.message,
            "type": self.type,
            "notification_type": self.notification_type,
            "read": self.read,
            "is_read": self.read,  # Always return read state consistently
            "priority": self.priority,
            "action_url": self.action_url,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
