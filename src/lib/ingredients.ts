/**
 * Canonical ingredient helpers shared across server-side features
 * (recipes, pantry, …).
 */

import { cache } from 'react'
import { db } from '@/lib/db'

/**
 * Returns the default ingredient type ID to use when no typeId is provided.
 * Prefers the "Produce" type; falls back to any available type.
 *
 * The two `findFirst` calls are issued in parallel via `Promise.all`, reducing
 * latency compared to sequential queries.
 *
 * Wrapped in React's `cache()`, which deduplicates calls within a React Server
 * Component render tree (e.g. if `resolveIngredient` is called from a page
 * component). Note: `cache()` has no effect inside Server Actions — each
 * Server Action invocation gets its own cache scope — so the deduplication
 * benefit only applies in RSC contexts.
 */
const getDefaultTypeId = cache(async (): Promise<string | undefined> => {
  const [produce, first] = await Promise.all([
    db.ingredientType.findFirst({ where: { slug: 'produce' }, select: { id: true } }),
    db.ingredientType.findFirst({ select: { id: true } }),
  ])
  return produce?.id ?? first?.id
})

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
    resolvedTypeId = await getDefaultTypeId()
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
