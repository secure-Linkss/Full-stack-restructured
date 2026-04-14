"""
Honeypot & Bot Blacklist Service
Maintains an in-memory (+ DB-backed) blacklist of malicious IPs/ASNs/fingerprints.
Traps hit the /h or /trap endpoints and auto-blacklist the requester.
"""

import hashlib
import logging
import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Optional, Set

logger = logging.getLogger(__name__)


class HoneypotService:
    def __init__(self):
        # In-memory blacklists (TTL = 24 h by default)
        self._ip_blacklist: Dict[str, float] = {}          # ip_hash -> expires_ts
        self._asn_blacklist: Dict[str, int] = defaultdict(int)  # asn -> hit_count
        self._ua_signatures: Dict[str, int] = defaultdict(int)  # ua_hash -> hit_count
        self._blacklist_ttl = 86400  # 24 hours

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _hash(self, value: str) -> str:
        return hashlib.sha256(value.encode()).hexdigest()[:32]

    def _expire_old_entries(self):
        now = time.time()
        expired = [k for k, v in self._ip_blacklist.items() if v < now]
        for k in expired:
            del self._ip_blacklist[k]

    # ── Public API ────────────────────────────────────────────────────────────

    # ── Private / loopback IPs — never blacklist ──────────────────────────────
    _SAFE_PREFIXES = ('127.', '::1', '10.', '172.16.', '172.17.', '172.18.',
                      '172.19.', '172.2', '172.3', '192.168.', 'localhost')

    def _is_private_ip(self, ip: str) -> bool:
        return any(ip.startswith(pfx) for pfx in self._SAFE_PREFIXES)

    def record_honeypot_hit(self, ip: str, user_agent: str = '', asn: str = '') -> None:
        """Record a honeypot hit and blacklist the source.
        Private / loopback IPs are never blacklisted (prevents test pollution).
        """
        # Never blacklist internal/loopback addresses
        if self._is_private_ip(ip):
            logger.debug(f"Honeypot triggered from private IP {ip} — not blacklisting")
            return

        self._expire_old_entries()

        ip_hash = self._hash(ip)
        self._ip_blacklist[ip_hash] = time.time() + self._blacklist_ttl

        if user_agent:
            ua_hash = self._hash(user_agent)
            self._ua_signatures[ua_hash] += 1

        if asn:
            self._asn_blacklist[asn] += 1

        logger.warning(
            f"Honeypot hit | ip={ip[:10]}... ua={user_agent[:60]} asn={asn}"
        )

        # Persist to DB asynchronously (fire-and-forget, no crash if it fails)
        try:
            self._persist_to_db(ip, user_agent, asn)
        except Exception as e:
            logger.debug(f"Honeypot DB persist error: {e}")

    def is_blacklisted(self, ip: str, user_agent: str = '', asn: str = '') -> Dict:
        """Check whether a request source is blacklisted."""
        self._expire_old_entries()

        ip_hash = self._hash(ip)
        if ip_hash in self._ip_blacklist:
            return {'blacklisted': True, 'reason': 'ip_blacklisted'}

        if user_agent:
            ua_hash = self._hash(user_agent)
            if self._ua_signatures.get(ua_hash, 0) >= 3:
                return {'blacklisted': True, 'reason': 'ua_signature_match'}

        if asn and self._asn_blacklist.get(asn, 0) >= 5:
            return {'blacklisted': True, 'reason': 'asn_cluster_abuse'}

        return {'blacklisted': False, 'reason': None}

    def _persist_to_db(self, ip: str, user_agent: str, asn: str) -> None:
        """Persist honeypot hit to DB (best-effort)."""
        try:
            from api.database import db
            from api.models.tracking_event import TrackingEvent
            from flask import has_app_context
            if not has_app_context():
                return
            event = TrackingEvent(
                ip_address=ip[:45],
                user_agent=(user_agent or '')[:512],
                status='honeypot',
                is_bot=True,
                timestamp=datetime.utcnow(),
                quantum_stage='honeypot',
                as_number=asn or 'unknown',
            )
            db.session.add(event)
            db.session.commit()
        except Exception as e:
            logger.debug(f"Honeypot persist to DB: {e}")

    def get_stats(self) -> Dict:
        self._expire_old_entries()
        return {
            'blacklisted_ips': len(self._ip_blacklist),
            'abusive_asns': len([k for k, v in self._asn_blacklist.items() if v >= 5]),
            'known_bot_ua_signatures': len(self._ua_signatures),
            'asn_hit_counts': dict(self._asn_blacklist),
        }


# Global singleton
honeypot_service = HoneypotService()
