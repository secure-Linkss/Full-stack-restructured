#!/usr/bin/env python3
"""
Vercel Deployment Script for Brain Link Tracker - Fixed Version
Deploys the project to Vercel with proper repository ID handling
"""

import requests
import json
import sys
import time

# Configuration
VERCEL_TOKEN = "1JIyxuO5vXBTUGJW5YmNy6GF"
GITHUB_REPO = "secure-Linkss/Full-stack-restructured"
PROJECT_NAME = "brain-link-tracker"

HEADERS = {
    "Authorization": f"Bearer {VERCEL_TOKEN}",
    "Content-Type": "application/json"
}

def get_project_details():
    """Get existing project details including repo ID"""
    print("🔍 Getting project details...")
    
    response = requests.get(
        f"https://api.vercel.com/v9/projects/{PROJECT_NAME}",
        headers=HEADERS
    )
    
    if response.status_code == 200:
        project = response.json()
        print(f"✅ Found project: {project['name']}")
        print(f"   Project ID: {project['id']}")
        
        # Get linked repository info
        link = project.get('link', {})
        if link:
            print(f"   Repository: {link.get('repo', 'N/A')}")
            print(f"   Repository ID: {link.get('repoId', 'N/A')}")
        
        return project
    else:
        print(f"❌ Failed to get project: {response.status_code}")
        print(response.text)
        return None

def update_environment_variables(project_id):
    """Update existing environment variables"""
    print("\n🔧 Updating environment variables...")
    
    # Get all existing env vars
    response = requests.get(
        f"https://api.vercel.com/v9/projects/{project_id}/env",
        headers=HEADERS
    )
    
    if response.status_code != 200:
        print(f"❌ Failed to get env vars: {response.status_code}")
        return
    
    existing_envs = {env['key']: env for env in response.json().get('envs', [])}
    
    # Environment variables to update
    env_updates = {
        "SECRET_KEY": "ej5B3Amppi4gjpbC65te6rJuvJzgVCWW_xfB-ZLR1TE",
        "DATABASE_URL": "postgresql://neondb_owner:npg_7CcKbPRm2GDw@ep-odd-thunder-ade4ip4a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
        "SHORTIO_API_KEY": "sk_DbGGlUHPN7Z9VotL",
        "SHORTIO_DOMAIN": "Secure-links.short.gy",
        "REDIS_HOST": "redis-15183.c16.us-east-1-3.ec2.cloud.redislabs.com",
        "REDIS_PORT": "15183",
        "REDIS_PASSWORD": "8tOWUOOILVmYZ4ZemXDuQooBNFa5hVFm",
        "REDIS_DB": "0",
        "REDIS_URL": "redis://:8tOWUOOILVmYZ4ZemXDuQooBNFa5hVFm@redis-15183.c16.us-east-1-3.ec2.cloud.redislabs.com:15183/0",
        "FLASK_ENV": "production",
        "PYTHON_VERSION": "3.9"
    }
    
    for key, value in env_updates.items():
        if key in existing_envs:
            env_id = existing_envs[key]['id']
            print(f"  🔄 Updating {key}...")
            
            update_response = requests.patch(
                f"https://api.vercel.com/v9/projects/{project_id}/env/{env_id}",
                headers=HEADERS,
                json={"value": value}
            )
            
            if update_response.status_code == 200:
                print(f"  ✅ Updated {key}")
            else:
                print(f"  ⚠️  Failed to update {key}: {update_response.status_code}")
        else:
            print(f"  ➕ Creating {key}...")
            
            create_response = requests.post(
                f"https://api.vercel.com/v10/projects/{project_id}/env",
                headers=HEADERS,
                json={
                    "key": key,
                    "value": value,
                    "type": "encrypted",
                    "target": ["production", "preview", "development"]
                }
            )
            
            if create_response.status_code in [200, 201]:
                print(f"  ✅ Created {key}")
            else:
                print(f"  ⚠️  Failed to create {key}: {create_response.status_code}")

def trigger_deployment_simple(project_name):
    """Trigger deployment using simple method - let Vercel handle git sync"""
    print("\n🚀 Triggering deployment...")
    
    # Use the simpler deployments endpoint that auto-detects git source
    deployment_data = {
        "name": project_name,
        "target": "production",
        "gitSource": {
            "type": "github",
            "ref": "main"
        }
    }
    
    response = requests.post(
        "https://api.vercel.com/v13/deployments",
        headers=HEADERS,
        json=deployment_data
    )
    
    if response.status_code in [200, 201]:
        deployment = response.json()
        deployment_id = deployment.get("id")
        deployment_url = deployment.get("url")
        print(f"✅ Deployment triggered!")
        print(f"   ID: {deployment_id}")
        print(f"   URL: https://{deployment_url}")
        return deployment_id, deployment_url
    else:
        print(f"⚠️  Method 1 failed: {response.status_code}")
        print(response.text)
        return None, None

def trigger_deployment_hook(project_id):
    """Trigger deployment using deploy hook"""
    print("\n🚀 Attempting deployment via hook...")
    
    # Create a deploy hook
    hook_response = requests.post(
        f"https://api.vercel.com/v1/integrations/deploy/{project_id}/main",
        headers=HEADERS
    )
    
    if hook_response.status_code in [200, 201]:
        print("✅ Deploy hook triggered!")
        return True
    else:
        print(f"⚠️  Hook method failed: {hook_response.status_code}")
        return False

def get_latest_deployment(project_name):
    """Get the latest deployment for the project"""
    print("\n🔍 Checking for latest deployment...")
    
    response = requests.get(
        f"https://api.vercel.com/v6/deployments?projectId={project_name}&limit=1",
        headers=HEADERS
    )
    
    if response.status_code == 200:
        deployments = response.json().get("deployments", [])
        if deployments:
            latest = deployments[0]
            print(f"✅ Found latest deployment:")
            print(f"   ID: {latest['uid']}")
            print(f"   URL: https://{latest['url']}")
            print(f"   State: {latest['readyState']}")
            print(f"   Created: {latest['createdAt']}")
            return latest['uid'], latest['url'], latest['readyState']
    
    return None, None, None

def redeploy_latest(project_id):
    """Redeploy the latest successful deployment"""
    print("\n🔄 Triggering redeploy...")
    
    # Get deployments
    response = requests.get(
        f"https://api.vercel.com/v6/deployments?projectId={project_id}&limit=10",
        headers=HEADERS
    )
    
    if response.status_code == 200:
        deployments = response.json().get("deployments", [])
        
        # Find the latest READY deployment
        for deployment in deployments:
            if deployment.get('readyState') == 'READY':
                deployment_id = deployment['uid']
                print(f"   Found successful deployment: {deployment_id}")
                
                # Trigger redeploy
                redeploy_response = requests.post(
                    f"https://api.vercel.com/v13/deployments/{deployment_id}/redeploy",
                    headers=HEADERS,
                    json={"target": "production"}
                )
                
                if redeploy_response.status_code in [200, 201]:
                    new_deployment = redeploy_response.json()
                    print(f"✅ Redeployment triggered!")
                    print(f"   New ID: {new_deployment.get('id')}")
                    print(f"   URL: https://{new_deployment.get('url')}")
                    return new_deployment.get('id'), new_deployment.get('url')
                else:
                    print(f"⚠️  Redeploy failed: {redeploy_response.status_code}")
                    print(redeploy_response.text)
                
                break
    
    return None, None

def check_deployment_status(deployment_id, max_wait=300):
    """Check deployment status with timeout"""
    print("\n⏳ Monitoring deployment...")
    
    start_time = time.time()
    attempt = 0
    
    while (time.time() - start_time) < max_wait:
        response = requests.get(
            f"https://api.vercel.com/v13/deployments/{deployment_id}",
            headers=HEADERS
        )
        
        if response.status_code == 200:
            deployment = response.json()
            state = deployment.get("readyState")
            
            if state == "READY":
                print("✅ Deployment successful!")
                return True, deployment.get("url")
            elif state in ["ERROR", "CANCELED"]:
                print(f"❌ Deployment failed with state: {state}")
                return False, None
            else:
                elapsed = int(time.time() - start_time)
                print(f"   Status: {state} ({elapsed}s elapsed)")
                time.sleep(10)
                attempt += 1
        else:
            print(f"⚠️  Status check failed: {response.status_code}")
            time.sleep(10)
    
    print("⏱️  Deployment monitoring timeout")
    return False, None

def verify_deployment(url):
    """Verify the deployment is accessible"""
    print(f"\n🔍 Verifying deployment at https://{url}...")
    
    try:
        response = requests.get(f"https://{url}", timeout=15, allow_redirects=True)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Deployment is accessible!")
            
            # Check for key elements
            content = response.text.lower()
            if "brain link" in content or "tracker" in content:
                print("✅ Content verification passed!")
            else:
                print("⚠️  Content may not be fully loaded")
            
            return True
        else:
            print(f"⚠️  Unexpected status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Failed to access deployment: {str(e)}")
        return False

def main():
    print("=" * 70)
    print("🧠 BRAIN LINK TRACKER - VERCEL DEPLOYMENT (FIXED)")
    print("=" * 70)
    
    # Step 1: Get project details
    project = get_project_details()
    if not project:
        print("\n❌ Failed to get project details. Exiting.")
        sys.exit(1)
    
    project_id = project['id']
    
    # Step 2: Update environment variables
    update_environment_variables(project_id)
    
    # Step 3: Try redeployment (most reliable method)
    print("\n" + "=" * 70)
    print("📦 ATTEMPTING REDEPLOYMENT")
    print("=" * 70)
    
    deployment_id, deployment_url = redeploy_latest(project_id)
    
    if not deployment_id:
        print("\n⚠️  Redeploy failed, checking for existing deployments...")
        deployment_id, deployment_url, state = get_latest_deployment(project_id)
        
        if deployment_id and state == "READY":
            print(f"\n✅ Found active deployment: https://{deployment_url}")
        else:
            print("\n❌ No active deployment found.")
            print("Please trigger a deployment manually from Vercel dashboard.")
            sys.exit(1)
    
    # Step 4: Monitor deployment
    if deployment_id:
        success, final_url = check_deployment_status(deployment_id)
        
        if success:
            deployment_url = final_url or deployment_url
            
            # Step 5: Verify deployment
            verify_deployment(deployment_url)
            
            print("\n" + "=" * 70)
            print("✅ DEPLOYMENT COMPLETE!")
            print("=" * 70)
            print(f"\n🌐 Production URL: https://{deployment_url}")
            print(f"📊 Project ID: {project_id}")
            print(f"🆔 Deployment ID: {deployment_id}")
            print("\n📝 CRITICAL NEXT STEPS:")
            print("   1. ✅ Test homepage loads correctly")
            print("   2. ✅ Test user registration and login")
            print("   3. ✅ Verify payment flow (plan selection + hash submission)")
            print("   4. ✅ Check admin panel access")
            print("   5. ✅ Test all action buttons (approve, reject, etc.)")
            print("   6. ✅ Verify database connectivity (create/read operations)")
            print("   7. ✅ Test Redis caching and sessions")
            print("   8. ✅ Verify Short.io link creation")
            print("   9. ✅ Check all API endpoints respond correctly")
            print("   10. ✅ Test full user flow: register → pay → admin approve → use platform")
            print("\n🔗 Quick Test URLs:")
            print(f"   Homepage: https://{deployment_url}")
            print(f"   Login: https://{deployment_url}/login")
            print(f"   Register: https://{deployment_url}/register")
            print(f"   Admin: https://{deployment_url}/admin")
            print(f"   API Health: https://{deployment_url}/api/health")
            print("\n" + "=" * 70)
        else:
            print("\n⚠️  Deployment monitoring inconclusive.")
            print(f"Please check: https://vercel.com/{project_id}")
    else:
        print("\n⚠️  Could not track deployment.")
        print(f"Please check Vercel dashboard: https://vercel.com")

if __name__ == "__main__":
    main()