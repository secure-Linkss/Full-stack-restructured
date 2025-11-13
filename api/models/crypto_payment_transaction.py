"""
Crypto Payment Transaction Model
Tracks all cryptocurrency payment transactions with verification status
"""
from datetime import datetime
from api.database import db

class CryptoPaymentTransaction(db.Model):
    __tablename__ = 'crypto_payment_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    plan_type = db.Column(db.String(50), nullable=False)
    currency = db.Column(db.String(10), nullable=False)
    wallet_address = db.Column(db.Text, nullable=False)
    transaction_hash = db.Column(db.String(255), unique=True, nullable=False)
    amount_crypto = db.Column(db.Numeric(20, 8), nullable=False)
    amount_usd = db.Column(db.Numeric(10, 2), nullable=False)
    screenshot_url = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending', nullable=False)
    verification_method = db.Column(db.String(50))
    blockchain_confirmations = db.Column(db.Integer, default=0)
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    verified_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    metadata = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='crypto_transactions')
    verifier = db.relationship('User', foreign_keys=[verified_by], backref='verified_crypto_payments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan_type': self.plan_type,
            'currency': self.currency,
            'wallet_address': self.wallet_address,
            'transaction_hash': self.transaction_hash,
            'amount_crypto': float(self.amount_crypto) if self.amount_crypto else None,
            'amount_usd': float(self.amount_usd) if self.amount_usd else None,
            'screenshot_url': self.screenshot_url,
            'status': self.status,
            'verification_method': self.verification_method,
            'blockchain_confirmations': self.blockchain_confirmations,
            'verified_by': self.verified_by,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'rejection_reason': self.rejection_reason,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<CryptoPaymentTransaction {self.id} - {self.transaction_hash[:8]}... - {self.status}>'