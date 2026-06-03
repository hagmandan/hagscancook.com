'use server'

/**
 * Favorites Server Actions.
 *
 * toggleFavorite is called from recipe detail and feed pages. It adds or
 * removes the (userId, recipeId) row from the favorites junction table.
 */

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'

/**
 * Adds or removes a recipe from the current user's favorites.
 *
 * Idempotent — calling with an already-favorited recipe unfavorites it and
 * vice versa.
 *
 * @param recipeId - The UUID of the recipe to toggle
 * @param recipeSlug - The slug, used to revalidate the detail page cache
 * @returns `{ favorited: boolean }` reflecting the new state
 */
export async function toggleFavorite(
  recipeId: string,
  recipeSlug: string
): Promise<{ favorited: boolean } | { error: string }> {
  const session = await requireSession()

  const existing = await db.favorite.findUnique({
    where: { userId_recipeId: { userId: session.userId, recipeId } },
    select: { userId: true },
  })

  if (existing) {
    await db.favorite.delete({
      where: { userId_recipeId: { userId: session.userId, recipeId } },
    })
    revalidatePath(`/recipes/${recipeSlug}`)
    revalidatePath('/favorites')
    return { favorited: false }
  }

  await db.favorite.create({
    data: { userId: session.userId, recipeId },
  })
  revalidatePath(`/recipes/${recipeSlug}`)
  revalidatePath('/favorites')
  return { favorited: true }
}
