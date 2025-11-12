from datetime import datetime
from typing import Dict, List, Optional
from enum import Enum

class TicketStatus(Enum):
    OPEN = 'open'
    IN_PROGRESS = 'in_progress'
    WAITING_RESPONSE = 'waiting_response'
    RESOLVED = 'resolved'
    CLOSED = 'closed'

class TicketPriority(Enum):
    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'
    URGENT = 'urgent'

class SupportTicket:
    """Support Ticket Model for Supabase"""

    def __init__(self, data: Dict):
        self.id = data.get('id')
        self.user_id = data.get('user_id')
        self.assigned_to = data.get('assigned_to')
        self.subject = data.get('subject')
        self.description = data.get('description')
        self.status = data.get('status', 'open')
        self.priority = data.get('priority', 'medium')
        self.category = data.get('category')
        self.tags = data.get('tags', [])
        self.created_at = data.get('created_at')
        self.updated_at = data.get('updated_at')
        self.resolved_at = data.get('resolved_at')

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'assigned_to': self.assigned_to,
            'subject': self.subject,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'category': self.category,
            'tags': self.tags,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'resolved_at': self.resolved_at
        }

    @staticmethod
    def from_dict(data: Dict) -> 'SupportTicket':
        return SupportTicket(data)

class TicketMessage:
    """Ticket Message Model for Supabase"""

    def __init__(self, data: Dict):
        self.id = data.get('id')
        self.ticket_id = data.get('ticket_id')
        self.user_id = data.get('user_id')
        self.message = data.get('message')
        self.is_internal = data.get('is_internal', False)
        self.attachments = data.get('attachments', [])
        self.created_at = data.get('created_at')

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'user_id': self.user_id,
            'message': self.message,
            'is_internal': self.is_internal,
            'attachments': self.attachments,
            'created_at': self.created_at
        }

    @staticmethod
    def from_dict(data: Dict) -> 'TicketMessage':
        return TicketMessage(data)
