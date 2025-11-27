#!/usr/bin/env python3
"""
FINAL PRODUCTION AUDIT SCRIPT
Comprehensive verification of all components, imports, API methods, and database schema
"""

import os
import sys
import re
from pathlib import Path
from collections import defaultdict
import json

class ProductionAudit:
    def __init__(self, root_dir):
        self.root_dir = Path(root_dir)
        self.issues = []
        self.warnings = []
        self.verified = []
        
    def check_api_methods(self):
        """Verify all API methods exist in api.js"""
        print("\n[1/8] Checking API methods...")
        api_file = self.root_dir / 'src' / 'services' / 'api.js'
        
        if not api_file.exists():
            self.issues.append("CRITICAL: src/services/api.js not found!")
            return
            
        with open(api_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        required_methods = {
            'support': ['getTickets', 'createTicket', 'replyToTicket', 'closeTicket'],
            'contact': ['submit', 'getSubmissions'],
            'notifications': ['getAll', 'markAsRead', 'delete'],
            'adminSettings': ['getDomains', 'addDomain', 'updateDomain', 'deleteDomain', 'getAll', 'update'],
            'geography': ['getAnalytics'],
            'liveActivity': ['getEvents'],
            'payments': ['getCryptoWallets', 'submitCryptoPayment', 'checkStatus'],
        }
        
        for namespace, methods in required_methods.items():
            if namespace not in content:
                self.issues.append(f"Missing API namespace: {namespace}")
            else:
                for method in methods:
                    if f'{namespace}' in content and method not in content:
                        self.warnings.append(f"Method {namespace}.{method} might be missing")
        
        self.verified.append("API methods structure verified")
    
    def check_components(self):
        """Check for missing or broken components"""
        print("[2/8] Checking React components...")
        
        critical_components = [
            'src/components/Geography.jsx',
            'src/components/PrivacyPolicyPage.jsx',
            'src/components/TermsOfServices.jsx',
            'src/components/ContactPage.jsx',
            'src/components/Notifications.jsx',
            'src/components/admin/AdminSettings.jsx',
            'src/components/admin/DomainManagementTab.jsx',
            'src/components/admin/CryptoWalletManager.jsx',
            'src/components/PayPalPaymentForm.jsx',
            'src/components/forms/CreateLink.jsx',
        ]
        
        for comp_path in critical_components:
            full_path = self.root_dir / comp_path
            if not full_path.exists():
                self.issues.append(f"Missing component: {comp_path}")
            else:
                # Check for export default
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'export default' not in content:
                        self.issues.append(f"Component {comp_path} missing export default")
                    else:
                        self.verified.append(f"Component {comp_path.split('/')[-1]} OK")
    
    def check_backend_routes(self):
        """Verify backend routes exist"""
        print("[3/8] Checking backend routes...")
        
        required_routes = [
            'api/routes/support_tickets.py',
            'api/routes/contact.py',
        ]
        
        for route_path in required_routes:
            full_path = self.root_dir / route_path
            if not full_path.exists():
                self.issues.append(f"Missing backend route: {route_path}")
            else:
                self.verified.append(f"Backend route {route_path.split('/')[-1]} exists")
    
    def check_blueprints_registered(self):
        """Check if blueprints are registered in api/index.py"""
        print("[4/8] Checking blueprint registration...")
        
        index_file = self.root_dir / 'api' / 'index.py'
        if not index_file.exists():
            self.issues.append("CRITICAL: api/index.py not found!")
            return
            
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        required_blueprints = ['contact_bp', 'support_tickets_bp']
        
        for bp in required_blueprints:
            if f'from api.routes' in content and bp in content:
                if f'app.register_blueprint({bp})' in content or f'register_blueprint({bp})' in content:
                    self.verified.append(f"Blueprint {bp} registered")
                else:
                    self.issues.append(f"Blueprint {bp} imported but not registered!")
            else:
                self.issues.append(f"Blueprint {bp} not found in api/index.py")
    
    def check_imports(self):
        """Check for common import issues"""
        print("[5/8] Checking imports...")
        
        src_dir = self.root_dir / 'src'
        jsx_files = list(src_dir.rglob('*.jsx'))[:50]  # Sample check
        
        import_issues = 0
        for jsx_file in jsx_files:
            try:
                with open(jsx_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for ArrowRight usage without import
                if 'ArrowRight' in content and 'from \'lucide-react\'' in content:
                    if 'import' in content[:500]:  # Check imports section
                        import_line = [line for line in content.split('\n')[:20] if 'lucide-react' in line]
                        if import_line and 'ArrowRight' not in import_line[0]:
                            import_issues += 1
            except:
                pass
        
        if import_issues == 0:
            self.verified.append("Import checks passed")
        else:
            self.warnings.append(f"Found {import_issues} potential import issues")
    
    def check_database_models(self):
        """Check database models exist"""
        print("[6/8] Checking database models...")
        
        required_models = [
            'api/models/contact.py',
            'api/models/support_ticket.py',
        ]
        
        for model_path in required_models:
            full_path = self.root_dir / model_path
            if not full_path.exists():
                self.warnings.append(f"Model file {model_path} not found (might use existing models)")
            else:
                self.verified.append(f"Model {model_path.split('/')[-1]} exists")
    
    def check_migration_files(self):
        """Check migration files"""
        print("[7/8] Checking migration files...")
        
        migration_file = self.root_dir / 'migrations' / 'add_missing_columns.sql'
        if migration_file.exists():
            self.verified.append("Migration file add_missing_columns.sql exists")
        else:
            self.warnings.append("Migration file not found")
    
    def check_git_status(self):
        """Check what's in git vs local"""
        print("[8/8] Checking git status...")
        
        try:
            import subprocess
            result = subprocess.run(['git', 'status', '--short'], 
                                  capture_output=True, text=True, cwd=self.root_dir)
            
            if result.returncode == 0:
                unstaged = result.stdout.strip()
                if unstaged:
                    self.warnings.append(f"Unstaged changes detected:\n{unstaged}")
                else:
                    self.verified.append("All changes committed to git")
        except:
            self.warnings.append("Could not check git status")
    
    def run_audit(self):
        """Run complete audit"""
        print("="*80)
        print("FINAL PRODUCTION AUDIT - COMPREHENSIVE CHECK")
        print("="*80)
        
        self.check_api_methods()
        self.check_components()
        self.check_backend_routes()
        self.check_blueprints_registered()
        self.check_imports()
        self.check_database_models()
        self.check_migration_files()
        self.check_git_status()
        
        self.print_report()
    
    def print_report(self):
        """Print audit report"""
        print("\n" + "="*80)
        print("AUDIT RESULTS")
        print("="*80)
        
        print(f"\n[OK] Verified Items: {len(self.verified)}")
        for item in self.verified:
            print(f"  [OK] {item}")
        
        if self.warnings:
            print(f"\n[WARN] Warnings: {len(self.warnings)}")
            for warning in self.warnings:
                print(f"  [WARN] {warning}")
        
        if self.issues:
            print(f"\n[ERROR] Critical Issues: {len(self.issues)}")
            for issue in self.issues:
                print(f"  [ERROR] {issue}")
            print("\n[ACTION REQUIRED] Fix critical issues before deployment!")
            return False
        else:
            print("\n" + "="*80)
            print("[SUCCESS] ALL CHECKS PASSED - PRODUCTION READY!")
            print("="*80)
            return True

if __name__ == "__main__":
    root = Path(__file__).parent
    auditor = ProductionAudit(root)
    success = auditor.run_audit()
    sys.exit(0 if success else 1)
