#!/usr/bin/env python3
"""
Final deployment with comprehensive verification
"""

import requests
import time
import json

VERCEL_TOKEN = "1JIyxuO5vXBTUGJW5YmNy6GF"
PROJECT_ID = "prj_zTxHveyLsIYLfAgOGkyldI6Wyo9s"

HEADERS = {
    "Authorization": f"Bearer {VERCEL_TOKEN}",
    "Content-Type": "application/json"
}

def trigger_new_deployment():
    """Trigger a fresh deployment"""
    print("🚀 Triggering new deployment from latest commit...")
    
    deployment_data = {
        "name": "brain-link-tracker",
        "project": PROJECT_ID,
        "target": "production",
        "gitSource": {
            "type": "github",
            "ref": "master",
            "repoId": 1071208873
        }
    }
    
    response = requests.post(
        "https://api.vercel.com/v13/deployments",
        headers=HEADERS,
        json=deployment_data
    )
    
    if response.status_code in [200, 201]:
        deployment = response.json()
        return deployment.get('id'), deployment.get('url')
    else:
        print(f"❌ Failed: {response.status_code}")
        print(response.text)
        return None, None

def wait_and_verify(deployment_id, timeout=600):
    """Wait for deployment and verify"""
    print(f"\n⏳ Monitoring deployment {deployment_id}...")
    
    start = time.time()
    while (time.time() - start) < timeout:
        response = requests.get(
            f"https://api.vercel.com/v13/deployments/{deployment_id}",
            headers=HEADERS
        )
        
        if response.status_code == 200:
            deployment = response.json()
            state = deployment.get('readyState')
            
            if state == 'READY':
                url = deployment.get('url')
                print(f"\n✅ Deployment READY!")
                print(f"🌐 URL: https://{url}")
                return url
            elif state in ['ERROR', 'CANCELED']:
                print(f"\n❌ Deployment failed: {state}")
                return None
            else:
                elapsed = int(time.time() - start)
                print(f"   {state}... ({elapsed}s)", end='\r')
                time.sleep(10)
    
    return None

def comprehensive_test(base_url):
    """Comprehensive testing of the deployment"""
    print(f"\n{'='*70}")
    print("🧪 COMPREHENSIVE TESTING")
    print(f"{'='*70}")
    
    tests = {
        "Homepage": f"https://{base_url}",
        "Login Page": f"https://{base_url}/login",
        "Register Page": f"https://{base_url}/register",
        "Admin Page": f"https://{base_url}/admin",
        "API Health": f"https://{base_url}/api/health",
        "API Auth Check": f"https://{base_url}/api/auth/check",
    }
    
    results = {}
    for name, url in tests.items():
        try:
            response = requests.get(url, timeout=15)
            status = response.status_code
            
            if status == 200:
                icon = "✅"
            elif status in [401, 404]:
                icon = "⚠️"
            else:
                icon = "❌"
            
            results[name] = status
            print(f"{icon} {name:20} : {status}")
            
            # For API health, show response
            if "health" in name.lower() and status == 200:
                try:
                    data = response.json()
                    print(f"   Response: {json.dumps(data, indent=2)[:200]}")
                except:
                    print(f"   Response: {response.text[:200]}")
                    
        except Exception as e:
            results[name] = f"Error: {str(e)}"
            print(f"❌ {name:20} : {str(e)[:50]}")
    
    return results

def main():
    print("="*70)
    print("🧠 BRAIN LINK TRACKER - FINAL DEPLOYMENT")
    print("="*70)
    
    # Trigger deployment
    deployment_id, deployment_url = trigger_new_deployment()
    
    if not deployment_id:
        print("\n❌ Failed to trigger deployment")
        return
    
    # Wait for completion
    final_url = wait_and_verify(deployment_id, timeout=600)
    
    if not final_url:
        print("\n❌ Deployment failed or timed out")
        return
    
    # Wait a bit for the deployment to stabilize
    print("\n⏳ Waiting 10 seconds for deployment to stabilize...")
    time.sleep(10)
    
    # Test everything
    results = comprehensive_test(final_url)
    
    # Get production domain
    response = requests.get(
        f"https://api.vercel.com/v9/projects/{PROJECT_ID}",
        headers=HEADERS
    )
    
    prod_domain = "brain-link-tracker-nine.vercel.app"
    if response.status_code == 200:
        project = response.json()
        targets = project.get('targets', {})
        production = targets.get('production', {})
        alias = production.get('alias', [])
        if alias:
            prod_domain = alias[0]
    
    # Final summary
    print(f"\n{'='*70}")
    print("✅ DEPLOYMENT COMPLETE!")
    print(f"{'='*70}")
    print(f"\n🌐 PRODUCTION URL: https://{prod_domain}")
    print(f"🔗 Latest Deployment: https://{final_url}")
    print(f"🆔 Deployment ID: {deployment_id}")
    
    # Check if API is working
    api_working = results.get("API Health", 0) == 200
    
    if api_working:
        print("\n✅ API IS WORKING!")
        print("\n📋 NEXT STEPS:")
        print("   1. Test user registration")
        print("   2. Test login functionality")
        print("   3. Test payment flow")
        print("   4. Test admin panel")
        print("   5. Verify database operations")
    else:
        print("\n⚠️  API ENDPOINTS RETURNING ERRORS")
        print("\n🔍 TROUBLESHOOTING STEPS:")
        print("   1. Check Vercel Function logs:")
        print(f"      https://vercel.com/secure-links-projects-3ddb7f78/brain-link-tracker/deployments/{deployment_id}")
        print("   2. Verify DATABASE_URL is correct and accessible")
        print("   3. Check if all Python dependencies are in requirements.txt")
        print("   4. Verify Redis connection")
        print("   5. Check for any import errors in the logs")
        print("\n💡 Common Issues:")
        print("   - Database connection timeout")
        print("   - Missing environment variables")
        print("   - Python dependency conflicts")
        print("   - Redis connection issues")
    
    print(f"\n{'='*70}")

if __name__ == "__main__":
    main()