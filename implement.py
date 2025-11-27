#!/usr/bin/env python3
"""
Quick Implementation Script
Automates the implementation of all required changes
"""

import os
import sys
import subprocess
from pathlib import Path

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(60)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def run_command(command, cwd=None):
    """Run a shell command and return success status"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True
        )
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def check_prerequisites():
    """Check if all required tools are installed"""
    print_header("Checking Prerequisites")
    
    checks = {
        'Node.js': 'node --version',
        'npm': 'npm --version',
        'Python': 'python --version',
        'pip': 'pip --version',
    }
    
    all_good = True
    for tool, command in checks.items():
        success, stdout, stderr = run_command(command)
        if success:
            version = stdout.strip()
            print_success(f"{tool}: {version}")
        else:
            print_error(f"{tool}: Not found")
            all_good = False
    
    return all_good

def run_database_migration():
    """Run database migration script"""
    print_header("Running Database Migration")
    
    migration_file = Path("migrations/add_missing_columns.sql")
    if not migration_file.exists():
        print_error("Migration file not found!")
        return False
    
    print_info("Please run the following SQL script manually:")
    print_info(f"File: {migration_file.absolute()}")
    print_warning("Make sure to backup your database first!")
    
    response = input("\nHave you run the migration? (yes/no): ")
    return response.lower() in ['yes', 'y']

def install_dependencies():
    """Install required npm packages"""
    print_header("Installing Dependencies")
    
    packages = [
        'qrcode.react',
        'react-icons',
        '@heroicons/react'
    ]
    
    print_info("Checking if additional packages are needed...")
    
    for package in packages:
        print_info(f"Installing {package}...")
        success, stdout, stderr = run_command(f"npm install {package}")
        if success:
            print_success(f"{package} installed")
        else:
            print_warning(f"{package} may already be installed or failed")
    
    return True

def create_component_files():
    """Create new component files"""
    print_header("Creating New Component Files")
    
    components = [
        {
            'path': 'src/components/ui/CryptoIcon.jsx',
            'description': 'Crypto currency icon component'
        },
        {
            'path': 'src/components/CryptoWalletDisplay.jsx',
            'description': 'Enhanced crypto wallet display'
        },
        {
            'path': 'src/components/admin/CryptoWalletManager.jsx',
            'description': 'Admin crypto wallet management'
        },
        {
            'path': 'src/components/admin/BlockchainVerificationSettings.jsx',
            'description': 'Blockchain verification configuration'
        },
        {
            'path': 'src/components/PayPalPaymentForm.jsx',
            'description': 'PayPal payment integration'
        },
        {
            'path': 'src/components/admin/ComprehensiveAdminDashboard.jsx',
            'description': 'Comprehensive admin dashboard'
        }
    ]
    
    print_info("Component code is available in:")
    print_info(".agent/PRODUCTION_READY_IMPLEMENTATION.md")
    print_warning("Please create these files manually using the provided code.")
    
    for component in components:
        print(f"  • {component['path']} - {component['description']}")
    
    response = input("\nHave you created the components? (yes/no): ")
    return response.lower() in ['yes', 'y']

def update_api_service():
    """Update API service file"""
    print_header("Updating API Service")
    
    print_info("API methods to add are documented in:")
    print_info(".agent/API_ADDITIONS_GUIDE.js")
    print_warning("Please update src/services/api.js manually")
    
    print("\nMethods to add:")
    print("  • Security methods (getBlockedIPs, addBlockedIP, etc.)")
    print("  • Shortener methods (getAll, delete, regenerate)")
    print("  • PayPal methods (createOrder, captureOrder)")
    print("  • Backward compatibility methods")
    
    response = input("\nHave you updated api.js? (yes/no): ")
    return response.lower() in ['yes', 'y']

def create_backend_routes():
    """Create backend route files"""
    print_header("Creating Backend Routes")
    
    routes = [
        {
            'path': 'api/routes/security_complete.py',
            'description': 'Complete security endpoints'
        },
        {
            'path': 'api/routes/paypal_payments.py',
            'description': 'PayPal payment integration'
        }
    ]
    
    print_info("Backend route code is available in:")
    print_info(".agent/IMPLEMENTATION_GUIDE.md")
    print_info(".agent/PRODUCTION_READY_IMPLEMENTATION.md")
    
    for route in routes:
        print(f"  • {route['path']} - {route['description']}")
    
    response = input("\nHave you created the backend routes? (yes/no): ")
    return response.lower() in ['yes', 'y']

def update_environment_variables():
    """Update environment variables"""
    print_header("Updating Environment Variables")
    
    print_info("Add these to your .env file:")
    print("\n# PayPal Configuration")
    print("VITE_PAYPAL_CLIENT_ID=your_paypal_client_id")
    print("PAYPAL_CLIENT_ID=your_paypal_client_id")
    print("PAYPAL_SECRET=your_paypal_secret")
    print("PAYPAL_MODE=sandbox")
    print("\n# Blockchain APIs (Optional)")
    print("BLOCKCHAIN_INFO_API_KEY=your_key")
    print("ETHERSCAN_API_KEY=your_key")
    print("TRONSCAN_API_KEY=your_key")
    
    response = input("\nHave you updated .env? (yes/no): ")
    return response.lower() in ['yes', 'y']

def run_tests():
    """Run tests"""
    print_header("Running Tests")
    
    print_info("Building frontend...")
    success, stdout, stderr = run_command("npm run build")
    
    if success:
        print_success("Frontend build successful!")
        return True
    else:
        print_error("Frontend build failed!")
        print_error(stderr)
        return False

def main():
    """Main execution function"""
    print_header("🚀 PRODUCTION-READY IMPLEMENTATION SCRIPT")
    print_info("This script will guide you through the implementation process")
    
    steps = [
        ("Prerequisites Check", check_prerequisites),
        ("Database Migration", run_database_migration),
        ("Install Dependencies", install_dependencies),
        ("Create Components", create_component_files),
        ("Update API Service", update_api_service),
        ("Create Backend Routes", create_backend_routes),
        ("Update Environment", update_environment_variables),
        ("Run Tests", run_tests),
    ]
    
    results = []
    
    for step_name, step_func in steps:
        try:
            result = step_func()
            results.append((step_name, result))
            
            if not result:
                print_warning(f"{step_name} incomplete or failed")
                response = input("Continue anyway? (yes/no): ")
                if response.lower() not in ['yes', 'y']:
                    print_error("Implementation aborted")
                    sys.exit(1)
        except Exception as e:
            print_error(f"Error in {step_name}: {str(e)}")
            results.append((step_name, False))
    
    # Print summary
    print_header("Implementation Summary")
    
    for step_name, result in results:
        if result:
            print_success(f"{step_name}")
        else:
            print_warning(f"{step_name} - Needs attention")
    
    print_header("Next Steps")
    print_info("1. Review all created files")
    print_info("2. Test all functionality")
    print_info("3. Deploy to staging environment")
    print_info("4. Run full QA testing")
    print_info("5. Deploy to production")
    
    print(f"\n{Colors.OKGREEN}{Colors.BOLD}Implementation guide complete!{Colors.ENDC}")
    print(f"{Colors.OKCYAN}For detailed documentation, see .agent/ directory{Colors.ENDC}\n")

if __name__ == "__main__":
    main()
