import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
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
