/**
 * Development and E2E seed data.
 *
 * This script is intentionally deterministic and idempotent. It upserts a
 * small set of users, lookup records, ingredients, and published recipes that
 * are safe to rely on in local development and Playwright tests.
 */

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

const E2E_USER = {
  firebaseUid: 'e2e-user',
  email: 'e2e-user@hagscancook.test',
  displayName: 'E2E Cook',
  role: 'user' as const,
}

const INGREDIENT_TYPES = [
  { name: 'Produce', slug: 'produce' },
  { name: 'Pasta', slug: 'pasta' },
  { name: 'Cheese', slug: 'cheese' },
  { name: 'Oils & Fats', slug: 'oils-fats' },
  { name: 'Spices', slug: 'spices' },
]

const TAGS = [
  { name: 'Dinner', slug: 'dinner' },
  { name: 'Weeknight', slug: 'weeknight' },
  { name: '30 Minutes or Less', slug: '30-minutes-or-less' },
  { name: 'Vegetarian', slug: 'vegetarian' },
]

const INGREDIENTS = [
  { name: 'spaghetti', typeSlug: 'pasta' },
  { name: 'cherry tomatoes', typeSlug: 'produce' },
  { name: 'olive oil', typeSlug: 'oils-fats' },
  { name: 'parmesan', typeSlug: 'cheese' },
  { name: 'black pepper', typeSlug: 'spices' },
]

const RECIPE_SLUG = 'e2e-weeknight-tomato-pasta'

async function upsertLookups() {
  for (const type of INGREDIENT_TYPES) {
    await prisma.ingredientType.upsert({
      where: { slug: type.slug },
      update: { name: type.name },
      create: type,
    })
  }

  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: tag,
    })
  }

  for (const ingredient of INGREDIENTS) {
    const type = await prisma.ingredientType.findUniqueOrThrow({
      where: { slug: ingredient.typeSlug },
      select: { id: true },
    })

    await prisma.ingredient.upsert({
      where: { name: ingredient.name },
      update: { typeId: type.id },
      create: {
        name: ingredient.name,
        typeId: type.id,
      },
    })
  }
}

async function upsertE2ERecipe() {
  const author = await prisma.user.upsert({
    where: { firebaseUid: E2E_USER.firebaseUid },
    update: {
      email: E2E_USER.email,
      displayName: E2E_USER.displayName,
      role: E2E_USER.role,
    },
    create: E2E_USER,
  })

  const recipe = await prisma.recipe.upsert({
    where: { slug: RECIPE_SLUG },
    update: {
      title: 'Weeknight Tomato Pasta',
      description: 'A fast, bright pasta fixture for local development and E2E tests.',
      coverImageUrl: null,
      prepTimeMins: 10,
      cookTimeMins: 15,
      servings: 2,
      status: 'published',
      cuisine: 'Italian',
      difficulty: 'Easy',
      dietaryRestrictions: ['Vegetarian'],
      cookingMethods: ['Boiled', 'Sautéed'],
      sourceUrl: null,
      sourceAttribution: null,
      authorId: author.id,
      deletedAt: null,
    },
    create: {
      slug: RECIPE_SLUG,
      title: 'Weeknight Tomato Pasta',
      description: 'A fast, bright pasta fixture for local development and E2E tests.',
      coverImageUrl: null,
      prepTimeMins: 10,
      cookTimeMins: 15,
      servings: 2,
      status: 'published',
      cuisine: 'Italian',
      difficulty: 'Easy',
      dietaryRestrictions: ['Vegetarian'],
      cookingMethods: ['Boiled', 'Sautéed'],
      sourceUrl: null,
      sourceAttribution: null,
      authorId: author.id,
      deletedAt: null,
    },
  })

  await prisma.step.deleteMany({ where: { recipeId: recipe.id } })
  await prisma.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } })
  await prisma.recipeTag.deleteMany({ where: { recipeId: recipe.id } })

  await prisma.step.createMany({
    data: [
      {
        recipeId: recipe.id,
        order: 1,
        content: 'Boil the spaghetti until al dente, reserving a cup of pasta water.',
      },
      {
        recipeId: recipe.id,
        order: 2,
        content: 'Sauté tomatoes in olive oil until jammy, then toss with pasta.',
      },
      {
        recipeId: recipe.id,
        order: 3,
        content: 'Finish with parmesan and black pepper before serving.',
      },
    ],
  })

  const ingredientRows = await prisma.ingredient.findMany({
    where: { name: { in: INGREDIENTS.map((ingredient) => ingredient.name) } },
    select: { id: true, name: true },
  })
  const ingredientByName = new Map(
    ingredientRows.map((ingredient) => [ingredient.name, ingredient.id])
  )

  await prisma.recipeIngredient.createMany({
    data: [
      {
        recipeId: recipe.id,
        ingredientId: ingredientByName.get('spaghetti')!,
        quantity: '8',
        unit: 'oz',
        preparation: null,
        groupLabel: null,
        display: null,
        order: 1,
      },
      {
        recipeId: recipe.id,
        ingredientId: ingredientByName.get('cherry tomatoes')!,
        quantity: '2',
        unit: 'cups',
        preparation: 'halved',
        groupLabel: null,
        display: null,
        order: 2,
      },
      {
        recipeId: recipe.id,
        ingredientId: ingredientByName.get('olive oil')!,
        quantity: '2',
        unit: 'tbsp',
        preparation: null,
        groupLabel: null,
        display: null,
        order: 3,
      },
      {
        recipeId: recipe.id,
        ingredientId: ingredientByName.get('parmesan')!,
        quantity: '1/2',
        unit: 'cup',
        preparation: 'grated',
        groupLabel: null,
        display: null,
        order: 4,
      },
    ],
  })

  const tagRows = await prisma.tag.findMany({
    where: { slug: { in: TAGS.map((tag) => tag.slug) } },
    select: { id: true },
  })

  await prisma.recipeTag.createMany({
    data: tagRows.map((tag) => ({
      recipeId: recipe.id,
      tagId: tag.id,
    })),
  })

  return recipe
}

async function main() {
  console.log('🌱 Seeding development fixtures…')
  await upsertLookups()
  const recipe = await upsertE2ERecipe()
  console.log(`  ✓ recipe: /recipes/${recipe.slug}`)
  console.log(`  ✓ user: ${E2E_USER.email}`)
  console.log('✅ Development seed complete.')
}

main()
  .catch((err) => {
    console.error('Development seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
