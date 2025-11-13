"""
Payment History Model
Unified tracking of all payment transactions (Stripe + Crypto)
"""
from datetime import datetime
from src.database import db

class PaymentHistory(db.Model):
    __tablename__ = 'payment_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    payment_type = db.Column(db.String(50), nullable=False)
    plan_type = db.Column(db.String(50), nullable=False)
    billing_cycle = db.Column(db.String(50))
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.String(10), default='USD')
    status = db.Column(db.String(50), default='pending', nullable=False)
    stripe_payment_intent_id = db.Column(db.String(255))
    stripe_subscription_id = db.Column(db.String(255))
    crypto_transaction_id = db.Column(db.Integer, db.ForeignKey('crypto_payment_transactions.id'))
    receipt_url = db.Column(db.Text)
    invoice_url = db.Column(db.Text)
    metadata = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='payment_history')
    crypto_transaction = db.relationship('CryptoPaymentTransaction', backref='payment_record')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'payment_method': self.payment_method,
            'payment_type': self.payment_type,
            'plan_type': self.plan_type,
            'billing_cycle': self.billing_cycle,
            'amount': float(self.amount) if self.amount else None,
            'currency': self.currency,
            'status': self.status,
            'stripe_payment_intent_id': self.stripe_payment_intent_id,
            'stripe_subscription_id': self.stripe_subscription_id,
            'crypto_transaction_id': self.crypto_transaction_id,
            'receipt_url': self.receipt_url,
            'invoice_url': self.invoice_url,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<PaymentHistory {self.id} - {self.payment_method} - {self.status}>'