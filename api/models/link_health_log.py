from api.database import db
from datetime import datetime


class LinkHealthLog(db.Model):
    """Audit log of health check results for tracking links."""
    __tablename__ = 'link_health_logs'

    id = db.Column(db.Integer, primary_key=True)
    link_id = db.Column(db.Integer, db.ForeignKey('links.id', ondelete='CASCADE'), nullable=False)

    status = db.Column(db.String(20), nullable=False)       # active, warning, down
    response_code = db.Column(db.Integer, nullable=True)    # HTTP status code
    response_time_ms = db.Column(db.Integer, nullable=True) # ms to respond
    error_message = db.Column(db.Text, nullable=True)
    checked_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'link_id': self.link_id,
            'status': self.status,
            'response_code': self.response_code,
            'response_time_ms': self.response_time_ms,
            'error_message': self.error_message,
            'checked_at': self.checked_at.isoformat() if self.checked_at else None,
        }
