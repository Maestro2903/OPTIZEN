import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateOAuthState, clearOAuthState } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Check for OAuth errors first
  if (error || errorDescription) {
    console.error('OAuth error:', { error, errorDescription })
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error || 'Authentication failed')}`, request.url)
    )
  }

  // CSRF Protection: Validate state parameter
  if (!state) {
    console.error('Missing state parameter - potential CSRF attack')
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent('Invalid request - missing state parameter')}`, request.url)
    )
  }

  // Validate state parameter against stored value using utility function
  const isValidState = await validateOAuthState(state)

  if (!isValidState) {
    console.error('State parameter validation failed - potential CSRF attack', { provided: state })
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent('Invalid request - state verification failed')}`, request.url)
    )
  }

  if (code) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables')
      }

      const cookieStore = await cookies()
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      })

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('Code exchange failed:', exchangeError)
        return NextResponse.redirect(
          new URL(`/auth/login?error=${encodeURIComponent('Authentication failed')}`, request.url)
        )
      }

      // Verify authentication was successful
      if (data?.session?.user) {
        // Clear the state cookie after successful authentication using utility function
        const response = NextResponse.redirect(new URL('/patients', request.url))
        clearOAuthState(response)
        return response
      } else {
        console.error('No session or user found after code exchange')
        return NextResponse.redirect(
          new URL(`/auth/login?error=${encodeURIComponent('Authentication incomplete')}`, request.url)
        )
      }
    } catch (error) {
      console.error('Unexpected error during code exchange:', error)
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent('Authentication failed')}`, request.url)
      )
    }
  }

  // No code provided
  console.error('No authorization code provided')
  return NextResponse.redirect(
    new URL(`/auth/login?error=${encodeURIComponent('No authorization code')}`, request.url)
  )
}
