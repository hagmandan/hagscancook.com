import { revalidatePath } from 'next/cache'

/**
 * Revalidates the recipe feed pages that need updating after any recipe
 * mutation. Pass a slug to also clear the recipe's own detail page.
 */
export function revalidateRecipeFeeds(slug?: string) {
  revalidatePath('/')
  revalidatePath('/recipes')
  revalidatePath('/my-recipes')
  if (slug) revalidatePath(`/recipes/${slug}`)
}
