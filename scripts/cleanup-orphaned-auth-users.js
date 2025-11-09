const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL is not set')
  if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY is not set')
  console.error('\nPlease ensure these variables are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanupOrphanedAuthUsers() {
  try {
    console.log('🔍 Finding orphaned auth users...\n')
    
    // Get all auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
      return
    }
    
    console.log(`Found ${authData.users.length} auth users`)
    
    // Get all database users
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, email')
    
    if (dbError) {
      console.error('❌ Error fetching database users:', dbError.message)
      return
    }
    
    console.log(`Found ${dbUsers.length} database users\n`)
    
    // Find orphaned auth users (in auth but not in database)
    const dbUserIds = new Set(dbUsers.map(u => u.id))
    const orphanedUsers = authData.users.filter(authUser => !dbUserIds.has(authUser.id))
    
    if (orphanedUsers.length === 0) {
      console.log('✅ No orphaned auth users found. All auth users have matching database records.')
      return
    }
    
    console.log(`⚠️  Found ${orphanedUsers.length} orphaned auth users:\n`)
    orphanedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`)
    })
    
    console.log('\n🗑️  Deleting orphaned auth users...\n')
    
    // Delete each orphaned user from auth
    let successCount = 0
    let errorCount = 0
    
    for (const user of orphanedUsers) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
      
      if (deleteError) {
        console.error(`❌ Failed to delete ${user.email}:`, deleteError.message)
        errorCount++
      } else {
        console.log(`✅ Deleted ${user.email}`)
        successCount++
      }
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Successfully deleted: ${successCount}`)
    if (errorCount > 0) {
      console.log(`   ❌ Failed to delete: ${errorCount}`)
    }
    console.log(`\n💡 Auth system is now clean!\n`)
    
  } catch (err) {
    console.error('💥 Unexpected error:', err.message)
    console.error('   Stack:', err.stack)
  }
}

cleanupOrphanedAuthUsers()
