#!/usr/bin/env node

/**
 * Apply Migration 037: Add Missing RBAC Permissions
 * 
 * This script applies the missing permissions to the database and verifies they exist.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('🚀 Migration 037: Add Missing RBAC Permissions\n');

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
    // Check which permissions are missing
    console.log('🔍 Checking for missing permissions...\n');
    
    const missingPermissions = [
      { resource: 'audit_logs', actions: ['create', 'print', 'update', 'delete'] },
      { resource: 'users', actions: ['print'] },
      { resource: 'roles', actions: ['print'] },
      { resource: 'reports', actions: ['create', 'print', 'update', 'delete'] },
      { resource: 'expenses', actions: ['read', 'create', 'print', 'update', 'delete'] },
      { resource: 'finance', actions: ['read', 'create', 'print', 'update', 'delete'] }
    ];

    let needsMigration = false;
    const toCreate = [];

    for (const perm of missingPermissions) {
      for (const action of perm.actions) {
        const { data, error } = await supabase
          .from('permissions')
          .select('id, action, resource')
          .eq('action', action)
          .eq('resource', perm.resource)
          .maybeSingle();

        if (!data) {
          console.log(`❌ Missing: ${perm.resource} - ${action}`);
          needsMigration = true;
          toCreate.push({ resource: perm.resource, action });
        } else {
          console.log(`✅ Exists: ${perm.resource} - ${action}`);
        }
      }
    }

    if (!needsMigration) {
      console.log('\n✅ All required permissions already exist! No migration needed.\n');
      process.exit(0);
    }

    console.log(`\n⚠️  Found ${toCreate.length} missing permissions that need to be created.\n`);

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '037_add_missing_permissions.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found at:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Applying migration via SQL Editor...\n');
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
    console.log('\n   After running, re-run this script to verify: node scripts/apply-migration-037.js\n');

    console.log('💡 Alternative: You can also apply this via Supabase CLI:');
    console.log('   npx supabase db push\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error checking migration status:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the script
applyMigration();

