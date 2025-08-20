#!/bin/bash

# Script to apply the yarn type tracking solution
# Author: GitHub Copilot
# Date: $(date +%Y-%m-%d)

# Set the base directory
BASE_DIR="/home/rakshit/Public/erp-web-app"
SERVER_DIR="$BASE_DIR/server"
FRONTEND_DIR="$BASE_DIR/erp-frontend"

echo "====== Yarn Type Tracking Solution Installation ======"
echo "This script will apply all changes needed to fix the yarn type tracking issue."
echo "Make sure you have a backup of your project before proceeding."
echo ""
echo "Press ENTER to continue or CTRL+C to cancel..."
read

# Step 1: Create backups
echo "Creating backups..."
mkdir -p "$BASE_DIR/backups/$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$BASE_DIR/backups/$(date +%Y%m%d-%H%M%S)"

cp "$SERVER_DIR/models/ASUProductionEntry.js" "$BACKUP_DIR/ASUProductionEntry.js.bak"
cp "$SERVER_DIR/controllers/asuUnit1Controller.js" "$BACKUP_DIR/asuUnit1Controller.js.bak"
cp "$FRONTEND_DIR/src/api/asuUnit1Api.ts" "$BACKUP_DIR/asuUnit1Api.ts.bak"

echo "Backups created in $BACKUP_DIR"

# Step 2: Update the ASUProductionEntry model
echo "Updating ASUProductionEntry model..."
cp "$SERVER_DIR/models/ASUProductionEntry.js.updated" "$SERVER_DIR/models/ASUProductionEntry.js"

# Step 3: Apply controller updates 
echo "Updating asuUnit1Controller.js..."
# We can't simply overwrite the file since we have partial updates
# Instead we'll use temporary files and patch the required functions

# First, extract the createProductionEntry function from the update file
sed -n '/\/\/ Create new production entry/,/};/p' "$SERVER_DIR/controllers/asuUnit1Controller.js.update" > "$SERVER_DIR/controllers/create_function.js"

# Next, extract the updateProductionEntry function from the update2 file
sed -n '/\/\/ Update production entry/,/};/p' "$SERVER_DIR/controllers/asuUnit1Controller.js.update2" > "$SERVER_DIR/controllers/update_function.js"

# Create a temporary controller file
cp "$SERVER_DIR/controllers/asuUnit1Controller.js" "$SERVER_DIR/controllers/asuUnit1Controller.js.new"

# Replace the createProductionEntry function
sed -i '/\/\/ Create new production entry/,/};/ {
  /\/\/ Create new production entry/r '"$SERVER_DIR/controllers/create_function.js"'
  d
}' "$SERVER_DIR/controllers/asuUnit1Controller.js.new"

# Replace the updateProductionEntry function
sed -i '/\/\/ Update production entry/,/};/ {
  /\/\/ Update production entry/r '"$SERVER_DIR/controllers/update_function.js"'
  d
}' "$SERVER_DIR/controllers/asuUnit1Controller.js.new"

# Apply the changes
mv "$SERVER_DIR/controllers/asuUnit1Controller.js.new" "$SERVER_DIR/controllers/asuUnit1Controller.js"

# Clean up temporary files
rm "$SERVER_DIR/controllers/create_function.js" "$SERVER_DIR/controllers/update_function.js"

# Step 4: Run the database migration
echo "Running database migration to add yarn_type column..."
cd "$SERVER_DIR"
node scripts/run_yarn_type_migration.js

# Step 5: Update the frontend API
echo "Updating frontend API functions..."
# Create temporary patched version of the file
cp "$FRONTEND_DIR/src/api/asuUnit1Api.ts" "$FRONTEND_DIR/src/api/asuUnit1Api.ts.new"

# Extract the createProductionEntry function
grep -A500 "createProductionEntry: async" "$FRONTEND_DIR/src/api/asuUnit1Api.ts.update" | sed -n '1,/},/p' > "$FRONTEND_DIR/src/api/create_function.ts"

# Extract the updateProductionEntry function
grep -A200 "updateProductionEntry: async" "$FRONTEND_DIR/src/api/asuUnit1Api.ts.update2" | sed -n '1,/},/p' > "$FRONTEND_DIR/src/api/update_function.ts"

# Extract the getProductionEntries transform code
cat "$FRONTEND_DIR/src/api/asuUnit1Api.ts.getProductionEntries" > "$FRONTEND_DIR/src/api/transform_code.ts"

# Update createProductionEntry
sed -i '/createProductionEntry: async/,/},/ {
  /createProductionEntry: async/r '"$FRONTEND_DIR/src/api/create_function.ts"'
  d
}' "$FRONTEND_DIR/src/api/asuUnit1Api.ts.new"

# Update updateProductionEntry
sed -i '/updateProductionEntry: async/,/},/ {
  /updateProductionEntry: async/r '"$FRONTEND_DIR/src/api/update_function.ts"'
  d
}' "$FRONTEND_DIR/src/api/asuUnit1Api.ts.new"

# Update the getProductionEntries data transformation code
sed -i '/rawEntries\.forEach\(\(entry: any\) => {/,/}\);/ {
  /rawEntries\.forEach\(\(entry: any\) => {/r '"$FRONTEND_DIR/src/api/transform_code.ts"'
  d
}' "$FRONTEND_DIR/src/api/asuUnit1Api.ts.new"

# Apply the changes
mv "$FRONTEND_DIR/src/api/asuUnit1Api.ts.new" "$FRONTEND_DIR/src/api/asuUnit1Api.ts"

# Clean up temporary files
rm "$FRONTEND_DIR/src/api/create_function.ts" "$FRONTEND_DIR/src/api/update_function.ts" "$FRONTEND_DIR/src/api/transform_code.ts"

echo "========================================================"
echo "Yarn Type Tracking Solution has been applied successfully!"
echo ""
echo "Please restart your server for the changes to take effect:"
echo "cd $SERVER_DIR && npm run dev"
echo ""
echo "Next steps:"
echo "1. Read the documentation in YARN_TYPE_TRACKING_SOLUTION.md"
echo "2. Test the solution to ensure it works correctly"
echo "3. If any issues arise, restore from the backups in $BACKUP_DIR"
echo "========================================================"
