import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { cookies as CookiesType } from 'next/headers'
import { Database } from './database.types'

// Lazy import cookies to avoid build-time errors
const getCookies = async () => {
  const { cookies } = await import('next/headers')
  return cookies
}

/**
 * Creates a Supabase client for server-side operations
 * 
 * DEVELOPMENT MODE: Uses service role key to bypass RLS when no auth is configured
 * PRODUCTION: Uses SSR client with cookies for proper authentication
 * 
 * NOTE: This function is synchronous for the service role case, but requires async
 * for the cookie-based case. Use createAuthenticatedClient() in async contexts.
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  // Development mode: Use service role key to bypass RLS (synchronous)
  if (process.env.NODE_ENV !== 'production' && serviceRoleKey) {
    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    }
    
    return createSupabaseClient<Database>(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          // Use a custom fetch that works better with Next.js
          fetch: async (url, options = {}) => {
            try {
              // Add keepalive and set a reasonable timeout
              const response = await fetch(url, {
                ...options,
                keepalive: false,
                signal: AbortSignal.timeout(30000), // 30 second timeout
              })
              return response
            } catch (error) {
              console.error('Fetch error:', {
                url,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
              })
              throw error
            }
          }
        }
      }
    )
  }
  
  // Production mode: Use SSR client with cookies (requires async)
  // For production, use createAuthenticatedClient() instead
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // In production without service role, we need cookies - use createAuthenticatedClient()
  // This is a fallback that will work but may have cookie issues
  // Note: This may fail during build - use createAuthenticatedClient() in API routes instead
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
    const cookies = await getCookies()
    cookieStore = await cookies()
  } catch (error: any) {
    // If cookies() fails (e.g., during build or outside request context), use service role
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

