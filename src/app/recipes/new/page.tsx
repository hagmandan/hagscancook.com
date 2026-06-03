/**
 * Create recipe page — /recipes/new
 *
 * Authenticated Server Component. Fetches the tags list for the form, then
 * renders the client-side RecipeForm with no initial values.
 */

import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { RecipeForm } from '@/components/recipe-form/RecipeForm'

export const metadata = {
  title: 'New recipe',
}

async function getTags() {
  return db.tag.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
}

async function getIngredientTypes() {
  return db.ingredientType.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
}

export default async function NewRecipePage() {
  // requireSession() redirects to /login if unauthenticated
  await requireSession()
  const [tags, ingredientTypes] = await Promise.all([getTags(), getIngredientTypes()])

  return <RecipeForm tags={tags} ingredientTypes={ingredientTypes} />
}
