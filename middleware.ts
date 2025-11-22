import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })

  // Safely attempt to get session; network issues (e.g., bad Supabase URL) should not crash middleware
  let session: any = null
  try {
    const {
      data: { session: s },
    } = await supabase.auth.getSession()
    session = s
  } catch (err) {
    console.error('Middleware: failed to get Supabase session:', err)
    session = null
  }

  // Protect dashboard routes (excluding root, auth, portal, and API routes)
  const pathname = req.nextUrl.pathname
  const isProtectedRoute = pathname !== '/' && 
    !pathname.startsWith('/auth') && 
    !pathname.startsWith('/portal') && 
    !pathname.startsWith('/api') &&
    pathname !== '/not-found'
  
  if (isProtectedRoute) {
    if (!session) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check for super_admin access to /access-control
    if (pathname.startsWith('/access-control')) {
      // Try to get role from session metadata first (faster)
      const userRole = session.user.user_metadata?.role || session.user.app_metadata?.role
      
      // If role not in session, fall back to DB lookup
      if (!userRole) {
        try {
          const { data: user, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (error) {
            console.error('Error fetching user role in middleware:', error)
            const redirectUrl = req.nextUrl.clone()
            redirectUrl.pathname = '/cases'
            redirectUrl.searchParams.set('error', 'db_error')
            return NextResponse.redirect(redirectUrl)
          }

          if (!user || user.role !== 'super_admin') {
            const redirectUrl = req.nextUrl.clone()
            redirectUrl.pathname = '/cases'
            return NextResponse.redirect(redirectUrl)
          }
        } catch (err) {
          console.error('Middleware: role lookup failed:', err)
          const redirectUrl = req.nextUrl.clone()
          redirectUrl.pathname = '/cases'
          redirectUrl.searchParams.set('error', 'db_error')
          return NextResponse.redirect(redirectUrl)
        }
      } else if (userRole !== 'super_admin') {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/cases'
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // Protect patient portal routes
  if (req.nextUrl.pathname.startsWith('/portal')) {
    if (!session) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect authenticated users away from auth pages (except logout)
  if (req.nextUrl.pathname.startsWith('/auth') && 
      !req.nextUrl.pathname.startsWith('/auth/logout') && 
      session) {
    return NextResponse.redirect(new URL('/cases', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

