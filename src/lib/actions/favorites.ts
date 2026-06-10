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
import { captureException } from '@/lib/monitoring/errors'
import { checkAndAwardBadges, type NewBadge } from '@/lib/badges'

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
): Promise<{ favorited: boolean; newBadges: NewBadge[] } | { error: string }> {
  const session = await requireSession()

  try {
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
      return { favorited: false, newBadges: [] }
    }

    const recipe = await db.recipe.findUnique({
      where: { id: recipeId },
      select: { authorId: true },
    })

    await db.favorite.create({
      data: { userId: session.userId, recipeId },
    })

    revalidatePath(`/recipes/${recipeSlug}`)
    revalidatePath('/favorites')

    // Award badges to the recipe's author.
    // Only include in the response when the current user IS the author —
    // otherwise the badge is awarded silently and the author sees it on
    // their profile next visit.
    const isOwnRecipe = recipe?.authorId === session.userId
    const authorId = recipe?.authorId ?? session.userId

    const [communityBadges, hitMakerBadges] = await Promise.all([
      checkAndAwardBadges(authorId, 'COMMUNITY_FAVORITE'),
      checkAndAwardBadges(authorId, 'HIT_MAKER'),
    ])

    const newBadges = isOwnRecipe ? [...communityBadges, ...hitMakerBadges] : []

    return { favorited: true, newBadges }
  } catch (err) {
    captureException(err, { feature: 'favorites', operation: 'toggle', runtime: 'server' })
    return { error: 'Failed to update favorite. Please try again.' }
  }
}
