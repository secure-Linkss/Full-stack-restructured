"""Minimal Flask test — verifying Vercel Python 3.12 runtime works."""
import os
import sys
import json

from flask import Flask, jsonify

app = Flask(__name__)
application = app

@app.route('/api/health')
def health():
    return jsonify({"ok": True, "python": sys.version})

@app.route('/api/debug/startup')
def debug():
    return jsonify({"boot": "minimal_ok", "python": sys.version, "path": sys.path[:3]})

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return jsonify({"status": "minimal_flask_running", "path": path}), 200
