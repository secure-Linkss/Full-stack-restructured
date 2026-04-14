"""
email_intelligence.py — Email tracking analytics:
  - Email client detection
  - Click latency (PURL send → first click delta)
  - Link decay analytics (clicks over time)
"""
import logging
from datetime import datetime, timedelta
from collections import defaultdict

from flask import Blueprint, request, jsonify, session
from api.database import db
from api.models.link import Link
from api.models.tracking_event import TrackingEvent
from api.models.purl_mapping import PurlMapping
from api.middleware.auth_decorators import login_required

logger = logging.getLogger(__name__)
email_intel_bp = Blueprint('email_intelligence', __name__)

# ──────────────────────────────────────────────────────────────
# EMAIL CLIENT DETECTION
# ──────────────────────────────────────────────────────────────

_CLIENT_SIGNATURES = {
    'Gmail': ['Gmail', 'Googlebot', 'Google-Apps', 'YahooMailProxy', 'Google'],
    'Outlook': ['Outlook', 'Microsoft', 'Office365', 'MicrosoftOffice', 'ms-office'],
    'Apple Mail': ['Apple', 'iPhone', 'iPad', 'CFNetwork', 'Darwin', 'Mail'],
    'Yahoo Mail': ['Yahoo', 'YahooMail'],
    'Thunderbird': ['Thunderbird'],
    'ProtonMail': ['ProtonMail'],
    'Hotmail': ['Hotmail', 'Windows Live Mail'],
}


def _detect_email_client(user_agent: str) -> str:
    if not user_agent:
        return 'Unknown'
    ua_lower = user_agent.lower()
    for client, sigs in _CLIENT_SIGNATURES.items():
        if any(s.lower() in ua_lower for s in sigs):
            return client
    return 'Other'


@email_intel_bp.route('/api/analytics/email-clients', methods=['GET'])
@login_required
def get_email_clients():
    """
    Return distribution of email clients that fired pixel events.
    Only events with email_opened=True or captured_email are considered.
    """
    user_id = session.get('user_id')
    link_ids = [l.id for l in Link.query.filter_by(user_id=user_id).all()]

    if not link_ids:
        return jsonify({'success': True, 'clients': [], 'total': 0})

    events = (TrackingEvent.query
              .filter(TrackingEvent.link_id.in_(link_ids))
              .filter(
                  db.or_(
                      TrackingEvent.email_opened == True,
                      TrackingEvent.captured_email.isnot(None),
                  )
              )
              .all())

    counts = defaultdict(int)
    for e in events:
        client = _detect_email_client(e.user_agent or '')
        counts[client] += 1

    total = sum(counts.values())
    clients = [
        {
            'client': k,
            'count': v,
            'percentage': round((v / total * 100), 1) if total else 0,
        }
        for k, v in sorted(counts.items(), key=lambda x: -x[1])
    ]

    return jsonify({'success': True, 'clients': clients, 'total': total})


# ──────────────────────────────────────────────────────────────
# CLICK LATENCY (send → click)
# ──────────────────────────────────────────────────────────────

@email_intel_bp.route('/api/analytics/click-latency', methods=['GET'])
@login_required
def get_click_latency():
    """
    Returns click latency per PURL — delta between PURL creation time and first click.
    Query params: link_id (optional)
    """
    user_id = session.get('user_id')
    link_id = request.args.get('link_id', type=int)

    query = PurlMapping.query.filter_by(user_id=user_id, clicked=True)
    if link_id:
        query = query.filter_by(link_id=link_id)

    purls = query.order_by(PurlMapping.clicked_at.desc()).limit(500).all()

    items = []
    total_seconds = 0
    for p in purls:
        if p.clicked_at and p.created_at:
            delta = (p.clicked_at - p.created_at).total_seconds()
            items.append({
                'email': p.email,
                'name': p.name,
                'latency_seconds': int(delta),
                'latency_display': _format_duration(int(delta)),
                'clicked_at': p.clicked_at.isoformat(),
                'created_at': p.created_at.isoformat(),
            })
            total_seconds += delta

    avg_latency = int(total_seconds / len(items)) if items else 0
    return jsonify({
        'success': True,
        'total_recipients_clicked': len(items),
        'avg_latency_seconds': avg_latency,
        'avg_latency_display': _format_duration(avg_latency),
        'items': items,
    })


def _format_duration(seconds: int) -> str:
    if seconds < 60:
        return f"{seconds}s"
    elif seconds < 3600:
        return f"{seconds // 60}m {seconds % 60}s"
    elif seconds < 86400:
        h = seconds // 3600
        m = (seconds % 3600) // 60
        return f"{h}h {m}m"
    else:
        d = seconds // 86400
        h = (seconds % 86400) // 3600
        return f"{d}d {h}h"


# ──────────────────────────────────────────────────────────────
# LINK DECAY ANALYTICS
# ──────────────────────────────────────────────────────────────

@email_intel_bp.route('/api/analytics/link-decay/<int:link_id>', methods=['GET'])
@login_required
def get_link_decay(link_id):
    """
    Returns click volume over time (daily buckets) for a specific link.
    Shows how engagement decays after a link is shared.
    Query params: period=7d|14d|30d|60d|90d (default: 30d)
    """
    user_id = session.get('user_id')
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({'success': False, 'error': 'Link not found'}), 404

    period_map = {'7d': 7, '14d': 14, '30d': 30, '60d': 60, '90d': 90}
    days = period_map.get(request.args.get('period', '30d'), 30)

    cutoff = datetime.utcnow() - timedelta(days=days)
    events = (TrackingEvent.query
              .filter(TrackingEvent.link_id == link_id)
              .filter(TrackingEvent.timestamp >= cutoff)
              .order_by(TrackingEvent.timestamp.asc())
              .all())

    # Bucket by day
    buckets = defaultdict(lambda: {'clicks': 0, 'real_visitors': 0, 'bots': 0})
    for e in events:
        day = e.timestamp.strftime('%Y-%m-%d') if e.timestamp else None
        if day:
            buckets[day]['clicks'] += 1
            if e.is_bot:
                buckets[day]['bots'] += 1
            else:
                buckets[day]['real_visitors'] += 1

    # Fill in zero-click days
    today = datetime.utcnow().date()
    chart_data = []
    for i in range(days):
        day = (today - timedelta(days=days - i - 1)).strftime('%Y-%m-%d')
        b = buckets.get(day, {'clicks': 0, 'real_visitors': 0, 'bots': 0})
        chart_data.append({'date': day, **b})

    peak_day = max(chart_data, key=lambda x: x['clicks']) if chart_data else None

    return jsonify({
        'success': True,
        'link_id': link_id,
        'campaign_name': link.campaign_name,
        'period': f"{days}d",
        'total_clicks': sum(d['clicks'] for d in chart_data),
        'total_real_visitors': sum(d['real_visitors'] for d in chart_data),
        'total_bots': sum(d['bots'] for d in chart_data),
        'peak_day': peak_day,
        'chart': chart_data,
    })


# ──────────────────────────────────────────────────────────────
# EMAIL INTELLIGENCE SUMMARY
# ──────────────────────────────────────────────────────────────

@email_intel_bp.route('/api/analytics/email-intelligence', methods=['GET'])
@login_required
def get_email_intelligence():
    """Combined email intelligence dashboard data."""
    user_id = session.get('user_id')
    link_ids = [l.id for l in Link.query.filter_by(user_id=user_id).all()]

    # PURL stats
    total_purls = PurlMapping.query.filter_by(user_id=user_id).count()
    clicked_purls = PurlMapping.query.filter_by(user_id=user_id, clicked=True).count()
    open_rate = round((clicked_purls / total_purls * 100), 1) if total_purls else 0

    # Bot vs human
    if link_ids:
        bot_count = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.is_bot == True
        ).count()
        human_count = TrackingEvent.query.filter(
            TrackingEvent.link_id.in_(link_ids),
            TrackingEvent.is_bot == False
        ).count()
    else:
        bot_count = human_count = 0

    total_events = bot_count + human_count

    # Recent email captures
    if link_ids:
        recent_captures = (TrackingEvent.query
                           .filter(TrackingEvent.link_id.in_(link_ids))
                           .filter(TrackingEvent.captured_email.isnot(None))
                           .order_by(TrackingEvent.timestamp.desc())
                           .limit(20).all())
        captures = [{
            'email': e.captured_email,
            'country': e.country,
            'browser': e.browser,
            'timestamp': e.timestamp.isoformat() if e.timestamp else None,
        } for e in recent_captures]
    else:
        captures = []

    return jsonify({
        'success': True,
        'purl_stats': {
            'total': total_purls,
            'clicked': clicked_purls,
            'open_rate': open_rate,
        },
        'honeypot': {
            'total_events': total_events,
            'bot_count': bot_count,
            'human_count': human_count,
            'bot_rate': round((bot_count / total_events * 100), 1) if total_events else 0,
        },
        'recent_captures': captures,
    })
