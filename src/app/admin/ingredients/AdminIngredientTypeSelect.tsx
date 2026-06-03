'use client'

import { useTransition } from 'react'
import { updateIngredientType } from '@/lib/actions/admin'
import styles from '../admin.module.css'

interface Props {
  ingredientId: string
  currentTypeId: string
  types: { id: string; name: string }[]
}

export function AdminIngredientTypeSelect({ ingredientId, currentTypeId, types }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const typeId = e.target.value
    startTransition(async () => { await updateIngredientType(ingredientId, typeId) })
  }

  return (
    <select
      defaultValue={currentTypeId}
      onChange={handleChange}
      disabled={isPending}
      className={styles.addSelect}
      aria-label="Ingredient type"
    >
      {types.map((t) => (
        <option key={t.id} value={t.id}>{t.name}</option>
      ))}
    </select>
  )
}
