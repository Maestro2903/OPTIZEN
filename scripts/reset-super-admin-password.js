const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')
const readline = require('readline')
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

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Generate a secure random password
function generateSecurePassword(length = 16) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  const allChars = uppercase + lowercase + numbers + symbols
  
  // Ensure at least one of each type
  let password = ''
  password += uppercase[crypto.randomInt(uppercase.length)]
  password += lowercase[crypto.randomInt(lowercase.length)]
  password += numbers[crypto.randomInt(numbers.length)]
  password += symbols[crypto.randomInt(symbols.length)]
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('')
}

// Prompt user for confirmation
function confirmAction(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')
    })
  })
}

async function resetSuperAdminPassword() {
  try {
    console.log('🔄 Resetting super admin password...')
    
    // Get super admin user
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'super_admin')
      .limit(1)
    
    // Check for database/fetch error first
    if (fetchError) {
      console.error('❌ Database error while fetching user:', fetchError.message)
      console.error('   Details:', fetchError)
      return
    }
    
    // Then check if user was found
    if (!users || users.length === 0) {
      console.error('❌ Super admin user not found in database')
      console.error('   No user with role "super_admin" exists')
      return
    }
    
    const superAdmin = users[0]
    console.log('✅ Found super admin:', superAdmin.email)
    
    // Prompt for confirmation
    console.log('\n⚠️  WARNING: This will reset the password for', superAdmin.email)
    const confirmed = await confirmAction('Are you sure you want to continue? (yes/no): ')
    
    if (!confirmed) {
      console.log('❌ Operation cancelled by user')
      process.exit(0)
    }
    
    // Generate secure password
    const newPassword = generateSecurePassword(16)
    
    // Reset password
    const { data, error } = await supabase.auth.admin.updateUserById(
      superAdmin.id,
      { password: newPassword }
    )
    
    if (error) {
      console.error('❌ Error resetting password:', error.message)
      console.error('   Details:', error)
      return
    }
    
    console.log('✅ Password reset successfully!')
    console.log('📧 Email:', superAdmin.email)
    console.log('\n⚠️  IMPORTANT: Store this password securely. It will not be shown again.')
    console.log('🔑 New Password:', newPassword)
    console.log('\n💡 TIP: Change this password after first login')
    
  } catch (err) {
    console.error('💥 Unexpected error:', err.message)
    console.error('   Stack:', err.stack)
  }
}

resetSuperAdminPassword()
