/**
 * Recipe Server Actions.
 *
 * All mutations go through these functions. Each re-verifies auth with
 * `requireSession()` before touching the DB — Server Actions are reachable
 * via direct POST and must not trust the proxy layer alone.
 *
 * Ingredient handling:
 *   Canonical `Ingredient` rows are upserted by name (case-insensitive).
 *   New ingredients default to the "Produce" ingredient type; an admin can
 *   re-categorise them via /admin/ingredients.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import type { Prisma } from '@prisma/client'
import { RecipeSchema, type RecipeFormValues } from '@/lib/schemas/recipe'
import { generateUniqueSlug } from '@/lib/utils/slugify'
import { resolveIngredient } from '@/lib/ingredients'
import { captureException } from '@/lib/monitoring/errors'

// ---------------------------------------------------------------------------
// createRecipe
// ---------------------------------------------------------------------------

/**
 * Creates a new recipe draft owned by the current user.
 *
 * Validates input with RecipeSchema, generates a unique slug from the title,
 * upserts canonical ingredients, then writes the recipe + all related rows
 * in a single transaction.
 *
 * @param formData - Raw form values from RecipeForm
 * @param publish - When true, sets status to `published` immediately
 * @returns The new recipe's slug (for redirect)
 * @throws Redirects to /login if unauthenticated
 */
export async function createRecipe(
  formData: RecipeFormValues,
  publish = false
): Promise<{ slug: string } | { error: string }> {
  const session = await requireSession()

  const parsed = RecipeSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid recipe data' }
  }

  const data = parsed.data
  const slug = await generateUniqueSlug(data.title)

  // Resolve ingredient IDs (find or create canonical ingredients)
  const ingredientIds = await Promise.all(
    data.ingredients.map((i) => resolveIngredient(i.ingredientName, i.typeId))
  )

  try {
    const recipe = await db.recipe.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        coverImageUrl: data.coverImageUrl || null,
        prepTimeMins: data.prepTimeMins ?? null,
        cookTimeMins: data.cookTimeMins ?? null,
        servings: data.servings ?? null,
        cuisine: data.cuisine ?? null,
        difficulty: data.difficulty ?? null,
        dietaryRestrictions: data.dietaryRestrictions,
        cookingMethods: data.cookingMethods,
        status: publish ? 'published' : 'draft',
        authorId: session.userId,
        steps: {
          create: data.steps.map((s, i) => ({
            order: i + 1,
            content: s.content,
          })),
        },
        recipeIngredients: {
          create: data.ingredients.map((ing, i) => ({
            ingredientId: ingredientIds[i],
            quantity: ing.quantity,
            unit: ing.unit || null,
            preparation: ing.preparation || null,
            groupLabel: ing.groupLabel || null,
            order: i + 1,
          })),
        },
        tags: {
          create: data.tagIds.map((tagId) => ({ tagId })),
        },
      },
      select: { slug: true },
    })

    revalidatePath('/')
    revalidatePath('/recipes')
    revalidatePath('/my-recipes')

    return { slug: recipe.slug }
  } catch (err) {
    captureException(err, {
      feature: 'recipe-form',
      operation: publish ? 'publish' : 'create',
      ingredientCount: data.ingredients.length,
      stepCount: data.steps.length,
      runtime: 'server',
    })
    return { error: 'Failed to save recipe. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// updateRecipe
// ---------------------------------------------------------------------------

/**
 * Updates an existing recipe owned by the current user (or any recipe for admins).
 *
 * Replaces steps, ingredients, and tags wholesale rather than diffing them,
 * which keeps the logic simple for MVP.
 *
 * @param recipeId - The recipe's UUID
 * @param formData - Raw form values from RecipeForm
 * @param publish - When true, sets status to `published`
 * @returns The (potentially updated) recipe slug
 * @throws Redirects to /login if unauthenticated; returns error if not owner
 */
export async function updateRecipe(
  recipeId: string,
  formData: RecipeFormValues,
  publish = false
): Promise<{ slug: string } | { error: string }> {
  const session = await requireSession()

  const existing = await db.recipe.findUnique({
    where: { id: recipeId },
    select: { authorId: true, slug: true, title: true },
  })

  if (!existing) return { error: 'Recipe not found' }
  if (existing.authorId !== session.userId && session.role !== 'admin') {
    return { error: 'Not authorised to edit this recipe' }
  }

  const parsed = RecipeSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid recipe data' }
  }

  const data = parsed.data

  // Re-generate slug only if title changed
  const slug =
    data.title !== existing.title
      ? await generateUniqueSlug(data.title, recipeId)
      : existing.slug

  const ingredientIds = await Promise.all(
    data.ingredients.map((i) => resolveIngredient(i.ingredientName, i.typeId))
  )

  try {
    await db.$transaction([
      // Delete and recreate child rows — simplest approach for MVP
      db.step.deleteMany({ where: { recipeId } }),
      db.recipeIngredient.deleteMany({ where: { recipeId } }),
      db.recipeTag.deleteMany({ where: { recipeId } }),

      db.recipe.update({
        where: { id: recipeId },
        data: {
          slug,
          title: data.title,
          description: data.description,
          coverImageUrl: data.coverImageUrl || null,
          prepTimeMins: data.prepTimeMins ?? null,
          cookTimeMins: data.cookTimeMins ?? null,
          servings: data.servings ?? null,
          cuisine: data.cuisine ?? null,
          difficulty: data.difficulty ?? null,
          dietaryRestrictions: data.dietaryRestrictions,
          cookingMethods: data.cookingMethods,
          ...(publish ? { status: 'published' } : {}),
          steps: {
            create: data.steps.map((s, i) => ({
              order: i + 1,
              content: s.content,
            })),
          },
          recipeIngredients: {
            create: data.ingredients.map((ing, i) => ({
              ingredientId: ingredientIds[i],
              quantity: ing.quantity,
              unit: ing.unit || null,
              preparation: ing.preparation || null,
              groupLabel: ing.groupLabel || null,
              order: i + 1,
            })),
          },
          tags: {
            create: data.tagIds.map((tagId) => ({ tagId })),
          },
        },
      }),
    ])

    revalidatePath('/')
    revalidatePath('/recipes')
    revalidatePath(`/recipes/${slug}`)
    revalidatePath('/my-recipes')

    return { slug }
  } catch (err) {
    captureException(err, {
      feature: 'recipe-form',
      operation: publish ? 'publish' : 'update',
      recipeId,
      ingredientCount: data.ingredients.length,
      stepCount: data.steps.length,
      runtime: 'server',
    })
    return { error: 'Failed to save recipe. Please try again.' }
  }
}

// ---------------------------------------------------------------------------
// deleteRecipe (soft delete)
// ---------------------------------------------------------------------------

/**
 * Soft-deletes a recipe by setting `deletedAt`. Never hard-deletes.
 *
 * @param recipeId - The recipe's UUID
 * @throws Returns error if user is not the author or admin
 */
export async function deleteRecipe(
  recipeId: string
): Promise<{ ok: true } | { error: string }> {
  const session = await requireSession()

  const existing = await db.recipe.findUnique({
    where: { id: recipeId },
    select: { authorId: true, slug: true },
  })

  if (!existing) return { error: 'Recipe not found' }
  if (existing.authorId !== session.userId && session.role !== 'admin') {
    return { error: 'Not authorised to delete this recipe' }
  }

  try {
    await db.recipe.update({
      where: { id: recipeId },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/')
    revalidatePath('/recipes')
    revalidatePath(`/recipes/${existing.slug}`)
    revalidatePath('/my-recipes')
  } catch (err) {
    captureException(err, {
      feature: 'recipe-form',
      operation: 'delete',
      recipeId,
      runtime: 'server',
    })
    return { error: 'Failed to delete recipe. Please try again.' }
  }

  // redirect() throws a special Next.js signal — must be outside try/catch
  redirect('/my-recipes')
}

// ---------------------------------------------------------------------------
// loadMoreRecipes
// ---------------------------------------------------------------------------

const FEED_PAGE_SIZE = 20

export type RecipeFilters = {
  cuisine?: string
  dietary?: string
  tag?: string
}

export type RecipeSummary = {
  id: string
  slug: string
  title: string
  description: string
  coverImageUrl: string | null
  prepTimeMins: number | null
  cookTimeMins: number | null
  servings: number | null
  cuisine: string | null
  author: { displayName: string }
}

export type RecipePage = {
  recipes: RecipeSummary[]
  nextCursor: string | null
}

export async function loadMoreRecipes(
  cursor: string,
  filters: RecipeFilters
): Promise<RecipePage> {
  await requireSession()

  const where: Prisma.RecipeWhereInput = {
    status: 'published',
    deletedAt: null,
    ...(filters.cuisine ? { cuisine: filters.cuisine } : {}),
    ...(filters.dietary ? { dietaryRestrictions: { has: filters.dietary } } : {}),
    ...(filters.tag ? { tags: { some: { tag: { slug: filters.tag } } } } : {}),
  }

  try {
    const rows = await db.recipe.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: FEED_PAGE_SIZE + 1,
      cursor: { id: cursor },
      skip: 1,
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
    })

    const hasMore = rows.length > FEED_PAGE_SIZE
    const recipes = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows
    const nextCursor = hasMore ? recipes[recipes.length - 1].id : null

    return { recipes, nextCursor }
  } catch (err) {
    captureException(err, {
      feature: 'recipe-feed',
      operation: 'load-more',
      cursor,
      runtime: 'server',
    })
    throw err
  }
}

// ---------------------------------------------------------------------------
// toggleRecipeStatus
// ---------------------------------------------------------------------------

/**
 * Flips a recipe's status between draft and published.
 * Only the recipe's author can call this.
 *
 * @param recipeId - The recipe's UUID
 */
export async function toggleRecipeStatus(
  recipeId: string
): Promise<{ status: 'draft' | 'published' } | { error: string }> {
  const session = await requireSession()

  const existing = await db.recipe.findUnique({
    where: { id: recipeId },
    select: { authorId: true, slug: true, status: true },
  })

  if (!existing) return { error: 'Recipe not found' }
  if (existing.authorId !== session.userId) {
    return { error: 'Not authorised to update this recipe' }
  }

  const newStatus = existing.status === 'published' ? 'draft' : 'published'

  try {
    await db.recipe.update({
      where: { id: recipeId },
      data: { status: newStatus },
    })

    revalidatePath('/')
    revalidatePath('/my-recipes')
    revalidatePath(`/recipes/${existing.slug}`)
    revalidatePath('/recipes')

    return { status: newStatus }
  } catch (err) {
    captureException(err, {
      feature: 'recipe-status',
      operation: 'toggle',
      recipeId,
      runtime: 'server',
    })
    return { error: 'Failed to update recipe status. Please try again.' }
  }
}
