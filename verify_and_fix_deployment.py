#!/usr/bin/env python3
"""
Verify deployment and check for issues
"""

import requests
import json

VERCEL_TOKEN = "1JIyxuO5vXBTUGJW5YmNy6GF"
PROJECT_ID = "prj_zTxHveyLsIYLfAgOGkyldI6Wyo9s"
DEPLOYMENT_ID = "dpl_GntZFVxgWXwFUEyiVbcikfEGenzv"

HEADERS = {
    "Authorization": f"Bearer {VERCEL_TOKEN}",
    "Content-Type": "application/json"
}

def get_deployment_logs():
    """Get deployment build logs"""
    print("📋 Fetching deployment logs...\n")
    
    response = requests.get(
        f"https://api.vercel.com/v2/deployments/{DEPLOYMENT_ID}/events",
        headers=HEADERS
    )
    
    if response.status_code == 200:
        events = response.json()
        
        # Print last 20 log entries
        for event in events[-20:]:
            payload = event.get('payload', {})
            text = payload.get('text', '')
            if text:
                print(text)
        
        return True
    else:
        print(f"❌ Failed to get logs: {response.status_code}")
        return False

def check_production_url():
    """Check the production URL"""
    print("\n" + "=" * 70)
    print("🌐 CHECKING PRODUCTION URL")
    print("=" * 70)
    
    prod_url = "https://brain-link-tracker-nine.vercel.app"
    
    print(f"\n🔍 Testing: {prod_url}")
    
    try:
        # Test homepage
        print("\n1. Homepage:")
        response = requests.get(prod_url, timeout=15)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Homepage loads successfully")
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
        
        # Test API health
        print("\n2. API Health Check:")
        api_response = requests.get(f"{prod_url}/api/health", timeout=15)
        print(f"   Status: {api_response.status_code}")
        if api_response.status_code == 200:
            print(f"   Response: {api_response.text[:200]}")
            print("   ✅ API is responding")
        else:
            print(f"   ⚠️  API Error: {api_response.status_code}")
            print(f"   Response: {api_response.text[:500]}")
        
        # Test other endpoints
        endpoints = [
            "/api/auth/check",
            "/login",
            "/register",
        ]
        
        print("\n3. Other Endpoints:")
        for endpoint in endpoints:
            try:
                r = requests.get(f"{prod_url}{endpoint}", timeout=10)
                status_icon = "✅" if r.status_code in [200, 401, 404] else "⚠️"
                print(f"   {status_icon} {endpoint}: {r.status_code}")
            except Exception as e:
                print(f"   ❌ {endpoint}: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def get_environment_variables():
    """Check environment variables are set"""
    print("\n" + "=" * 70)
    print("🔧 CHECKING ENVIRONMENT VARIABLES")
    print("=" * 70)
    
    response = requests.get(
        f"https://api.vercel.com/v9/projects/{PROJECT_ID}/env",
        headers=HEADERS
    )
    
    if response.status_code == 200:
        envs = response.json().get('envs', [])
        
        required_vars = [
            'SECRET_KEY',
            'DATABASE_URL',
            'SHORTIO_API_KEY',
            'SHORTIO_DOMAIN',
            'REDIS_HOST',
            'REDIS_PORT',
            'REDIS_PASSWORD',
            'FLASK_ENV'
        ]
        
        print("\nEnvironment Variables Status:")
        for var in required_vars:
            exists = any(env['key'] == var for env in envs)
            icon = "✅" if exists else "❌"
            print(f"   {icon} {var}")
        
        return True
    else:
        print(f"❌ Failed to get env vars: {response.status_code}")
        return False

def main():
    print("=" * 70)
    print("🔍 DEPLOYMENT VERIFICATION & DIAGNOSTICS")
    print("=" * 70)
    
    # Check environment variables
    get_environment_variables()
    
    # Check production URL
    check_production_url()
    
    # Get logs
    print("\n" + "=" * 70)
    print("📋 DEPLOYMENT LOGS (Last 20 entries)")
    print("=" * 70)
    get_deployment_logs()
    
    print("\n" + "=" * 70)
    print("✅ DIAGNOSTICS COMPLETE")
    print("=" * 70)
    print("\n🌐 Production URL: https://brain-link-tracker-nine.vercel.app")
    print("\n📝 If API returns 500 errors, possible causes:")
    print("   1. Database connection issue (check DATABASE_URL)")
    print("   2. Missing Python dependencies")
    print("   3. Redis connection issue")
    print("   4. Flask app initialization error")
    print("\n💡 Recommendation:")
    print("   - Check Vercel function logs in dashboard")
    print("   - Verify database is accessible from Vercel")
    print("   - Ensure all environment variables are correct")
    print("=" * 70)

if __name__ == "__main__":
    main()