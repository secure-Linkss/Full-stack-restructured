"""
Channel Adaptive Mode™
=======================
Dynamically adjusts redirect behaviour based on the channel the link
was designed for: Email, LinkedIn, SMS, or General.

Each channel has a routing profile that influences:
  - Scanner deflection aggressiveness
  - Redirect parameter stripping level
  - Human delay range (ms)
  - Cloaking template preference
  - Quantum stage timeout multipliers
  - SafeRoute™ logic

Channel profiles
----------------
  email     — Maximum scanner safety; minimal params; stealth headers
  linkedin  — Ultra-clean URL; trust signals; strict bot block
  sms       — Lightning fast; mobile optimised; minimal overhead
  general   — Full tracking; balanced stealth

Usage in routing gateway (Stage 3):
  profile = get_channel_profile(link.channel_type)
  destination_url = profile.apply(destination_url, visitor_context)
"""

from __future__ import annotations

import logging
from typing import Dict, Optional
from urllib.parse import urlparse, parse_qs, urlencode

logger = logging.getLogger(__name__)

# ── Channel constants ──────────────────────────────────────────────────────────

CHANNELS = ('email', 'linkedin', 'sms', 'general')
DEFAULT_CHANNEL = 'general'

# ── Profiles ───────────────────────────────────────────────────────────────────

class ChannelProfile:
    """Encapsulates all routing decisions for a given channel."""

    def __init__(
        self,
        name: str,
        *,
        max_params: int = 10,
        human_delay_min_ms: int = 100,
        human_delay_max_ms: int = 300,
        scanner_aggressiveness: str = 'medium',   # low | medium | high
        preferred_cloak: str = 'generic',
        strip_utm: bool = False,
        mobile_optimised: bool = False,
        description: str = '',
        feature_flag: Optional[str] = None,       # plan_type required to use
    ):
        self.name = name
        self.max_params = max_params
        self.human_delay_min_ms = human_delay_min_ms
        self.human_delay_max_ms = human_delay_max_ms
        self.scanner_aggressiveness = scanner_aggressiveness
        self.preferred_cloak = preferred_cloak
        self.strip_utm = strip_utm
        self.mobile_optimised = mobile_optimised
        self.description = description
        self.feature_flag = feature_flag  # None = available to all

    def apply(self, url: str, ctx: Dict = None) -> str:
        """Apply channel-specific URL optimisation."""
        if not url:
            return url
        parsed = urlparse(url)
        params = parse_qs(parsed.query, keep_blank_values=True)

        if self.strip_utm:
            # Strip UTM + common tracking params for cleaner URLs
            _STRIP_KEYS = {
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
                'fbclid', 'gclid', 'msclkid', 'mc_cid', 'mc_eid',
            }
            params = {k: v for k, v in params.items() if k not in _STRIP_KEYS}

        if len(params) > self.max_params:
            # Keep only the first max_params entries
            params = dict(list(params.items())[:self.max_params])

        new_query = urlencode(params, doseq=True)
        result = parsed._replace(query=new_query).geturl()
        return result

    def to_dict(self) -> Dict:
        return {
            'name': self.name,
            'description': self.description,
            'max_params': self.max_params,
            'human_delay_ms': [self.human_delay_min_ms, self.human_delay_max_ms],
            'scanner_aggressiveness': self.scanner_aggressiveness,
            'preferred_cloak': self.preferred_cloak,
            'strip_utm': self.strip_utm,
            'mobile_optimised': self.mobile_optimised,
            'feature_flag': self.feature_flag,
        }


# ── Channel registry ──────────────────────────────────────────────────────────

_PROFILES: Dict[str, ChannelProfile] = {
    'email': ChannelProfile(
        'email',
        max_params=4,
        human_delay_min_ms=150,
        human_delay_max_ms=400,
        scanner_aggressiveness='high',
        preferred_cloak='microsoft',
        strip_utm=True,
        mobile_optimised=False,
        description='Maximum scanner deflection; stripped params; stealth headers. Best for cold email campaigns.',
    ),
    'linkedin': ChannelProfile(
        'linkedin',
        max_params=3,
        human_delay_min_ms=80,
        human_delay_max_ms=200,
        scanner_aggressiveness='medium',
        preferred_cloak='generic',
        strip_utm=True,
        mobile_optimised=False,
        description="Ultra-clean URLs; minimal overhead; trust-optimised for LinkedIn's link preview crawler.",
        feature_flag='pro',   # Requires pro or higher
    ),
    'sms': ChannelProfile(
        'sms',
        max_params=2,
        human_delay_min_ms=50,
        human_delay_max_ms=120,
        scanner_aggressiveness='low',
        preferred_cloak='generic',
        strip_utm=True,
        mobile_optimised=True,
        description='Lightning fast. Minimal params. Mobile-first redirect optimised for SMS click-through.',
        feature_flag='pro',
    ),
    'general': ChannelProfile(
        'general',
        max_params=15,
        human_delay_min_ms=100,
        human_delay_max_ms=250,
        scanner_aggressiveness='medium',
        preferred_cloak='generic',
        strip_utm=False,
        mobile_optimised=False,
        description='Full tracking; balanced stealth. Default for web links and general distribution.',
    ),
}


def get_channel_profile(channel: Optional[str]) -> ChannelProfile:
    """Return the ChannelProfile for *channel*, defaulting to 'general'."""
    ch = (channel or DEFAULT_CHANNEL).lower().strip()
    return _PROFILES.get(ch, _PROFILES[DEFAULT_CHANNEL])


def list_channels() -> Dict[str, Dict]:
    """Return all available channel profiles as dicts."""
    return {name: profile.to_dict() for name, profile in _PROFILES.items()}


def is_channel_available(channel: str, plan_type: str) -> bool:
    """Return True if this plan can use this channel."""
    profile = get_channel_profile(channel)
    if not profile.feature_flag:
        return True  # Available to all
    # Hierarchy: trial < free < pro < premium < enterprise
    _PLAN_RANK = {'trial': 0, 'free': 1, 'pro': 2, 'premium': 3, 'enterprise': 4}
    required = _PLAN_RANK.get(profile.feature_flag, 0)
    user_rank = _PLAN_RANK.get((plan_type or 'free').lower(), 1)
    return user_rank >= required
