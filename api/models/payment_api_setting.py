"""
Payment API Settings Model
Admin-configurable blockchain verification APIs
"""
from datetime import datetime
from api.database import db

class PaymentAPISetting(db.Model):
    __tablename__ = 'payment_api_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    api_name = db.Column(db.String(100), unique=True, nullable=False)
    api_type = db.Column(db.String(50), nullable=False)
    api_key = db.Column(db.Text)
    api_url = db.Column(db.Text)
    supported_currencies = db.Column(db.ARRAY(db.String))
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    priority = db.Column(db.Integer, default=0)
    rate_limit_per_minute = db.Column(db.Integer, default=10)
    last_used_at = db.Column(db.DateTime)
    configuration = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'api_name': self.api_name,
            'api_type': self.api_type,
            'api_url': self.api_url,
            'supported_currencies': self.supported_currencies,
            'is_active': self.is_active,
            'priority': self.priority,
            'rate_limit_per_minute': self.rate_limit_per_minute,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'configuration': self.configuration,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_sensitive:
            data['api_key'] = self.api_key
        else:
            data['api_key'] = '***' if self.api_key else None
            
        return data
    
    def __repr__(self):
        return f'<PaymentAPISetting {self.api_name} - {"Active" if self.is_active else "Inactive"}>'