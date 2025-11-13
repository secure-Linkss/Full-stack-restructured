#!/usr/bin/env python3
"""
Automated fix for circular import issues
Replaces 'from src.database import db
from src.models.X import ...' with proper imports
"""

import os
import re
from pathlib import Path

def fix_circular_imports(file_path):
    """Fix circular imports in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern 1: from src.database import db
from src.models.user import User
        # Replace with: from src.database import db\nfrom src.models.user import User
        pattern1 = r'from src\.models\.user import db, User'
        replacement1 = 'from src.database import db\nfrom src.models.user import User'
        content = re.sub(pattern1, replacement1, content)
        
        # Pattern 2: from src.database import db
from src.models.user import User
        pattern2 = r'from src\.models\.user import User, db'
        replacement2 = 'from src.database import db\nfrom src.models.user import User'
        content = re.sub(pattern2, replacement2, content)
        
        # Pattern 3: from src.database import db
from src.models.XXX import YYY, ZZZ
        # More complex - need to split
        pattern3 = r'from (src\.models\.\w+) import ([^,]+),\s*db,\s*(.+)'
        def replace_pattern3(match):
            module = match.group(1)
            before = match.group(2)
            after = match.group(3)
            return f'from src.database import db\nfrom {module} import {before}, {after}'
        content = re.sub(pattern3, replace_pattern3, content)
        
        # Pattern 4: from src.database import db
from src.models.XXX import YYY, ZZZ
        pattern4 = r'from (src\.models\.\w+) import db,\s*(.+)'
        def replace_pattern4(match):
            module = match.group(1)
            rest = match.group(2)
            return f'from src.database import db\nfrom {module} import {rest}'
        content = re.sub(pattern4, replace_pattern4, content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, "Fixed"
        return False, "No changes needed"
        
    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    root_dir = Path(__file__).parent
    
    # Find all Python files
    py_files = list(root_dir.rglob('*.py'))
    # Exclude certain directories
    py_files = [f for f in py_files if not any(
        exclude in str(f) for exclude in ['venv', 'node_modules', '__pycache__', '.git', 'dist', 'backups']
    )]
    
    print(f"Scanning {len(py_files)} Python files for circular import issues...\n")
    
    fixed_count = 0
    for py_file in sorted(py_files):
        fixed, message = fix_circular_imports(py_file)
        if fixed:
            rel_path = py_file.relative_to(root_dir)
            print(f"✅ Fixed: {rel_path}")
            fixed_count += 1
    
    print(f"\n{'='*60}")
    print(f"Fixed {fixed_count} files")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
