/**
 * Firebase Admin authentication helpers.
 *
 * Provides server-side session verification using the Firebase Admin SDK.
 * Session cookies are set by `/api/auth/callback` after the client-side
 * Firebase sign-in and are verified here on every protected request.
 *
 * **Three-layer auth model:**
 * 1. `proxy.ts`       — Edge Runtime: optimistic redirect if cookie absent (no JWT verify)
 * 2. Server Component — call `getSession()` to fully verify JWT + fetch role from DB
 * 3. Server Action    — call `requireSession()` / `requireAdmin()` to re-verify before mutation
 *
 * The Admin SDK is initialized once via `getApps()` guard to avoid duplicate app errors
 * in Next.js module hot-reloads.
 */

import { cookies } from 'next/headers'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { db } from '@/lib/db'
import type { Role } from '@prisma/client'

// ---------------------------------------------------------------------------
// Firebase Admin initialization
// ---------------------------------------------------------------------------

/**
 * Lazily initializes the Firebase Admin SDK from the `FIREBASE_SERVICE_ACCOUNT_KEY`
 * environment variable (base64-encoded service account JSON).
 *
 * Safe to call multiple times — subsequent calls are no-ops if the app is
 * already initialized.
 */
function initAdmin() {
  if (getApps().length > 0) return

  const encodedKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!encodedKey) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. ' +
        'Add it to .env.local for development or as a Cloud Secret Manager ' +
        'secret referenced in apphosting.yaml for production.'
    )
  }

  const serviceAccount = JSON.parse(
    Buffer.from(encodedKey, 'base64').toString('utf-8')
  )

  initializeApp({ credential: cert(serviceAccount) })
}

// ---------------------------------------------------------------------------
// Session types
// ---------------------------------------------------------------------------

/** Verified session returned by `getSession()`. Contains the DB user row. */
export interface Session {
  /** DB user id (UUID). */
  userId: string
  /** Firebase Auth UID. */
  firebaseUid: string
  email: string
  displayName: string
  avatarUrl: string | null
  role: Role
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

/**
 * Verifies the Firebase session cookie and returns the authenticated user.
 *
 * Returns `null` if there is no session cookie, if the cookie is invalid, or
 * if the Firebase UID does not correspond to a row in the `users` table.
 *
 * Call this in Server Components and Route Handlers. For mutations, prefer
 * `requireSession()` which throws instead of returning null.
 *
 * @returns The verified `Session` object, or `null` if unauthenticated.
 */
export async function getSession(): Promise<Session | null> {
  try {
    initAdmin()

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('__session')?.value
    if (!sessionCookie) return null

    const decoded = await getAuth().verifySessionCookie(sessionCookie, true)

    const user = await db.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
      },
    })

    if (!user) return null

    return {
      userId: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
    }
  } catch {
    // Invalid cookie, expired token, revoked session, etc.
    return null
  }
}

/**
 * Returns the current session or throws a redirect to `/login`.
 *
 * Use in Server Actions and Route Handlers that require authentication.
 * The redirect is performed with `next/navigation` `redirect()`, which
 * throws a special Next.js error that is caught by the framework.
 *
 * @returns The verified `Session` object.
 * @throws Redirects to `/login` if the session is absent or invalid.
 */
export async function requireSession(): Promise<Session> {
  const { redirect } = await import('next/navigation')
  const session = await getSession()
  if (!session) redirect('/login')
  return session!
}

/**
 * Returns the current session or throws a redirect to `/login` / 403 for
 * non-admin users.
 *
 * Use in Server Actions and Route Handlers that require admin access.
 *
 * @returns The verified `Session` object for an admin user.
 * @throws Redirects to `/login` if unauthenticated; throws 403 if authenticated but not admin.
 */
export async function requireAdmin(): Promise<Session> {
  const { redirect, notFound } = await import('next/navigation')
  const session = await getSession()
  if (!session) redirect('/login')
  // Use notFound() as a 404/403 — avoids exposing that admin routes exist.
  if (session!.role !== 'admin') notFound()
  return session!
}

// ---------------------------------------------------------------------------
// User upsert (called from /api/auth/callback)
// ---------------------------------------------------------------------------

/**
 * Creates or updates the `users` row for a Firebase Auth user.
 *
 * Called from `/api/auth/callback` immediately after the session cookie is
 * set. Subsequent logins update `displayName` and `avatarUrl` in case the
 * user has changed their Google profile since their last visit.
 *
 * @param params - Firebase Auth user fields from the decoded ID token.
 * @returns The upserted user row.
 */
export async function upsertUser(params: {
  firebaseUid: string
  email: string
  displayName: string
  avatarUrl?: string
}) {
  return db.user.upsert({
    where: { firebaseUid: params.firebaseUid },
    update: {
      displayName: params.displayName,
      avatarUrl: params.avatarUrl ?? null,
    },
    create: {
      firebaseUid: params.firebaseUid,
      email: params.email,
      displayName: params.displayName,
      avatarUrl: params.avatarUrl ?? null,
    },
  })
}
