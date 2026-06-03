/**
 * Database seed script.
 *
 * Populates lookup tables that are admin-managed and not user-editable:
 *   - ingredient_types  — canonical ingredient category taxonomy
 *   - tags              — initial recipe tag set
 *
 * All upserts are idempotent — safe to re-run after `prisma migrate reset`.
 *
 * Usage:
 *   yarn prisma db seed
 *
 * Configured in package.json:
 *   "prisma": { "seed": "tsx prisma/seed.ts" }
 */

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// Ingredient type taxonomy
// ---------------------------------------------------------------------------

const INGREDIENT_TYPES: Array<{ name: string; slug: string }> = [
  { name: 'Produce', slug: 'produce' },
  { name: 'Meat', slug: 'meat' },
  { name: 'Poultry', slug: 'poultry' },
  { name: 'Seafood', slug: 'seafood' },
  { name: 'Eggs', slug: 'eggs' },
  { name: 'Dairy', slug: 'dairy' },
  { name: 'Cheese', slug: 'cheese' },
  { name: 'Grains', slug: 'grains' },
  { name: 'Pasta', slug: 'pasta' },
  { name: 'Bread & Bakery', slug: 'bread-bakery' },
  { name: 'Legumes', slug: 'legumes' },
  { name: 'Nuts & Seeds', slug: 'nuts-seeds' },
  { name: 'Oils & Fats', slug: 'oils-fats' },
  { name: 'Vinegars & Acids', slug: 'vinegars-acids' },
  { name: 'Spices', slug: 'spices' },
  { name: 'Herbs', slug: 'herbs' },
  { name: 'Sweeteners', slug: 'sweeteners' },
  { name: 'Condiments', slug: 'condiments' },
  { name: 'Canned Goods', slug: 'canned-goods' },
  { name: 'Broth & Stock', slug: 'broth-stock' },
  { name: 'Baking', slug: 'baking' },
  { name: 'Beverages', slug: 'beverages' },
  { name: 'Alcohol & Wine', slug: 'alcohol-wine' },
  { name: 'Frozen', slug: 'frozen' },
  { name: 'Other', slug: 'other' },
]

// ---------------------------------------------------------------------------
// Initial tag set
// ---------------------------------------------------------------------------

const TAGS: Array<{ name: string; slug: string }> = [
  // Meal type
  { name: 'Breakfast', slug: 'breakfast' },
  { name: 'Lunch', slug: 'lunch' },
  { name: 'Dinner', slug: 'dinner' },
  { name: 'Dessert', slug: 'dessert' },
  { name: 'Snack', slug: 'snack' },
  { name: 'Appetizer', slug: 'appetizer' },
  { name: 'Side Dish', slug: 'side-dish' },
  { name: 'Soup', slug: 'soup' },
  { name: 'Salad', slug: 'salad' },
  { name: 'Drink', slug: 'drink' },
  // Cooking method
  { name: 'Air Fryer', slug: 'air-fryer' },
  { name: 'Baked', slug: 'baked' },
  { name: 'Boiled', slug: 'boiled' },
  { name: 'Braised', slug: 'braised' },
  { name: 'Broiled', slug: 'broiled' },
  { name: 'Deep-Fried', slug: 'deep-fried' },
  { name: 'Fermented', slug: 'fermented' },
  { name: 'Fried', slug: 'fried' },
  { name: 'Grilled', slug: 'grilled' },
  { name: 'Instant Pot', slug: 'instant-pot' },
  { name: 'No-Cook', slug: 'no-cook' },
  { name: 'Pan-Seared', slug: 'pan-seared' },
  { name: 'Pickled', slug: 'pickled' },
  { name: 'Poached', slug: 'poached' },
  { name: 'Roasted', slug: 'roasted' },
  { name: 'Sautéed', slug: 'sauteed' },
  { name: 'Slow Cooker', slug: 'slow-cooker' },
  { name: 'Smoked', slug: 'smoked' },
  { name: 'Steamed', slug: 'steamed' },
  { name: 'Stir-Fried', slug: 'stir-fried' },
  { name: 'Sous Vide', slug: 'sous-vide' },
  // Time
  { name: '30 Minutes or Less', slug: '30-minutes-or-less' },
  { name: 'Under 1 Hour', slug: 'under-1-hour' },
  { name: 'Meal Prep', slug: 'meal-prep' },
  { name: 'Make Ahead', slug: 'make-ahead' },
  // Occasion
  { name: 'Weeknight', slug: 'weeknight' },
  { name: 'Weekend', slug: 'weekend' },
  { name: 'Holiday', slug: 'holiday' },
  { name: 'Game Day', slug: 'game-day' },
  { name: 'Batch Cooking', slug: 'batch-cooking' },
  // Difficulty
  { name: 'Beginner', slug: 'beginner' },
  { name: 'Intermediate', slug: 'intermediate' },
  { name: 'Advanced', slug: 'advanced' },
  // Misc
  { name: 'Comfort Food', slug: 'comfort-food' },
  { name: 'Healthy', slug: 'healthy' },
  { name: 'Budget-Friendly', slug: 'budget-friendly' },
  { name: 'Kid-Friendly', slug: 'kid-friendly' },
  { name: 'Date Night', slug: 'date-night' },
  { name: 'One Pot', slug: 'one-pot' },
]

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Seeding database…')

  // Upsert ingredient types
  let ingredientTypeCount = 0
  for (const type of INGREDIENT_TYPES) {
    await prisma.ingredientType.upsert({
      where: { slug: type.slug },
      update: { name: type.name },
      create: type,
    })
    ingredientTypeCount++
  }
  console.log(`  ✓ ${ingredientTypeCount} ingredient types`)

  // Upsert tags
  let tagCount = 0
  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: tag,
    })
    tagCount++
  }
  console.log(`  ✓ ${tagCount} tags`)

  console.log('✅ Seed complete.')
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
