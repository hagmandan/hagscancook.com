/**
 * Firebase client SDK singleton.
 *
 * Initializes the Firebase app for use in Client Components and client-side
 * auth flows. The `getApps()` guard prevents duplicate initialization across
 * Next.js hot-reloads.
 *
 * **Production (Firebase App Hosting):**
 * The platform auto-injects `FIREBASE_WEBAPP_CONFIG` at build time, so
 * `initializeApp()` with no arguments works — no `NEXT_PUBLIC_FIREBASE_*`
 * vars needed.
 *
 * **Local dev:**
 * `FIREBASE_WEBAPP_CONFIG` is not present, so we fall back to individual
 * `NEXT_PUBLIC_FIREBASE_*` vars from `.env.local`.
 *
 * Usage:
 *   import { auth } from '@/lib/firebase-client'
 */

import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

function initFirebase() {
  if (getApps().length > 0) return getApps()[0]

  // In production on Firebase App Hosting, FIREBASE_WEBAPP_CONFIG is
  // auto-injected and initializeApp() reads it with no arguments.
  // In local dev, we construct the config from NEXT_PUBLIC_* vars.
  if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    })
  }

  // Production path: auto-config from FIREBASE_WEBAPP_CONFIG
  return initializeApp()
}

const app = initFirebase()

/** Firebase Auth instance for use in Client Components. */
export const auth = getAuth(app)
