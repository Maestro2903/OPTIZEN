#!/bin/bash
#
# Execute Final Complaints Insertion
# This script adds the remaining 150 complaints to the master_data table
#

echo "=================================="
echo " Final Complaints Insertion"
echo "=================================="
echo ""
echo "This will add 185 unique complaints to the database."
echo "Using ON CONFLICT to prevent duplicates."
echo ""

# Check if the SQL file exists
if [[ ! -f "/tmp/complaints_final.sql" ]]; then
    echo "❌ Error: /tmp/complaints_final.sql not found"
    echo "   Please run the Python script first to generate it."
    exit 1
fi

# Count items
ITEM_COUNT=$(grep -c "('complaints'" /tmp/complaints_final.sql)
echo "📊 Found $ITEM_COUNT complaint items to insert"
echo ""

# Option 1: Use psql if available
if command -v psql &> /dev/null && [[ -n "$DATABASE_URL" ]]; then
    echo "✓ Using psql to execute..."
    psql "$DATABASE_URL" < /tmp/complaints_final.sql
    
    if [[ $? -eq 0 ]]; then
        echo ""
        echo "✅ Successfully executed!"
    else
        echo ""
        echo "⚠️  Execution failed. Try Option 2 below."
    fi
else
    echo "ℹ️  psql not available or DATABASE_URL not set"
    echo ""
    echo "📋 To complete insertion, use ONE of these options:"
    echo ""
    echo "Option 1: Supabase Dashboard"
    echo "  1. Go to: https://supabase.com/dashboard"
    echo "  2. Select your project"
    echo "  3. Navigate to: SQL Editor"
    echo "  4. Copy/paste contents from: /tmp/complaints_final.sql"
    echo "  5. Click 'Run'"
    echo ""
    echo "Option 2: Supabase CLI"
    echo "  supabase db execute < /tmp/complaints_final.sql"
    echo ""
    echo "Option 3: Direct PostgreSQL"
    echo "  psql \$DATABASE_URL < /tmp/complaints_final.sql"
fi

echo ""
echo "=================================="
echo " After Execution"
echo "=================================="
echo ""
echo "Verify with this query:"
echo "  SELECT COUNT(*) FROM master_data WHERE category = 'complaints';"
echo ""
echo "Expected result: ~220 items (35 existing + 185 new)"
echo ""


