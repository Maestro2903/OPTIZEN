import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout failed:', error)
      // Redirect to login even if logout fails to clear client state
      return NextResponse.redirect(new URL('/auth/login?error=logout_failed', request.url))
    }

    // Redirect to login page after successful logout
    return NextResponse.redirect(new URL('/auth/login', request.url))
  } catch (error) {
    console.error('Unexpected error during logout:', error)
    return NextResponse.redirect(new URL('/auth/login?error=unexpected', request.url))
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout failed:', error)
      return NextResponse.json(
        { error: 'Logout failed', message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error during logout:', error)
    return NextResponse.json(
      { error: 'Logout failed', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
