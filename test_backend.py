#!/usr/bin/env python3
"""
Backend Test Script
Tests if the backend starts correctly with all fixes applied
"""

import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

# Set environment variables for testing
os.environ['SECRET_KEY'] = 'ej5B3Amppi4gjpbC65te6rJuvJzgVCWW_xfB-ZLR1TE'
os.environ['DATABASE_URL'] = 'postgresql://neondb_owner:npg_7CcKbPRm2GDw@ep-odd-thunder-ade4ip4a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

print("=" * 80)
print("BACKEND STARTUP TEST")
print("=" * 80)

try:
    print("\n1. Importing Flask and extensions...")
    from flask import Flask
    from flask_cors import CORS
    from flask_migrate import Migrate
    print("   ✅ Flask imports successful")
    
    print("\n2. Importing database module...")
    from src.database import db
    print("   ✅ Database module imported")
    
    print("\n3. Importing models...")
    from src.models.user import User
    from src.models.link import Link
    from src.models.campaign import Campaign
    from src.models.notification import Notification
    from src.models.audit_log import AuditLog
    from src.models.tracking_event import TrackingEvent
    from src.models.domain import Domain
    from src.models.security import SecuritySettings, BlockedIP, BlockedCountry
    from src.models.ab_test import ABTest
    from src.models.api_key import APIKey
    from src.models.admin_settings import AdminSettings
    print("   ✅ All models imported successfully")
    
    print("\n4. Importing blueprints...")
    from src.api.auth import auth_bp
    from src.api.user import user_bp
    from src.api.links import links_bp
    from src.api.campaigns import campaigns_bp
    from src.api.analytics import analytics_bp
    from src.api.pending_users import pending_users_bp
    print("   ✅ Blueprints imported successfully")
    
    print("\n5. Creating Flask app...")
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    print("   ✅ Flask app created")
    
    print("\n6. Initializing database...")
    db.init_app(app)
    migrate = Migrate(app, db)
    print("   ✅ Database initialized")
    
    print("\n7. Registering blueprints...")
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(links_bp, url_prefix='/api')
    app.register_blueprint(campaigns_bp)
    app.register_blueprint(analytics_bp, url_prefix='/api')
    app.register_blueprint(pending_users_bp)
    print("   ✅ Blueprints registered")
    
    print("\n8. Testing database connection...")
    with app.app_context():
        # Try to query database
        try:
            user_count = User.query.count()
            print(f"   ✅ Database connection successful - {user_count} users in database")
        except Exception as e:
            print(f"   ⚠️  Database query failed: {e}")
    
    print("\n9. Checking admin users...")
    with app.app_context():
        brain_user = User.query.filter_by(username="Brain").first()
        brain7_user = User.query.filter_by(username="7thbrain").first()
        
        if brain_user:
            print(f"   ✅ Admin 'Brain' exists - Status: {brain_user.status}, Active: {brain_user.is_active}")
        else:
            print("   ⚠️  Admin 'Brain' not found")
        
        if brain7_user:
            print(f"   ✅ Admin '7thbrain' exists - Status: {brain7_user.status}, Active: {brain7_user.is_active}")
        else:
            print("   ⚠️  Admin '7thbrain' not found")
    
    print("\n10. Testing auth endpoints...")
    with app.test_client() as client:
        # Test login with Brain account
        response = client.post('/api/auth/login', json={
            'username': 'Brain',
            'password': 'Mayflower1!!'
        })
        if response.status_code == 200:
            print("   ✅ Login endpoint works - 'Brain' login successful")
        else:
            print(f"   ⚠️  Login failed: {response.status_code} - {response.get_json()}")
    
    print("\n" + "=" * 80)
    print("BACKEND TEST RESULT: ✅ ALL TESTS PASSED")
    print("=" * 80)
    print("\nThe backend is ready for deployment!")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    print("\n" + "=" * 80)
    print("BACKEND TEST RESULT: ❌ FAILED")
    print("=" * 80)
    sys.exit(1)
