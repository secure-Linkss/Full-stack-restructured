#!/usr/bin/env python3
"""
Test all imports to identify the issue
"""

import os
import sys

# Set up path
sys.path.insert(0, os.path.dirname(__file__))

print("Testing imports...")
print("=" * 60)

try:
    print("1. Testing database import...")
    from src.database import db
    print("   ✅ Database imported")
except Exception as e:
    print(f"   ❌ Database import failed: {e}")
    sys.exit(1)

try:
    print("2. Testing Flask imports...")
    from flask import Flask
    print("   ✅ Flask imported")
except Exception as e:
    print(f"   ❌ Flask import failed: {e}")
    sys.exit(1)

try:
    print("3. Testing config import...")
    from api.config.production import config
    print("   ✅ Config imported")
except Exception as e:
    print(f"   ❌ Config import failed: {e}")
    sys.exit(1)

try:
    print("4. Testing model imports...")
    from src.models.user import User
    print("   ✅ User model imported")
    from api.models.contact import ContactSubmission
    print("   ✅ Contact model imported")
except Exception as e:
    print(f"   ❌ Model import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    print("5. Testing route imports...")
    from api.routes.auth import auth_bp
    print("   ✅ Auth routes imported")
except Exception as e:
    print(f"   ❌ Route import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("=" * 60)
print("✅ All imports successful!")
print("\nNow testing Flask app initialization...")

try:
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'test'
    
    db.init_app(app)
    
    with app.app_context():
        print("   ✅ Flask app initialized successfully")
        
except Exception as e:
    print(f"   ❌ Flask app initialization failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("=" * 60)
print("✅ ALL TESTS PASSED!")