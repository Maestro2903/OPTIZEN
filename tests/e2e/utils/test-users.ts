import { createClient } from '@supabase/supabase-js'

/**
 * Helper to create or fetch a known test user for E2E flows.
 * Uses the same Supabase project as the main app via env vars.
 */
export async function ensureTestUser(role: string = 'super_admin') {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase env vars for E2E test user setup')
  }

  const supabase = createClient(url, key)
  const email = `e2e+${role}@example.com`

  // Try to find existing user in public users table
  const { data: existing } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return existing
  }

  // The main project already has scripts for seeding users;
  // this is a lightweight fallback for tests if needed.
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      full_name: `E2E ${role}`,
      role,
      is_active: true,
    })
    .select('id, email, role')
    .single()

  if (error) {
    throw error
  }

  return data
}






