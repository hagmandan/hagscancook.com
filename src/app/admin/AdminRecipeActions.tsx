'use client'

import { useState, useTransition } from 'react'
import { unpublishRecipe, adminDeleteRecipe } from '@/lib/actions/admin'
import styles from './admin.module.css'

interface AdminRecipeActionsProps {
  recipeId: string
  recipeSlug: string
  status: string
}

export function AdminRecipeActions({ recipeId, recipeSlug, status }: AdminRecipeActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleUnpublish() {
    startTransition(async () => { await unpublishRecipe(recipeId) })
  }

  function handleDelete() {
    startTransition(async () => {
      await adminDeleteRecipe(recipeId)
      setConfirming(false)
    })
  }

  if (confirming) {
    return (
      <span style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', color: '#374151' }}>Delete?</span>
        <button onClick={handleDelete} disabled={isPending} className={`${styles.actionBtn} ${styles.dangerBtn}`} type="button">
          {isPending ? '…' : 'Yes'}
        </button>
        <button onClick={() => setConfirming(false)} className={styles.actionBtn} type="button">No</button>
      </span>
    )
  }

  return (
    <span style={{ display: 'flex', gap: '0.375rem' }}>
      <a href={`/recipes/${recipeSlug}/edit`} className={styles.actionBtn} style={{ textDecoration: 'none' }}>Edit</a>
      {status === 'published' && (
        <button onClick={handleUnpublish} disabled={isPending} className={styles.actionBtn} type="button">
          Unpublish
        </button>
      )}
      <button onClick={() => setConfirming(true)} className={`${styles.actionBtn} ${styles.dangerBtn}`} type="button">
        Delete
      </button>
    </span>
  )
}
