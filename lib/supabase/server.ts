import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
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

/**
 * Creates an authenticated Supabase client that ALWAYS uses cookies
 * Use this for API routes that need to access user sessions (like /api/access-control)
 * 
 * This ensures proper session handling even in development mode
 */
export const createAuthenticatedClient = async () => {
  const cookieStore = await cookies()
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore })
}

/**
 * Creates a Supabase client with SERVICE ROLE KEY
 * Use this for admin operations that need to bypass RLS and PostgREST cache
 * 
 * WARNING: This client bypasses all Row Level Security policies.
 * Only use for:
 * - Critical admin operations (like access control management)
 * - Operations that need to bypass stale PostgREST cache
 * - Server-side operations where you've already verified authorization
 */
export const createServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createSupabaseClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  )
}

