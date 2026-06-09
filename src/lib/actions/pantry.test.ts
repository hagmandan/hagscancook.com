import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    pantryItem: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  requireSession: vi.fn(),
}))

vi.mock('@/lib/ingredients', () => ({
  resolveIngredient: vi.fn(),
}))

vi.mock('@/lib/monitoring/errors', () => ({
  captureException: vi.fn(),
}))

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { resolveIngredient } from '@/lib/ingredients'
import { captureException } from '@/lib/monitoring/errors'
import { addPantryItem, addPantryItems, removePantryItem, updatePantryItem } from './pantry'

const mockRequireSession = vi.mocked(requireSession)
const mockResolveIngredient = vi.mocked(resolveIngredient)
const mockUpsert = vi.mocked(db.pantryItem.upsert)
const mockFindUnique = vi.mocked(db.pantryItem.findUnique)
const mockUpdate = vi.mocked(db.pantryItem.update)
const mockDelete = vi.mocked(db.pantryItem.delete)
const mockRevalidatePath = vi.mocked(revalidatePath)
const mockCaptureException = vi.mocked(captureException)

function pantryRow(overrides: Partial<ReturnType<typeof pantryRow>> = {}) {
  return {
    id: 'pantry-1',
    amount: '2',
    unit: 'cups',
    note: 'for baking',
    ingredient: {
      id: 'ingredient-1',
      name: 'flour',
      type: { id: 'type-1', name: 'Baking', slug: 'baking' },
    },
    ...overrides,
  }
}

describe('addPantryItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireSession.mockResolvedValue({ userId: 'user-1', role: 'user' })
    mockResolveIngredient.mockResolvedValue('ingredient-1')
    mockUpsert.mockResolvedValue(pantryRow())
  })

  it('returns a validation error without resolving ingredients', async () => {
    const result = await addPantryItem({ ingredientName: '' })

    expect(result).toEqual({ error: 'Ingredient name is required' })
    expect(mockResolveIngredient).not.toHaveBeenCalled()
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('upserts a pantry item for the current user', async () => {
    const result = await addPantryItem({
      ingredientName: 'flour',
      amount: ' 2 ',
      unit: ' cups ',
      note: '',
      typeId: 'type-1',
    })

    expect(result).toEqual({
      item: {
        id: 'pantry-1',
        amount: '2',
        unit: 'cups',
        note: 'for baking',
        ingredient: { id: 'ingredient-1', name: 'flour' },
        type: { id: 'type-1', name: 'Baking', slug: 'baking' },
      },
    })
    expect(mockResolveIngredient).toHaveBeenCalledWith('flour', 'type-1')
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { userId_ingredientId: { userId: 'user-1', ingredientId: 'ingredient-1' } },
      create: {
        userId: 'user-1',
        ingredientId: 'ingredient-1',
        amount: '2',
        unit: 'cups',
        note: null,
      },
      update: { amount: '2', unit: 'cups', note: null },
      select: expect.any(Object),
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/pantry')
  })

  it('captures failures and returns a user-facing error', async () => {
    const error = new Error('upsert failed')
    mockUpsert.mockRejectedValue(error)

    const result = await addPantryItem({ ingredientName: 'flour' })

    expect(result).toEqual({ error: 'Failed to add item. Please try again.' })
    expect(mockCaptureException).toHaveBeenCalledWith(error, {
      feature: 'pantry',
      operation: 'add',
      runtime: 'server',
    })
  })
})

describe('addPantryItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireSession.mockResolvedValue({ userId: 'user-1', role: 'user' })
    mockResolveIngredient.mockImplementation(async (name) => `ingredient-${name}`)
    mockUpsert.mockImplementation(async ({ create }) =>
      pantryRow({
        id: `pantry-${create.ingredientId}`,
        ingredient: {
          id: create.ingredientId,
          name: create.ingredientId.replace('ingredient-', ''),
          type: { id: 'type-1', name: 'Produce', slug: 'produce' },
        },
      }),
    )
  })

  it('returns an error when no inputs are valid', async () => {
    const result = await addPantryItems([{ ingredientName: '' }])

    expect(result).toEqual({ error: 'No valid items to add' })
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('skips invalid inputs and upserts valid items', async () => {
    const result = await addPantryItems([
      { ingredientName: 'apples' },
      { ingredientName: '' },
      { ingredientName: 'bananas', typeId: 'type-fruit' },
    ])

    expect('items' in result ? result.items : []).toHaveLength(2)
    expect(mockResolveIngredient).toHaveBeenNthCalledWith(1, 'apples', undefined)
    expect(mockResolveIngredient).toHaveBeenNthCalledWith(2, 'bananas', 'type-fruit')
    expect(mockUpsert).toHaveBeenCalledTimes(2)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: 'user-1',
          amount: null,
          unit: null,
          note: null,
        }),
        update: {},
      }),
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/pantry')
  })
})

describe('updatePantryItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireSession.mockResolvedValue({ userId: 'user-1', role: 'user' })
    mockFindUnique.mockResolvedValue({ userId: 'user-1' })
    mockUpdate.mockResolvedValue(pantryRow({ amount: '3', unit: 'cups', note: null }))
  })

  it('returns a validation error before ownership lookup', async () => {
    const result = await updatePantryItem('pantry-1', { note: 'n'.repeat(121) })

    expect(result).toEqual({ error: 'Too big: expected string to have <=120 characters' })
    expect(mockFindUnique).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('blocks edits to another user’s item', async () => {
    mockFindUnique.mockResolvedValue({ userId: 'other-user' })

    const result = await updatePantryItem('pantry-1', { amount: '3' })

    expect(result).toEqual({ error: 'Not authorised to edit this item' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('updates amount, unit, and note for an owned item', async () => {
    const result = await updatePantryItem('pantry-1', {
      amount: ' 3 ',
      unit: ' cups ',
      note: '',
    })

    expect('item' in result ? result.item.amount : null).toBe('3')
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'pantry-1' },
      data: { amount: '3', unit: 'cups', note: null },
      select: expect.any(Object),
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/pantry')
  })
})

describe('removePantryItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireSession.mockResolvedValue({ userId: 'user-1', role: 'user' })
    mockFindUnique.mockResolvedValue({ userId: 'user-1' })
    mockDelete.mockResolvedValue({})
  })

  it('returns not found when the item does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await removePantryItem('pantry-1')

    expect(result).toEqual({ error: 'Pantry item not found' })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('blocks removing another user’s item', async () => {
    mockFindUnique.mockResolvedValue({ userId: 'other-user' })

    const result = await removePantryItem('pantry-1')

    expect(result).toEqual({ error: 'Not authorised to remove this item' })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('deletes owned pantry items', async () => {
    await expect(removePantryItem('pantry-1')).resolves.toEqual({ ok: true })

    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'pantry-1' } })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/pantry')
  })
})
