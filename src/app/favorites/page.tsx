/**
 * Favorites page — /favorites
 *
 * Authenticated Server Component. Shows all recipes the current user has
 * saved, ordered by when they were favorited (most recent first).
 */

import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import styles from './favorites.module.css'

async function getFavorites(userId: string) {
  return db.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      recipe: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          coverImageUrl: true,
          prepTimeMins: true,
          cookTimeMins: true,
          servings: true,
          cuisine: true,
          deletedAt: true,
          status: true,
          author: { select: { displayName: true } },
        },
      },
    },
  })
}

export const metadata = { title: 'Favorites' }

export default async function FavoritesPage() {
  const session = await requireSession()
  const favorites = await getFavorites(session.userId)

  // Filter out soft-deleted or unpublished recipes
  const visible = favorites.filter(
    (f) => f.recipe.status === 'published' && !f.recipe.deletedAt
  )

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Favorites</h1>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <p>No saved recipes yet.</p>
          <Link href="/recipes" className={styles.emptyLink}>
            Browse recipes
          </Link>
        </div>
      ) : (
        <>
          <p className={styles.count}>
            {visible.length} saved recipe{visible.length !== 1 ? 's' : ''}
          </p>
          <ul className={styles.grid} role="list">
            {visible.map(({ recipe }) => (
              <li key={recipe.id}>
                <RecipeCard recipe={recipe} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
