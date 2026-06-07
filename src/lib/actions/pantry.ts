'use server'

/**
 * Pantry Server Actions.
 *
 * Manage a user's personal kitchen inventory (PantryItem rows). Each action
 * re-verifies auth with requireSession() and re-checks ownership — Server
 * Actions are reachable via direct POST and must not trust the proxy alone.
 *
 * Each pantry item links to a canonical Ingredient (find-or-create via the
 * shared resolveIngredient helper), so the pantry can later join cleanly
 * against recipes.
 */

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireSession } from '@/lib/auth'
import { resolveIngredient } from '@/lib/ingredients'
import { AddPantryItemSchema, UpdatePantryItemSchema } from '@/lib/schemas/pantry'
import type { AddPantryItemInput, UpdatePantryItemInput } from '@/lib/schemas/pantry'
import { captureException } from '@/lib/monitoring/errors'

/** Shape returned to the client for optimistic rendering. */
export interface PantryItemView {
  id: string
  amount: string | null
  unit: string | null
  note: string | null
  ingredient: { id: string; name: string }
  type: { id: string; name: string; slug: string }
}

const ITEM_SELECT = {
  id: true,
  amount: true,
  unit: true,
  note: true,
  ingredient: {
    select: {
      id: true,
      name: true,
      type: { select: { id: true, name: true, slug: true } },
    },
  },
} as const

type ItemRow = {
  id: string
  amount: string | null
  unit: string | null
  note: string | null
  ingredient: { id: string; name: string; type: { id: string; name: string; slug: string } }
}

function toView(row: ItemRow): PantryItemView {
  return {
    id: row.id,
    amount: row.amount,
    unit: row.unit,
    note: row.note,
    ingredient: { id: row.ingredient.id, name: row.ingredient.name },
    type: row.ingredient.type,
  }
}

/**
 * Adds an ingredient to the current user's pantry, or updates the existing
 * row's amount/unit/note if that ingredient is already present (idempotent —
 * never errors on the (user, ingredient) unique constraint).
 */
export async function addPantryItem(
  input: AddPantryItemInput
): Promise<{ item: PantryItemView } | { error: string }> {
  const session = await requireSession()

  const parsed = AddPantryItemSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid pantry item' }
  }
  const data = parsed.data

  try {
    const ingredientId = await resolveIngredient(data.ingredientName, data.typeId)

    const row = await db.pantryItem.upsert({
      where: { userId_ingredientId: { userId: session.userId, ingredientId } },
      create: {
        userId: session.userId,
        ingredientId,
        amount: data.amount ?? null,
        unit: data.unit ?? null,
        note: data.note ?? null,
      },
      update: {
        amount: data.amount ?? null,
        unit: data.unit ?? null,
        note: data.note ?? null,
      },
      select: ITEM_SELECT,
    })

    revalidatePath('/pantry')
    return { item: toView(row) }
  } catch (err) {
    captureException(err, {
      feature: 'pantry',
      operation: 'add',
      runtime: 'server',
    })
    return { error: 'Failed to add item. Please try again.' }
  }
}

/**
 * Adds multiple ingredients to the current user's pantry in parallel.
 * Skips any inputs that fail validation; upserts are idempotent.
 */
export async function addPantryItems(
  inputs: AddPantryItemInput[]
): Promise<{ items: PantryItemView[] } | { error: string }> {
  const session = await requireSession()

  const valid = inputs
    .map((i) => AddPantryItemSchema.safeParse(i))
    .filter((p) => p.success)
    .map((p) => p.data!)

  if (valid.length === 0) return { error: 'No valid items to add' }

  try {
    const rows = await Promise.all(
      valid.map(async (data) => {
        const ingredientId = await resolveIngredient(data.ingredientName, data.typeId)
        return db.pantryItem.upsert({
          where: { userId_ingredientId: { userId: session.userId, ingredientId } },
          create: { userId: session.userId, ingredientId, amount: null, unit: null, note: null },
          update: {},
          select: ITEM_SELECT,
        })
      })
    )
    revalidatePath('/pantry')
    return { items: rows.map(toView) }
  } catch (err) {
    captureException(err, { feature: 'pantry', operation: 'bulk-add', runtime: 'server' })
    return { error: 'Failed to add items. Please try again.' }
  }
}

/** Updates the amount/unit/note of a pantry item the current user owns. */
export async function updatePantryItem(
  id: string,
  input: UpdatePantryItemInput
): Promise<{ item: PantryItemView } | { error: string }> {
  const session = await requireSession()

  const parsed = UpdatePantryItemSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid pantry item' }
  }
  const data = parsed.data

  const existing = await db.pantryItem.findUnique({
    where: { id },
    select: { userId: true },
  })
  if (!existing) return { error: 'Pantry item not found' }
  if (existing.userId !== session.userId) {
    return { error: 'Not authorised to edit this item' }
  }

  try {
    const row = await db.pantryItem.update({
      where: { id },
      data: {
        amount: data.amount ?? null,
        unit: data.unit ?? null,
        note: data.note ?? null,
      },
      select: ITEM_SELECT,
    })

    revalidatePath('/pantry')
    return { item: toView(row) }
  } catch (err) {
    captureException(err, {
      feature: 'pantry',
      operation: 'update',
      runtime: 'server',
    })
    return { error: 'Failed to update item. Please try again.' }
  }
}

/** Removes a pantry item the current user owns. */
export async function removePantryItem(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const session = await requireSession()

  const existing = await db.pantryItem.findUnique({
    where: { id },
    select: { userId: true },
  })
  if (!existing) return { error: 'Pantry item not found' }
  if (existing.userId !== session.userId) {
    return { error: 'Not authorised to remove this item' }
  }

  try {
    await db.pantryItem.delete({ where: { id } })
    revalidatePath('/pantry')
    return { ok: true }
  } catch (err) {
    captureException(err, {
      feature: 'pantry',
      operation: 'remove',
      runtime: 'server',
    })
    return { error: 'Failed to remove item. Please try again.' }
  }
}
