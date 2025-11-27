#!/usr/bin/env python3
"""
Database Schema Verification Script
Checks for missing tables and columns in Neon PostgreSQL
"""

import os
import sys
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text, inspect

DATABASE_URL = os.environ.get('DATABASE_URL') or 'postgresql://neondb_owner:npg_7CcKbPRm2GDw@ep-odd-thunder-ade4ip4a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'

print("="*80)
print("DATABASE SCHEMA VERIFICATION")
print("="*80)

try:
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    print("\n[1/3] Checking existing tables...")
    tables = inspector.get_table_names()
    print(f"Found {len(tables)} tables:")
    for table in sorted(tables):
        print(f"  - {table}")
    
    print("\n[2/3] Verifying critical tables...")
    required_tables = [
        'users', 'links', 'campaigns', 'tracking_events',
        'domains', 'payments', 'notifications', 'support_tickets',
        'contact_submissions'
    ]
    
    missing_tables = []
    for table in required_tables:
        if table in tables:
            print(f"  [OK] {table}")
        else:
            print(f"  [MISSING] {table}")
            missing_tables.append(table)
    
    print("\n[3/3] Checking critical columns...")
    
    # Check users table
    if 'users' in tables:
        user_cols = [col['name'] for col in inspector.get_columns('users')]
        required_user_cols = ['avatar_url', 'background_url', 'background_color', 'theme']
        for col in required_user_cols:
            if col in user_cols:
                print(f"  [OK] users.{col}")
            else:
                print(f"  [MISSING] users.{col}")
    
    # Check campaigns table  
    if 'campaigns' in tables:
        campaign_cols = [col['name'] for col in inspector.get_columns('campaigns')]
        required_campaign_cols = ['type', 'impressions', 'total_visitors', 'last_activity_date']
        for col in required_campaign_cols:
            if col in campaign_cols:
                print(f"  [OK] campaigns.{col}")
            else:
                print(f"  [MISSING] campaigns.{col}")
    
    print("\n" + "="*80)
    if missing_tables:
        print(f"[WARNING] {len(missing_tables)} tables need to be created")
        print("Run: python -c 'from api.index import app, db; app.app_context().push(); db.create_all()'")
    else:
        print("[SUCCESS] Database schema verified!")
    print("="*80)
    
except Exception as e:
    print(f"\n[ERROR] Database connection failed: {e}")
    print("Please verify DATABASE_URL is correct")
    sys.exit(1)
