#!/bin/bash
# Script to apply the machine_configurations table migration

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL client (psql) not found. Please install it first."
    exit 1
fi

# Ask for database credentials
read -p "Enter database name: " DB_NAME
read -p "Enter database user: " DB_USER
read -s -p "Enter password (will not be displayed): " DB_PASS
echo ""

# Run the migration file
echo "Applying migration..."
PGPASSWORD=$DB_PASS psql -U $DB_USER -d $DB_NAME -f add_machine_configurations_table.sql

if [ $? -eq 0 ]; then
    echo "Migration completed successfully."
    echo "Now please restart your API server for changes to take effect."
else
    echo "Error applying migration. Please check the error message above."
fi
