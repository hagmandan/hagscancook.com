'use client'

import { useState, useTransition } from 'react'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import {
  loadMoreRecipes,
  type RecipeFilters,
  type RecipeSummary,
} from '@/lib/actions/recipes'
import styles from './recipes.module.css'

interface RecipesFeedProps {
  initialRecipes: RecipeSummary[]
  initialCursor: string | null
  filters: RecipeFilters
}

export function RecipesFeed({
  initialRecipes,
  initialCursor,
  filters,
}: RecipesFeedProps) {
  const [recipes, setRecipes] = useState(initialRecipes)
  const [cursor, setCursor] = useState(initialCursor)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleLoadMore() {
    if (!cursor) return
    setError(null)
    startTransition(async () => {
      try {
        const result = await loadMoreRecipes(cursor, filters)
        setRecipes((prev) => [...prev, ...result.recipes])
        setCursor(result.nextCursor)
      } catch {
        setError("Couldn't load more — try again")
      }
    })
  }

  return (
    <>
      <ul className={styles.grid} role="list">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <RecipeCard recipe={recipe} />
          </li>
        ))}
      </ul>
      {cursor !== null && (
        <div className={styles.loadMore}>
          <button
            onClick={handleLoadMore}
            disabled={isPending}
            className={styles.loadMoreButton}
          >
            {isPending ? 'Loading...' : 'Load more recipes'}
          </button>
          {error && <p className={styles.loadMoreError}>{error}</p>}
        </div>
      )}
    </>
  )
}
