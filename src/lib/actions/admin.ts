'use server'

/**
 * Admin Server Actions.
 *
 * All actions require `admin` role — enforced by `requireAdmin()` on every call.
 */

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { toSlug } from '@/lib/utils/slugify'
import { captureException } from '@/lib/monitoring/errors'
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
    where: { id: recipeId },
    select: { slug: true },
  })
  if (!recipe) return { error: 'Recipe not found' }

  await db.recipe.update({
    where: { id: recipeId },
    data: { status: 'draft' },
  })
  revalidatePath('/')
  revalidatePath('/recipes')
  revalidatePath(`/recipes/${recipe.slug}`)
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
    where: { id: recipeId },
    select: { slug: true },
  })
  if (!recipe) return { error: 'Recipe not found' }

  await db.recipe.update({
    where: { id: recipeId },
    data: { deletedAt: new Date() },
  })
  revalidatePath('/')
  revalidatePath('/recipes')
  revalidatePath('/admin')
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

const TagSchema = z.object({
  name: z.string().min(1).max(60),
})

/** Creates a new tag. Slug is auto-generated from name. */
export async function createTag(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const parsed = TagSchema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid' }

  const slug = toSlug(parsed.data.name)
  try {
    await db.tag.create({ data: { name: parsed.data.name, slug } })
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

const IngredientTypeSchema = z.object({
  name: z.string().min(1).max(60),
})

/** Creates a new ingredient type. */
export async function createIngredientType(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const parsed = IngredientTypeSchema.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid' }

  const slug = toSlug(parsed.data.name)
  try {
    await db.ingredientType.create({ data: { name: parsed.data.name, slug } })
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

const IngredientSchema = z.object({
  name: z.string().min(1).max(120),
  typeId: z.string().uuid(),
})

/** Creates a new canonical ingredient. */
export async function createIngredient(
  formData: FormData
): Promise<{ ok: true } | { error: string }> {
  await requireAdmin()
  const parsed = IngredientSchema.safeParse({
    name: formData.get('name'),
    typeId: formData.get('typeId'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid' }

  try {
    await db.ingredient.create({
      data: {
        name: parsed.data.name.toLowerCase().trim(),
        typeId: parsed.data.typeId,
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
