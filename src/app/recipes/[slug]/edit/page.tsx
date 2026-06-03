/**
 * Edit recipe page — /recipes/[slug]/edit
 *
 * Authenticated Server Component. Loads the existing recipe, verifies
 * ownership (or admin role), then renders RecipeForm pre-populated with
 * the recipe's current values.
 *
 * Returns 404 (via notFound()) if the recipe doesn't exist, is soft-deleted,
 * or the current user is not the author (and not an admin).
 */

import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { RecipeForm } from '@/components/recipe-form/RecipeForm'
import type { RecipeFormValues } from '@/lib/schemas/recipe'

interface EditRecipePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: EditRecipePageProps) {
  const { slug } = await params
  const recipe = await db.recipe.findFirst({
    where: { slug, deletedAt: null },
    select: { title: true },
  })
  return { title: recipe ? `Edit "${recipe.title}"` : 'Edit recipe' }
}

async function getRecipeForEdit(slug: string) {
  return db.recipe.findFirst({
    where: { slug, deletedAt: null },
    include: {
      steps: { orderBy: { order: 'asc' } },
      recipeIngredients: {
        orderBy: { order: 'asc' },
        include: { ingredient: { select: { name: true, typeId: true } } },
      },
      tags: { select: { tagId: true } },
    },
  })
}

async function getTags() {
  return db.tag.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
}

async function getIngredientTypes() {
  return db.ingredientType.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { slug } = await params
  const session = await requireSession()

  const [recipe, tags, ingredientTypes] = await Promise.all([
    getRecipeForEdit(slug),
    getTags(),
    getIngredientTypes(),
  ])

  if (!recipe) notFound()
  if (recipe.authorId !== session.userId && session.role !== 'admin') notFound()

  // Map DB row to RecipeFormValues
  const initialValues: RecipeFormValues = {
    title: recipe.title,
    description: recipe.description,
    coverImageUrl: recipe.coverImageUrl ?? '',
    prepTimeMins: recipe.prepTimeMins?.toString() ?? '',
    cookTimeMins: recipe.cookTimeMins?.toString() ?? '',
    servings: recipe.servings?.toString() ?? '',
    cuisine: recipe.cuisine ?? '',
    difficulty: recipe.difficulty ?? '',
    dietaryRestrictions: recipe.dietaryRestrictions,
    cookingMethods: recipe.cookingMethods,
    tagIds: recipe.tags.map((t) => t.tagId),
    ingredients: recipe.recipeIngredients.map((ri) => ({
      ingredientName: ri.ingredient.name,
      quantity: ri.quantity,
      unit: ri.unit ?? '',
      preparation: ri.preparation ?? '',
      groupLabel: ri.groupLabel ?? '',
      typeId: ri.ingredient.typeId,
    })),
    steps: recipe.steps.map((s) => ({ content: s.content })),
  }

  return (
    <RecipeForm
      initialValues={initialValues}
      recipeId={recipe.id}
      tags={tags}
      ingredientTypes={ingredientTypes}
    />
  )
}
