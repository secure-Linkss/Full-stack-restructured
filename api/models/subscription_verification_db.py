"""
Subscription Verification Database Model
SQLAlchemy model for subscription management and verification
"""

from src.database import db
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Numeric

class SubscriptionVerification(db.Model):
    __tablename__ = 'subscription_verifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    plan_type = db.Column(db.String(50), nullable=False)  # free, pro, enterprise
    subscription_status = db.Column(db.String(20), default='active')  # active, expired, cancelled, suspended
    
    # Billing information
    billing_cycle = db.Column(db.String(20), default='monthly')  # monthly, yearly, lifetime
    amount = db.Column(Numeric(10, 2), nullable=True)
    currency = db.Column(db.String(3), default='USD')
    
    # Payment provider integration
    provider = db.Column(db.String(50), nullable=True)  # stripe, paypal, manual
    provider_subscription_id = db.Column(db.String(255), nullable=True)
    provider_customer_id = db.Column(db.String(255), nullable=True)
    
    # Subscription dates
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    suspended_at = db.Column(db.DateTime, nullable=True)
    
    # Usage tracking
    usage_limits = db.Column(db.JSON, nullable=True)  # Links, clicks, domains etc.
    current_usage = db.Column(db.JSON, nullable=True)
    reset_date = db.Column(db.DateTime, nullable=True)  # When usage resets
    
    # Trial information
    is_trial = db.Column(db.Boolean, default=False)
    trial_ends_at = db.Column(db.DateTime, nullable=True)
    trial_converted = db.Column(db.Boolean, default=False)
    
    # Admin actions
    notes = db.Column(db.Text, nullable=True)
    last_verified_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    last_verified_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='subscription_verifications')
    verifier = db.relationship('User', foreign_keys=[last_verified_by])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan_type': self.plan_type,
            'subscription_status': self.subscription_status,
            'billing_cycle': self.billing_cycle,
            'amount': float(self.amount) if self.amount else None,
            'currency': self.currency,
            'provider': self.provider,
            'provider_subscription_id': self.provider_subscription_id,
            'provider_customer_id': self.provider_customer_id,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'suspended_at': self.suspended_at.isoformat() if self.suspended_at else None,
            'usage_limits': self.usage_limits,
            'current_usage': self.current_usage,
            'reset_date': self.reset_date.isoformat() if self.reset_date else None,
            'is_trial': self.is_trial,
            'trial_ends_at': self.trial_ends_at.isoformat() if self.trial_ends_at else None,
            'trial_converted': self.trial_converted,
            'notes': self.notes,
            'last_verified_by': self.last_verified_by,
            'last_verified_at': self.last_verified_at.isoformat() if self.last_verified_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Compatibility fields for frontend
            'status': self.subscription_status,
            'expiry_date': self.expires_at.isoformat() if self.expires_at else None,
            'user_name': self.user.username if self.user else None,
            'user_email': self.user.email if self.user else None
        }

    def is_active(self):
        """Check if subscription is currently active"""
        if self.subscription_status != 'active':
            return False
        
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        
        return True

    def days_until_expiry(self):
        """Get days until subscription expires"""
        if not self.expires_at:
            return None
        
        delta = self.expires_at - datetime.utcnow()
        return delta.days if delta.days > 0 else 0

    def __repr__(self):
        return f'<SubscriptionVerification {self.user_id}: {self.plan_type}>'


class SubscriptionHistory(db.Model):
    __tablename__ = 'subscription_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscription_verifications.id'), nullable=True)
    
    # Event information
    event_type = db.Column(db.String(50), nullable=False)  # created, upgraded, downgraded, cancelled, renewed
    previous_plan = db.Column(db.String(50), nullable=True)
    new_plan = db.Column(db.String(50), nullable=True)
    
    # Payment information
    amount = db.Column(Numeric(10, 2), nullable=True)
    currency = db.Column(db.String(3), default='USD')
    payment_method = db.Column(db.String(50), nullable=True)
    transaction_id = db.Column(db.String(255), nullable=True)
    
    # Admin information
    initiated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reason = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    # Timestamps
    effective_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='subscription_history')
    subscription = db.relationship('SubscriptionVerification', backref='history')
    initiator = db.relationship('User', foreign_keys=[initiated_by])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'subscription_id': self.subscription_id,
            'event_type': self.event_type,
            'previous_plan': self.previous_plan,
            'new_plan': self.new_plan,
            'amount': float(self.amount) if self.amount else None,
            'currency': self.currency,
            'payment_method': self.payment_method,
            'transaction_id': self.transaction_id,
            'initiated_by': self.initiated_by,
            'reason': self.reason,
            'notes': self.notes,
            'effective_date': self.effective_date.isoformat() if self.effective_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<SubscriptionHistory {self.event_type} for User {self.user_id}>'