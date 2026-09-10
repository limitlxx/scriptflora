import { type NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/canvas', '/projects']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only guard the protected routes
  if (!PROTECTED.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // LWC sets an HttpOnly cookie named `lwc_session` after successful login
  const session = request.cookies.get('lwc_session')
  if (session?.value) return NextResponse.next()

  // Not authenticated — redirect to landing page
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/'
  return NextResponse.redirect(loginUrl)
}

export const config = {
  // Run only on app routes, skip static files, API, and /sandbox
  matcher: ['/canvas/:path*', '/projects/:path*'],
}
