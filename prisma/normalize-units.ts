/**
 * One-time backfill: normalize existing `recipe_ingredients.unit` free-text
 * values to the canonical units defined in src/lib/constants/units.ts.
 *
 *   npx tsx prisma/normalize-units.ts          # dry run (default) — reports only
 *   npx tsx prisma/normalize-units.ts --write   # apply the changes
 *
 * Idempotent: rows already canonical (or with no recognized mapping) are left
 * untouched, so it is safe to run repeatedly. Unknown units are preserved as-is
 * — the recipe form treats them as "Other…" free-text.
 */

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import 'dotenv/config'
import { normalizeUnit } from '../src/lib/constants/units'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const apply = process.argv.includes('--write')

const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  const rows = await prisma.recipeIngredient.findMany({
    where: { unit: { not: null } },
    select: { id: true, unit: true },
  })

  const changes: { id: string; from: string; to: string }[] = []
  for (const row of rows) {
    const normalized = normalizeUnit(row.unit)
    if (normalized !== null && normalized !== row.unit) {
      changes.push({ id: row.id, from: row.unit!, to: normalized })
    }
  }

  console.log(`Scanned ${rows.length} ingredient rows with a unit.`)
  console.log(`${changes.length} would be normalized:`)
  for (const c of changes) {
    console.log(`  "${c.from}" → "${c.to}"  (${c.id})`)
  }

  if (!apply) {
    console.log('\nDry run — re-run with --write to apply.')
    return
  }

  await prisma.$transaction(
    changes.map((c) =>
      prisma.recipeIngredient.update({ where: { id: c.id }, data: { unit: c.to } })
    )
  )
  console.log(`\nApplied ${changes.length} updates.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
