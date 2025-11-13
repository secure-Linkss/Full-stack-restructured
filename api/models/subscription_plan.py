"""
Subscription Plan Model
Defines available subscription plans with pricing and features
"""
from datetime import datetime
from src.database import db

class SubscriptionPlan(db.Model):
    __tablename__ = 'subscription_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    plan_code = db.Column(db.String(50), unique=True, nullable=False)
    plan_name = db.Column(db.String(100), nullable=False)
    plan_description = db.Column(db.Text)
    price_monthly = db.Column(db.Numeric(10, 2))
    price_quarterly = db.Column(db.Numeric(10, 2))
    price_yearly = db.Column(db.Numeric(10, 2))
    stripe_monthly_price_id = db.Column(db.String(255))
    stripe_quarterly_price_id = db.Column(db.String(255))
    stripe_yearly_price_id = db.Column(db.String(255))
    features = db.Column(db.JSON)
    limits = db.Column(db.JSON)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_featured = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'plan_code': self.plan_code,
            'plan_name': self.plan_name,
            'plan_description': self.plan_description,
            'pricing': {
                'monthly': float(self.price_monthly) if self.price_monthly else None,
                'quarterly': float(self.price_quarterly) if self.price_quarterly else None,
                'yearly': float(self.price_yearly) if self.price_yearly else None
            },
            'stripe_price_ids': {
                'monthly': self.stripe_monthly_price_id,
                'quarterly': self.stripe_quarterly_price_id,
                'yearly': self.stripe_yearly_price_id
            },
            'features': self.features or [],
            'limits': self.limits or {},
            'is_active': self.is_active,
            'is_featured': self.is_featured,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<SubscriptionPlan {self.plan_code} - {self.plan_name}>'