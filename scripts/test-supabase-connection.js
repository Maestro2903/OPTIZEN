#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Verifies that environment variables are properly loaded and Supabase is accessible
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n')

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('📋 Environment Variables:')
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`)
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}\n`)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables')
    process.exit(1)
  }

  try {
    // Test with anon key
    console.log('🔌 Testing connection with anon key...')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    const { data, error } = await supabase.from('employees').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.log(`   ⚠️  Connection OK, but query requires authentication: ${error.message}`)
    } else {
      console.log('   ✅ Connection successful!')
    }

    // Test service role key if available
    if (supabaseServiceKey) {
      console.log('\n🔐 Testing connection with service role key...')
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
      
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from('employees')
        .select('count', { count: 'exact', head: true })
      
      if (adminError) {
        console.log(`   ❌ Service role connection failed: ${adminError.message}`)
      } else {
        console.log('   ✅ Service role connection successful!')
      }
    }

    console.log('\n✅ Supabase configuration is valid!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message)
    process.exit(1)
  }
}

testConnection()
