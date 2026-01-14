import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

/**
 * Creates a Supabase client for server-side operations
 * 
 * Uses SSR client with cookies for proper authentication.
 * Falls back to service role key only during build-time when cookies are unavailable.
 * 
 * NOTE: This function is synchronous for the service role case, but requires async
 * for the cookie-based case. Use createAuthenticatedClient() in async contexts.
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Check if we have a service role key as fallback for build time
  if (serviceRoleKey) {
    try {
      // Attempt to access cookies - this will fail during build time
      const { cookies } = require('next/headers')
      const cookieStore = cookies()

      return createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
        }
      )
    } catch (error) {
      // If cookies() fails (e.g., during build time), use service role client
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
  } else {
    // No service role key, must use cookies - this will fail at build time
    // We'll try anyway and let it fail with a clear message if not in request context
    try {
      // Access cookies - will throw error at build time
      const { cookies } = require('next/headers')
      const cookieStore = cookies()

      return createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
        }
      )
    } catch (error) {
      throw new Error('Supabase client creation failed. Ensure you are calling this in a server context with access to headers/cookies.')
    }
  }
}

/**
 * Creates an authenticated Supabase client that ALWAYS uses cookies
 * Use this for API routes that need to access user sessions (like /api/access-control)
 *
 * This ensures proper session handling even in development mode
 */
export const createAuthenticatedClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Try to get cookies, but fall back to service role if it fails (e.g., during build)
  let cookieStore
  try {
    const { cookies } = await import('next/headers')
    cookieStore = cookies()
  } catch (error) {
    // If cookies() fails (e.g., during build or outside request context), use service role if available
    if (serviceRoleKey) {
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
    throw error
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
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

