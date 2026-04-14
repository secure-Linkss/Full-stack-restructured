"""
Advanced Client Fingerprinting Service
Receives browser-collected signals and computes a stable fingerprint hash.

Collected signals (sent from JS):
  canvas_hash      — SHA-256 of canvas toDataURL() output
  webgl_vendor     — WebGL UNMASKED_VENDOR_WEBGL string
  webgl_renderer   — WebGL UNMASKED_RENDERER_WEBGL string
  screen_width     — screen.width
  screen_height    — screen.height
  color_depth      — screen.colorDepth
  pixel_ratio      — window.devicePixelRatio
  timezone         — Intl.DateTimeFormat().resolvedOptions().timeZone
  language         — navigator.language
  languages        — navigator.languages joined by comma
  platform         — navigator.platform
  hw_concurrency   — navigator.hardwareConcurrency
  device_memory    — navigator.deviceMemory (GB, may be absent)
  max_touch_points — navigator.maxTouchPoints
  plugins_count    — navigator.plugins.length
  dnt              — navigator.doNotTrack
  cookie_enabled   — navigator.cookieEnabled
  connection_type  — navigator.connection.effectiveType (may be absent)
  fonts            — comma-joined list of detected fonts (CSS probe)
"""

import hashlib
import json
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# Signals that carry high entropy — used for the stable hash
_HIGH_ENTROPY_KEYS = [
    'canvas_hash',
    'webgl_vendor',
    'webgl_renderer',
    'screen_width',
    'screen_height',
    'color_depth',
    'pixel_ratio',
    'timezone',
    'language',
    'platform',
    'hw_concurrency',
    'max_touch_points',
    'fonts',
]


def compute_fingerprint(signals: Dict) -> str:
    """
    Compute a stable hex fingerprint from browser signals.
    Only uses high-entropy keys so the hash survives minor UA changes.
    """
    parts = []
    for key in _HIGH_ENTROPY_KEYS:
        val = signals.get(key, '')
        parts.append(f"{key}={val}")
    raw = '|'.join(parts)
    return hashlib.sha256(raw.encode()).hexdigest()


def score_fingerprint(signals: Dict) -> int:
    """
    Return a humanness score 0-100.
    Bots typically have zero canvas entropy, no plugins, no touch data, etc.
    """
    score = 50  # neutral baseline

    # Canvas fingerprint present → strong human signal
    if signals.get('canvas_hash') and len(signals['canvas_hash']) > 8:
        score += 15
    else:
        score -= 20

    # WebGL present → likely real browser
    if signals.get('webgl_renderer') and signals.get('webgl_vendor'):
        score += 10
    else:
        score -= 10

    # Realistic screen resolution
    try:
        w = int(signals.get('screen_width', 0))
        h = int(signals.get('screen_height', 0))
        if 320 <= w <= 7680 and 240 <= h <= 4320:
            score += 10
        else:
            score -= 15
    except (TypeError, ValueError):
        score -= 5

    # Hardware concurrency in sane range
    try:
        hwc = int(signals.get('hw_concurrency', 0))
        if 1 <= hwc <= 128:
            score += 5
    except (TypeError, ValueError):
        pass

    # Touch points — expected for mobile / unexpected for desktop headless
    try:
        tp = int(signals.get('max_touch_points', -1))
        if tp >= 0:
            score += 5
    except (TypeError, ValueError):
        pass

    # Fonts detected → JS probe ran
    fonts = signals.get('fonts', '')
    if fonts and len(fonts) > 10:
        score += 5

    # Cookie enabled
    if signals.get('cookie_enabled') is True or signals.get('cookie_enabled') == 'true':
        score += 5

    return max(0, min(100, score))


def validate_and_enrich(raw_signals: Dict) -> Dict:
    """
    Validate incoming signals, compute fingerprint + score, return enriched dict.
    """
    # Sanitise — only keep known keys, truncate long values
    _ALLOWED = {
        'canvas_hash', 'webgl_vendor', 'webgl_renderer',
        'screen_width', 'screen_height', 'color_depth', 'pixel_ratio',
        'timezone', 'language', 'languages', 'platform',
        'hw_concurrency', 'device_memory', 'max_touch_points',
        'plugins_count', 'dnt', 'cookie_enabled', 'connection_type', 'fonts',
    }
    clean: Dict = {}
    for k, v in raw_signals.items():
        if k in _ALLOWED:
            # Truncate to avoid oversized payloads
            clean[k] = str(v)[:512] if v is not None else ''

    fp_hash = compute_fingerprint(clean)
    fp_score = score_fingerprint(clean)

    return {
        'fingerprint_hash':  fp_hash,
        'fingerprint_score': fp_score,
        'signals':           clean,
        'is_likely_human':   fp_score >= 50,
    }
