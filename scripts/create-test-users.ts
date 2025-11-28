/**
 * Script to create test users for all roles
 * 
 * Usage:
 *   npx tsx scripts/create-test-users.ts
 * 
 * This script creates users for all roles with simple passwords.
 * Note: Some roles are mapped to database enum values:
 * - Doctor -> ophthalmologist
 * - Nurse -> technician
 * - Pharmacy Staff -> technician
 * - Lab Technician -> technician
 * 
 * User Credentials:
 * - Super Admin: superadmin@eyecare.local / admin123
 * - Hospital Admin: hospitaladmin@eyecare.local / admin123
 * - Doctor: doctor@eyecare.local / doctor123
 * - Nurse: nurse@eyecare.local / nurse123
 * - Receptionist: receptionist@eyecare.local / receptionist123
 * - Billing Staff: billing@eyecare.local / billing123
 * - Pharmacy Staff: pharmacy@eyecare.local / pharmacy123
 * - Lab Technician: labtech@eyecare.local / labtech123
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
  phone?: string
}

// Map roles to database enum values
// The database enum supports: super_admin, hospital_admin, receptionist, optometrist, ophthalmologist, technician, billing_staff, patient
// For roles not in enum, we'll use the closest match or technician
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
    role: 'ophthalmologist', // doctor maps to ophthalmologist
    phone: '+1234567890',
  },
  {
    email: 'nurse@eyecare.local',
    password: 'nurse123',
    fullName: 'Nurse Jane Doe',
    role: 'technician', // nurse maps to technician in database
    phone: '+1234567891',
  },
  {
    email: 'receptionist@eyecare.local',
    password: 'receptionist123',
    fullName: 'Receptionist Alice Johnson',
    role: 'receptionist',
    phone: '+1234567892',
  },
  {
    email: 'billing@eyecare.local',
    password: 'billing123',
    fullName: 'Billing Staff Bob Williams',
    role: 'billing_staff',
    phone: '+1234567893',
  },
  {
    email: 'pharmacy@eyecare.local',
    password: 'pharmacy123',
    fullName: 'Pharmacy Staff Carol Brown',
    role: 'technician', // pharmacy_staff maps to technician in database
    phone: '+1234567894',
  },
  {
    email: 'labtech@eyecare.local',
    password: 'labtech123',
    fullName: 'Lab Technician David Miller',
    role: 'technician', // lab_technician maps to technician in database
    phone: '+1234567895',
  },
]

async function createTestUsers() {
  console.log('👥 Creating test users for all roles...')
  console.log('')

  const results: Array<{ user: TestUser; status: 'created' | 'exists' | 'error'; message?: string }> = []

  for (const user of testUsers) {
    try {
      // Check if user already exists
      const { data: users, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        console.error(`❌ Error listing users for ${user.email}:`, listError.message)
        results.push({ user, status: 'error', message: listError.message })
        continue
      }

      const existingUser = users.users.find(u => u.email === user.email)

      if (existingUser) {
        console.log(`⚠️  User ${user.email} already exists, skipping...`)
        results.push({ user, status: 'exists' })
        continue
      }

      // Create new user in Supabase Auth
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          role: user.role,
        },
      })

      if (createError) {
        console.error(`❌ Error creating user ${user.email}:`, createError.message)
        results.push({ user, status: 'error', message: createError.message })
        continue
      }

      if (!newUser?.user) {
        console.error(`❌ No user data returned for ${user.email}`)
        results.push({ user, status: 'error', message: 'No user data returned' })
        continue
      }

      console.log(`✅ Created auth user: ${user.email}`)

      // Create user profile in public.users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: newUser.user.id,
          email: user.email,
          full_name: user.fullName,
          role: user.role,
          phone: user.phone || null,
          is_active: true,
        })

      if (profileError) {
        console.warn(`⚠️  Warning: Could not create user profile for ${user.email}:`, profileError.message)
        // Don't fail, but note it
        results.push({ user, status: 'created', message: `Profile creation warning: ${profileError.message}` })
      } else {
        console.log(`✅ Created user profile for ${user.email}`)
        results.push({ user, status: 'created' })
      }

      console.log('')

    } catch (error) {
      console.error(`❌ Unexpected error creating user ${user.email}:`, error)
      results.push({ user, status: 'error', message: String(error) })
    }
  }

  // Print summary
  console.log('')
  console.log('='.repeat(60))
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))
  console.log('')

  const created = results.filter(r => r.status === 'created')
  const exists = results.filter(r => r.status === 'exists')
  const errors = results.filter(r => r.status === 'error')

  console.log(`✅ Created: ${created.length} users`)
  console.log(`⚠️  Already exists: ${exists.length} users`)
  console.log(`❌ Errors: ${errors.length} users`)
  console.log('')

  if (created.length > 0 || exists.length > 0) {
    console.log('📋 USER CREDENTIALS:')
    console.log('='.repeat(60))
    console.log('')
    
    for (const result of results) {
      if (result.status === 'created' || result.status === 'exists') {
        console.log(`Role: ${result.user.role}`)
        console.log(`  Email: ${result.user.email}`)
        console.log(`  Password: ${result.user.password}`)
        console.log(`  Name: ${result.user.fullName}`)
        if (result.message) {
          console.log(`  Note: ${result.message}`)
        }
        console.log('')
      }
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
createTestUsers()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })

