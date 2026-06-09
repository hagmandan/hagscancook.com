import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    recipe: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    tag: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    ingredientType: {
      create: vi.fn(),
    },
    ingredient: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(),
}))

vi.mock('@/lib/monitoring/errors', () => ({
  captureException: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { captureException } from '@/lib/monitoring/errors'
import {
  adminDeleteRecipe,
  approveRecipeImage,
  createIngredient,
  createIngredientType,
  createTag,
  deleteTag,
  rejectRecipeImage,
  setUserRole,
  unpublishRecipe,
  updateIngredientType,
} from './admin'

const mockRequireAdmin = vi.mocked(requireAdmin)
const mockRecipeFindUnique = vi.mocked(db.recipe.findUnique)
const mockRecipeUpdate = vi.mocked(db.recipe.update)
const mockUserUpdate = vi.mocked(db.user.update)
const mockTagCreate = vi.mocked(db.tag.create)
const mockTagDelete = vi.mocked(db.tag.delete)
const mockIngredientTypeCreate = vi.mocked(db.ingredientType.create)
const mockIngredientCreate = vi.mocked(db.ingredient.create)
const mockIngredientUpdate = vi.mocked(db.ingredient.update)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockCaptureException = vi.mocked(captureException)

function form(values: Record<string, string>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value)
  }
  return formData
}

describe('admin recipe moderation actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ userId: 'admin-1', role: 'admin' })
    mockRecipeFindUnique.mockResolvedValue({ slug: 'lemon-pasta' })
    mockRecipeUpdate.mockResolvedValue({})
  })

  it('returns not found when unpublishing a missing recipe', async () => {
    mockRecipeFindUnique.mockResolvedValue(null)

    const result = await unpublishRecipe('recipe-1')

    expect(result).toEqual({ error: 'Recipe not found' })
    expect(mockRecipeUpdate).not.toHaveBeenCalled()
  })

  it('unpublishes an existing recipe and revalidates affected pages', async () => {
    const result = await unpublishRecipe('recipe-1')

    expect(result).toEqual({ ok: true })
    expect(mockRecipeUpdate).toHaveBeenCalledWith({
      where: { id: 'recipe-1' },
      data: { status: 'draft' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/recipes/lemon-pasta')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin')
  })

  it('soft-deletes an existing recipe', async () => {
    const result = await adminDeleteRecipe('recipe-1')

    expect(result).toEqual({ ok: true })
    expect(mockRecipeUpdate).toHaveBeenCalledWith({
      where: { id: 'recipe-1' },
      data: { deletedAt: expect.any(Date) },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin')
  })

  it('returns not found when approving a missing recipe', async () => {
    mockRecipeFindUnique.mockResolvedValue(null)

    const result = await approveRecipeImage('recipe-1')

    expect(result).toEqual({ error: 'Recipe not found' })
    expect(mockRecipeUpdate).not.toHaveBeenCalled()
  })

  it('approves a recipe image and revalidates recipe page and queue', async () => {
    const result = await approveRecipeImage('recipe-1')

    expect(result).toEqual({ ok: true })
    expect(mockRecipeUpdate).toHaveBeenCalledWith({
      where: { id: 'recipe-1' },
      data: { coverImageStatus: 'approved' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/recipes/lemon-pasta')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/recipes/lemon-pasta/edit')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/images')
  })

  it('returns not found when rejecting a missing recipe', async () => {
    mockRecipeFindUnique.mockResolvedValue(null)

    const result = await rejectRecipeImage('recipe-1')

    expect(result).toEqual({ error: 'Recipe not found' })
    expect(mockRecipeUpdate).not.toHaveBeenCalled()
  })

  it('rejects a recipe image and revalidates the queue', async () => {
    const result = await rejectRecipeImage('recipe-1')

    expect(result).toEqual({ ok: true })
    expect(mockRecipeUpdate).toHaveBeenCalledWith({
      where: { id: 'recipe-1' },
      data: { coverImageStatus: 'rejected' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/recipes/lemon-pasta/edit')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/images')
  })
})

describe('setUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ userId: 'admin-1', role: 'admin' })
    mockUserUpdate.mockResolvedValue({})
  })

  it('rejects invalid roles without writing', async () => {
    const result = await setUserRole('user-1', 'owner')

    expect(result).toEqual({ error: 'Invalid role: owner' })
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })

  it('updates valid user roles', async () => {
    const result = await setUserRole('user-1', 'chef')

    expect(result).toEqual({ ok: true })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { role: 'chef' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/users')
  })
})

describe('tag management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ userId: 'admin-1', role: 'admin' })
    mockTagCreate.mockResolvedValue({})
    mockTagDelete.mockResolvedValue({})
  })

  it('validates tag names before creating', async () => {
    const result = await createTag(form({ name: '' }))

    expect('error' in result).toBe(true)
    expect(mockTagCreate).not.toHaveBeenCalled()
  })

  it('creates tags with generated slugs', async () => {
    const result = await createTag(form({ name: 'Quick Meals' }))

    expect(result).toEqual({ ok: true })
    expect(mockTagCreate).toHaveBeenCalledWith({
      data: { name: 'Quick Meals', slug: 'quick-meals' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/tags')
  })

  it('captures duplicate tag creation failures', async () => {
    const error = new Error('duplicate')
    mockTagCreate.mockRejectedValue(error)

    const result = await createTag(form({ name: 'Quick Meals' }))

    expect(result).toEqual({ error: 'A tag with that name already exists' })
    expect(mockCaptureException).toHaveBeenCalledWith(error, {
      feature: 'admin',
      operation: 'create-tag',
      runtime: 'server',
    })
  })

  it('deletes tags', async () => {
    const result = await deleteTag('tag-1')

    expect(result).toEqual({ ok: true })
    expect(mockTagDelete).toHaveBeenCalledWith({ where: { id: 'tag-1' } })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/tags')
  })
})

describe('ingredient management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({ userId: 'admin-1', role: 'admin' })
    mockIngredientTypeCreate.mockResolvedValue({})
    mockIngredientCreate.mockResolvedValue({})
    mockIngredientUpdate.mockResolvedValue({})
  })

  it('creates ingredient types with generated slugs', async () => {
    const result = await createIngredientType(form({ name: 'Dairy & Eggs' }))

    expect(result).toEqual({ ok: true })
    expect(mockIngredientTypeCreate).toHaveBeenCalledWith({
      data: { name: 'Dairy & Eggs', slug: 'dairy-eggs' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/ingredients')
  })

  it('returns a duplicate ingredient type error on create failures', async () => {
    const error = new Error('duplicate')
    mockIngredientTypeCreate.mockRejectedValue(error)

    const result = await createIngredientType(form({ name: 'Dairy & Eggs' }))

    expect(result).toEqual({ error: 'An ingredient type with that name already exists' })
    expect(mockCaptureException).toHaveBeenCalledWith(error, {
      feature: 'admin',
      operation: 'create-ingredient-type',
      runtime: 'server',
    })
  })

  it('validates ingredient type ids before creating ingredients', async () => {
    const result = await createIngredient(form({ name: 'Flour', typeId: 'not-a-uuid' }))

    expect('error' in result).toBe(true)
    expect(mockIngredientCreate).not.toHaveBeenCalled()
  })

  it('creates normalized canonical ingredients', async () => {
    const result = await createIngredient({
      get: (key: string) =>
        ({ name: '  Flour  ', typeId: '11111111-1111-4111-8111-111111111111' })[key] ?? null,
    } as FormData)

    expect(result).toEqual({ ok: true })
    expect(mockIngredientCreate).toHaveBeenCalledWith({
      data: {
        name: 'flour',
        typeId: '11111111-1111-4111-8111-111111111111',
      },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/ingredients')
  })

  it('updates an ingredient category', async () => {
    const result = await updateIngredientType('ingredient-1', 'type-1')

    expect(result).toEqual({ ok: true })
    expect(mockIngredientUpdate).toHaveBeenCalledWith({
      where: { id: 'ingredient-1' },
      data: { typeId: 'type-1' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/ingredients')
  })
})
