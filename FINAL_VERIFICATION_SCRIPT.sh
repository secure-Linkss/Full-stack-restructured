#!/bin/bash

echo "=== Brain Link Tracker - Final Verification Script ==="
echo ""

# Check for missing imports
echo "1. Checking for missing component imports..."
grep -r "import.*from.*'\.\/.*'" src/components/*.jsx | grep -v "node_modules" | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  import=$(echo "$line" | grep -o "from '[^']*'" | sed "s/from '\.\///g" | sed "s/'//g")
  if [ ! -z "$import" ]; then
    dir=$(dirname "$file")
    if [ ! -f "$dir/$import.jsx" ] && [ ! -f "$dir/$import.js" ]; then
      echo "⚠️  Missing: $import in $file"
    fi
  fi
done

echo ""
echo "2. Checking UI component imports..."
missing_ui=0
for component in src/components/ui/*.jsx; do
  name=$(basename "$component" .jsx)
  if ! grep -q "export.*$name" "$component" 2>/dev/null; then
    echo "⚠️  Component $name may have export issues"
    missing_ui=$((missing_ui + 1))
  fi
done

if [ $missing_ui -eq 0 ]; then
  echo "✅ All UI components have exports"
fi

echo ""
echo "3. Checking for undefined variables in JSX..."
grep -r "className.*undefined" src/components/*.jsx 2>/dev/null | head -5

echo ""
echo "4. Verifying critical files exist..."
critical_files=(
  "src/App.jsx"
  "src/main.jsx"
  "src/index.css"
  "src/lib/utils.js"
  "src/services/api.js"
  "src/components/Layout.jsx"
  "src/components/Header.jsx"
  "src/components/Sidebar.jsx"
  "src/components/Footer.jsx"
  "src/components/Dashboard.jsx"
)

for file in "${critical_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ MISSING: $file"
  fi
done

echo ""
echo "5. Build verification..."
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
  echo "✅ Build output exists"
  echo "   Files in dist:"
  ls -lh dist/ | tail -5
else
  echo "❌ Build output missing"
fi

echo ""
echo "=== Verification Complete ==="
