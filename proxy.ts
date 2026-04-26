import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function proxy(req: NextRequest) {
  console.log('[Proxy] Proxy function called for:', req.nextUrl.pathname)
  
  const res = NextResponse.next()
  
  // Create Supabase client with cookies
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') ?? '',
        },
      },
    }
  )

  // Protected routes yang memerlukan autentikasi
  const protectedRoutes = ['/account', '/account/']
  
  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    console.log('[Proxy] Protected route:', req.nextUrl.pathname)
    console.log('[Proxy] Auth check disabled - letting account page handle authentication')
    
    // Temporarily disable auth check to allow account page to handle it
    // TODO: Fix server-side session access issue
    return NextResponse.next()
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
