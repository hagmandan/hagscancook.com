import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    $transaction: vi.fn(),
    recipe: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    step: {
      deleteMany: vi.fn(),
    },
    recipeIngredient: {
      deleteMany: vi.fn(),
    },
    recipeTag: {
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  requireSession: vi.fn(),
}))

vi.mock('@/lib/monitoring/errors', () => ({
  captureException: vi.fn(),
}))

vi.mock('@/lib/utils/slugify', () => ({
  generateUniqueSlug: vi.fn(),
}))

vi.mock('@/lib/ingredients', () => ({
  resolveIngredient: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

vi.mock('@/lib/badges', () => ({
  checkAndAwardBadges: vi.fn().mockResolvedValue([]),
}))

import { createRecipe, loadMoreRecipes, toggleRecipeStatus, updateRecipe } from './recipes'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { resolveIngredient } from '@/lib/ingredients'
import { generateUniqueSlug } from '@/lib/utils/slugify'
import { revalidatePath } from 'next/cache'
import type { RecipeFormValues } from '@/lib/schemas/recipe'

const mockCreate = vi.mocked(db.recipe.create)
const mockFindMany = vi.mocked(db.recipe.findMany)
const mockFindUnique = vi.mocked(db.recipe.findUnique)
const mockRecipeUpdate = vi.mocked(db.recipe.update)
const mockRequireSession = vi.mocked(requireSession)
const mockResolveIngredient = vi.mocked(resolveIngredient)
const mockGenerateUniqueSlug = vi.mocked(generateUniqueSlug)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockTransaction = vi.mocked(db.$transaction)
const mockStepDeleteMany = vi.mocked(db.step.deleteMany)
const mockRecipeIngredientDeleteMany = vi.mocked(db.recipeIngredient.deleteMany)
const mockRecipeTagDeleteMany = vi.mocked(db.recipeTag.deleteMany)

const validRecipeForm: RecipeFormValues = {
  title: 'Lemon Pasta',
  description: 'A bright weeknight pasta.',
  coverImageUrl: '',
  prepTimeMins: '15',
  cookTimeMins: '20',
  servings: '4',
  cuisine: 'Italian',
  difficulty: 'Easy',
  dietaryRestrictions: ['Vegetarian'],
  cookingMethods: ['Boil'],
  tagIds: ['11111111-1111-4111-8111-111111111111'],
  ingredients: [
    {
      ingredientName: 'pasta',
      quantity: '1',
      unit: 'lb',
      preparation: '',
      groupLabel: '',
      typeId: '',
    },
  ],
  steps: [{ content: 'Boil the pasta.' }],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireSession.mockResolvedValue({ userId: 'user-1', role: 'user' })
  mockGenerateUniqueSlug.mockResolvedValue('lemon-pasta')
  mockResolveIngredient.mockResolvedValue('ingredient-1')
  mockCreate.mockResolvedValue({ slug: 'lemon-pasta' })
  mockTransaction.mockResolvedValue([])
  mockStepDeleteMany.mockReturnValue({ query: 'delete-steps' } as never)
  mockRecipeIngredientDeleteMany.mockReturnValue({ query: 'delete-ingredients' } as never)
  mockRecipeTagDeleteMany.mockReturnValue({ query: 'delete-tags' } as never)
})

function makeRecipe(id: string) {
  return {
    id,
    slug: `recipe-${id}`,
    title: `Recipe ${id}`,
    description: 'A recipe',
    coverImageUrl: null,
    prepTimeMins: null,
    cookTimeMins: null,
    servings: null,
    cuisine: null,
    author: { displayName: 'Chef' },
  }
}

describe('createRecipe', () => {
  it('returns a validation error without writing when input is invalid', async () => {
    const result = await createRecipe({ ...validRecipeForm, title: '' })

    expect(result).toEqual({ error: 'Title is required' })
    expect(mockCreate).not.toHaveBeenCalled()
    expect(mockGenerateUniqueSlug).not.toHaveBeenCalled()
    expect(mockResolveIngredient).not.toHaveBeenCalled()
  })

  it('creates a draft recipe with normalized nested payload', async () => {
    const result = await createRecipe(validRecipeForm)

    expect(result).toEqual({ slug: 'lemon-pasta', newBadges: [] })
    expect(mockGenerateUniqueSlug).toHaveBeenCalledWith('Lemon Pasta')
    expect(mockResolveIngredient).toHaveBeenCalledWith('pasta', '')
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: 'lemon-pasta',
        title: 'Lemon Pasta',
        description: 'A bright weeknight pasta.',
        coverImageUrl: null,
        prepTimeMins: 15,
        cookTimeMins: 20,
        servings: 4,
        cuisine: 'Italian',
        difficulty: 'Easy',
        dietaryRestrictions: ['Vegetarian'],
        cookingMethods: ['Boil'],
        status: 'draft',
        authorId: 'user-1',
        steps: { create: [{ order: 1, content: 'Boil the pasta.' }] },
        recipeIngredients: {
          create: [
            {
              ingredientId: 'ingredient-1',
              quantity: '1',
              unit: 'lb',
              preparation: null,
              groupLabel: null,
              order: 1,
            },
          ],
        },
        tags: { create: [{ tagId: '11111111-1111-4111-8111-111111111111' }] },
      }),
      select: { slug: true },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/recipes')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/my-recipes')
  })

  it('sets published status when requested', async () => {
    await createRecipe(validRecipeForm, true)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'published' }),
      }),
    )
  })

  it('sets coverImageStatus to pending_approval when a cover image is provided', async () => {
    await createRecipe({
      ...validRecipeForm,
      coverImageUrl: 'https://storage.googleapis.com/bucket/covers/uid/123.jpg',
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          coverImageUrl: 'https://storage.googleapis.com/bucket/covers/uid/123.jpg',
          coverImageStatus: 'pending_approval',
        }),
      })
    )
  })

  it('sets coverImageStatus to null when no cover image provided', async () => {
    await createRecipe(validRecipeForm) // coverImageUrl: ''

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          coverImageUrl: null,
          coverImageStatus: null,
        }),
      })
    )
  })
})

describe('loadMoreRecipes', () => {
  it('returns recipes and null nextCursor when fewer than 20 results come back', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => makeRecipe(String(i)))
    mockFindMany.mockResolvedValue(rows)

    const result = await loadMoreRecipes('cursor-id', {})

    expect(result.recipes).toHaveLength(5)
    expect(result.nextCursor).toBeNull()
  })

  it('slices to 20 and sets nextCursor when 21 rows come back', async () => {
    const rows = Array.from({ length: 21 }, (_, i) => makeRecipe(String(i)))
    mockFindMany.mockResolvedValue(rows)

    const result = await loadMoreRecipes('cursor-id', {})

    expect(result.recipes).toHaveLength(20)
    expect(result.nextCursor).toBe('19')
  })

  it('queries with cursor and skip:1', async () => {
    mockFindMany.mockResolvedValue([])

    await loadMoreRecipes('abc-cursor', {})

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: 'abc-cursor' },
        skip: 1,
        take: 21,
      }),
    )
  })

  it('passes cuisine filter to the where clause', async () => {
    mockFindMany.mockResolvedValue([])

    await loadMoreRecipes('abc', { cuisine: 'Italian' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ cuisine: 'Italian' }),
      }),
    )
  })

  it('passes dietary filter to the where clause', async () => {
    mockFindMany.mockResolvedValue([])

    await loadMoreRecipes('abc', { dietary: 'Vegan' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dietaryRestrictions: { has: 'Vegan' },
        }),
      }),
    )
  })

  it('passes tag filter to the where clause', async () => {
    mockFindMany.mockResolvedValue([])

    await loadMoreRecipes('abc', { tag: 'quick-meals' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tags: { some: { tag: { slug: 'quick-meals' } } },
        }),
      }),
    )
  })

  it('excludes recipes authored by test-role users', async () => {
    mockFindMany.mockResolvedValue([])

    await loadMoreRecipes('abc', {})

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          author: { role: { not: 'test' } },
        }),
      }),
    )
  })
})

describe('updateRecipe', () => {
  it('blocks edits by non-authors', async () => {
    mockFindUnique.mockResolvedValue({ authorId: 'other-user', slug: 'old-slug', title: 'Old Title', coverImageUrl: null })

    const result = await updateRecipe('recipe-1', validRecipeForm)

    expect(result).toEqual({ error: 'Not authorised to edit this recipe' })
    expect(mockTransaction).not.toHaveBeenCalled()
    expect(mockRecipeUpdate).not.toHaveBeenCalled()
  })

  it('updates a recipe and regenerates the slug when title changes', async () => {
    mockFindUnique.mockResolvedValue({ authorId: 'user-1', slug: 'old-slug', title: 'Old Title', coverImageUrl: null })
    mockRecipeUpdate.mockReturnValue({ query: 'update-recipe' } as never)

    const result = await updateRecipe('recipe-1', validRecipeForm, true)

    expect(result).toEqual({ slug: 'lemon-pasta', newBadges: [] })
    expect(mockGenerateUniqueSlug).toHaveBeenCalledWith('Lemon Pasta', 'recipe-1')
    expect(mockStepDeleteMany).toHaveBeenCalledWith({ where: { recipeId: 'recipe-1' } })
    expect(mockRecipeIngredientDeleteMany).toHaveBeenCalledWith({ where: { recipeId: 'recipe-1' } })
    expect(mockRecipeTagDeleteMany).toHaveBeenCalledWith({ where: { recipeId: 'recipe-1' } })
    expect(mockRecipeUpdate).toHaveBeenCalledWith({
      where: { id: 'recipe-1' },
      data: expect.objectContaining({
        slug: 'lemon-pasta',
        title: 'Lemon Pasta',
        status: 'published',
        steps: { create: [{ order: 1, content: 'Boil the pasta.' }] },
        recipeIngredients: {
          create: [
            expect.objectContaining({
              ingredientId: 'ingredient-1',
              quantity: '1',
              order: 1,
            }),
          ],
        },
      }),
    })
    expect(mockTransaction).toHaveBeenCalledWith([
      { query: 'delete-steps' },
      { query: 'delete-ingredients' },
      { query: 'delete-tags' },
      { query: 'update-recipe' },
    ])
    expect(mockRevalidatePath).toHaveBeenCalledWith('/my-recipes')
  })

  it('sets coverImageStatus to pending_approval when a new image URL is saved', async () => {
    mockFindUnique.mockResolvedValue({
      authorId: 'user-1',
      slug: 'lemon-pasta',
      title: 'Lemon Pasta',
      coverImageUrl: null,
    })
    mockRecipeUpdate.mockReturnValue({ query: 'update-recipe' } as never)

    await updateRecipe('recipe-1', {
      ...validRecipeForm,
      coverImageUrl: 'https://storage.googleapis.com/bucket/covers/uid/456.jpg',
    })

    expect(mockRecipeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ coverImageStatus: 'pending_approval' }),
      })
    )
  })

  it('preserves image status when the URL is unchanged on save', async () => {
    const existingUrl = 'https://storage.googleapis.com/bucket/covers/uid/456.jpg'
    mockFindUnique.mockResolvedValue({
      authorId: 'user-1',
      slug: 'lemon-pasta',
      title: 'Lemon Pasta',
      coverImageUrl: existingUrl,
    })
    mockRecipeUpdate.mockReturnValue({ query: 'update-recipe' } as never)

    await updateRecipe('recipe-1', { ...validRecipeForm, coverImageUrl: existingUrl })

    // coverImageStatus must NOT be in the update payload — status is preserved
    expect(mockRecipeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ coverImageStatus: expect.anything() }),
      })
    )
  })

  it('clears image status when image is removed', async () => {
    mockFindUnique.mockResolvedValue({
      authorId: 'user-1',
      slug: 'lemon-pasta',
      title: 'Lemon Pasta',
      coverImageUrl: 'https://storage.googleapis.com/bucket/covers/uid/456.jpg',
    })
    mockRecipeUpdate.mockReturnValue({ query: 'update-recipe' } as never)

    await updateRecipe('recipe-1', { ...validRecipeForm, coverImageUrl: '' })

    expect(mockRecipeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ coverImageStatus: null }),
      })
    )
  })
})

describe('toggleRecipeStatus', () => {
  it('blocks status updates by non-authors', async () => {
    mockFindUnique.mockResolvedValue({ authorId: 'other-user', slug: 'lemon-pasta', status: 'draft' })

    const result = await toggleRecipeStatus('recipe-1')

    expect(result).toEqual({ error: 'Not authorised to update this recipe' })
    expect(mockRecipeUpdate).not.toHaveBeenCalled()
  })

  it('publishes draft recipes', async () => {
    mockFindUnique.mockResolvedValue({ authorId: 'user-1', slug: 'lemon-pasta', status: 'draft' })
    mockRecipeUpdate.mockResolvedValue({})

    await expect(toggleRecipeStatus('recipe-1')).resolves.toEqual({ status: 'published' })

    expect(mockRecipeUpdate).toHaveBeenCalledWith({
      where: { id: 'recipe-1' },
      data: { status: 'published' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/recipes')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/recipes/lemon-pasta')
  })

  it('moves published recipes back to drafts', async () => {
    mockFindUnique.mockResolvedValue({ authorId: 'user-1', slug: 'lemon-pasta', status: 'published' })
    mockRecipeUpdate.mockResolvedValue({})

    await expect(toggleRecipeStatus('recipe-1')).resolves.toEqual({ status: 'draft' })

    expect(mockRecipeUpdate).toHaveBeenCalledWith({
      where: { id: 'recipe-1' },
      data: { status: 'draft' },
    })
  })
})
