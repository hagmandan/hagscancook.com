/**
 * Pantry dashboard — /pantry
 *
 * Authenticated Server Component. Shows the current user's kitchen inventory,
 * grouped by ingredient category, with quick-add + inline edit/remove handled
 * client-side in PantryManager.
 */

import { requireSession } from '@/lib/auth'
import { db } from '@/lib/db'
import type { PantryItemView } from '@/lib/actions/pantry'
import { PantryManager } from './PantryManager'

async function getPantryItems(userId: string): Promise<PantryItemView[]> {
  const rows = await db.pantryItem.findMany({
    where: { userId },
    orderBy: [{ ingredient: { name: 'asc' } }],
    select: {
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
    },
  })

  return rows.map((row) => ({
    id: row.id,
    amount: row.amount,
    unit: row.unit,
    note: row.note,
    ingredient: { id: row.ingredient.id, name: row.ingredient.name },
    type: row.ingredient.type,
  }))
}

export const metadata = { title: 'Pantry' }

export default async function PantryPage() {
  const session = await requireSession()
  const [items, ingredientTypes] = await Promise.all([
    getPantryItems(session.userId),
    db.ingredientType.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
  ])

  return <PantryManager initialItems={items} ingredientTypes={ingredientTypes} />
}
