/**
 * POST /api/auth/signout
 *
 * Clears the server-side `__session` cookie, completing the sign-out flow
 * that begins with `signOut(auth)` on the client.
 *
 * Called by the `logout()` function in `src/components/layout/Providers.tsx`.
 */

import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ status: 'ok' })
  response.cookies.set('__session', '', {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
  return response
}
