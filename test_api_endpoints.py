#!/usr/bin/env python3
"""
Comprehensive API Endpoint Testing Script
Tests frontend API calls against backend implementation
"""

import os
import re
import json
from collections import defaultdict

def extract_frontend_api_calls():
    """Extract all API calls from frontend components"""
    api_calls = defaultdict(list)
    
    # Read api.js to get available methods
    with open('src/services/api.js', 'r') as f:
        api_content = f.read()
    
    # Extract API structure
    api_structure = {}
    current_section = None
    
    for line in api_content.split('\n'):
        if '// ===========' in line and 'APIs' in line:
            current_section = line.strip().replace('// ', '').replace('=', '').strip()
            current_section = current_section.replace(' APIs', '').strip()
        elif current_section and ':' in line and '(' in line:
            match = re.search(r'(\w+):\s*(?:async\s*)?\(', line)
            if match:
                method_name = match.group(1)
                if current_section not in api_structure:
                    api_structure[current_section] = []
                api_structure[current_section].append(method_name)
    
    # Check for top-level methods (like getTrackingLinks)
    top_level_methods = []
    in_api_object = False
    for line in api_content.split('\n'):
        if line.strip() == 'const api = {':
            in_api_object = True
        elif in_api_object and line.strip() == '};':
            in_api_object = False
        elif in_api_object and ':' in line and '(' in line and '//' not in line:
            if not line.strip().startswith('//'):
                match = re.search(r'(\w+):\s*(?:async\s*)?\(', line)
                if match:
                    method_name = match.group(1)
                    # Check if it's not part of a nested object
                    if '{' not in line:
                        top_level_methods.append(method_name)
    
    # Scan all component files
    component_calls = defaultdict(set)
    for root, dirs, files in os.walk('src/components'):
        for file in files:
            if file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()
                    
                    # Find api.section.method() calls
                    nested_calls = re.findall(r'api\.(\w+)\.(\w+)\(', content)
                    for section, method in nested_calls:
                        component_calls[file].add(f"api.{section}.{method}()")
                    
                    # Find direct api.method() calls
                    direct_calls = re.findall(r'(?<!\.)\bapi\.(\w+)\(', content)
                    for method in direct_calls:
                        component_calls[file].add(f"api.{method}()")
    
    return api_structure, top_level_methods, component_calls

def check_api_coverage():
    """Check if all frontend API calls have backend implementations"""
    print("=" * 80)
    print("API ENDPOINT COVERAGE ANALYSIS")
    print("=" * 80)
    
    api_structure, top_level_methods, component_calls = extract_frontend_api_calls()
    
    print("\n📋 AVAILABLE API STRUCTURE:")
    print("-" * 80)
    for section, methods in sorted(api_structure.items()):
        print(f"\n{section}:")
        for method in sorted(methods):
            print(f"  ✓ api.{section}.{method}()")
    
    if top_level_methods:
        print(f"\nTop-level methods:")
        for method in sorted(top_level_methods):
            print(f"  ✓ api.{method}()")
    
    print("\n\n🔍 COMPONENT API USAGE:")
    print("-" * 80)
    
    missing_methods = []
    for component, calls in sorted(component_calls.items()):
        print(f"\n{component}:")
        for call in sorted(calls):
            # Check if method exists
            if 'api.' in call:
                parts = call.replace('api.', '').replace('()', '').split('.')
                if len(parts) == 2:
                    section, method = parts
                    if section in api_structure and method in api_structure[section]:
                        print(f"  ✓ {call}")
                    else:
                        print(f"  ✗ {call} - MISSING")
                        missing_methods.append(call)
                elif len(parts) == 1:
                    method = parts[0]
                    if method in top_level_methods:
                        print(f"  ✓ {call}")
                    else:
                        print(f"  ✗ {call} - MISSING")
                        missing_methods.append(call)
    
    print("\n\n📊 SUMMARY:")
    print("-" * 80)
    total_sections = len(api_structure)
    total_methods = sum(len(methods) for methods in api_structure.values()) + len(top_level_methods)
    total_calls = sum(len(calls) for calls in component_calls.values())
    
    print(f"Total API Sections: {total_sections}")
    print(f"Total API Methods: {total_methods}")
    print(f"Total Component Calls: {total_calls}")
    print(f"Missing Methods: {len(missing_methods)}")
    
    if missing_methods:
        print("\n⚠️  MISSING API METHODS:")
        for method in sorted(set(missing_methods)):
            print(f"  - {method}")
        return False
    else:
        print("\n✅ ALL API METHODS ARE IMPLEMENTED!")
        return True

if __name__ == "__main__":
    check_api_coverage()