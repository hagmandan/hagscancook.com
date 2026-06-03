/**
 * Seed recipe import script.
 *
 * Imports recipe JSON files from a local directory (cloned from
 * dpapathanasiou/recipes or a compatible format) into the Neon DB.
 *
 * Source format expected per file:
 *   { title, ingredients: string[], directions: string[],
 *     source?, url?, tags?, language? }
 *
 * All imported recipes are created as `draft` and require admin review
 * before publishing. The script is idempotent — re-running it skips any
 * recipe whose generated slug already exists.
 *
 * Usage:
 *   yarn tsx scripts/import-recipes.ts ./path/to/recipes-dir [--limit 50]
 *
 * Prerequisites:
 *   1. DATABASE_URL must be set in .env.local
 *   2. Clone dpapathanasiou/recipes:
 *        git clone https://github.com/dpapathanasiou/recipes.git /tmp/recipes
 *   3. Run: yarn tsx scripts/import-recipes.ts /tmp/recipes
 */

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import * as dotenv from 'dotenv'

// Load .env.local before importing Prisma (needs DATABASE_URL)
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { toSlug } from '@/lib/utils/slugify'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SourceRecipe {
  title: string
  ingredients: string[]
  directions: string[]
  source?: string
  url?: string
  tags?: string[]
  language?: string
}

// ---------------------------------------------------------------------------
// DB setup
// ---------------------------------------------------------------------------

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set. Add it to .env.local')

const adapter = new PrismaNeon({ connectionString })
const db = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// Ingredient string parser
// ---------------------------------------------------------------------------

const UNIT_WORDS = new Set([
  'cup', 'cups', 'c',
  'tablespoon', 'tablespoons', 'tbsp', 'tbs',
  'teaspoon', 'teaspoons', 'tsp',
  'ounce', 'ounces', 'oz',
  'pound', 'pounds', 'lb', 'lbs',
  'gram', 'grams', 'g',
  'kilogram', 'kilograms', 'kg',
  'liter', 'liters', 'l',
  'milliliter', 'milliliters', 'ml',
  'clove', 'cloves',
  'slice', 'slices',
  'piece', 'pieces',
  'bunch', 'bunches',
  'stalk', 'stalks',
  'sprig', 'sprigs',
  'can', 'cans',
  'package', 'packages', 'pkg',
  'packet', 'packets',
  'bottle', 'bottles',
  'jar', 'jars',
  'bag', 'bags',
  'dash', 'dashes',
  'pinch', 'pinches',
  'handful', 'handfuls',
  'head', 'heads',
  'inch', 'inches',
])

const FRACTION_CHARS: Record<string, string> = {
  '¼': '1/4', '½': '1/2', '¾': '3/4',
  '⅓': '1/3', '⅔': '2/3',
  '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
}

/**
 * Heuristically parses a raw ingredient string into structured fields.
 * Preserves the original string in `display`.
 *
 * Examples:
 *   "3 cloves garlic, minced"    → qty="3", unit="cloves", name="garlic", prep="minced"
 *   "1/2 cup butter"             → qty="1/2", unit="cup", name="butter"
 *   "salt and pepper to taste"   → qty="", unit="", name="salt and pepper to taste"
 */
function parseIngredient(raw: string): {
  display: string
  quantity: string
  unit: string
  ingredientName: string
  preparation: string
} {
  const display = raw.trim()

  // Normalise fraction unicode characters
  let s = display
  for (const [char, replacement] of Object.entries(FRACTION_CHARS)) {
    s = s.replaceAll(char, replacement)
  }

  // Try to extract leading quantity (e.g. "3", "1/2", "1 1/2")
  const qtyMatch = s.match(/^(\d+(?:\s*\/\s*\d+)?(?:\s+\d+\s*\/\s*\d+)?)\s+(.*)$/)
  let quantity = ''
  let rest = s

  if (qtyMatch) {
    quantity = qtyMatch[1].trim().replace(/\s+/g, '')
    rest = qtyMatch[2]
  }

  // Try to extract unit (first word if it matches a known unit)
  const firstWordMatch = rest.match(/^(\S+)\s+(.*)$/)
  let unit = ''
  let afterUnit = rest

  if (firstWordMatch) {
    const candidate = firstWordMatch[1].toLowerCase().replace(/[.,]$/, '')
    if (UNIT_WORDS.has(candidate)) {
      unit = firstWordMatch[1].replace(/[.,]$/, '')
      afterUnit = firstWordMatch[2]
    }
  }

  // Ingredient name = up to first comma; preparation = after first comma
  const commaIdx = afterUnit.indexOf(',')
  let ingredientName: string
  let preparation: string

  if (commaIdx !== -1) {
    ingredientName = afterUnit.slice(0, commaIdx).trim()
    preparation = afterUnit.slice(commaIdx + 1).trim()
  } else {
    ingredientName = afterUnit.trim()
    preparation = ''
  }

  // Fallback — if we couldn't extract a usable name, use the full raw string
  if (!ingredientName) {
    ingredientName = display
  }

  // Normalise ingredient name to lowercase for deduplication
  const normalisedName = ingredientName.toLowerCase().trim()

  return {
    display,
    quantity: quantity || '1',
    unit,
    ingredientName: normalisedName,
    preparation,
  }
}

// ---------------------------------------------------------------------------
// Ingredient find-or-create
// ---------------------------------------------------------------------------

/** Cache to avoid redundant DB lookups within a single import run. */
const ingredientCache = new Map<string, string>()

async function resolveIngredient(name: string): Promise<string> {
  if (ingredientCache.has(name)) return ingredientCache.get(name)!

  const existing = await db.ingredient.findFirst({
    where: { name },
    select: { id: true },
  })

  if (existing) {
    ingredientCache.set(name, existing.id)
    return existing.id
  }

  // New ingredient — use "Other" type as conservative default for imports
  const otherType = await db.ingredientType.findFirst({
    where: { slug: 'other' },
    select: { id: true },
  })
  const typeId = otherType?.id ?? (
    await db.ingredientType.findFirst({ select: { id: true } })
  )?.id

  if (!typeId) throw new Error('No ingredient types found. Run `yarn prisma db seed` first.')

  const created = await db.ingredient.create({
    data: { name, typeId },
    select: { id: true },
  })

  ingredientCache.set(name, created.id)
  return created.id
}

// ---------------------------------------------------------------------------
// Import a single recipe
// ---------------------------------------------------------------------------

/** Must match the first user created (or a seeded admin). Falls back to null
 *  which will break the FK — you MUST set this to a real user UUID. */
async function getImportUserId(): Promise<string> {
  const admin = await db.user.findFirst({
    where: { role: 'admin' },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  if (admin) return admin.id

  // Fall back to any user
  const any = await db.user.findFirst({ select: { id: true }, orderBy: { createdAt: 'asc' } })
  if (any) return any.id

  throw new Error(
    'No users found in DB. Sign in to the app first to create a user account, then re-run this script.'
  )
}

async function importRecipe(
  raw: SourceRecipe,
  authorId: string
): Promise<{ slug: string; status: 'created' | 'skipped' }> {
  const baseSlug = toSlug(raw.title)

  // Idempotency check — skip if slug already exists
  const existing = await db.recipe.findFirst({
    where: { slug: baseSlug },
    select: { slug: true },
  })
  if (existing) return { slug: baseSlug, status: 'skipped' }

  // Resolve ingredients
  const parsedIngredients = raw.ingredients.map(parseIngredient)
  const ingredientIds = await Promise.all(
    parsedIngredients.map((pi) => resolveIngredient(pi.ingredientName))
  )

  await db.recipe.create({
    data: {
      slug: baseSlug,
      title: raw.title,
      description: raw.directions[0]?.slice(0, 500) ?? '',
      status: 'draft',
      sourceUrl: raw.url ?? null,
      sourceAttribution: raw.source ?? null,
      authorId,
      steps: {
        create: raw.directions.map((dir, i) => ({
          order: i + 1,
          content: dir,
        })),
      },
      recipeIngredients: {
        create: parsedIngredients.map((pi, i) => ({
          ingredientId: ingredientIds[i],
          display: pi.display,
          quantity: pi.quantity,
          unit: pi.unit || null,
          preparation: pi.preparation || null,
          order: i + 1,
        })),
      },
    },
  })

  return { slug: baseSlug, status: 'created' }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2)
  const dirArg = args.find((a) => !a.startsWith('--'))
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined

  if (!dirArg) {
    console.error(`
Usage: yarn tsx scripts/import-recipes.ts <directory> [--limit=N]

  directory   Path to a directory of recipe JSON files
              (e.g. a clone of github.com/dpapathanasiou/recipes)
  --limit=N   Only import the first N recipes (useful for testing)

Example:
  git clone https://github.com/dpapathanasiou/recipes.git /tmp/recipes
  yarn tsx scripts/import-recipes.ts /tmp/recipes --limit=20
`)
    process.exit(1)
  }

  const dir = path.resolve(dirArg)
  const authorId = await getImportUserId()
  console.log(`\n📥 Importing recipes from: ${dir}`)
  console.log(`   Author ID: ${authorId}`)
  if (limit) console.log(`   Limit: ${limit}`)

  // Read all JSON files from the directory
  const entries = await readdir(dir, { withFileTypes: true })
  let files = entries
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => path.join(dir, e.name))

  if (limit) files = files.slice(0, limit)

  console.log(`\n   Found ${files.length} JSON files\n`)

  let created = 0
  let skipped = 0
  let errored = 0

  for (const file of files) {
    let raw: unknown
    try {
      const text = await readFile(file, 'utf-8')
      raw = JSON.parse(text)
    } catch {
      console.error(`  ✗ Failed to parse: ${path.basename(file)}`)
      errored++
      continue
    }

    // Validate required fields
    if (
      !raw ||
      typeof raw !== 'object' ||
      !('title' in raw) ||
      typeof (raw as SourceRecipe).title !== 'string' ||
      !Array.isArray((raw as SourceRecipe).ingredients) ||
      !Array.isArray((raw as SourceRecipe).directions) ||
      (raw as SourceRecipe).ingredients.length === 0 ||
      (raw as SourceRecipe).directions.length === 0
    ) {
      console.log(`  ⚠ Skipping (invalid structure): ${path.basename(file)}`)
      skipped++
      continue
    }

    const recipe = raw as SourceRecipe

    try {
      const result = await importRecipe(recipe, authorId)
      if (result.status === 'created') {
        console.log(`  ✓ Created: "${recipe.title}" → /${result.slug}`)
        created++
      } else {
        console.log(`  · Skipped (exists): "${recipe.title}"`)
        skipped++
      }
    } catch (err) {
      console.error(`  ✗ Error importing "${recipe.title}": ${err instanceof Error ? err.message : err}`)
      errored++
    }
  }

  console.log(`\n✅ Import complete.`)
  console.log(`   Created:  ${created}`)
  console.log(`   Skipped:  ${skipped}`)
  console.log(`   Errored:  ${errored}`)
  console.log(`\n   All imported recipes are in draft status.`)
  console.log(`   Visit /admin to review and publish them.\n`)
}

main()
  .catch((err) => {
    console.error('Import failed:', err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
