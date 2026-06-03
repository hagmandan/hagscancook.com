'use client'

/**
 * Instructions gate — client island rendered on recipe detail pages.
 *
 * Receives `isAuthenticated` from the Server Component (no client-side auth
 * check needed — the value is baked in at render time on the server). If the
 * user is authenticated, renders the numbered step list. If not, renders a
 * sign-up prompt.
 *
 * Because this is a Client Component, it hydrates after the initial SSR paint.
 * The server HTML is identical for all users (good for caching); the gate
 * state is resolved purely on the client after hydration.
 */

import Link from 'next/link'
import styles from './InstructionsGate.module.css'

interface Step {
  id: string
  order: number
  content: string
}

interface InstructionsGateProps {
  /** Pre-resolved on the server — no Firebase client SDK call needed here. */
  isAuthenticated: boolean
  steps: Step[]
}

export function InstructionsGate({ isAuthenticated, steps }: InstructionsGateProps) {
  if (isAuthenticated) {
    if (steps.length === 0) {
      return <p className={styles.empty}>No instructions added yet.</p>
    }

    return (
      <ol className={styles.stepList}>
        {steps.map((step) => (
          <li key={step.id} className={styles.step}>
            <span className={styles.stepNumber}>{step.order}</span>
            <p className={styles.stepContent}>{step.content}</p>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <div className={styles.gate}>
      <div className={styles.gateBlur} aria-hidden>
        <div className={styles.fakeLine} style={{ width: '92%' }} />
        <div className={styles.fakeLine} style={{ width: '78%' }} />
        <div className={styles.fakeLine} style={{ width: '85%' }} />
        <div className={styles.fakeLine} style={{ width: '60%' }} />
      </div>
      <div className={styles.gatePrompt}>
        <p className={styles.gateTitle}>Sign up to view the full recipe</p>
        <p className={styles.gateSubtitle}>
          Create a free account to see instructions, save favorites, and share
          your own recipes.
        </p>
        <div className={styles.gateActions}>
          <Link href="/signup" className={styles.gateCtaPrimary}>
            Sign up free
          </Link>
          <Link href="/login" className={styles.gateCtaSecondary}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
