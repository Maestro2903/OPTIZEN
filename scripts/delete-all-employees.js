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

// Prompt user for confirmation
const readline = require('readline')

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

async function deleteAllEmployees() {
  try {
    console.log('🔍 Fetching all employee/staff users...\n')
    
    // Get all users except super_admin
    // Employees/staff are anyone who is not super_admin
    const { data: employees, error: fetchError } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .neq('role', 'super_admin')
      .order('full_name')
    
    if (fetchError) {
      console.error('❌ Database error while fetching employees:', fetchError.message)
      console.error('   Details:', fetchError)
      return
    }
    
    if (!employees || employees.length === 0) {
      console.log('✅ No employees found in database (only super admins remain)')
      return
    }
    
    console.log(`Found ${employees.length} employee/staff members:\n`)
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.full_name} (${emp.role}) - ${emp.email}`)
    })
    
    console.log('\n⚠️  WARNING: This will PERMANENTLY DELETE ALL employee/staff records!')
    console.log('   (Super admin accounts will be preserved)')
    console.log('   (This uses hard delete, not soft delete)')
    const confirmed = await confirmAction('\nAre you sure you want to delete ALL employees? (yes/no): ')
    
    if (!confirmed) {
      console.log('❌ Operation cancelled by user')
      process.exit(0)
    }
    
    console.log('\n🗑️  Deleting all employee/staff records...')
    
    // Hard delete all non-super_admin users
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .neq('role', 'super_admin')
    
    if (deleteError) {
      console.error('❌ Error deleting employees:', deleteError.message)
      console.error('   Details:', deleteError)
      return
    }
    
    console.log(`\n✅ Successfully deleted ${employees.length} employees!`)
    console.log('💡 Super admin accounts have been preserved')
    console.log('💡 The employee/staff data has been cleared')
    console.log('💡 You can now add fresh employee data\n')
    
  } catch (err) {
    console.error('💥 Unexpected error:', err.message)
    console.error('   Stack:', err.stack)
  }
}

deleteAllEmployees()
