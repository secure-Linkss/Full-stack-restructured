from api.database import db
from datetime import datetime

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    actor_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.Text, nullable=False)
    details = db.Column(db.Text)  # Additional details about the action
    ip_address = db.Column(db.String(45))  # IPv4 or IPv6 address
    user_agent = db.Column(db.Text)  # Browser/client user agent
    target_id = db.Column(db.Integer)
    target_type = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    actor = db.relationship('User', backref='audit_logs')

    def __repr__(self):
        return f'<AuditLog {self.action}>'

    def to_dict(self):
        return {
            'id': self.id,
            'actor_id': self.actor_id,
            'action': self.action,
            'details': self.details,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'target_id': self.target_id,
            'target_type': self.target_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


