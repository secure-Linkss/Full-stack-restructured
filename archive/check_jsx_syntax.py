#!/usr/bin/env python3
"""
JSX/JS Syntax Checker
Checks for common syntax issues in JSX files
"""

import os
import re
from pathlib import Path
from collections import defaultdict

class JSXAnalyzer:
    def __init__(self, root_dir):
        self.root_dir = Path(root_dir)
        self.errors = defaultdict(list)
        self.warnings = defaultdict(list)
        self.files_checked = 0
        
    def check_file(self, filepath):
        """Check a single JSX/JS file for common issues"""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            lines = content.split('\n')
            
            # Check for unclosed brackets/braces
            open_braces = content.count('{')
            close_braces = content.count('}')
            if open_braces != close_braces:
                self.warnings[str(filepath)].append(
                    f"Mismatched braces: {open_braces} opening, {close_braces} closing"
                )
            
            # Check for missing semicolons in imports (common issue)
            for i, line in enumerate(lines, 1):
                line = line.strip()
                
                # Check for incomplete imports
                if line.startswith('import ') and not line.endswith(';') and not line.endswith('*/'):
                    if i < len(lines) and not lines[i].strip().startswith('from'):
                        self.warnings[str(filepath)].append(
                            f"Line {i}: Possible incomplete import statement"
                        )
                
                # Check for console statements (not errors, but should be removed in production)
                if 'console.log' in line or 'console.error' in line:
                    pass  # Not reporting these as they're common in development
            
            # Check for unclosed JSX tags (simplified check)
            jsx_pattern = r'<([A-Z][a-zA-Z0-9]*)[^>]*>'
            closing_pattern = r'</([A-Z][a-zA-Z0-9]*)>'
            
            opening_tags = re.findall(jsx_pattern, content)
            closing_tags = re.findall(closing_pattern, content)
            
            # Count self-closing tags
            self_closing = len(re.findall(r'<[A-Z][a-zA-Z0-9]*[^>]*/>', content))
            
            # This is a rough check - actual JSX parsing would be better
            expected_closing = len(opening_tags) - self_closing
            if len(closing_tags) != expected_closing and expected_closing > 0:
                diff = abs(len(closing_tags) - expected_closing)
                if diff > 5:  # Only report significant differences
                    self.warnings[str(filepath)].append(
                        f"Possible unclosed JSX tags: {expected_closing} expected, {len(closing_tags)} found"
                    )
            
            return True
            
        except Exception as e:
            self.errors[str(filepath)].append(f"Error reading file: {str(e)}")
            return False
    
    def analyze_all(self):
        """Analyze all JSX/JS files in src directory"""
        print(f"Analyzing JSX/JS files in: {self.root_dir}/src\n")
        
        # Find JSX and JS files in src (exclude node_modules, dist)
        src_dir = self.root_dir / 'src'
        if not src_dir.exists():
            print("src directory not found!")
            return
        
        jsx_files = list(src_dir.rglob('*.jsx')) + list(src_dir.rglob('*.js'))
        # Exclude certain patterns
        jsx_files = [f for f in jsx_files if not any(
            exclude in str(f) for exclude in ['node_modules', '__pycache__', '.pyc', 'dist']
        )]
        
        print(f"Found {len(jsx_files)} JSX/JS files to check\n")
        
        for filepath in sorted(jsx_files):
            self.files_checked += 1
            self.check_file(filepath)
        
        self.print_report()
    
    def print_report(self):
        """Print analysis report"""
        print("=" * 80)
        print("JSX/JS SYNTAX ANALYSIS REPORT")
        print("=" * 80)
        print(f"\nFiles Checked: {self.files_checked}")
        print(f"Files with Errors: {len(self.errors)}")
        print(f"Files with Warnings: {len(self.warnings)}")
        
        if self.errors:
            print("\n" + "=" * 80)
            print("ERRORS (MUST FIX)")
            print("=" * 80)
            for filepath, error_list in sorted(self.errors.items()):
                try:
                    rel_path = Path(filepath).relative_to(self.root_dir)
                except:
                    rel_path = filepath
                print(f"\n❌ {rel_path}")
                for error in error_list:
                    print(f"   {error}")
        
        if self.warnings:
            print("\n" + "=" * 80)
            print("WARNINGS (SHOULD REVIEW)")
            print("=" * 80)
            count = 0
            for filepath, warning_list in sorted(self.warnings.items()):
                if count >= 20:  # Limit output
                    remaining = len(self.warnings) - count
                    print(f"\n... and {remaining} more files with warnings")
                    break
                try:
                    rel_path = Path(filepath).relative_to(self.root_dir)
                except:
                    rel_path = filepath
                print(f"\n⚠️  {rel_path}")
                for warning in warning_list[:3]:  # Limit warnings per file
                    print(f"   {warning}")
                count += 1
        
        if not self.errors and not self.warnings:
            print("\n✅ All JSX/JS files passed basic checks!")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    root = Path(__file__).parent
    analyzer = JSXAnalyzer(root)
    analyzer.analyze_all()
