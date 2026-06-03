'use client'

/**
 * Favorite toggle button — shown on recipe detail pages.
 *
 * Calls the `toggleFavorite` Server Action and updates local state
 * optimistically while the action resolves.
 */

import { useState, useTransition } from 'react'
import { toggleFavorite } from '@/lib/actions/favorites'
import styles from './FavoriteButton.module.css'

interface FavoriteButtonProps {
  recipeId: string
  recipeSlug: string
  initialFavorited: boolean
}

export function FavoriteButton({
  recipeId,
  recipeSlug,
  initialFavorited,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    // Optimistic update
    setFavorited((prev) => !prev)
    startTransition(async () => {
      const result = await toggleFavorite(recipeId, recipeSlug)
      if ('error' in result) {
        // Revert on error
        setFavorited((prev) => !prev)
      } else {
        setFavorited(result.favorited)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`${styles.button} ${favorited ? styles.favorited : ''}`}
      aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
      aria-pressed={favorited}
      data-testid="favorite-button"
    >
      <span className={styles.icon} aria-hidden>{favorited ? '♥' : '♡'}</span>
      <span>{favorited ? 'Saved' : 'Save'}</span>
    </button>
  )
}
