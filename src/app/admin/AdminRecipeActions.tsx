'use client'

import { useTransition } from 'react'
import { unpublishRecipe, adminDeleteRecipe } from '@/lib/actions/admin'
import { useToast } from '@/lib/toast'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import styles from './admin.module.css'

interface AdminRecipeActionsProps {
  recipeId: string
  recipeSlug: string
  status: string
}

export function AdminRecipeActions({ recipeId, recipeSlug, status }: AdminRecipeActionsProps) {
  const [isPending, startTransition] = useTransition()
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
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const result = await adminDeleteRecipe(recipeId)
        if ('error' in result) {
          toast.error('Error', 'Could not delete recipe')
        } else {
          toast.success('Done', 'Recipe deleted')
        }
        resolve()
      })
    })
  }

  return (
    <span className={styles.actionRow}>
      <a href={`/recipes/${recipeSlug}/edit`} className={styles.actionBtn}>Edit</a>
      {status === 'published' && (
        <button onClick={handleUnpublish} disabled={isPending} className={styles.actionBtn} type="button">
          Unpublish
        </button>
      )}
      <ConfirmButton
        label="Delete"
        confirmQuestion="Delete?"
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={handleDelete}
        isPending={isPending}
        pendingLabel="…"
        danger
      />
    </span>
  )
}
