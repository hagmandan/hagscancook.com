'use client'

import { useState, useTransition } from 'react'
import { unpublishRecipe, adminDeleteRecipe } from '@/lib/actions/admin'
import { useToast } from '@/lib/toast'
import styles from './admin.module.css'

interface AdminRecipeActionsProps {
  recipeId: string
  recipeSlug: string
  status: string
}

export function AdminRecipeActions({ recipeId, recipeSlug, status }: AdminRecipeActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const toast = useToast()

  function handleUnpublish() {
    startTransition(async () => {
      const result = await unpublishRecipe(recipeId)
      if ('error' in result) {
        toast.error('Error', 'Could not unpublish recipe')
      } else {
        toast.success('Done', 'Recipe unpublished')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await adminDeleteRecipe(recipeId)
      if ('error' in result) {
        toast.error('Error', 'Could not delete recipe')
      } else {
        toast.success('Done', 'Recipe deleted')
      }
      setConfirming(false)
    })
  }

  if (confirming) {
    return (
      <span className={styles.actionRow}>
        <span className={styles.confirmLabel}>Delete?</span>
        <button onClick={handleDelete} disabled={isPending} className={`${styles.actionBtn} ${styles.dangerBtn}`} type="button">
          {isPending ? '…' : 'Yes'}
        </button>
        <button onClick={() => setConfirming(false)} className={styles.actionBtn} type="button">No</button>
      </span>
    )
  }

  return (
    <span className={styles.actionRow}>
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
