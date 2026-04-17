"""
Bridge page — fires on_page beacon then redirects to final destination.
Sits at the end of the quantum redirect chain (after all security checks pass).
"""
from flask import Blueprint, request, redirect, make_response
from urllib.parse import unquote

bridge_bp = Blueprint("bridge", __name__)

BRIDGE_HTML = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Redirecting...</title>
<script>
(function() {
  var uid = {uid_json};
  var dest = {dest_json};
  if (uid) {
    try {
      var base = window.location.origin;
      navigator.sendBeacon(base + '/api/track/page-view', JSON.stringify({{ uid: uid }}));
    } catch(e) {{}}
  }
  if (dest) {
    window.location.replace(dest);
  }
})();
</script>
<noscript>
  <meta http-equiv="refresh" content="0; url={dest_escaped}">
</noscript>
</head>
<body style="background:#000;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
<p>Redirecting...</p>
</body>
</html>"""


@bridge_bp.route("/bridge")
def bridge():
    """Intermediate bridge page: fire on_page beacon, then JS-redirect to destination."""
    uid = request.args.get("uid", "")
    dest = request.args.get("dest", "")

    if not dest:
        return "Missing destination", 400

    # Safely embed into JS without XSS
    import json
    uid_json = json.dumps(uid)
    dest_json = json.dumps(dest)
    dest_escaped = dest.replace('"', "&quot;").replace("'", "&#39;").replace("<", "&lt;")

    html = BRIDGE_HTML.replace("{uid_json}", uid_json) \
                      .replace("{dest_json}", dest_json) \
                      .replace("{dest_escaped}", dest_escaped)

    resp = make_response(html, 200)
    resp.headers["Content-Type"] = "text/html; charset=utf-8"
    resp.headers["Cache-Control"] = "no-store"
    return resp
