/**
 * Script to reset superadmin password
 * 
 * Usage:
 *   npx tsx scripts/reset-superadmin-password.ts
 * 
 * Or with custom password:
 *   PASSWORD=yourNewPassword npx tsx scripts/reset-superadmin-password.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗')
  process.exit(1)
}

// Create admin client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function resetSuperAdminPassword() {
  const newPassword = process.env.PASSWORD || 'SuperAdmin@2024!'
  const email = 'superadmin@eyecare.local'

  console.log('🔐 Resetting superadmin password...')
  console.log(`   Email: ${email}`)
  console.log(`   New Password: ${newPassword}`)
  console.log('')

  try {
    // First, find the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      process.exit(1)
    }

    const user = users?.users?.find((u: any) => u.email === email)

    if (!user) {
      console.error(`❌ User with email ${email} not found`)
      console.log('')
      console.log('💡 Creating new superadmin user...')
      
      // Create new superadmin user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Super Admin',
          role: 'super_admin'
        }
      })

      if (createError) {
        console.error('❌ Error creating user:', createError.message)
        process.exit(1)
      }

      console.log('✅ Created new superadmin user')
      console.log(`   User ID: ${newUser.user.id}`)

      // Create user profile in public.users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: newUser.user.id,
          email,
          full_name: 'Super Admin',
          role: 'super_admin',
          is_active: true,
        })

      if (profileError) {
        console.warn('⚠️  Warning: Could not create user profile:', profileError.message)
        console.log('   You may need to create the profile manually in the database')
      } else {
        console.log('✅ Created user profile in public.users table')
      }

      console.log('')
      console.log('🎉 Success! New superadmin credentials:')
      console.log(`   Email: ${email}`)
      console.log(`   Password: ${newPassword}`)
      return
    }

    // Update existing user's password
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        password: newPassword,
      }
    )

    if (updateError) {
      console.error('❌ Error updating password:', updateError.message)
      process.exit(1)
    }

    console.log('✅ Password updated successfully!')
    console.log(`   User ID: ${updatedUser.user.id}`)
    console.log('')
    console.log('🎉 Success! Updated superadmin credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${newPassword}`)
    console.log('')
    console.log('💡 You can now log in with these credentials')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
resetSuperAdminPassword()
  .then(() => {
    console.log('')
    console.log('✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

