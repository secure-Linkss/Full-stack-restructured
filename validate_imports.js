// Simple script to validate imports in new components
const fs = require('fs');
const path = require('path');

const files = [
  'src/components/admin/PendingUsersTable.jsx',
  'src/components/admin/CreateUserModal.jsx',
  'src/components/admin/DomainManagementTab.jsx',
  'src/components/admin/AdminUsers.jsx',
  'src/components/admin/AdminSettings.jsx',
  'src/components/Settings.jsx'
];

console.log('Validating React component imports...\n');

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for common import issues
    const imports = content.match(/import .* from ['"].*['"]/g) || [];
    console.log(`✓ ${file}`);
    console.log(`  Found ${imports.length} imports`);
    
    // Check for missing semicolons in imports
    const missingSemicolon = imports.filter(imp => !imp.endsWith(';'));
    if (missingSemicolon.length > 0) {
      console.log(`  ⚠ ${missingSemicolon.length} imports missing semicolons`);
    }
    
  } catch (error) {
    console.log(`✗ ${file}: ${error.message}`);
  }
  console.log('');
});

console.log('Validation complete!');
