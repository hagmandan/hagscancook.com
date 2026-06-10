'use server'

/**
 * Admin Server Actions.
 *
 * All actions require `admin` role — enforced by `requireAdmin()` on every call.
 */

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { toSlug } from '@/lib/utils/slugify'
import { captureException } from '@/lib/monitoring/errors'
import { parseOrError } from '@/lib/schemas/validation'
import { TagSchema, IngredientTypeSchema, IngredientSchema } from '@/lib/schemas/admin'
import { revalidateRecipeFeeds } from '@/lib/utils/revalidation'
import type { Role } from '@prisma/client'

// ---------------------------------------------------------------------------
// Recipe moderation
// ---------------------------------------------------------------------------

/**
 * Hard-unpublishes a recipe (sets status back to draft) for policy violations.
 * Does not soft-delete — the author can re-edit and republish.
 */
export async function unpublishRecipe(
  recipeId: string
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const recipe = await db.recipe.findUnique({
    where: { id: recipeId, deletedAt: null },
    select: { slug: true },
  })
  if (!recipe) return { error: 'Recipe not found' }

  await db.recipe.update({
    where: { id: recipeId },
    data: { status: 'draft' },
  })
  revalidateRecipeFeeds(recipe.slug)
  revalidatePath('/admin')
  return { ok: true }
}

/**
 * Permanently soft-deletes a recipe. Admin-only.
 */
export async function adminDeleteRecipe(
  recipeId: string
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const recipe = await db.recipe.findUnique({
    where: { id: recipeId, deletedAt: null },
    select: { slug: true },
  })
  if (!recipe) return { error: 'Recipe not found' }

  await db.recipe.update({
    where: { id: recipeId },
    data: { deletedAt: new Date() },
  })
  revalidateRecipeFeeds(recipe.slug)
  revalidatePath('/admin')
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Image moderation
// ---------------------------------------------------------------------------

/**
 * Approves a recipe's pending cover image, making it publicly visible.
 */
export async function approveRecipeImage(
  recipeId: string
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const recipe = await db.recipe.findUnique({
    where: { id: recipeId, deletedAt: null },
    select: { slug: true },
  })
  if (!recipe) return { error: 'Recipe not found' }

  await db.recipe.update({
    where: { id: recipeId },
    data: { coverImageStatus: 'approved' },
  })
  revalidatePath(`/recipes/${recipe.slug}`)
  revalidatePath(`/recipes/${recipe.slug}/edit`)
  revalidatePath('/admin/images')
  return { ok: true }
}

/**
 * Rejects a recipe's pending cover image. The file is kept in Firebase Storage;
 * admin removes manually if needed. The user sees an in-app rejection notice.
 */
export async function rejectRecipeImage(
  recipeId: string
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const recipe = await db.recipe.findUnique({
    where: { id: recipeId, deletedAt: null },
    select: { slug: true },
  })
  if (!recipe) return { error: 'Recipe not found' }

  await db.recipe.update({
    where: { id: recipeId },
    data: { coverImageStatus: 'rejected' },
  })
  revalidatePath(`/recipes/${recipe.slug}/edit`)
  revalidatePath('/admin/images')
  return { ok: true }
}

// ---------------------------------------------------------------------------
// User role management
// ---------------------------------------------------------------------------

const VALID_ROLES: Role[] = ['user', 'chef', 'admin']

/**
 * Updates a user's role.
 *
 * @param userId - The user's DB UUID
 * @param role - New role value
 */
export async function setUserRole(
  userId: string,
  role: string
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  if (!VALID_ROLES.includes(role as Role)) {
    return { error: `Invalid role: ${role}` }
  }
  await db.user.update({
    where: { id: userId },
    data: { role: role as Role },
  })
  revalidatePath('/admin/users')
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Tag management
// ---------------------------------------------------------------------------

/** Creates a new tag. Slug is auto-generated from name. */
export async function createTag(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const result = parseOrError(TagSchema, { name: formData.get('name') }, 'Invalid')
  if ('error' in result) return result

  const slug = toSlug(result.data.name)
  try {
    await db.tag.create({ data: { name: result.data.name, slug } })
  } catch (err) {
    captureException(err, { feature: 'admin', operation: 'create-tag', runtime: 'server' })
    return { error: 'A tag with that name already exists' }
  }
  revalidatePath('/admin/tags')
  return { ok: true }
}

/** Deletes a tag. RecipeTag rows cascade-delete via onDelete: Cascade. */
export async function deleteTag(
  tagId: string
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  await db.tag.delete({ where: { id: tagId } })
  revalidatePath('/admin/tags')
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Ingredient type management
// ---------------------------------------------------------------------------

/** Creates a new ingredient type. */
export async function createIngredientType(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const result = parseOrError(IngredientTypeSchema, { name: formData.get('name') }, 'Invalid')
  if ('error' in result) return result

  const slug = toSlug(result.data.name)
  try {
    await db.ingredientType.create({ data: { name: result.data.name, slug } })
  } catch (err) {
    captureException(err, { feature: 'admin', operation: 'create-ingredient-type', runtime: 'server' })
    return { error: 'An ingredient type with that name already exists' }
  }
  revalidatePath('/admin/ingredients')
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Ingredient management
// ---------------------------------------------------------------------------

/** Creates a new canonical ingredient. */
export async function createIngredient(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const result = parseOrError(IngredientSchema, {
    name: formData.get('name'),
    typeId: formData.get('typeId'),
  }, 'Invalid')
  if ('error' in result) return result

  try {
    await db.ingredient.create({
      data: {
        name: result.data.name.toLowerCase().trim(),
        typeId: result.data.typeId,
      },
    })
  } catch (err) {
    captureException(err, { feature: 'admin', operation: 'create-ingredient', runtime: 'server' })
    return { error: 'An ingredient with that name already exists' }
  }
  revalidatePath('/admin/ingredients')
  return { ok: true }
}

/** Re-categorises an existing ingredient to a different type. */
export async function updateIngredientType(
  ingredientId: string,
  typeId: string
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  await db.ingredient.update({
    where: { id: ingredientId },
    data: { typeId },
  })
  revalidatePath('/admin/ingredients')
  return { ok: true }
}
