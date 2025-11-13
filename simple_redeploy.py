#!/usr/bin/env python3
"""
Simple redeployment using existing configuration
"""

import requests
import time

VERCEL_TOKEN = "1JIyxuO5vXBTUGJW5YmNy6GF"
PROJECT_ID = "prj_zTxHveyLsIYLfAgOGkyldI6Wyo9s"

HEADERS = {
    "Authorization": f"Bearer {VERCEL_TOKEN}",
    "Content-Type": "application/json"
}

def get_latest_deployment():
    """Get the latest successful deployment"""
    print("🔍 Finding latest deployment...")
    
    response = requests.get(
        f"https://api.vercel.com/v6/deployments?projectId={PROJECT_ID}&limit=10",
        headers=HEADERS
    )
    
    if response.status_code == 200:
        deployments = response.json().get("deployments", [])
        for dep in deployments:
            if dep.get('readyState') == 'READY':
                print(f"✅ Found deployment: {dep['uid']}")
                return dep['uid']
    
    return None

def redeploy(deployment_id):
    """Redeploy an existing deployment"""
    print(f"🚀 Redeploying {deployment_id}...")
    
    # Use the correct redeploy endpoint
    response = requests.post(
        f"https://api.vercel.com/v13/deployments",
        headers=HEADERS,
        json={
            "deploymentId": deployment_id,
            "name": "brain-link-tracker",
            "target": "production"
        }
    )
    
    if response.status_code in [200, 201]:
        new_dep = response.json()
        print(f"✅ New deployment: {new_dep.get('id')}")
        return new_dep.get('id'), new_dep.get('url')
    else:
        print(f"⚠️  Status: {response.status_code}")
        print(response.text)
        return None, None

def wait_for_ready(deployment_id):
    """Wait for deployment to be ready"""
    print(f"\n⏳ Waiting for deployment...")
    
    for i in range(60):
        response = requests.get(
            f"https://api.vercel.com/v13/deployments/{deployment_id}",
            headers=HEADERS
        )
        
        if response.status_code == 200:
            dep = response.json()
            state = dep.get('readyState')
            
            if state == 'READY':
                print(f"\n✅ Deployment ready!")
                return dep.get('url')
            elif state in ['ERROR', 'CANCELED']:
                print(f"\n❌ Failed: {state}")
                return None
            
            print(f"   {state}... ({i*5}s)", end='\r')
            time.sleep(5)
    
    return None

def test_deployment(url):
    """Quick test"""
    print(f"\n🧪 Testing https://{url}...")
    
    tests = {
        "Homepage": f"https://{url}",
        "API Health": f"https://{url}/api/health"
    }
    
    for name, test_url in tests.items():
        try:
            r = requests.get(test_url, timeout=10)
            icon = "✅" if r.status_code == 200 else "⚠️"
            print(f"{icon} {name}: {r.status_code}")
        except Exception as e:
            print(f"❌ {name}: {str(e)[:50]}")

def main():
    print("="*70)
    print("🚀 SIMPLE REDEPLOYMENT")
    print("="*70)
    
    # Get latest deployment
    dep_id = get_latest_deployment()
    
    if not dep_id:
        print("❌ No deployment found")
        return
    
    # Redeploy
    new_id, new_url = redeploy(dep_id)
    
    if not new_id:
        print("\n❌ Redeploy failed")
        print("\n💡 The project is already deployed at:")
        print("   https://brain-link-tracker-nine.vercel.app")
        print("\n📝 To check status:")
        print("   1. Visit the Vercel dashboard")
        print("   2. Check function logs for errors")
        print("   3. Verify environment variables")
        return
    
    # Wait
    final_url = wait_for_ready(new_id)
    
    if final_url:
        test_deployment(final_url)
        
        print("\n" + "="*70)
        print("✅ DEPLOYMENT COMPLETE")
        print("="*70)
        print(f"\n🌐 Production: https://brain-link-tracker-nine.vercel.app")
        print(f"🔗 Latest: https://{final_url}")
        print(f"🆔 ID: {new_id}")
        print("="*70)

if __name__ == "__main__":
    main()