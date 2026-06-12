'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { deleteRecipe } from '@/lib/actions/recipes'
import { useToast } from '@/lib/toast'
import { StatusToggle } from '@/components/recipe/StatusToggle'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import styles from './my-recipes.module.css'

interface RecipeRowActionsProps {
  recipeId: string
  recipeSlug: string
  status: 'draft' | 'published'
}

export function RecipeRowActions({ recipeId, recipeSlug, status }: RecipeRowActionsProps) {
  const [isPending, startTransition] = useTransition()
  const toast = useToast()

  function handleDelete() {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const result = await deleteRecipe(recipeId)
        // If deleteRecipe succeeded it called redirect() — component unmounts
        // and we never reach here. If we do reach here, there was an error.
        if ('error' in result) {
          toast.error('Error', 'Could not delete recipe')
        }
        resolve()
      })
    })
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
      <ConfirmButton
        label="Delete"
        confirmQuestion="Delete this recipe?"
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        isPending={isPending}
        pendingLabel="Deleting…"
        danger
      />
    </div>
  )
}
