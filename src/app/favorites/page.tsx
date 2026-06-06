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
    where: {
      userId,
      recipe: { status: 'published', deletedAt: null },
    },
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

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Favorites</h1>

      {favorites.length === 0 ? (
        <div className={styles.empty}>
          <p>No saved recipes yet.</p>
          <Link href="/recipes" className={styles.emptyLink}>
            Browse recipes
          </Link>
        </div>
      ) : (
        <>
          <p className={styles.count}>
            {favorites.length} saved recipe{favorites.length !== 1 ? 's' : ''}
          </p>
          <ul className={styles.grid} role="list">
            {favorites.map(({ recipe }) => (
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
