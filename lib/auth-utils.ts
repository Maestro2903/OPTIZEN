/**
 * Auth utilities for OAuth CSRF protection and Next.js 15 compatibility
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Generate a cryptographically secure random state parameter for OAuth CSRF protection
 * @returns {string} Random state string
 */
export function generateOAuthState(): string {
  // Generate a random state parameter for CSRF protection
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Store OAuth state in a secure, httpOnly cookie
 * @param {string} state - The state parameter to store
 * @param {NextResponse} response - The response object to set cookie on
 */
export function storeOAuthState(state: string, response: NextResponse): void {
  // Store in secure, httpOnly cookie with appropriate expiration
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 600, // 10 minutes - OAuth flow should complete quickly
  }

  response.cookies.set('oauth_state', state, cookieOptions)
}

/**
 * Validate OAuth state parameter against stored value
 * @param {string} providedState - State parameter from OAuth callback
 * @returns {Promise<boolean>} Whether state is valid
 */
export async function validateOAuthState(providedState: string): Promise<boolean> {
  const cookieStore = await cookies()
  const storedState = cookieStore.get('oauth_state')?.value

  return storedState !== undefined && storedState === providedState
}

/**
 * Clear OAuth state cookie after successful authentication
 * @param {NextResponse} response - The response object to clear cookie on
 */
export function clearOAuthState(response: NextResponse): void {
  response.cookies.set('oauth_state', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  })
}

/**
 * Example usage for initiating OAuth flow with state parameter:
 *
 * // In your OAuth initiation route (e.g., /auth/google)
 * export async function GET(request: Request) {
 *   const state = generateOAuthState()
 *   const supabase = createRouteHandlerClient({ cookies: () => cookies() })
 *
 *   const { data, error } = await supabase.auth.signInWithOAuth({
 *     provider: 'google',
 *     options: {
 *       redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
 *       queryParams: {
 *         state: state
 *       }
 *     }
 *   })
 *
 *   if (error) {
 *     return NextResponse.redirect(new URL('/auth/login?error=oauth_failed', request.url))
 *   }
 *
 *   if (data.url) {
 *     const response = NextResponse.redirect(data.url)
 *     storeOAuthState(state, response)
 *     return response
 *   }
 * }
 */