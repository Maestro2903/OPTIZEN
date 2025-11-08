#!/usr/bin/env node

/**
 * Check Database Schema
 * Verifies that the database tables match the API expectations
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkDatabaseSchema() {
  console.log('🔍 Checking Database Schema...\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Check patients table
  console.log('📋 Checking patients table...')
  
  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .limit(1)

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('   ❌ patients table does not exist')
        console.log('   📝 Solution: Run migration 012_fix_patients_schema.sql')
        console.log('   🔗 Visit your Supabase project dashboard SQL editor to apply migrations')
      } else {
        console.log('   ❌ Error:', error.message)
      }
      process.exit(1)
    }

    console.log('   ✅ patients table exists')

    // Check if table has correct schema by trying to select expected columns
    const { data: schemaCheck, error: schemaError } = await supabase
      .from('patients')
      .select('patient_id, full_name, mobile, gender, status')
      .limit(0)

    if (schemaError) {
      console.log('   ❌ Schema mismatch:', schemaError.message)
      console.log('   📝 The table exists but has the wrong columns')
      console.log('   💡 Expected columns: patient_id, full_name, mobile, gender, status')
      console.log('   📝 Solution: Run migration 012_fix_patients_schema.sql')
      process.exit(1)
    }

    console.log('   ✅ Schema looks correct (patient_id, full_name, etc.)')

    // Check RLS policies
    console.log('\n🔐 Checking Row Level Security...')
    
    // Simple check: try to query with anon key (should fail with proper error)
    const anonSupabase = createClient(supabaseUrl, supabaseAnonKey)
    const { error: anonError } = await anonSupabase
      .from('patients')
      .select('patient_id')
      .limit(1)

    if (anonError && anonError.message.includes('not authenticated')) {
      console.log('   ✅ RLS is properly configured (requires authentication)')
    } else {
      console.log('   ⚠️  RLS might not be configured correctly')
      console.log('   📝 Check RLS policies in Supabase Dashboard')
    }

    // Count existing patients
    console.log('\n📊 Patient Records...')
    const { count } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })

    console.log(`   Total patients: ${count || 0}`)

    console.log('\n✅ Database schema check complete!')
    console.log('\n📝 Next steps:')
    console.log('   1. Make sure you have a user account created')
    console.log('   2. Login at: http://localhost:3001/auth/login')
    console.log('   3. Try adding a patient')

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

checkDatabaseSchema()
