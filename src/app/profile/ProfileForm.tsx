'use client'

/**
 * Profile edit form — display name update.
 *
 * Uses a native form action (Server Action bound to `action` prop) with
 * `useActionState` for progressive enhancement.
 */

import { useActionState } from 'react'
import { updateProfile } from '@/lib/actions/profile'
import styles from './profile.module.css'

interface ProfileFormProps {
  initialDisplayName: string
}

export function ProfileForm({ initialDisplayName }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { ok?: true; error?: string } | null, formData: FormData) => {
      return updateProfile(formData)
    },
    null
  )

  return (
    <form action={formAction} className={styles.form}>
      <h2 className={styles.formTitle}>Edit profile</h2>

      {state && 'error' in state && (
        <p className={styles.error} role="alert">{state.error}</p>
      )}
      {state && 'ok' in state && (
        <p className={styles.success} role="status">Profile updated.</p>
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={initialDisplayName}
          required
          maxLength={80}
          className={styles.input}
          data-testid="displayname-input"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={styles.submitButton}
      >
        {isPending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
