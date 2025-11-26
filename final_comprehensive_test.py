#!/usr/bin/env python3
"""
Comprehensive Test Suite for Brain Link Tracker
Tests all API endpoints, data connections, and frontend/backend integration
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:5000"
FRONTEND_URL = "http://localhost:3025"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "TestPassword123!"

# Test Results
test_results = {
    "total_tests": 0,
    "passed_tests": 0,
    "failed_tests": 0,
    "errors": []
}

def print_test_header(title):
    """Print a formatted test header"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_api_endpoint(method, endpoint, data=None, headers=None, session=None):
    """Test an API endpoint and return the response"""
    test_results["total_tests"] += 1
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = session.get(url, headers=headers) if session else requests.get(url, headers=headers)
        elif method == "POST":
            response = session.post(url, json=data, headers=headers) if session else requests.post(url, json=data, headers=headers)
        elif method == "PATCH":
            response = session.patch(url, json=data, headers=headers) if session else requests.patch(url, json=data, headers=headers)
        
        if response.status_code in [200, 201, 204]:
            test_results["passed_tests"] += 1
            print(f"✓ {method} {endpoint} - Status: {response.status_code}")
            return response
        else:
            test_results["failed_tests"] += 1
            error_msg = f"✗ {method} {endpoint} - Status: {response.status_code} - {response.text[:100]}"
            print(error_msg)
            test_results["errors"].append(error_msg)
            return response
    except Exception as e:
        test_results["failed_tests"] += 1
        error_msg = f"✗ {method} {endpoint} - Error: {str(e)}"
        print(error_msg)
        test_results["errors"].append(error_msg)
        return None

def test_user_authentication():
    """Test user authentication endpoints"""
    print_test_header("Testing User Authentication")
    
    session = requests.Session()
    
    # Test registration
    register_data = {
        "email": f"test_{int(time.time())}@example.com",
        "password": "TestPassword123!",
        "name": "Test User"
    }
    response = test_api_endpoint("POST", "/api/auth/register", register_data, session=session)
    
    if response and response.status_code == 201:
        # Test login
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }
        response = test_api_endpoint("POST", "/api/auth/login", login_data, session=session)
        return session, register_data["email"]
    
    return session, None

def test_tracking_links_api(session):
    """Test Tracking Links API endpoints"""
    print_test_header("Testing Tracking Links API")
    
    # Create a tracking link
    link_data = {
        "campaign_name": "Test Campaign",
        "target_url": "https://www.example.com",
        "landing_page_url": "https://landing.example.com"
    }
    response = test_api_endpoint("POST", "/api/links/create", link_data, session=session)
    
    link_id = None
    if response and response.status_code == 201:
        try:
            link_id = response.json().get("id") or response.json().get("link_id")
        except:
            pass
    
    # Get all tracking links
    test_api_endpoint("GET", "/api/links", session=session)
    
    # Get link details
    if link_id:
        test_api_endpoint("GET", f"/api/links/{link_id}", session=session)
    
    return link_id

def test_link_shortener_api(session):
    """Test Link Shortener API endpoints"""
    print_test_header("Testing Link Shortener API")
    
    # Create a shortened link
    shortener_data = {
        "original_url": "https://www.example.com/very/long/url",
        "custom_code": None
    }
    response = test_api_endpoint("POST", "/api/shortener/create", shortener_data, session=session)
    
    short_code = None
    if response and response.status_code == 201:
        try:
            short_code = response.json().get("short_code")
        except:
            pass
    
    # Get all shortened links
    test_api_endpoint("GET", "/api/shortener", session=session)
    
    return short_code

def test_analytics_api(session):
    """Test Analytics API endpoints"""
    print_test_header("Testing Analytics API")
    
    # Get dashboard analytics
    test_api_endpoint("GET", "/api/analytics/dashboard", session=session)
    
    # Get analytics with period filter
    test_api_endpoint("GET", "/api/analytics/dashboard?period=7d", session=session)
    
    # Get geography analytics
    test_api_endpoint("GET", "/api/analytics/geography", session=session)
    
    # Get visitor flow
    test_api_endpoint("GET", "/api/analytics/visitor-flow", session=session)
    
    # Get A/B test performance
    test_api_endpoint("GET", "/api/analytics/ab-test-performance", session=session)

def test_user_settings_api(session):
    """Test User Settings API endpoints"""
    print_test_header("Testing User Settings API")
    
    # Get appearance settings
    test_api_endpoint("GET", "/api/user/settings/appearance", session=session)
    
    # Update appearance settings
    appearance_data = {
        "theme": "dark",
        "background_url": "https://example.com/bg.jpg",
        "background_color": "#1a1a1a"
    }
    test_api_endpoint("PATCH", "/api/user/settings/appearance", appearance_data, session=session)
    
    # Get billing info
    test_api_endpoint("GET", "/api/user/billing", session=session)

def test_api_key_management(session):
    """Test API Key Management endpoints"""
    print_test_header("Testing API Key Management")
    
    # Get API keys
    test_api_endpoint("GET", "/api/user/api-keys", session=session)
    
    # Create API key
    api_key_data = {
        "name": "Test API Key",
        "permissions": ["read", "write"]
    }
    test_api_endpoint("POST", "/api/user/api-keys", api_key_data, session=session)

def test_campaign_api(session):
    """Test Campaign API endpoints"""
    print_test_header("Testing Campaign API")
    
    # Get all campaigns
    test_api_endpoint("GET", "/api/campaigns", session=session)
    
    # Create campaign
    campaign_data = {
        "name": "Test Campaign",
        "description": "Test campaign for verification"
    }
    response = test_api_endpoint("POST", "/api/campaigns", campaign_data, session=session)
    
    campaign_id = None
    if response and response.status_code == 201:
        try:
            campaign_id = response.json().get("id")
        except:
            pass
    
    return campaign_id

def test_data_integrity(session, link_id):
    """Test data integrity and accuracy"""
    print_test_header("Testing Data Integrity")
    
    if link_id:
        # Fetch link details
        response = test_api_endpoint("GET", f"/api/links/{link_id}", session=session)
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                print(f"  Link Data: {json.dumps(data, indent=2)[:200]}...")
                
                # Verify required fields
                required_fields = ["id", "campaign_name", "target_url", "total_clicks"]
                for field in required_fields:
                    if field in data:
                        print(f"  ✓ Field '{field}' present")
                    else:
                        print(f"  ✗ Field '{field}' missing")
                        test_results["failed_tests"] += 1
                        test_results["errors"].append(f"Missing field: {field}")
            except Exception as e:
                print(f"  Error parsing response: {e}")

def test_frontend_availability():
    """Test frontend availability"""
    print_test_header("Testing Frontend Availability")
    
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            print(f"✓ Frontend is accessible at {FRONTEND_URL}")
            test_results["passed_tests"] += 1
        else:
            print(f"✗ Frontend returned status {response.status_code}")
            test_results["failed_tests"] += 1
    except Exception as e:
        print(f"✗ Frontend error: {e}")
        test_results["failed_tests"] += 1

def print_test_summary():
    """Print test summary"""
    print_test_header("Test Summary")
    print(f"Total Tests: {test_results['total_tests']}")
    print(f"Passed: {test_results['passed_tests']}")
    print(f"Failed: {test_results['failed_tests']}")
    print(f"Success Rate: {(test_results['passed_tests'] / test_results['total_tests'] * 100):.1f}%" if test_results['total_tests'] > 0 else "N/A")
    
    if test_results["errors"]:
        print("\nErrors Encountered:")
        for error in test_results["errors"][:10]:  # Show first 10 errors
            print(f"  - {error}")

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  BRAIN LINK TRACKER - COMPREHENSIVE TEST SUITE")
    print("="*60)
    print(f"  Test Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Backend URL: {BASE_URL}")
    print(f"  Frontend URL: {FRONTEND_URL}")
    
    # Test frontend availability
    test_frontend_availability()
    
    # Test user authentication
    session, user_email = test_user_authentication()
    
    if session:
        # Test tracking links API
        link_id = test_tracking_links_api(session)
        
        # Test link shortener API
        short_code = test_link_shortener_api(session)
        
        # Test analytics API
        test_analytics_api(session)
        
        # Test user settings API
        test_user_settings_api(session)
        
        # Test API key management
        test_api_key_management(session)
        
        # Test campaign API
        campaign_id = test_campaign_api(session)
        
        # Test data integrity
        test_data_integrity(session, link_id)
    
    # Print summary
    print_test_summary()
    
    print(f"\n  Test End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60 + "\n")
    
    return test_results["failed_tests"] == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
