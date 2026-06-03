'use client'

/**
 * Signup page — /signup
 *
 * Supports Google SSO and email/password registration. After account
 * creation, exchanges the Firebase ID token for a server session cookie via
 * POST /api/auth/callback (which also upserts the user row in the DB), then
 * redirects to /recipes.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '@/lib/firebase-client'
import styles from './signup.module.css'

const googleProvider = new GoogleAuthProvider()

export default function SignupPage() {
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function exchangeTokenAndRedirect(idToken: string) {
    const res = await fetch('/api/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    if (!res.ok) throw new Error('Session creation failed')
    router.push('/recipes')
  }

  async function handleGoogleSignUp() {
    setError(null)
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      await exchangeTokenAndRedirect(idToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      // Set display name on the Firebase Auth profile
      if (displayName.trim()) {
        await updateProfile(result.user, { displayName: displayName.trim() })
      }
      const idToken = await result.user.getIdToken()
      await exchangeTokenAndRedirect(idToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>
          Already have an account?{' '}
          <Link href="/login" className={styles.link}>
            Sign in
          </Link>
        </p>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {/* Google SSO */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading}
          className={styles.googleButton}
          data-testid="google-signup"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        {/* Email + password */}
        <form onSubmit={handleEmailSignUp} className={styles.form}>
          <label className={styles.label}>
            Display name
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoComplete="name"
              placeholder="What should we call you?"
              className={styles.input}
              data-testid="displayname-input"
            />
          </label>

          <label className={styles.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={styles.input}
              data-testid="email-input"
            />
          </label>

          <label className={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              className={styles.input}
              data-testid="password-input"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
            data-testid="signup-submit"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}
