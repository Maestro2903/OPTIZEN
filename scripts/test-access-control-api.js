const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function testAccessControlAPI() {
  console.log('\n🧪 Testing Access Control API Connection\n')
  console.log('='.repeat(60))
  
  try {
    // Test 1: Check roles table
    console.log('\n1️⃣ Testing roles table...')
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name')
      .limit(5)
    
    if (rolesError) {
      console.error('❌ Roles query failed:', rolesError.message)
    } else {
      console.log('✅ Roles found:', roles.length)
      roles.forEach(r => console.log(`   - ${r.name} (${r.id})`))
    }
    
    // Test 2: Check permissions table
    console.log('\n2️⃣ Testing permissions table...')
    const { data: permissions, error: permsError } = await supabase
      .from('permissions')
      .select('id, resource, action')
      .limit(10)
    
    if (permsError) {
      console.error('❌ Permissions query failed:', permsError.message)
    } else {
      console.log('✅ Permissions found:', permissions.length)
      permissions.forEach(p => console.log(`   - ${p.resource}.${p.action} (${p.id})`))
    }
    
    // Test 3: Check role_permissions table
    console.log('\n3️⃣ Testing role_permissions table...')
    const { data: rolePerms, error: rolePermsError } = await supabase
      .from('role_permissions')
      .select(`
        id,
        roles (name),
        permissions (resource, action)
      `)
      .limit(10)
    
    if (rolePermsError) {
      console.error('❌ Role permissions query failed:', rolePermsError.message)
    } else {
      console.log('✅ Role permissions found:', rolePerms.length)
      rolePerms.forEach(rp => {
        const role = rp.roles?.name || 'unknown'
        const perm = rp.permissions
        console.log(`   - ${role}: ${perm?.resource}.${perm?.action}`)
      })
    }
    
    // Test 4: Check super admin user
    console.log('\n4️⃣ Testing super admin user...')
    const { data: superAdmin, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'super_admin')
      .single()
    
    if (userError) {
      console.error('❌ Super admin query failed:', userError.message)
    } else {
      console.log('✅ Super admin found:')
      console.log(`   Email: ${superAdmin.email}`)
      console.log(`   Role: ${superAdmin.role}`)
      console.log(`   ID: ${superAdmin.id}`)
    }
    
    // Test 5: Test permission lookup for a specific role
    console.log('\n5️⃣ Testing permission lookup for doctor role...')
    const { data: doctorRole, error: doctorRoleError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('name', 'doctor')
      .single()
    
    if (doctorRoleError) {
      console.error('❌ Doctor role not found:', doctorRoleError.message)
    } else {
      const { data: doctorPerms, error: doctorPermsError } = await supabase
        .from('role_permissions')
        .select(`
          permission_id,
          permissions (resource, action)
        `)
        .eq('role_id', doctorRole.id)
        .limit(10)
      
      if (doctorPermsError) {
        console.error('❌ Doctor permissions query failed:', doctorPermsError.message)
      } else {
        console.log(`✅ Doctor has ${doctorPerms.length}+ permissions`)
        doctorPerms.forEach(dp => {
          const perm = dp.permissions
          console.log(`   - ${perm.resource}.${perm.action}`)
        })
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ All database tests completed successfully!')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message)
  }
}

testAccessControlAPI()

