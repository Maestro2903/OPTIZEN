#!/usr/bin/env node

/**
 * Create Test Users with Different Roles for RBAC Testing
 * 
 * This script:
 * 1. Creates users in Supabase Auth
 * 2. Creates corresponding entries in public.users table
 * 3. Verifies role permissions are synced
 * 
 * Usage:
 *   node scripts/create-test-users.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test users to create
const testUsers = [
  {
    email: 'superadmin@eyecare.local',
    password: 'Test@123456',
    fullName: 'Super Admin',
    role: 'super_admin',
    phone: '+1234567890'
  },
  {
    email: 'admin@eyecare.local',
    password: 'Test@123456',
    fullName: 'Hospital Admin',
    role: 'admin',
    phone: '+1234567891'
  },
  {
    email: 'doctor@eyecare.local',
    password: 'Test@123456',
    fullName: 'Dr. John Smith',
    role: 'doctor',
    phone: '+1234567892'
  },
  {
    email: 'nurse@eyecare.local',
    password: 'Test@123456',
    fullName: 'Jane Doe RN',
    role: 'nurse',
    phone: '+1234567893'
  },
  {
    email: 'receptionist@eyecare.local',
    password: 'Test@123456',
    fullName: 'Sarah Johnson',
    role: 'receptionist',
    phone: '+1234567894'
  },
  {
    email: 'finance@eyecare.local',
    password: 'Test@123456',
    fullName: 'Michael Chen',
    role: 'finance',
    phone: '+1234567895'
  },
  {
    email: 'pharmacy@eyecare.local',
    password: 'Test@123456',
    fullName: 'Emily Williams',
    role: 'pharmacy_staff',
    phone: '+1234567896'
  },
  {
    email: 'lab@eyecare.local',
    password: 'Test@123456',
    fullName: 'David Brown',
    role: 'lab_technician',
    phone: '+1234567897'
  }
];

async function createTestUser(userData) {
  console.log(`\n📝 Creating user: ${userData.email}`);
  
  try {
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: userData.fullName
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`⚠️  User already exists in auth: ${userData.email}`);
        
        // Get existing user by querying public.users table instead of listing all auth users
        const { data: existingPublicUser, error: publicUserError } = await supabase
          .from('users')
          .select('id')
          .eq('email', userData.email)
          .single();
        
        if (publicUserError || !existingPublicUser) {
          console.error(`❌ Could not find existing user: ${userData.email}`);
          return null;
        }
        
        // Initialize authData properly if it's undefined
        if (!authData) {
          authData = { user: { id: existingPublicUser.id, email: userData.email } };
        } else {
          authData.user = { id: existingPublicUser.id, email: userData.email };
        }
      } else {
        throw authError;
      }
    } else {
      console.log(`✅ Auth user created: ${authData.user.id}`);
    }

    const userId = authData.user.id;

    // Step 2: Create/Update entry in public.users table
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: userData.email,
        full_name: userData.fullName,
        role: userData.role,
        phone: userData.phone,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (publicError) {
      throw publicError;
    }

    console.log(`✅ Public user record created/updated`);

    // Step 3: Verify user_roles was synced by trigger
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles:role_id (
          name,
          description
        )
      `)
      .eq('user_id', userId);

    if (rolesError) {
      console.warn(`⚠️  Could not verify user roles: ${rolesError.message}`);
    } else if (userRoles && userRoles.length > 0) {
      console.log(`✅ Role synced: ${userRoles[0].roles.name}`);
      
      // Get permission count - read count from response root, not data
      const { count: permCount, error: permCountError } = await supabase
        .from('role_permissions')
        .select('id', { count: 'exact', head: true })
        .eq('role_id', userRoles[0].role_id);
      
      if (permCountError) {
        console.warn(`⚠️  Could not fetch permission count: ${permCountError.message}`);
      }
      console.log(`✅ Permissions assigned: ${permCount || 0}`);
    } else {
      console.warn(`⚠️  No role assignment found - trigger may not have fired`);
    }

    return {
      userId,
      email: userData.email,
      role: userData.role,
      success: true
    };

  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error.message);
    return {
      email: userData.email,
      role: userData.role,
      success: false,
      error: error.message
    };
  }
}

async function verifyPermissions() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION REPORT');
  console.log('='.repeat(60));

  const { data: usersWithRoles, error } = await supabase
    .from('users')
    .select(`
      email,
      full_name,
      role,
      is_active,
      user_roles!inner (
        is_active,
        roles (
          name,
          description
        )
      )
    `)
    .like('email', '%@eyecare.local')
    .order('email');

  if (error) {
    console.error('❌ Error fetching verification data:', error);
    return;
  }

  console.log('\nCreated Users:');
  console.log('-'.repeat(60));
  
  for (const user of usersWithRoles) {
    const roleName = user.user_roles[0]?.roles?.name || 'No role';
    
    // Get permission count for this user's role
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', roleName)
      .single();
    
    let permCount = 0;
    if (roleData) {
      const { count, error: countError } = await supabase
        .from('role_permissions')
        .select('id', { count: 'exact', head: true })
        .eq('role_id', roleData.id);
      
      if (countError) {
        console.warn(`⚠️  Could not fetch permission count for ${roleName}: ${countError.message}`);
      }
      permCount = count || 0;
    }
    
    console.log(`📧 ${user.email}`);
    console.log(`   Name: ${user.full_name}`);
    console.log(`   Role: ${user.role} → ${roleName}`);
    console.log(`   Status: ${user.is_active ? '✅ Active' : '❌ Inactive'}`);
    console.log(`   Permissions: ${permCount}`);
    console.log('');
  }
}

async function main() {
  console.log('🚀 Starting Test Users Creation');
  console.log('='.repeat(60));
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`📝 Creating ${testUsers.length} test users...\n`);

  const results = [];

  for (const user of testUsers) {
    const result = await createTestUser(user);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r?.success);
  const failed = results.filter(r => r && !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${testUsers.length}`);
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}`);
    console.log('\nFailed users:');
    failed.forEach(f => console.log(`  - ${f.email}: ${f.error}`));
  }

  // Verify all permissions are set up correctly
  await verifyPermissions();

  console.log('\n' + '='.repeat(60));
  console.log('🎉 TEST USERS READY!');
  console.log('='.repeat(60));
  console.log('\n📝 Login Credentials:');
  console.log('   Email: [user]@eyecare.local');
  console.log('   Password: Test@123456');
  console.log('\n🔗 Test Login: http://localhost:3000/auth/login');
  console.log('');
}

// Run the script
main()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

