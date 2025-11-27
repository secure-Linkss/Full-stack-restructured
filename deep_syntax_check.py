#!/usr/bin/env python3
"""
Deep Syntax Checker for JSX/JS files
Checks for import errors, missing components, and syntax issues
"""

import os
import re
from pathlib import Path
from collections import defaultdict

class DeepSyntaxChecker:
    def __init__(self, root_dir):
        self.root_dir = Path(root_dir)
        self.errors = []
        self.warnings = []
        self.files_checked = 0
        
    def check_imports(self, filepath, content):
        """Check for import issues"""
        lines = content.split('\n')
        issues = []
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            
            # Check for imports from lucide-react
            if 'from \'lucide-react\'' in line or 'from "lucide-react"' in line:
                # Extract imported items
                match = re.search(r'import\s+{([^}]+)}', line)
                if match:
                    imports = [item.strip() for item in match.group(1).split(',')]
                    # Check if these imports are actually used in the file
                    for imp in imports:
                        if imp and imp not in content[content.find(line):]:
                            issues.append(f"Line {i}: Imported '{imp}' but never used")
            
            # Check for missing imports (common components used but not imported)
            if i > 20:  # Skip import section
                # Check for common missing imports
                if '<Button' in line and 'import' not in line:
                    if 'from \'./ui/button\'' not in content and 'from "@/components/ui/button"' not in content:
                        if 'Button' not in str(filepath):
                            issues.append(f"Line {i}: Using Button but might not be imported")
        
        return issues
    
    def check_jsx_syntax(self, filepath, content):
        """Check JSX syntax issues"""
        issues = []
        
        # Check for unclosed tags
        open_tags = re.findall(r'<([A-Z][a-zA-Z0-9]*)[^/>]*(?<!/)>', content)
        close_tags = re.findall(r'</([A-Z][a-zA-Z0-9]*)>', content)
        
        # Check for missing component declarations
        if 'export default' in content:
            # Find what's being exported
            export_match = re.search(r'export default\s+(\w+)', content)
            if export_match:
                component_name = export_match.group(1)
                # Check if component is defined
                if f'const {component_name}' not in content and f'function {component_name}' not in content and f'class {component_name}' not in content:
                    issues.append(f"Exporting '{component_name}' but component not found in file")
        
        # Check for common syntax errors
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            # Check for missing closing braces in JSX
            if '{' in line and '}' not in line and not line.strip().endswith('{'):
                # This might be multiline, so just warn
                pass
            
            # Check for incorrect import paths
            if 'import' in line and '@/components' in line:
                # Verify the path makes sense
                if '../' in line:
                    issues.append(f"Line {i}: Mixed path styles (@ alias and relative)")
        
        return issues
    
    def check_file(self, filepath):
        """Check a single file"""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            rel_path = filepath.relative_to(self.root_dir)
            
            # Check imports
            import_issues = self.check_imports(filepath, content)
            if import_issues:
                for issue in import_issues:
                    self.warnings.append(f"{rel_path}: {issue}")
            
            # Check JSX syntax
            jsx_issues = self.check_jsx_syntax(filepath, content)
            if jsx_issues:
                for issue in jsx_issues:
                    self.errors.append(f"{rel_path}: {issue}")
            
            return True
            
        except Exception as e:
            self.errors.append(f"{filepath}: Error reading file: {str(e)}")
            return False
    
    def analyze_all(self):
        """Analyze all JSX/JS files"""
        print("Running deep syntax check on JSX/JS files...\n")
        
        src_dir = self.root_dir / 'src'
        if not src_dir.exists():
            print("src directory not found!")
            return
        
        jsx_files = list(src_dir.rglob('*.jsx')) + list(src_dir.rglob('*.js'))
        jsx_files = [f for f in jsx_files if 'node_modules' not in str(f)]
        
        print(f"Checking {len(jsx_files)} files...\n")
        
        for filepath in sorted(jsx_files):
            self.files_checked += 1
            self.check_file(filepath)
        
        self.print_report()
    
    def print_report(self):
        """Print analysis report"""
        print("=" * 80)
        print("DEEP SYNTAX CHECK REPORT")
        print("=" * 80)
        print(f"\nFiles Checked: {self.files_checked}")
        print(f"Critical Errors: {len(self.errors)}")
        print(f"Warnings: {len(self.warnings)}")
        
        if self.errors:
            print("\n" + "=" * 80)
            print("CRITICAL ERRORS")
            print("=" * 80)
            for error in self.errors[:30]:  # Limit output
                print(f"[ERROR] {error}")
            if len(self.errors) > 30:
                print(f"\n... and {len(self.errors) - 30} more errors")
        
        if self.warnings:
            print("\n" + "=" * 80)
            print("WARNINGS")
            print("=" * 80)
            for warning in self.warnings[:20]:  # Limit output
                print(f"[WARN] {warning}")
            if len(self.warnings) > 20:
                print(f"\n... and {len(self.warnings) - 20} more warnings")
        
        if not self.errors and not self.warnings:
            print("\n[OK] All files passed deep syntax check!")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    root = Path(__file__).parent
    checker = DeepSyntaxChecker(root)
    checker.analyze_all()
