'use client'

import { useState, useTransition } from 'react'
import { addPantryItem, type PantryItemView } from '@/lib/actions/pantry'
import { PANTRY_LIMITS } from '@/lib/schemas/pantry'
import styles from './pantry.module.css'

interface PantrySectionAddProps {
  sectionId: string
  typeId: string
  onAdded: (item: PantryItemView) => void
}

export function PantrySectionAdd({ sectionId, typeId, onAdded }: PantrySectionAddProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setError(null)

    startTransition(async () => {
      const result = await addPantryItem({ ingredientName: trimmed, typeId })
      if ('error' in result) {
        setError(result.error)
        return
      }
      onAdded(result.item)
      setName('')
    })
  }

  return (
    <form
      className={styles.sectionCustomAdd}
      onSubmit={handleSubmit}
      data-testid={`pantry-section-add-${sectionId}`}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add something else…"
        className={styles.sectionAddInput}
        maxLength={PANTRY_LIMITS.INGREDIENT_NAME}
        aria-label={`Add custom ingredient to ${sectionId}`}
      />
      <button
        type="submit"
        className={styles.sectionAddButton}
        disabled={isPending || !name.trim()}
      >
        {isPending ? 'Adding…' : 'Add'}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
