from datetime import datetime
from typing import Dict, Optional
from enum import Enum

class ThreatType(Enum):
    BOT = 'bot'
    PROXY = 'proxy'
    VPN = 'vpn'
    SUSPICIOUS_ACTIVITY = 'suspicious_activity'
    RATE_LIMIT = 'rate_limit'
    MALICIOUS_REQUEST = 'malicious_request'

class ThreatSeverity(Enum):
    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'
    CRITICAL = 'critical'

class SecurityThreat:
    """Security Threat Model for threat detection and logging"""

    def __init__(self, data: Dict):
        self.id = data.get('id')
        self.threat_type = data.get('threat_type')
        self.severity = data.get('severity', 'medium')
        self.ip_address = data.get('ip_address')
        self.user_agent = data.get('user_agent')
        self.request_path = data.get('request_path')
        self.user_id = data.get('user_id')
        self.link_id = data.get('link_id')
        self.description = data.get('description')
        self.metadata = data.get('metadata', {})
        self.action_taken = data.get('action_taken')
        self.blocked = data.get('blocked', False)
        self.created_at = data.get('created_at')

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'threat_type': self.threat_type,
            'severity': self.severity,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'request_path': self.request_path,
            'user_id': self.user_id,
            'link_id': self.link_id,
            'description': self.description,
            'metadata': self.metadata,
            'action_taken': self.action_taken,
            'blocked': self.blocked,
            'created_at': self.created_at
        }

    @staticmethod
    def from_dict(data: Dict) -> 'SecurityThreat':
        return SecurityThreat(data)

class IPBlocklist:
    """IP Blocklist Model for managing blocked IP addresses"""

    def __init__(self, data: Dict):
        self.id = data.get('id')
        self.ip_address = data.get('ip_address')
        self.reason = data.get('reason')
        self.blocked_by = data.get('blocked_by')
        self.expires_at = data.get('expires_at')
        self.is_permanent = data.get('is_permanent', False)
        self.created_at = data.get('created_at')

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'ip_address': self.ip_address,
            'reason': self.reason,
            'blocked_by': self.blocked_by,
            'expires_at': self.expires_at,
            'is_permanent': self.is_permanent,
            'created_at': self.created_at
        }

    @staticmethod
    def from_dict(data: Dict) -> 'IPBlocklist':
        return IPBlocklist(data)
