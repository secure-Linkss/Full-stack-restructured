from src.database import db
from datetime import datetime
import json

class ABTest(db.Model):
    __tablename__ = 'ab_tests'
    
    id = db.Column(db.Integer, primary_key=True)
    link_id = db.Column(db.Integer, db.ForeignKey('links.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='active')  # active, paused, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    variants = db.relationship('ABTestVariant', backref='ab_test', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'link_id': self.link_id,
            'user_id': self.user_id,
            'name': self.name,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'variants': [v.to_dict() for v in self.variants]
        }


class ABTestVariant(db.Model):
    __tablename__ = 'ab_test_variants'
    
    id = db.Column(db.Integer, primary_key=True)
    ab_test_id = db.Column(db.Integer, db.ForeignKey('ab_tests.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    target_url = db.Column(db.String(500), nullable=False)
    traffic_percentage = db.Column(db.Integer, default=50)  # 0-100
    clicks = db.Column(db.Integer, default=0)
    conversions = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        conversion_rate = (self.conversions / self.clicks * 100) if self.clicks > 0 else 0
        return {
            'id': self.id,
            'ab_test_id': self.ab_test_id,
            'name': self.name,
            'target_url': self.target_url,
            'traffic_percentage': self.traffic_percentage,
            'clicks': self.clicks,
            'conversions': self.conversions,
            'conversion_rate': round(conversion_rate, 2),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }