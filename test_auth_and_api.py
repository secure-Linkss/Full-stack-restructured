#!/usr/bin/env python3
"""
Authentication and API Testing Script
Tests backend connectivity, authentication, and API endpoints
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000"
API_URL = f"{BASE_URL}/api"

# Test credentials
TEST_USER = "7thbrain"
TEST_PASSWORD = "Mayflower1!"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ {message}{Colors.END}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠ {message}{Colors.END}")

def test_backend_health():
    """Test if backend server is running"""
    print_info("Testing backend server health...")
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success("Backend server is running")
            return True
        else:
            print_warning(f"Health check returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to backend server - is it running?")
        print_info(f"Attempted to connect to: {BASE_URL}")
        return False
    except Exception as e:
        print_error(f"Health check failed: {str(e)}")
        return False

def test_login():
    """Test login endpoint and get authentication token"""
    print_info("Testing login endpoint...")
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            json={"username": TEST_USER, "password": TEST_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if 'token' in data or 'access_token' in data:
                token = data.get('token') or data.get('access_token')
                print_success(f"Login successful! Token received (length: {len(token)})")
                return token
            else:
                print_warning("Login returned 200 but no token in response")
                print_info(f"Response: {json.dumps(data, indent=2)}")
                return None
        else:
            print_error(f"Login failed with status {response.status_code}")
            try:
                error_data = response.json()
                print_info(f"Error: {json.dumps(error_data, indent=2)}")
            except:
                print_info(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Login test failed: {str(e)}")
        return None

def test_authenticated_endpoint(token, endpoint, method='GET'):
    """Test an authenticated API endpoint"""
    print_info(f"Testing {method} {endpoint}...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        if method == 'GET':
            response = requests.get(f"{API_URL}{endpoint}", headers=headers, timeout=10)
        elif method == 'POST':
            response = requests.post(f"{API_URL}{endpoint}", headers=headers, timeout=10)
        else:
            print_error(f"Unsupported method: {method}")
            return False
        
        if response.status_code == 200:
            print_success(f"{endpoint} - Success")
            try:
                data = response.json()
                # Show first few keys of response
                if isinstance(data, dict):
                    keys = list(data.keys())[:5]
                    print_info(f"Response keys: {keys}")
                elif isinstance(data, list):
                    print_info(f"Response: List with {len(data)} items")
            except:
                pass
            return True
        elif response.status_code == 401:
            print_error(f"{endpoint} - 401 Unauthorized (token invalid/expired)")
            return False
        elif response.status_code == 404:
            print_error(f"{endpoint} - 404 Not Found (endpoint doesn't exist)")
            return False
        else:
            print_warning(f"{endpoint} - Status {response.status_code}")
            try:
                error_data = response.json()
                print_info(f"Error: {json.dumps(error_data, indent=2)}")
            except:
                print_info(f"Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        return False

def run_comprehensive_tests():
    """Run all API tests"""
    print("\n" + "="*60)
    print(f"{Colors.BLUE}BRAIN LINK TRACKER - API DIAGNOSTIC TEST{Colors.END}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60 + "\n")
    
    # Test 1: Backend Health
    print("\n[TEST 1] Backend Server Health")
    print("-" * 40)
    if not test_backend_health():
        print_error("\nBackend server is not running!")
        print_info("To start the backend:")
        print_info("  cd /home/user/brain-link-tracker")
        print_info("  python api/index.py")
        return False
    
    # Test 2: Login
    print("\n[TEST 2] Authentication")
    print("-" * 40)
    token = test_login()
    if not token:
        print_error("\nLogin failed! Cannot proceed with authenticated tests.")
        print_info("Check:")
        print_info("  1. Database is initialized")
        print_info("  2. User '7thbrain' exists")
        print_info("  3. Password is correct")
        return False
    
    # Test 3: Authenticated Endpoints
    print("\n[TEST 3] Authenticated API Endpoints")
    print("-" * 40)
    
    endpoints_to_test = [
        ('/user/profile', 'GET'),
        ('/analytics/dashboard?period=7d', 'GET'),
        ('/admin/dashboard/stats', 'GET'),
        ('/admin/users', 'GET'),
        ('/links', 'GET'),
        ('/campaigns', 'GET'),
    ]
    
    results = []
    for endpoint, method in endpoints_to_test:
        result = test_authenticated_endpoint(token, endpoint, method)
        results.append((endpoint, result))
    
    # Summary
    print("\n" + "="*60)
    print(f"{Colors.BLUE}TEST SUMMARY{Colors.END}")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\nEndpoint Tests: {passed}/{total} passed")
    
    if passed == total:
        print_success("\n✓ All tests passed! Backend is working correctly.")
        return True
    elif passed > 0:
        print_warning(f"\n⚠ Some tests failed ({total - passed} failures)")
        print_info("Failed endpoints:")
        for endpoint, result in results:
            if not result:
                print(f"  - {endpoint}")
        return False
    else:
        print_error("\n✗ All endpoint tests failed!")
        print_info("This suggests an authentication or token issue.")
        return False

if __name__ == "__main__":
    success = run_comprehensive_tests()
    sys.exit(0 if success else 1)
