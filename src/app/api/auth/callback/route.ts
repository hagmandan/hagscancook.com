/**
 * POST /api/auth/callback
 *
 * Exchanges a Firebase ID token (obtained client-side after sign-in) for a
 * server-managed session cookie, then upserts the user row in the database.
 *
 * **Flow:**
 * 1. Client signs in with Firebase Auth (Google or email/password)
 * 2. Client calls `user.getIdToken()` and POSTs it here
 * 3. This handler verifies the token with firebase-admin, creates a 5-day
 *    session cookie, upserts the user in Neon, and returns 200
 * 4. The client redirects to the intended destination
 *
 * The session cookie (`__session`) is HttpOnly, Secure in production, and
 * SameSite=Lax. It is read by `proxy.ts` (presence check) and `getSession()`
 * (full JWT verify).
 */

import { type NextRequest, NextResponse } from 'next/server'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth'
import { upsertUser } from '@/lib/auth'
import { captureException } from '@/lib/monitoring/errors'

// ---------------------------------------------------------------------------
// Firebase Admin init (shared with src/lib/auth.ts — guarded by getApps())
// ---------------------------------------------------------------------------

function initAdmin() {
  if (getApps().length > 0) return
  const encodedKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!encodedKey) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set')
  const serviceAccount = JSON.parse(
    Buffer.from(encodedKey, 'base64').toString('utf-8')
  )
  initializeApp({ credential: cert(serviceAccount) })
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

/** Session cookie duration: 5 days in milliseconds. */
const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000

export async function POST(request: NextRequest) {
  try {
    initAdmin()
  } catch (err) {
    console.error('[/api/auth/callback] Firebase Admin init failed:', err)
    captureException(err, { feature: 'auth', operation: 'init', runtime: 'server' })
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { idToken?: unknown }
    const idToken = body.idToken

    if (typeof idToken !== 'string' || !idToken) {
      return NextResponse.json(
        { error: 'idToken is required' },
        { status: 400 }
      )
    }

    // Create the session cookie. This also verifies the ID token.
    let sessionCookie: string
    let decoded: DecodedIdToken
    try {
      ;[sessionCookie, decoded] = await Promise.all([
        getAuth().createSessionCookie(idToken, { expiresIn: SESSION_DURATION_MS }),
        getAuth().verifyIdToken(idToken),
      ])
    } catch (err) {
      console.error('[/api/auth/callback] Token verification failed:', err)
      captureException(err, { feature: 'auth', operation: 'verify-token', runtime: 'server' })
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    try {
      await upsertUser({
        firebaseUid: decoded.uid,
        email: decoded.email ?? '',
        displayName: decoded.name ?? decoded.email?.split('@')[0] ?? 'User',
        avatarUrl: decoded.picture,
      })
    } catch (err) {
      console.error('[/api/auth/callback] DB upsert failed:', err)
      captureException(err, { feature: 'auth', operation: 'upsert-user', runtime: 'server' })
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    const response = NextResponse.json({ status: 'ok' })
    response.cookies.set('__session', sessionCookie, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[/api/auth/callback] Unexpected error:', err)
    captureException(err, { feature: 'auth', operation: 'callback', runtime: 'server' })
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
}
