'use client'

/**
 * Edit / Delete action buttons for a recipe row in My Recipes.
 *
 * Client Component because delete confirmation and the Server Action call
 * need interactivity. The Server Action `deleteRecipe` handles its own
 * redirect after soft-deletion.
 */

import Link from 'next/link'
import { useState } from 'react'
import { deleteRecipe } from '@/lib/actions/recipes'
import styles from './my-recipes.module.css'

interface RecipeRowActionsProps {
  recipeId: string
  recipeSlug: string
  status: 'draft' | 'published'
}

export function RecipeRowActions({ recipeId, recipeSlug, status }: RecipeRowActionsProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteRecipe(recipeId)
    // deleteRecipe calls redirect() — page navigates away automatically
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
      {status === 'draft' && (
        <Link
          href={`/recipes/${recipeSlug}/edit?publish=1`}
          className={styles.publishButton}
        >
          Publish
        </Link>
      )}
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
