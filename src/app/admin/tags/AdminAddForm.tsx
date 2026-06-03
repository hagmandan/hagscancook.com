'use client'

/**
 * Reusable inline add form for tags and ingredient types.
 * Uses `useActionState` for progressive enhancement.
 */

import { useActionState } from 'react'
import { createTag } from '@/lib/actions/admin'
import { createIngredientType } from '@/lib/actions/admin'
import styles from '../admin.module.css'

interface AdminAddFormProps {
  placeholder: string
  actionName: 'createTag' | 'createIngredientType'
}

const actions = { createTag, createIngredientType }

export function AdminAddForm({ placeholder, actionName }: AdminAddFormProps) {
  const action = actions[actionName]
  const [state, formAction, isPending] = useActionState(
    async (_prev: { ok?: true; error?: string } | null, formData: FormData) =>
      action(formData),
    null
  )

  return (
    <form action={formAction} className={styles.addForm}>
      <input
        name="name"
        type="text"
        required
        placeholder={placeholder}
        className={styles.addInput}
      />
      <button type="submit" disabled={isPending} className={styles.addBtn}>
        {isPending ? 'Adding…' : 'Add'}
      </button>
      {state && 'error' in state && <p className={styles.formError}>{state.error}</p>}
    </form>
  )
}
