#!/usr/bin/env python3
"""
Script to update all frontend components to use real API instead of mock data
"""

import os
import re

# Components to update
components_to_update = [
    'src/components/Analytics.jsx',
    'src/components/Campaigns.jsx',
    'src/components/Geography.jsx',
    'src/components/LinkShortener.jsx',
    'src/components/Notifications.jsx',
    'src/components/Security.jsx',
    'src/components/TrackingLinks.jsx',
]

def update_component(filepath):
    """Update a component file to use real API"""
    print(f"Updating {filepath}...")
    
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Replace mock API import with real API
        content = re.sub(
            r"import\s+{\s*fetchMockData\s*}\s+from\s+['\"]\.\.\/services\/mockApi['\"];?",
            "import api from '../services/api';",
            content
        )
        
        # Replace fetchMockData calls with api calls
        # This is a simple replacement - may need manual adjustment for complex cases
        content = re.sub(
            r"fetchMockData\(['\"](\w+)['\"]",
            r"api.\1(",
            content
        )
        
        # Add try-catch for error handling if not present
        if 'try {' not in content and 'await api.' in content:
            print(f"  Warning: {filepath} may need manual error handling")
        
        with open(filepath, 'w') as f:
            f.write(content)
        
        print(f"  ✓ Updated {filepath}")
        return True
    
    except Exception as e:
        print(f"  ✗ Error updating {filepath}: {e}")
        return False

def main():
    print("=" * 60)
    print("Frontend Component API Update Script")
    print("=" * 60)
    print()
    
    updated = 0
    failed = 0
    
    for component in components_to_update:
        if os.path.exists(component):
            if update_component(component):
                updated += 1
            else:
                failed += 1
        else:
            print(f"  ✗ File not found: {component}")
            failed += 1
    
    print()
    print("=" * 60)
    print(f"Summary: {updated} updated, {failed} failed")
    print("=" * 60)
    print()
    print("Note: Some components may need manual review for complex API calls")

if __name__ == '__main__':
    main()