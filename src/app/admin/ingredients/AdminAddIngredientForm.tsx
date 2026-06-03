'use client'

import { useActionState } from 'react'
import { createIngredient } from '@/lib/actions/admin'
import styles from '../admin.module.css'

interface AdminAddIngredientFormProps {
  types: { id: string; name: string }[]
}

export function AdminAddIngredientForm({ types }: AdminAddIngredientFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { ok?: true; error?: string } | null, formData: FormData) =>
      createIngredient(formData),
    null
  )

  return (
    <form action={formAction} className={styles.addForm}>
      <input
        name="name"
        type="text"
        required
        placeholder="Ingredient name (e.g. miso paste)"
        className={styles.addInput}
      />
      <select name="typeId" required className={styles.addSelect}>
        <option value="">Select type…</option>
        {types.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <button type="submit" disabled={isPending} className={styles.addBtn}>
        {isPending ? 'Adding…' : 'Add'}
      </button>
      {state && 'error' in state && <p className={styles.formError}>{state.error}</p>}
    </form>
  )
}
