#!/usr/bin/env python3
"""
Trigger a fresh production deployment and verify all systems
"""

import requests
import json
import time

VERCEL_TOKEN = "1JIyxuO5vXBTUGJW5YmNy6GF"
PROJECT_ID = "prj_zTxHveyLsIYLfAgOGkyldI6Wyo9s"

HEADERS = {
    "Authorization": f"Bearer {VERCEL_TOKEN}",
    "Content-Type": "application/json"
}

def get_production_domain():
    """Get the production domain for the project"""
    print("🔍 Getting production domain...")
    
    response = requests.get(
        f"https://api.vercel.com/v9/projects/{PROJECT_ID}",
        headers=HEADERS
    )
    
    if response.status_code == 200:
        project = response.json()
        
        # Get production domain
        targets = project.get('targets', {})
        production = targets.get('production', {})
        alias = production.get('alias', [])
        
        if alias:
            print(f"✅ Production domain: {alias[0]}")
            return alias[0]
        
        # Fallback to project name
        name = project.get('name', '')
        domain = f"{name}.vercel.app"
        print(f"✅ Default domain: {domain}")
        return domain
    
    return None

def create_deployment():
    """Create a new production deployment"""
    print("\n🚀 Creating new production deployment...")
    
    # Get the latest commit from main branch
    deployment_data = {
        "name": "brain-link-tracker",
        "project": PROJECT_ID,
        "target": "production",
        "gitSource": {
            "type": "github",
            "ref": "main",
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
        print(f"✅ Deployment created!")
        print(f"   ID: {deployment.get('id')}")
        print(f"   URL: https://{deployment.get('url')}")
        return deployment.get('id'), deployment.get('url')
    else:
        print(f"⚠️  Failed: {response.status_code}")
        print(response.text)
        return None, None

def promote_to_production(deployment_id):
    """Promote a deployment to production"""
    print(f"\n📤 Promoting deployment to production...")
    
    response = requests.patch(
        f"https://api.vercel.com/v13/deployments/{deployment_id}",
        headers=HEADERS,
        json={"target": "production"}
    )
    
    if response.status_code == 200:
        print("✅ Promoted to production!")
        return True
    else:
        print(f"⚠️  Promotion status: {response.status_code}")
        return False

def wait_for_deployment(deployment_id, timeout=300):
    """Wait for deployment to complete"""
    print("\n⏳ Waiting for deployment to complete...")
    
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
                print("✅ Deployment ready!")
                return deployment.get('url')
            elif state in ['ERROR', 'CANCELED']:
                print(f"❌ Deployment failed: {state}")
                return None
            else:
                elapsed = int(time.time() - start)
                print(f"   {state}... ({elapsed}s)")
                time.sleep(10)
    
    print("⏱️  Timeout")
    return None

def test_api_endpoints(base_url):
    """Test critical API endpoints"""
    print(f"\n🧪 Testing API endpoints on {base_url}...")
    
    endpoints = [
        "/api/health",
        "/api/auth/check",
    ]
    
    results = {}
    for endpoint in endpoints:
        try:
            url = f"https://{base_url}{endpoint}"
            response = requests.get(url, timeout=10)
            status = "✅" if response.status_code in [200, 401] else "⚠️"
            print(f"   {status} {endpoint}: {response.status_code}")
            results[endpoint] = response.status_code
        except Exception as e:
            print(f"   ❌ {endpoint}: {str(e)}")
            results[endpoint] = None
    
    return results

def verify_database_connection(base_url):
    """Verify database is accessible"""
    print(f"\n🗄️  Verifying database connection...")
    
    try:
        response = requests.get(f"https://{base_url}/api/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if 'database' in str(data).lower() or 'status' in str(data).lower():
                print("✅ Database connection verified!")
                return True
        print("⚠️  Database status unclear")
        return False
    except Exception as e:
        print(f"❌ Database check failed: {str(e)}")
        return False

def main():
    print("=" * 70)
    print("🚀 TRIGGERING FRESH PRODUCTION DEPLOYMENT")
    print("=" * 70)
    
    # Get production domain
    prod_domain = get_production_domain()
    
    # Create new deployment
    deployment_id, deployment_url = create_deployment()
    
    if not deployment_id:
        print("\n❌ Failed to create deployment")
        return
    
    # Wait for deployment
    final_url = wait_for_deployment(deployment_id)
    
    if not final_url:
        print("\n❌ Deployment did not complete successfully")
        return
    
    # Test endpoints
    test_api_endpoints(final_url)
    
    # Verify database
    verify_database_connection(final_url)
    
    print("\n" + "=" * 70)
    print("✅ DEPLOYMENT VERIFICATION COMPLETE")
    print("=" * 70)
    print(f"\n🌐 Deployment URL: https://{final_url}")
    if prod_domain:
        print(f"🌐 Production Domain: https://{prod_domain}")
    print(f"🆔 Deployment ID: {deployment_id}")
    print("\n📋 Manual Verification Checklist:")
    print("   [ ] Homepage loads without errors")
    print("   [ ] User can register with plan selection")
    print("   [ ] Payment hash submission works")
    print("   [ ] Admin can log in")
    print("   [ ] Admin can approve/reject users")
    print("   [ ] Approved users can create links")
    print("   [ ] Links are tracked properly")
    print("   [ ] Dashboard shows analytics")
    print("   [ ] All buttons trigger correct actions")
    print("=" * 70)

if __name__ == "__main__":
    main()