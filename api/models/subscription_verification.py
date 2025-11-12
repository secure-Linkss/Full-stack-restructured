from datetime import datetime
from typing import Dict, Optional
from enum import Enum

class PaymentMethod(Enum):
    BTC = 'btc'
    USDT = 'usdt'
    OTHER = 'other'

class VerificationStatus(Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'

class SubscriptionVerification:
    """Subscription Verification Model for manual crypto payment tracking"""

    def __init__(self, data: Dict):
        self.id = data.get('id')
        self.user_id = data.get('user_id')
        self.verified_by = data.get('verified_by')
        self.plan_type = data.get('plan_type')
        self.payment_method = data.get('payment_method')
        self.transaction_id = data.get('transaction_id')
        self.transaction_proof_url = data.get('transaction_proof_url')
        self.amount = data.get('amount')
        self.currency = data.get('currency', 'USD')
        self.duration_days = data.get('duration_days', 30)
        self.start_date = data.get('start_date')
        self.end_date = data.get('end_date')
        self.status = data.get('status', 'pending')
        self.admin_notes = data.get('admin_notes')
        self.created_at = data.get('created_at')
        self.verified_at = data.get('verified_at')
        self.updated_at = data.get('updated_at')

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'verified_by': self.verified_by,
            'plan_type': self.plan_type,
            'payment_method': self.payment_method,
            'transaction_id': self.transaction_id,
            'transaction_proof_url': self.transaction_proof_url,
            'amount': float(self.amount) if self.amount else None,
            'currency': self.currency,
            'duration_days': self.duration_days,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'status': self.status,
            'admin_notes': self.admin_notes,
            'created_at': self.created_at,
            'verified_at': self.verified_at,
            'updated_at': self.updated_at
        }

    @staticmethod
    def from_dict(data: Dict) -> 'SubscriptionVerification':
        return SubscriptionVerification(data)
