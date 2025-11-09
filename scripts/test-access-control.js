#!/usr/bin/env node

/**
 * Test Access Control and Login Functionality
 * 
 * This script tests:
 * 1. User authentication
 * 2. Permission checking
 * 3. API route access control
 * 4. Role-based access
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const testUsers = [
  { email: 'superadmin@eyecare.local', password: 'Test@123456', expectedRole: 'super_admin' },
  { email: 'doctor@eyecare.local', password: 'Test@123456', expectedRole: 'doctor' },
  { email: 'receptionist@eyecare.local', password: 'Test@123456', expectedRole: 'receptionist' },
  { email: 'pharmacy@eyecare.local', password: 'Test@123456', expectedRole: 'pharmacy_staff' }
];

async function testUserLogin(userData) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Testing: ${userData.email}`);
  console.log('='.repeat(60));

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Test login
    console.log('🔐 Attempting login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: userData.password
    });

    if (authError) {
      console.error(`❌ Login failed: ${authError.message}`);
      return false;
    }

    console.log(`✅ Login successful!`);
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);

    // Fetch user data from public.users
    console.log('\n📋 Fetching user profile...');
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.error(`❌ Failed to fetch user data: ${userError.message}`);
      return false;
    }

    console.log(`✅ Profile loaded:`);
    console.log(`   Name: ${userProfile.full_name}`);
    console.log(`   Role: ${userProfile.role}`);
    console.log(`   Status: ${userProfile.is_active ? 'Active' : 'Inactive'}`);

    // Fetch permissions
    console.log('\n🔑 Fetching permissions...');
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles:role_id (
          id,
          name,
          role_permissions (
            permissions:permission_id (
              action,
              resource
            )
          )
        )
      `)
      .eq('user_id', authData.user.id)
      .eq('is_active', true);

    if (rolesError) {
      console.error(`❌ Failed to fetch permissions: ${rolesError.message}`);
      return false;
    }

    if (userRoles && userRoles.length > 0) {
      const role = userRoles[0].roles;
      const permissions = role.role_permissions.map(rp => rp.permissions);
      
      console.log(`✅ Permissions loaded: ${permissions.length} total`);
      
      // Group permissions by resource
      const permsByResource = {};
      permissions.forEach(p => {
        if (!permsByResource[p.resource]) {
          permsByResource[p.resource] = [];
        }
        permsByResource[p.resource].push(p.action);
      });

      console.log('\n📊 Permissions by resource:');
      Object.keys(permsByResource).sort().forEach(resource => {
        const actions = permsByResource[resource].sort();
        console.log(`   ${resource}: ${actions.join(', ')}`);
      });

      // Test specific permissions
      console.log('\n🎯 Testing specific permissions:');
      
      const testPermissions = [
        { resource: 'patients', action: 'read' },
        { resource: 'patients', action: 'create' },
        { resource: 'patients', action: 'delete' },
        { resource: 'revenue', action: 'read' },
        { resource: 'pharmacy', action: 'read' },
      ];

      testPermissions.forEach(test => {
        const hasPermission = permissions.some(
          p => p.resource === test.resource && p.action === test.action
        );
        const icon = hasPermission ? '✅' : '❌';
        console.log(`   ${icon} ${test.action} on ${test.resource}`);
      });
    }

    // Test API access
    console.log('\n🌐 Testing API access...');
    
    // Test patients endpoint
    const { data: patientsData, error: patientsError } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .limit(1);

    if (patientsError) {
      console.log(`   ❌ Patients API: ${patientsError.message}`);
    } else {
      console.log(`   ✅ Patients API: Access granted (${patientsData.length} records)`);
    }

    // Test revenue endpoint (should fail for non-finance roles)
    const { data: revenueData, error: revenueError } = await supabase
      .from('revenue')
      .select('id')
      .limit(1);

    if (revenueError) {
      console.log(`   ⚠️  Revenue API: Access restricted (expected for non-finance roles)`);
    } else {
      console.log(`   ✅ Revenue API: Access granted (${revenueData.length} records)`);
    }

    // Sign out
    console.log('\n🚪 Signing out...');
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');

    return true;

  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 ACCESS CONTROL TESTING');
  console.log('='.repeat(60));
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`👥 Testing ${testUsers.length} users...\n`);

  const results = [];

  for (const user of testUsers) {
    const success = await testUserLogin(user);
    results.push({ email: user.email, success });
    
    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Passed: ${passed}/${testUsers.length}`);
  console.log(`❌ Failed: ${failed}/${testUsers.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.email}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 TESTING COMPLETE!');
  console.log('='.repeat(60));
  console.log('\n💡 Next Steps:');
  console.log('1. Test login via browser: http://localhost:3000/auth/login');
  console.log('2. Verify role-based navigation in sidebar');
  console.log('3. Test Access Control page (super admin only)');
  console.log('4. Test API routes with different roles');
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

