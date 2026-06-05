/**
 * Canonical ingredient helpers shared across server-side features
 * (recipes, pantry, …).
 */

import { db } from '@/lib/db'

/**
 * Finds or creates a canonical Ingredient by name (case-insensitive).
 *
 * @param name   - Ingredient name (normalised to lowercase before lookup)
 * @param typeId - Optional ingredient type UUID. Used when creating a new
 *   ingredient. If omitted, falls back to the "Produce" type (or the first
 *   available type if "Produce" isn't seeded yet).
 */
export async function resolveIngredient(name: string, typeId?: string): Promise<string> {
  const normalised = name.toLowerCase().trim()

  const existing = await db.ingredient.findFirst({
    where: { name: normalised },
    select: { id: true },
  })
  if (existing) return existing.id

  // Determine the type to assign to the new ingredient
  let resolvedTypeId = typeId

  if (!resolvedTypeId) {
    resolvedTypeId = (
      await db.ingredientType.findFirst({
        where: { slug: 'produce' },
        select: { id: true },
      })
    )?.id
  }

  if (!resolvedTypeId) {
    const first = await db.ingredientType.findFirst({ select: { id: true } })
    resolvedTypeId = first?.id
  }

  if (!resolvedTypeId) {
    throw new Error('No ingredient types found in DB. Run `prisma db seed` first.')
  }

  const created = await db.ingredient.create({
    data: { name: normalised, typeId: resolvedTypeId },
    select: { id: true },
  })
  return created.id
}
