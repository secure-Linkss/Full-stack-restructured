"""
Payment Model
Used to store records of all payments, including crypto and stripe
"""

from api.database import db
from datetime import datetime

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Payment details
    payment_type = db.Column(db.String(50), nullable=False)  # 'crypto', 'stripe'
    currency = db.Column(db.String(10), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    plan_type = db.Column(db.String(50), nullable=False)
    
    # Crypto specific fields
    tx_hash = db.Column(db.String(255), nullable=True)
    confirmations = db.Column(db.Integer, default=0)
    transaction_data = db.Column(db.Text, nullable=True) # JSON dump of blockchain data
    rejection_reason = db.Column(db.Text, nullable=True)
    
    # Stripe specific fields
    stripe_charge_id = db.Column(db.String(255), nullable=True)
    
    # Status and timestamps
    status = db.Column(db.String(50), nullable=False, default='pending') # 'pending', 'confirmed', 'rejected', 'failed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    user = db.relationship('User', backref=db.backref('payments', lazy=True))

    def __repr__(self):
        return f"<Payment {self.id} - {self.payment_type} - {self.status}>"

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'payment_type': self.payment_type,
            'currency': self.currency,
            'amount': self.amount,
            'plan_type': self.plan_type,
            'tx_hash': self.tx_hash,
            'confirmations': self.confirmations,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None
        }
