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

  // Table to test (configurable via env or fallback)
  const tableName = process.env.DB_TABLE_NAME || 'employees'

  try {
    // Test with anon key using connection-only check
    console.log('🔌 Testing connection with anon key...')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    try {
      // Use auth.getSession() for connection-only check (doesn't depend on tables)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.log(`   ❌ Auth check returned error: ${sessionError.message}`)
        throw sessionError
      }
      console.log('   ✅ Connection successful!')
    } catch (connError) {
      console.log(`   ❌ Connection failed: ${connError.message}`)
      throw connError
    }

    // Test service role key if available
    if (supabaseServiceKey) {
      console.log('\n🔐 Testing connection with service role key...')
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
      
      try {
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from(tableName)
          .select('count', { count: 'exact', head: true })
        
        if (adminError) {
          // Check if it's a missing table error
          if (adminError.message.includes('does not exist')) {
            console.log(`   ⚠️  Connection OK, but table '${tableName}' does not exist`)
            console.log(`   💡 Tip: Run migrations or set DB_TABLE_NAME to an existing table`)
          } else {
            console.log(`   ❌ Service role query failed: ${adminError.message}`)
          }
        } else {
          console.log('   ✅ Service role connection successful!')
        }
      } catch (adminError) {
        console.log(`   ❌ Service role connection failed: ${adminError.message}`)
        console.log(`   Full error:`, adminError)
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
