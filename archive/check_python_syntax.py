#!/usr/bin/env python3
"""
Comprehensive Python Syntax Checker
Analyzes all Python files for syntax errors, import issues, and code quality
"""

import os
import sys
import ast
import re
from pathlib import Path
from collections import defaultdict

class PythonAnalyzer:
    def __init__(self, root_dir):
        self.root_dir = Path(root_dir)
        self.errors = defaultdict(list)
        self.warnings = defaultdict(list)
        self.files_checked = 0
        self.files_with_errors = 0
        
    def check_file(self, filepath):
        """Check a single Python file for syntax and import issues"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for syntax errors
            try:
                ast.parse(content, filename=str(filepath))
            except SyntaxError as e:
                self.errors[str(filepath)].append(f"Syntax Error: Line {e.lineno}: {e.msg}")
                return False
            
            # Check for circular import patterns
            if 'from src.models.' in content and 'import db' in content:
                # Check if importing db from model files
                if re.search(r'from src\.models\.\w+ import.*\bdb\b', content):
                    self.warnings[str(filepath)].append(
                        "Potential circular dependency: importing 'db' from model file instead of src.database"
                    )
            
            # Check for indentation consistency
            lines = content.split('\n')
            tab_count = sum(1 for line in lines if line.startswith('\t'))
            space_count = sum(1 for line in lines if line.startswith('    '))
            
            if tab_count > 0 and space_count > 0:
                self.warnings[str(filepath)].append(
                    f"Mixed indentation: {tab_count} tabs, {space_count} space-indented lines"
                )
            
            # Check for missing __init__.py in package directories
            if filepath.name != '__init__.py':
                parent_dir = filepath.parent
                if parent_dir.name not in ['__pycache__', '.git']:
                    init_file = parent_dir / '__init__.py'
                    if not init_file.exists() and (parent_dir / '__init__.py').exists() == False:
                        # Check if directory has other .py files
                        py_files = list(parent_dir.glob('*.py'))
                        if len(py_files) > 1:
                            self.warnings[str(parent_dir)].append(
                                f"Missing __init__.py in package directory with {len(py_files)} Python files"
                            )
            
            return True
            
        except Exception as e:
            self.errors[str(filepath)].append(f"Error reading file: {str(e)}")
            return False
    
    def analyze_all(self):
        """Analyze all Python files in the project"""
        print(f"Analyzing Python files in: {self.root_dir}\n")
        
        # Find all Python files
        py_files = list(self.root_dir.rglob('*.py'))
        # Exclude venv, node_modules, __pycache__
        py_files = [f for f in py_files if not any(
            exclude in str(f) for exclude in ['venv', 'node_modules', '__pycache__', '.git', 'dist']
        )]
        
        print(f"Found {len(py_files)} Python files to check\n")
        
        for filepath in sorted(py_files):
            self.files_checked += 1
            result = self.check_file(filepath)
            if not result:
                self.files_with_errors += 1
        
        self.print_report()
    
    def print_report(self):
        """Print analysis report"""
        print("=" * 80)
        print("PYTHON SYNTAX ANALYSIS REPORT")
        print("=" * 80)
        print(f"\nFiles Checked: {self.files_checked}")
        print(f"Files with Errors: {self.files_with_errors}")
        print(f"Files with Warnings: {len(self.warnings)}")
        
        if self.errors:
            print("\n" + "=" * 80)
            print("ERRORS (MUST FIX)")
            print("=" * 80)
            for filepath, error_list in sorted(self.errors.items()):
                rel_path = Path(filepath).relative_to(self.root_dir)
                print(f"\n❌ {rel_path}")
                for error in error_list:
                    print(f"   {error}")
        
        if self.warnings:
            print("\n" + "=" * 80)
            print("WARNINGS (SHOULD FIX)")
            print("=" * 80)
            for filepath, warning_list in sorted(self.warnings.items()):
                try:
                    rel_path = Path(filepath).relative_to(self.root_dir)
                except ValueError:
                    rel_path = filepath
                print(f"\n⚠️  {rel_path}")
                for warning in warning_list:
                    print(f"   {warning}")
        
        if not self.errors and not self.warnings:
            print("\n✅ All Python files passed syntax checks!")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    root = Path(__file__).parent
    analyzer = PythonAnalyzer(root)
    analyzer.analyze_all()
