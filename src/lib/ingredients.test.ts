// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    ingredient: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    ingredientType: {
      findFirst: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { resolveIngredient } from './ingredients'

const mockIngredientFindFirst = vi.mocked(db.ingredient.findFirst)
const mockIngredientCreate = vi.mocked(db.ingredient.create)
const mockIngredientTypeFindFirst = vi.mocked(db.ingredientType.findFirst)

describe('resolveIngredient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIngredientCreate.mockResolvedValue({ id: 'created-ingredient' })
  })

  it('returns an existing normalized ingredient id', async () => {
    mockIngredientFindFirst.mockResolvedValue({ id: 'existing-ingredient' })

    await expect(resolveIngredient('  Flour  ')).resolves.toBe('existing-ingredient')

    expect(mockIngredientFindFirst).toHaveBeenCalledWith({
      where: { name: 'flour' },
      select: { id: true },
    })
    expect(mockIngredientCreate).not.toHaveBeenCalled()
  })

  it('creates a normalized ingredient with a provided type id', async () => {
    mockIngredientFindFirst.mockResolvedValue(null)

    await expect(resolveIngredient('  Flour  ', 'type-baking')).resolves.toBe('created-ingredient')

    expect(mockIngredientTypeFindFirst).not.toHaveBeenCalled()
    expect(mockIngredientCreate).toHaveBeenCalledWith({
      data: { name: 'flour', typeId: 'type-baking' },
      select: { id: true },
    })
  })

  it('falls back to the produce type when no type id is provided', async () => {
    mockIngredientFindFirst.mockResolvedValue(null)
    mockIngredientTypeFindFirst.mockResolvedValueOnce({ id: 'type-produce' })

    await expect(resolveIngredient('Apples')).resolves.toBe('created-ingredient')

    expect(mockIngredientTypeFindFirst).toHaveBeenCalledWith({
      where: { slug: 'produce' },
      select: { id: true },
    })
    expect(mockIngredientCreate).toHaveBeenCalledWith({
      data: { name: 'apples', typeId: 'type-produce' },
      select: { id: true },
    })
  })

  it('falls back to the first ingredient type when produce is missing', async () => {
    mockIngredientFindFirst.mockResolvedValue(null)
    mockIngredientTypeFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'type-first' })

    await expect(resolveIngredient('Apples')).resolves.toBe('created-ingredient')

    expect(mockIngredientTypeFindFirst).toHaveBeenNthCalledWith(2, {
      select: { id: true },
    })
    expect(mockIngredientCreate).toHaveBeenCalledWith({
      data: { name: 'apples', typeId: 'type-first' },
      select: { id: true },
    })
  })

  it('throws when no ingredient types are available', async () => {
    mockIngredientFindFirst.mockResolvedValue(null)
    mockIngredientTypeFindFirst.mockResolvedValue(null)

    await expect(resolveIngredient('Apples')).rejects.toThrow(
      'No ingredient types found in DB. Run `prisma db seed` first.',
    )

    expect(mockIngredientCreate).not.toHaveBeenCalled()
  })
})
