#!/usr/bin/env python3
"""
Vercel Deployment Script for Brain Link Tracker
Deploys the project to Vercel with all environment variables configured
"""

import requests
import json
import sys
import time

# Configuration
VERCEL_TOKEN = "1JIyxuO5vXBTUGJW5YmNy6GF"
GITHUB_REPO = "secure-Linkss/Full-stack-restructured"
PROJECT_NAME = "brain-link-tracker"

# Environment Variables to set in Vercel
ENV_VARS = {
    "SECRET_KEY": "ej5B3Amppi4gjpbC65te6rJuvJzgVCWW_xfB-ZLR1TE",
    "DATABASE_URL": "postgresql://neondb_owner:npg_7CcKbPRm2GDw@ep-odd-thunder-ade4ip4a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    "SHORTIO_API_KEY": "sk_DbGGlUHPN7Z9VotL",
    "SHORTIO_DOMAIN": "Secure-links.short.gy",
    "REDIS_HOST": "redis-15183.c16.us-east-1-3.ec2.cloud.redislabs.com",
    "REDIS_PORT": "15183",
    "REDIS_PASSWORD": "8tOWUOOILVmYZ4ZemXDuQooBNFa5hVFm",
    "REDIS_DB": "0",
    "FLASK_ENV": "production",
    "PYTHON_VERSION": "3.9"
}

HEADERS = {
    "Authorization": f"Bearer {VERCEL_TOKEN}",
    "Content-Type": "application/json"
}

def get_or_create_project():
    """Get existing project or create new one"""
    print("🔍 Checking for existing project...")
    
    # List all projects
    response = requests.get(
        "https://api.vercel.com/v9/projects",
        headers=HEADERS
    )
    
    if response.status_code == 200:
        projects = response.json().get("projects", [])
        for project in projects:
            if project["name"] == PROJECT_NAME:
                print(f"✅ Found existing project: {project['name']}")
                return project["id"]
    
    # Create new project
    print("📦 Creating new project...")
    project_data = {
        "name": PROJECT_NAME,
        "framework": "vite",
        "gitRepository": {
            "repo": GITHUB_REPO,
            "type": "github"
        },
        "buildCommand": "npm run build",
        "outputDirectory": "dist",
        "installCommand": "npm install --legacy-peer-deps",
        "rootDirectory": None
    }
    
    response = requests.post(
        "https://api.vercel.com/v9/projects",
        headers=HEADERS,
        json=project_data
    )
    
    if response.status_code in [200, 201]:
        project_id = response.json()["id"]
        print(f"✅ Project created: {project_id}")
        return project_id
    else:
        print(f"❌ Failed to create project: {response.status_code}")
        print(response.text)
        return None

def set_environment_variables(project_id):
    """Set all environment variables for the project"""
    print("\n🔧 Setting environment variables...")
    
    for key, value in ENV_VARS.items():
        env_data = {
            "key": key,
            "value": value,
            "type": "encrypted",
            "target": ["production", "preview", "development"]
        }
        
        response = requests.post(
            f"https://api.vercel.com/v10/projects/{project_id}/env",
            headers=HEADERS,
            json=env_data
        )
        
        if response.status_code in [200, 201]:
            print(f"  ✅ Set {key}")
        elif response.status_code == 409:
            print(f"  ⚠️  {key} already exists, updating...")
            # Get existing env var ID and update it
            get_response = requests.get(
                f"https://api.vercel.com/v9/projects/{project_id}/env",
                headers=HEADERS
            )
            if get_response.status_code == 200:
                envs = get_response.json().get("envs", [])
                for env in envs:
                    if env["key"] == key:
                        update_response = requests.patch(
                            f"https://api.vercel.com/v9/projects/{project_id}/env/{env['id']}",
                            headers=HEADERS,
                            json={"value": value}
                        )
                        if update_response.status_code == 200:
                            print(f"  ✅ Updated {key}")
                        break
        else:
            print(f"  ❌ Failed to set {key}: {response.status_code}")
            print(f"     {response.text}")

def trigger_deployment(project_id):
    """Trigger a new deployment"""
    print("\n🚀 Triggering deployment...")
    
    deployment_data = {
        "name": PROJECT_NAME,
        "gitSource": {
            "type": "github",
            "repo": GITHUB_REPO,
            "ref": "main"
        },
        "target": "production"
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
        print(f"❌ Deployment failed: {response.status_code}")
        print(response.text)
        return None, None

def check_deployment_status(deployment_id):
    """Check deployment status"""
    print("\n⏳ Checking deployment status...")
    
    max_attempts = 60  # 5 minutes max
    attempt = 0
    
    while attempt < max_attempts:
        response = requests.get(
            f"https://api.vercel.com/v13/deployments/{deployment_id}",
            headers=HEADERS
        )
        
        if response.status_code == 200:
            deployment = response.json()
            state = deployment.get("readyState")
            
            if state == "READY":
                print("✅ Deployment successful!")
                return True
            elif state in ["ERROR", "CANCELED"]:
                print(f"❌ Deployment failed with state: {state}")
                return False
            else:
                print(f"   Status: {state} (attempt {attempt + 1}/{max_attempts})")
                time.sleep(5)
                attempt += 1
        else:
            print(f"❌ Failed to check status: {response.status_code}")
            return False
    
    print("⏱️  Deployment timeout - please check Vercel dashboard")
    return False

def remove_project_protection(project_id):
    """Remove project protection settings"""
    print("\n🔓 Removing project protection...")
    
    protection_data = {
        "ssoProtection": None
    }
    
    response = requests.patch(
        f"https://api.vercel.com/v9/projects/{project_id}",
        headers=HEADERS,
        json=protection_data
    )
    
    if response.status_code == 200:
        print("✅ Project protection removed")
    else:
        print(f"⚠️  Could not remove protection: {response.status_code}")

def verify_deployment(deployment_url):
    """Verify the deployment is accessible"""
    print("\n🔍 Verifying deployment accessibility...")
    
    try:
        response = requests.get(f"https://{deployment_url}", timeout=10)
        if response.status_code == 200:
            print("✅ Deployment is accessible!")
            return True
        else:
            print(f"⚠️  Deployment returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Failed to access deployment: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("🧠 BRAIN LINK TRACKER - VERCEL DEPLOYMENT")
    print("=" * 60)
    
    # Step 1: Get or create project
    project_id = get_or_create_project()
    if not project_id:
        print("\n❌ Failed to get/create project. Exiting.")
        sys.exit(1)
    
    # Step 2: Set environment variables
    set_environment_variables(project_id)
    
    # Step 3: Remove protection
    remove_project_protection(project_id)
    
    # Step 4: Trigger deployment
    deployment_id, deployment_url = trigger_deployment(project_id)
    if not deployment_id:
        print("\n❌ Failed to trigger deployment. Exiting.")
        sys.exit(1)
    
    # Step 5: Check deployment status
    success = check_deployment_status(deployment_id)
    
    if success:
        # Step 6: Verify deployment
        verify_deployment(deployment_url)
        
        print("\n" + "=" * 60)
        print("✅ DEPLOYMENT COMPLETE!")
        print("=" * 60)
        print(f"\n🌐 Production URL: https://{deployment_url}")
        print(f"📊 Project ID: {project_id}")
        print(f"🆔 Deployment ID: {deployment_id}")
        print("\n📝 Next Steps:")
        print("   1. Test user login and registration")
        print("   2. Verify payment flow")
        print("   3. Check admin panel functionality")
        print("   4. Test all action buttons")
        print("   5. Verify database connectivity")
        print("\n" + "=" * 60)
    else:
        print("\n❌ Deployment failed or timed out.")
        print("Please check the Vercel dashboard for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()