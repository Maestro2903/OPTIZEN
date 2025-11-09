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

async function resetSuperAdminPassword() {
  try {
    console.log('🔄 Resetting super admin password...')
    
    // Get super admin user
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'super_admin')
      .limit(1)
    
    if (fetchError || !users || users.length === 0) {
      console.error('❌ Super admin user not found:', fetchError)
      return
    }
    
    const superAdmin = users[0]
    console.log('✅ Found super admin:', superAdmin.email)
    
    // Reset password
    const { data, error } = await supabase.auth.admin.updateUserById(
      superAdmin.id,
      { password: 'Test@123456' }
    )
    
    if (error) {
      console.error('❌ Error resetting password:', error)
      return
    }
    
    console.log('✅ Password reset successfully!')
    console.log('📧 Email:', superAdmin.email)
    console.log('🔑 Password: Test@123456')
    
  } catch (err) {
    console.error('💥 Unexpected error:', err)
  }
}

resetSuperAdminPassword()

