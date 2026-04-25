"""
link_features.py — Extended link feature endpoints:
  QR code generation, link health monitoring, pixel injection,
  OG metadata, dynamic routing rules, bulk import/export.

Security hardening:
  - All write routes rate-limited
  - Input sanitized via bleach
  - Format/size params whitelisted
  - OG image URL validated (no javascript: / data: schemes)
  - Bulk import: 500 link max, campaign_name sanitized, URL validated
"""
import io
import csv
import json
import re
import time
import string
import random
import logging
import bleach
import requests as http_requests
from datetime import datetime

from flask import g, Blueprint, request, jsonify, session, send_file
from api.database import db
from api.models.link import Link
from api.models.link_health_log import LinkHealthLog
from api.models.user import User
from api.middleware.auth_decorators import login_required
from api.middleware.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)
link_features_bp = Blueprint('link_features', __name__)

# Allowed QR formats whitelist
_QR_FORMATS = {'png', 'svg'}

# URL scheme whitelist for OG images and routing rule destinations
_SAFE_SCHEMES = ('http://', 'https://')

# Max campaign name length
_MAX_CAMPAIGN_LEN = 255

def _safe_url(url):
    """Return url if safe scheme, else None."""
    if not url:
        return None
    url = str(url).strip()
    return url if url.startswith(_SAFE_SCHEMES) else None


def _sanitize_text(val, max_len=255):
    """Strip HTML, limit length."""
    if not val:
        return None
    cleaned = bleach.clean(str(val), tags=[], strip=True)
    return cleaned[:max_len]


# ──────────────────────────────────────────────────────────────
# QR CODE GENERATION
# ──────────────────────────────────────────────────────────────

@link_features_bp.route('/api/links/<int:link_id>/qr', methods=['GET'])
@login_required
@rate_limiter.rate_limit(requests_per_minute=30, requests_per_hour=200)
def get_link_qr(link_id):
    """
    Generate a QR code for a tracking link.
    Query params:
      format=png|svg  (default: png)
      size=200-1000   (default: 300)
      download=1      to trigger browser download
    """
    import qrcode
    import qrcode.image.svg

    user_id = g.user.id
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({'success': False, 'error': 'Link not found'}), 404

    # Whitelist format
    fmt = request.args.get('format', 'png').lower()
    if fmt not in _QR_FORMATS:
        fmt = 'png'

    # Clamp size
    try:
        size = min(max(int(request.args.get('size', 300)), 100), 1000)
    except (ValueError, TypeError):
        size = 300

    download = request.args.get('download', '0') == '1'

    scheme = request.headers.get('X-Forwarded-Proto', request.scheme)
    base_url = f"{scheme}://{request.host}"
    qr_url = f"{base_url}/t/{link.short_code}?id={link.id}"

    try:
        if fmt == 'svg':
            factory = qrcode.image.svg.SvgImage
            qr_img = qrcode.make(qr_url, image_factory=factory)
            buf = io.BytesIO()
            qr_img.save(buf)
            buf.seek(0)
            filename = f"qr_{link.short_code}.svg"
            mimetype = 'image/svg+xml'
        else:
            qr = qrcode.QRCode(
                version=None,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=max(1, size // 30),
                border=4,
            )
            qr.add_data(qr_url)
            qr.make(fit=True)
            img = qr.make_image(fill_color='black', back_color='white')
            buf = io.BytesIO()
            img.save(buf, format='PNG')
            buf.seek(0)
            filename = f"qr_{link.short_code}.png"
            mimetype = 'image/png'

        return send_file(
            buf,
            mimetype=mimetype,
            as_attachment=download,
            download_name=filename,
        )
    except Exception as e:
        logger.error(f"QR generation error: {e}")
        return jsonify({'success': False, 'error': 'QR generation failed'}), 500


# ──────────────────────────────────────────────────────────────
# LINK HEALTH MONITORING
# ──────────────────────────────────────────────────────────────

def _perform_health_check(link):
    """Check target URL reachability. Returns (status, code, ms, error_msg)."""
    url = link.target_url
    if not url:
        return 'down', None, None, 'No target URL configured'
    try:
        t0 = time.time()
        resp = http_requests.head(
            url, allow_redirects=True, timeout=10,
            headers={'User-Agent': 'BrainLinkTracker/HealthCheck/1.0'}
        )
        ms = int((time.time() - t0) * 1000)
        code = resp.status_code
        if code < 400:
            status = 'active'
        elif code < 500:
            status = 'warning'
        else:
            status = 'down'
        return status, code, ms, None
    except http_requests.exceptions.Timeout:
        return 'down', None, None, 'Request timed out'
    except http_requests.exceptions.ConnectionError as e:
        return 'down', None, None, f'Connection error: {str(e)[:120]}'
    except Exception as e:
        return 'warning', None, None, str(e)[:200]


@link_features_bp.route('/api/links/<int:link_id>/health', methods=['GET'])
@login_required
def get_link_health(link_id):
    """Return latest health status + last 10 check logs."""
    user_id = g.user.id
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({'success': False, 'error': 'Link not found'}), 404

    logs = (LinkHealthLog.query
            .filter_by(link_id=link_id)
            .order_by(LinkHealthLog.checked_at.desc())
            .limit(10).all())

    return jsonify({
        'success': True,
        'health_status': link.health_status or 'unknown',
        'health_response_code': link.health_response_code,
        'health_last_checked': link.health_last_checked.isoformat() if link.health_last_checked else None,
        'logs': [l.to_dict() for l in logs],
    })


@link_features_bp.route('/api/links/<int:link_id>/health-check', methods=['POST'])
@login_required
@rate_limiter.rate_limit(requests_per_minute=10, requests_per_hour=60)
def run_link_health_check(link_id):
    """Manually trigger a health check for a specific link."""
    user_id = g.user.id
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({'success': False, 'error': 'Link not found'}), 404

    status, code, ms, error = _perform_health_check(link)

    log = LinkHealthLog(
        link_id=link_id,
        status=status,
        response_code=code,
        response_time_ms=ms,
        error_message=error,
    )
    db.session.add(log)

    link.health_status = status
    link.health_response_code = code
    link.health_last_checked = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'success': True,
        'health_status': status,
        'response_code': code,
        'response_time_ms': ms,
        'error': error,
        'checked_at': log.checked_at.isoformat(),
    })


# ──────────────────────────────────────────────────────────────
# RETARGETING PIXEL INJECTION
# ──────────────────────────────────────────────────────────────

@link_features_bp.route('/api/links/<int:link_id>/pixels', methods=['GET'])
@login_required
def get_link_pixels(link_id):
    user_id = g.user.id
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({'success': False, 'error': 'Link not found'}), 404

    return jsonify({
        'success': True,
        'data': {
            'facebook_pixel_id': link.facebook_pixel_id,
            'enable_facebook_pixel': link.enable_facebook_pixel,
            'google_ads_pixel': link.google_ads_pixel,
            'enable_google_ads_pixel': link.enable_google_ads_pixel,
            'tiktok_pixel': link.tiktok_pixel,
            'enable_tiktok_pixel': link.enable_tiktok_pixel,
        },
        'error': None,
    })


@link_features_bp.route('/api/links/<int:link_id>/pixels', methods=['PUT'])
@login_required
@rate_limiter.rate_limit(requests_per_minute=20)
def update_link_pixels(link_id):
    user_id = g.user.id
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({'success': False, 'error': 'Link not found'}), 404

    data = request.get_json() or {}

    # Validate pixel IDs — only alphanumeric and hyphens/underscores
    _PIXEL_RE = re.compile(r'^[A-Za-z0-9_\-]{1,100}$')

    def _validate_pixel_id(val):
        if not val:
            return None
        val = str(val).strip()
        return val if _PIXEL_RE.match(val) else None

    if 'facebook_pixel_id' in data:
        link.facebook_pixel_id = _validate_pixel_id(data['facebook_pixel_id'])
    if 'enable_facebook_pixel' in data:
        link.enable_facebook_pixel = bool(data['enable_facebook_pixel'])
    if 'google_ads_pixel' in data:
        link.google_ads_pixel = _validate_pixel_id(data['google_ads_pixel'])
    if 'enable_google_ads_pixel' in data:
        link.enable_google_ads_pixel = bool(data['enable_google_ads_pixel'])
    if 'tiktok_pixel' in data:
        link.tiktok_pixel = _validate_pixel_id(data['tiktok_pixel'])
    if 'enable_tiktok_pixel' in data:
        link.enable_tiktok_pixel = bool(data['enable_tiktok_pixel'])

    db.session.commit()
    return jsonify({'success': True, 'data': None, 'error': None,
                    'message': 'Pixel configuration updated'})


# ──────────────────────────────────────────────────────────────
# OPEN GRAPH METADATA
# ──────────────────────────────────────────────────────────────

@link_features_bp.route('/api/links/<int:link_id>/og-metadata', methods=['GET'])
@login_required
def get_og_metadata(link_id):
    user_id = g.user.id
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({'success': False, 'error': 'Link not found'}), 404

    return jsonify({
        'success': True,
        'data': {
            'og_title': link.og_title,
            'og_description': link.og_description,
            'og_image_url': link.og_image_url,
        },
        'error': None,
    })


@link_features_bp.route('/api/links/<int:link_id>/og-metadata', methods=['PUT'])
@login_required
@rate_limiter.rate_limit(requests_per_minute=20)
def update_og_metadata(link_id):
    user_id = g.user.id
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({'success': False, 'error': 'Link not found'}), 404

    data = request.get_json() or {}

    if 'og_title' in data:
        link.og_title = _sanitize_text(data['og_title'], 255)
    if 'og_description' in data:
        link.og_description = _sanitize_text(data['og_description'], 500)
    if 'og_image_url' in data:
        # Strict: must be http/https — reject javascript:, data:, etc.
        safe = _safe_url(data['og_image_url'])
        if data['og_image_url'] and not safe:
            return jsonify({'success': False, 'error': 'Invalid image URL — must use http or https'}), 400
        link.og_image_url = safe

    db.session.commit()
    return jsonify({'success': True, 'data': None, 'error': None,
                    'message': 'OG metadata updated'})


# ──────────────────────────────────────────────────────────────
# DYNAMIC ROUTING RULES
# ──────────────────────────────────────────────────────────────

VALID_RULE_TYPES = {'device', 'geo', 'returning_visitor', 'time_of_day'}
_MAX_RULES = 20


def _validate_routing_rules(rules):
    if not isinstance(rules, list):
        return False, 'Rules must be an array'
    if len(rules) > _MAX_RULES:
        return False, f'Maximum {_MAX_RULES} rules allowed'
    for i, rule in enumerate(rules):
        if not isinstance(rule, dict):
            return False, f'Rule {i} must be an object'
        if rule.get('type') not in VALID_RULE_TYPES:
            return False, f'Rule {i}: invalid type. Must be one of {sorted(VALID_RULE_TYPES)}'
        dest = rule.get('destination_url', '')
        if not _safe_url(dest):
            return False, f'Rule {i}: destination_url must start with http:// or https://'
    return True, None


@link_features_bp.route('/api/links/<int:link_id>/routing-rules', methods=['GET'])
@login_required
def get_routing_rules(link_id):
    user_id = g.user.id
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({'success': False, 'error': 'Link not found'}), 404

    rules = []
    if link.routing_rules:
        try:
            rules = json.loads(link.routing_rules)
        except Exception:
            rules = []

    return jsonify({'success': True, 'data': {'routing_rules': rules}, 'error': None})


@link_features_bp.route('/api/links/<int:link_id>/routing-rules', methods=['PUT'])
@login_required
@rate_limiter.rate_limit(requests_per_minute=20)
def update_routing_rules(link_id):
    user_id = g.user.id
    link = Link.query.filter_by(id=link_id, user_id=user_id).first()
    if not link:
        return jsonify({'success': False, 'error': 'Link not found'}), 404

    data = request.get_json() or {}
    rules = data.get('routing_rules', [])

    valid, error = _validate_routing_rules(rules)
    if not valid:
        return jsonify({'success': False, 'error': error}), 400

    link.routing_rules = json.dumps(rules)
    db.session.commit()
    return jsonify({'success': True, 'data': {'routing_rules': rules}, 'error': None,
                    'message': 'Routing rules updated'})


# ──────────────────────────────────────────────────────────────
# BULK IMPORT / EXPORT
# ──────────────────────────────────────────────────────────────

def _gen_short_code():
    chars = string.ascii_letters + string.digits
    for _ in range(10):
        code = ''.join(random.choice(chars) for _ in range(8))
        if not Link.query.filter_by(short_code=code).first():
            return code
    return ''.join(random.choice(chars) for _ in range(12))


@link_features_bp.route('/api/links/export', methods=['GET'])
@login_required
@rate_limiter.rate_limit(requests_per_minute=5, requests_per_hour=30)
def export_links():
    """Export all user links as CSV."""
    user_id = g.user.id
    links = Link.query.filter_by(user_id=user_id).order_by(Link.created_at.desc()).all()

    scheme = request.headers.get('X-Forwarded-Proto', request.scheme)
    base_url = f"{scheme}://{request.host}"

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        'id', 'campaign_name', 'target_url', 'short_code', 'status',
        'total_clicks', 'real_visitors', 'blocked_attempts',
        'tracking_url', 'pixel_url',
        'capture_email', 'bot_blocking_enabled', 'geo_targeting_enabled',
        'facebook_pixel_id', 'google_ads_pixel', 'tiktok_pixel',
        'expires_at', 'created_at',
    ])
    for link in links:
        writer.writerow([
            link.id,
            link.campaign_name or '',
            link.target_url or '',
            link.short_code or '',
            link.status or 'active',
            link.total_clicks or 0,
            link.real_visitors or 0,
            link.blocked_attempts or 0,
            f"{base_url}/t/{link.short_code}?id={link.id}",
            f"{base_url}/p/{link.short_code}?email={{email}}&id={link.id}",
            link.capture_email,
            link.bot_blocking_enabled,
            link.geo_targeting_enabled,
            link.facebook_pixel_id or '',
            link.google_ads_pixel or '',
            link.tiktok_pixel or '',
            link.expires_at.isoformat() if link.expires_at else '',
            link.created_at.isoformat() if link.created_at else '',
        ])

    buf.seek(0)
    return send_file(
        io.BytesIO(buf.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name='tracking_links.csv',
    )


@link_features_bp.route('/api/links/bulk-import', methods=['POST'])
@login_required
@rate_limiter.rate_limit(requests_per_minute=3, requests_per_hour=20)
def bulk_import_links():
    """
    Bulk create tracking links from JSON body or CSV file upload.
    Accepts:
      - JSON: { "links": [{ "target_url": "...", "campaign_name": "..." }, ...] }
      - Multipart: file=<csv>
    Limits: 500 links per request, URL must be http/https.
    Duplicates (same target_url + campaign_name) are skipped.
    """
    user_id = g.user.id
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'error': 'Authentication required'}), 401

    rows = []

    if request.content_type and 'multipart' in request.content_type:
        f = request.files.get('file')
        if not f:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400
        # Only allow CSV
        filename = (f.filename or '').lower()
        if not filename.endswith('.csv'):
            return jsonify({'success': False, 'error': 'Only CSV files accepted'}), 400
        # Read with utf-8, ignore invalid bytes
        content = f.read(5 * 1024 * 1024).decode('utf-8', errors='ignore')
        reader = csv.DictReader(io.StringIO(content))
        for row in reader:
            rows.append({
                'target_url': row.get('target_url') or row.get('url') or row.get('destination') or '',
                'campaign_name': row.get('campaign_name') or row.get('name') or 'Imported Campaign',
                'capture_email': str(row.get('capture_email', '')).lower() in ('true', '1', 'yes'),
                'bot_blocking_enabled': str(row.get('bot_blocking_enabled', '')).lower() in ('true', '1', 'yes'),
            })
    else:
        data = request.get_json() or {}
        rows = data.get('links', [])

    if not rows:
        return jsonify({'success': False, 'error': 'No links provided'}), 400
    if len(rows) > 500:
        return jsonify({'success': False, 'error': 'Maximum 500 links per import'}), 400

    created = []
    errors = []

    for i, row in enumerate(rows):
        target_url = str(row.get('target_url', '')).strip()

        # Strict URL validation
        if not _safe_url(target_url):
            errors.append({'row': i + 1, 'error': 'Invalid or missing target_url (must be http/https)'})
            continue

        # Sanitize campaign name
        campaign_name = _sanitize_text(
            str(row.get('campaign_name', 'Imported Campaign')),
            _MAX_CAMPAIGN_LEN
        ) or 'Imported Campaign'

        # Duplicate check: same user + target_url + campaign_name
        duplicate = Link.query.filter_by(
            user_id=user_id,
            target_url=target_url,
            campaign_name=campaign_name
        ).first()
        if duplicate:
            errors.append({'row': i + 1, 'error': f'Duplicate: {campaign_name} → {target_url[:60]}'})
            continue

        try:
            link = Link(
                user_id=user_id,
                target_url=target_url,
                short_code=_gen_short_code(),
                campaign_name=campaign_name,
                capture_email=bool(row.get('capture_email', False)),
                bot_blocking_enabled=bool(row.get('bot_blocking_enabled', False)),
            )
            db.session.add(link)
            db.session.flush()

            scheme = request.headers.get('X-Forwarded-Proto', request.scheme)
            base_url = f"{scheme}://{request.host}"
            created.append({
                'id': link.id,
                'campaign_name': link.campaign_name,
                'target_url': link.target_url,
                'short_code': link.short_code,
                'tracking_url': f"{base_url}/t/{link.short_code}?id={link.id}",
            })
        except Exception as e:
            db.session.rollback()
            errors.append({'row': i + 1, 'error': str(e)[:120]})
            continue

    db.session.commit()

    return jsonify({
        'success': True,
        'data': {
            'created': len(created),
            'errors': len(errors),
            'links': created,
            'error_details': errors,
        },
        'error': None,
    }), 201
