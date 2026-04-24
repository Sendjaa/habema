import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Protected routes yang memerlukan autentikasi
  const protectedRoutes = ['/account', '/account/']
  
  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    // Get session from cookies
    const accessToken = req.cookies.get('sb-access-token')?.value
    const refreshToken = req.cookies.get('sb-refresh-token')?.value

    if (!accessToken) {
      // No session, redirect to login
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      // Verify session with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      
      if (error || !user) {
        // Invalid session, redirect to login
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
      }

      // For admin routes, check if user is admin
      if (req.nextUrl.pathname.startsWith('/admin')) {
        // Check if user has admin role
        const isAdmin = user?.user_metadata?.role === 'admin' || 
                       user?.email?.endsWith('@habema.id') || // Example admin email domain
                       user?.app_metadata?.role === 'admin'

        if (!isAdmin) {
          // Redirect non-admin users to home page
          return NextResponse.redirect(new URL('/', req.url))
        }
      }
    } catch (error) {
      // Error verifying session, redirect to login
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
