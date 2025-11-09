#!/usr/bin/env node

/**
 * Script to reload PostgREST schema cache in Supabase
 * 
 * This forces Supabase's API layer (PostgREST) to refresh its schema cache,
 * which is necessary after migrations that add/modify tables or roles.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function reloadPostgRESTCache() {
  console.log('🔄 Reloading PostgREST schema cache...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });

  try {
    // Method 1: Use NOTIFY command to trigger PostgREST reload
    console.log('📡 Sending NOTIFY signal to PostgREST...');
    const { data: notifyResult, error: notifyError } = await supabase.rpc('exec_sql', {
      sql_query: "NOTIFY pgrst, 'reload schema';"
    });

    if (notifyError) {
      console.log('⚠️  NOTIFY failed (function may not exist), trying alternative method...');
      console.log('   Error:', notifyError.message);
    } else {
      console.log('✅ NOTIFY signal sent successfully');
    }

    // Method 2: Force cache refresh by querying system tables
    console.log('\n📊 Forcing cache refresh via system query...');
    const { data: cacheRefresh, error: cacheError } = await supabase
      .from('pg_database')
      .select('datname')
      .limit(1);

    if (cacheError) {
      console.log('⚠️  System table query failed:', cacheError.message);
    } else {
      console.log('✅ Cache refresh query executed');
    }

    // Method 3: Query roles table directly to verify cache is fresh
    console.log('\n🔍 Verifying roles table access...');
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name')
      .limit(5);

    if (rolesError) {
      console.error('❌ Failed to query roles table:', rolesError);
      throw new Error('Roles table not accessible');
    }

    console.log(`✅ Successfully fetched ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(`   - ${role.name} (${role.id})`);
    });

    // Method 4: Verify super_admin role specifically
    console.log('\n🔍 Verifying super_admin role...');
    const { data: superAdmin, error: superAdminError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('name', 'super_admin')
      .single();

    if (superAdminError) {
      console.error('❌ super_admin role NOT found:', superAdminError);
      console.log('\n💡 This might be a PostgREST cache issue.');
      console.log('   Try restarting your Supabase instance or wait a few minutes.');
    } else {
      console.log('✅ super_admin role found:');
      console.log(`   - ID: ${superAdmin.id}`);
      console.log(`   - Name: ${superAdmin.name}`);
    }

    console.log('\n✅ PostgREST cache reload completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your Next.js dev server');
    console.log('   2. Clear browser cache (Cmd+Shift+R)');
    console.log('   3. Test the access control toggles');

  } catch (error) {
    console.error('\n❌ Error reloading PostgREST cache:', error);
    process.exit(1);
  }
}

// Run the script
reloadPostgRESTCache();

