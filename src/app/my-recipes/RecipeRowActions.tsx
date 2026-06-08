'use client'

import Link from 'next/link'
import { useState } from 'react'
import { deleteRecipe } from '@/lib/actions/recipes'
import { useToast } from '@/lib/toast'
import { StatusToggle } from '@/components/recipe/StatusToggle'
import styles from './my-recipes.module.css'

interface RecipeRowActionsProps {
  recipeId: string
  recipeSlug: string
  status: 'draft' | 'published'
}

export function RecipeRowActions({ recipeId, recipeSlug, status }: RecipeRowActionsProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteRecipe(recipeId)
    // If deleteRecipe succeeded it called redirect() — component unmounts
    // and we never reach here. If we do reach here, there was an error.
    if ('error' in result) {
      toast.error('Error', 'Could not delete recipe')
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className={styles.confirmRow}>
        <span className={styles.confirmText}>Delete this recipe?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={styles.confirmYes}
          type="button"
        >
          {deleting ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className={styles.confirmNo}
          type="button"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className={styles.actions}>
      <Link
        href={`/recipes/${recipeSlug}/edit`}
        className={styles.actionButton}
      >
        Edit
      </Link>
      <StatusToggle recipeId={recipeId} currentStatus={status} />
      <button
        onClick={() => setConfirming(true)}
        className={styles.deleteButton}
        type="button"
      >
        Delete
      </button>
    </div>
  )
}
