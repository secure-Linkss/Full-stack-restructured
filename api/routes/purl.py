"""
purl.py — Personalized URL (PURL) engine.
Generates a unique tracking link per recipient (CSV upload of name + email).
Supports honeypot detection (bot vs human event tagging).
"""
import io
import csv
import re
import logging
from datetime import datetime

from flask import g, Blueprint, request, jsonify, session, send_file
from api.database import db

# RFC 5322-inspired email regex (practical subset)
_EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
from api.models.link import Link
from api.models.purl_mapping import PurlMapping
from api.models.tracking_event import TrackingEvent
from api.middleware.auth_decorators import login_required

logger = logging.getLogger(__name__)
purl_bp = Blueprint('purl', __name__)


# ──────────────────────────────────────────────────────────────
# PURL GENERATION
# ──────────────────────────────────────────────────────────────

@purl_bp.route('/api/purl/generate', methods=['POST'])
@login_required
def generate_purls():
    """
    Generate personalized URLs for a list of recipients.
    Accepts:
      - JSON: { "link_id": 1, "recipients": [{"name": "...", "email": "..."}, ...] }
      - Multipart: link_id=<int>, file=<csv with name,email columns>
    """
    user_id = g.user.id

    if request.content_type and 'multipart' in request.content_type:
        link_id = request.form.get('link_id', type=int)
        f = request.files.get('file')
        if not f:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
        content = f.read().decode('utf-8', errors='replace')
        reader = csv.DictReader(io.StringIO(content))
        recipients = []
        for row in reader:
            email = (row.get('email') or row.get('Email') or '').strip()
            name = (row.get('name') or row.get('Name') or '').strip()
            if email:
                recipients.append({'email': email, 'name': name})
    else:
        data = request.get_json() or {}
        link_id = data.get('link_id')
        recipients = data.get('recipients', [])

    if not link_id:
        return jsonify({'success': False, 'error': 'link_id required'}), 400
    if not recipients:
        return jsonify({'success': False, 'error': 'No recipients provided'}), 400
    if len(recipients) > 5000:
        return jsonify({'success': False, 'error': 'Maximum 5000 recipients per batch'}), 400

    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({'success': False, 'error': 'Link not found'}), 404

    scheme = request.headers.get('X-Forwarded-Proto', request.scheme)
    base_url = f"{scheme}://{request.host}"

    created = []
    skipped = []

    for rec in recipients:
        email = str(rec.get('email', '')).strip().lower()
        name = str(rec.get('name', '')).strip()[:255]

        if not email or not _EMAIL_RE.match(email):
            skipped.append({'email': email, 'reason': 'Invalid email'})
            continue

        # Check if PURL already exists for this link+email combination
        existing = PurlMapping.query.filter_by(link_id=link_id, email=email).first()
        if existing:
            skipped.append({'email': email, 'reason': 'Already exists'})
            continue

        purl = PurlMapping(user_id=user_id, link_id=link_id, email=email, name=name)
        db.session.add(purl)
        db.session.flush()

        purl_url = f"{base_url}/t/{link.short_code}?email={email}&purl={purl.unique_code}"
        created.append({
            'id': purl.id,
            'name': name,
            'email': email,
            'unique_code': purl.unique_code,
            'purl': purl_url,
        })

    db.session.commit()

    # If all recipients were invalid (none created), return 400
    if len(created) == 0 and len(skipped) > 0:
        return jsonify({
            'success': False,
            'error': 'No valid recipients — all were skipped',
            'created': 0,
            'skipped': len(skipped),
            'purls': [],
            'skip_details': skipped,
        }), 400

    return jsonify({
        'success': True,
        'created': len(created),
        'skipped': len(skipped),
        'purls': created,
        'skip_details': skipped,
    }), 200


@purl_bp.route('/api/purl/list', methods=['GET'])
@login_required
def list_purls():
    """List all PURL mappings for current user, optionally filtered by link_id."""
    user_id = g.user.id
    link_id = request.args.get('link_id', type=int)
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 50, type=int), 200)

    query = PurlMapping.query.filter_by(user_id=user_id)
    if link_id:
        query = query.filter_by(link_id=link_id)

    pagination = query.order_by(PurlMapping.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    scheme = request.headers.get('X-Forwarded-Proto', request.scheme)
    base_url = f"{scheme}://{request.host}"

    return jsonify({
        'success': True,
        'purls': [p.to_dict(base_url=base_url) for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
    })


@purl_bp.route('/api/purl/<int:purl_id>', methods=['DELETE'])
@login_required
def delete_purl(purl_id):
    user_id = g.user.id
    purl = PurlMapping.query.filter_by(id=purl_id, user_id=user_id).first()
    if not purl:
        return jsonify({'success': False, 'error': 'PURL not found'}), 404
    db.session.delete(purl)
    db.session.commit()
    return jsonify({'success': True, 'message': 'PURL deleted'})


@purl_bp.route('/api/purl/export', methods=['GET'])
@login_required
def export_purls():
    """Export PURLs as CSV."""
    user_id = g.user.id
    link_id = request.args.get('link_id', type=int)

    scheme = request.headers.get('X-Forwarded-Proto', request.scheme)
    base_url = f"{scheme}://{request.host}"

    query = PurlMapping.query.filter_by(user_id=user_id)
    if link_id:
        query = query.filter_by(link_id=link_id)
    purls = query.order_by(PurlMapping.created_at.desc()).all()

    # Pre-fetch all referenced links in one query to avoid N+1
    link_ids = list({p.link_id for p in purls})
    links_map = {lnk.id: lnk for lnk in Link.query.filter(Link.id.in_(link_ids)).all()} if link_ids else {}

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(['id', 'name', 'email', 'unique_code', 'purl', 'clicked', 'click_count', 'clicked_at', 'created_at'])
    for p in purls:
        lnk = links_map.get(p.link_id)
        short_code = lnk.short_code if lnk else ''
        purl_url = f"{base_url}/t/{short_code}?email={p.email}&purl={p.unique_code}"
        writer.writerow([
            p.id, p.name or '', p.email, p.unique_code, purl_url,
            p.clicked, p.click_count,
            p.clicked_at.isoformat() if p.clicked_at else '',
            p.created_at.isoformat() if p.created_at else '',
        ])

    buf.seek(0)
    return send_file(
        io.BytesIO(buf.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name='purls.csv',
    )


# ──────────────────────────────────────────────────────────────
# HONEYPOT DETECTION
# ──────────────────────────────────────────────────────────────

@purl_bp.route('/api/analytics/honeypot-stats', methods=['GET'])
@login_required
def get_honeypot_stats():
    """Return bot vs human breakdown for the current user's events."""
    user_id = g.user.id
    link_ids = [l.id for l in Link.query.filter_by(user_id=user_id).all()]

    if not link_ids:
        return jsonify({'success': True, 'bot_count': 0, 'human_count': 0, 'total': 0, 'events': []})

    events = (TrackingEvent.query
              .filter(TrackingEvent.link_id.in_(link_ids))
              .order_by(TrackingEvent.timestamp.desc())
              .limit(200).all())

    bot_count = sum(1 for e in events if e.is_bot)
    human_count = len(events) - bot_count

    event_list = []
    for e in events:
        event_list.append({
            'id': e.id,
            'link_id': e.link_id,
            'is_bot': e.is_bot,
            'ip_address': e.ip_address,
            'country': e.country,
            'device_type': e.device_type,
            'created_at': e.timestamp.isoformat() if e.timestamp else None,
        })

    return jsonify({
        'success': True,
        'bot_count': bot_count,
        'human_count': human_count,
        'total': len(events),
        'bot_rate': round((bot_count / len(events) * 100), 1) if events else 0,
        'events': event_list[:50],
    })
