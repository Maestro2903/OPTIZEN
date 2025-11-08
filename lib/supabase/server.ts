import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from './database.types'

/**
 * Creates a Supabase client for server-side operations
 * 
 * DEVELOPMENT MODE: Uses service role key to bypass RLS when no auth is configured
 * PRODUCTION: Uses auth-helpers with cookies for proper authentication
 */
export const createClient = () => {
  // Development mode: Use service role key to bypass RLS
  if (process.env.NODE_ENV !== 'production' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    )
  }
  
  // Production mode: Use standard auth-helpers with cookies
  return createServerComponentClient<Database>({ cookies })
}

