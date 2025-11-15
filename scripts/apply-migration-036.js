#!/usr/bin/env node

/**
 * Apply Migration 036: Add get_category_counts Function
 * 
 * This script provides the SQL to create the get_category_counts() RPC function
 * and verifies if it already exists.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('🚀 Migration 036: Add get_category_counts Function\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗');
    console.error('\n💡 Make sure your .env.local file is properly configured.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });

  try {
    // First, check if the function already exists
    console.log('🔍 Checking if function already exists...');
    const { data: existingData, error: existingError } = await supabase.rpc('get_category_counts');

    if (!existingError) {
      console.log('✅ Function get_category_counts() already exists and is working!');
      console.log(`   Found ${existingData.length} categories in master_data table\n`);
      
      if (existingData && existingData.length > 0) {
        console.log('📊 Category counts:');
        existingData.forEach(item => {
          console.log(`   - ${item.category}: ${item.count}`);
        });
      }
      
      console.log('\n✅ No migration needed - function is already present!\n');
      process.exit(0);
    }

    // Function doesn't exist, provide SQL to create it
    console.log('⚠️  Function does not exist yet.\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '036_add_get_category_counts_function.sql');
    
    let migrationSQL;
    if (fs.existsSync(migrationPath)) {
      migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    } else {
      // Fallback to inline SQL
      migrationSQL = `-- Create get_category_counts RPC function
CREATE OR REPLACE FUNCTION get_category_counts()
RETURNS TABLE (
  category TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    md.category,
    COUNT(*) as count
  FROM master_data md
  GROUP BY md.category
  ORDER BY md.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON FUNCTION get_category_counts() IS 'Returns count of items per category in master_data table';`;
    }

    console.log('📋 Please run the following SQL in your Supabase SQL Editor:\n');
    console.log(''.padEnd(80, '='));
    console.log(migrationSQL);
    console.log(''.padEnd(80, '='));
    console.log('\n📝 Steps to apply:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Click "SQL Editor" in the left sidebar');
    console.log('   4. Click "+ New query"');
    console.log('   5. Paste the SQL above');
    console.log('   6. Click "Run" or press Cmd/Ctrl+Enter');
    console.log('\n   After running, re-run this script to verify: node scripts/apply-migration-036.js\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error checking migration status:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the script
applyMigration();
