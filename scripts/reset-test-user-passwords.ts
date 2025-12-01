/**
 * Script to reset passwords for all test users to simple passwords
 * 
 * Usage:
 *   npx tsx scripts/reset-test-user-passwords.ts
 * 
 * This script resets passwords for all test users to ensure they match the expected values.
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

interface TestUser {
  email: string
  password: string
  fullName: string
  role: string
}

const testUsers: TestUser[] = [
  {
    email: 'superadmin@eyecare.local',
    password: 'admin123',
    fullName: 'Super Admin',
    role: 'super_admin',
  },
  {
    email: 'hospitaladmin@eyecare.local',
    password: 'admin123',
    fullName: 'Hospital Admin',
    role: 'hospital_admin',
  },
  {
    email: 'doctor@eyecare.local',
    password: 'doctor123',
    fullName: 'Dr. John Smith',
    role: 'ophthalmologist',
  },
  {
    email: 'nurse@eyecare.local',
    password: 'nurse123',
    fullName: 'Nurse Jane Doe',
    role: 'technician',
  },
  {
    email: 'receptionist@eyecare.local',
    password: 'receptionist123',
    fullName: 'Receptionist Alice Johnson',
    role: 'receptionist',
  },
  {
    email: 'billing@eyecare.local',
    password: 'billing123',
    fullName: 'Billing Staff Bob Williams',
    role: 'billing_staff',
  },
  {
    email: 'pharmacy@eyecare.local',
    password: 'pharmacy123',
    fullName: 'Pharmacy Staff Carol Brown',
    role: 'technician',
  },
  {
    email: 'labtech@eyecare.local',
    password: 'labtech123',
    fullName: 'Lab Technician David Miller',
    role: 'technician',
  },
]

async function resetPasswords() {
  console.log('🔐 Resetting passwords for all test users...')
  console.log('')

  const results: Array<{ user: TestUser; status: 'updated' | 'not_found' | 'error'; message?: string }> = []

  // Get all users
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('❌ Error listing users:', listError.message)
    process.exit(1)
  }

  for (const user of testUsers) {
    try {
      const existingUser = usersData?.users?.find((u: any) => u.email === user.email)

      if (!existingUser) {
        console.log(`⚠️  User ${user.email} not found, skipping...`)
        results.push({ user, status: 'not_found' })
        continue
      }

      // Update password
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password: user.password,
        }
      )

      if (updateError) {
        console.error(`❌ Error updating password for ${user.email}:`, updateError.message)
        results.push({ user, status: 'error', message: updateError.message })
        continue
      }

      console.log(`✅ Password reset for ${user.email}`)
      results.push({ user, status: 'updated' })

    } catch (error) {
      console.error(`❌ Unexpected error for ${user.email}:`, error)
      results.push({ user, status: 'error', message: String(error) })
    }
  }

  // Print summary
  console.log('')
  console.log('='.repeat(60))
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))
  console.log('')

  const updated = results.filter(r => r.status === 'updated')
  const notFound = results.filter(r => r.status === 'not_found')
  const errors = results.filter(r => r.status === 'error')

  console.log(`✅ Passwords reset: ${updated.length} users`)
  console.log(`⚠️  Not found: ${notFound.length} users`)
  console.log(`❌ Errors: ${errors.length} users`)
  console.log('')

  if (updated.length > 0) {
    console.log('📋 UPDATED USER CREDENTIALS:')
    console.log('='.repeat(60))
    console.log('')
    
    for (const result of updated) {
      console.log(`Role: ${result.user.role}`)
      console.log(`  Email: ${result.user.email}`)
      console.log(`  Password: ${result.user.password}`)
      console.log('')
    }
  }

  if (errors.length > 0) {
    console.log('')
    console.log('❌ ERRORS:')
    console.log('='.repeat(60))
    for (const result of errors) {
      console.log(`  ${result.user.email}: ${result.message}`)
    }
    console.log('')
  }

  console.log('✨ Script completed')
}

// Run the script
resetPasswords()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })












