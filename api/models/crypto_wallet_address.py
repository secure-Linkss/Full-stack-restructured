"""
Crypto Wallet Address Model
Admin-managed cryptocurrency wallet addresses for receiving payments
"""
from datetime import datetime
from api.database import db

class CryptoWalletAddress(db.Model):
    __tablename__ = 'crypto_wallet_addresses'
    
    id = db.Column(db.Integer, primary_key=True)
    currency = db.Column(db.String(10), unique=True, nullable=False)
    wallet_address = db.Column(db.Text, nullable=False)
    network = db.Column(db.String(50))
    qr_code_url = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    updater = db.relationship('User', backref='updated_wallets')
    
    def to_dict(self):
        return {
            'id': self.id,
            'currency': self.currency,
            'wallet_address': self.wallet_address,
            'network': self.network,
            'qr_code_url': self.qr_code_url,
            'is_active': self.is_active,
            'updated_by': self.updated_by,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<CryptoWalletAddress {self.currency} - {"Active" if self.is_active else "Inactive"}>'