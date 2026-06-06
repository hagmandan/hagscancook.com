/**
 * Next.js 16 Proxy (formerly Middleware).
 *
 * Runs on the Edge Runtime before every matched request. This is an
 * **optimistic** redirect only — it checks for the presence of the Firebase
 * session cookie without verifying its signature (firebase-admin requires
 * Node.js APIs unavailable on the Edge).
 *
 * Full JWT verification happens in the Server Component and Server Action
 * layers, which run in the Node.js runtime.
 *
 * Protected routes (require authentication):
 *   /recipes/new, /recipes/[slug]/edit, /my-recipes, /favorites, /profile,
 *   /admin and all sub-paths
 *
 * Admin-only routes:
 *   /admin and sub-paths — role check is done in the Server Component layer, not here.
 */

import { type NextRequest, NextResponse } from 'next/server'

/** Name of the Firebase session cookie set by /api/auth/callback. */
const SESSION_COOKIE = '__session'

/** Routes that require any authenticated session. */
const PROTECTED_PATHS = [
  '/recipes/new',
  '/my-recipes',
  '/favorites',
  '/profile',
  '/admin',
]

/**
 * Returns true if the pathname requires authentication.
 * Matches exact paths and all sub-paths (e.g. `/admin` catches `/admin/users`).
 */
function isProtected(pathname: string): boolean {
  // /recipes/[slug]/edit — dynamic auth route
  if (/^\/recipes\/[^/]+\/edit(\/.*)?$/.test(pathname)) return true
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!isProtected(pathname)) return NextResponse.next()

  const hasSession = request.cookies.has(SESSION_COOKIE)
  if (hasSession) return NextResponse.next()

  // No session cookie — redirect to login, preserving the intended destination
  // so the login page can redirect back after sign-in.
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static and _next/image (Next.js internals)
     * - favicon.ico
     * - /api/auth/* (auth routes must be reachable without a session cookie)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
