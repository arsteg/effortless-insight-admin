import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/forgot-password', '/reset-password']
const authPaths = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is public
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // Check for auth token in cookies
  const hasToken = request.cookies.has('admin_access_token')

  // Also check localStorage token via a custom header (set by client)
  // For SSR, we rely on cookies; client-side auth is handled by RequireAuth

  // If accessing auth pages while logged in, redirect to dashboard
  if (authPaths.some((path) => pathname.startsWith(path)) && hasToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // For protected routes, the RequireAuth component handles the redirect
  // Middleware here is lightweight and lets client-side auth handle most cases

  // Redirect root to dashboard or login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
