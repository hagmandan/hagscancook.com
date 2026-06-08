/**
 * One-time seed: imports Dan Hagman's personal recipe spreadsheet into his account.
 *
 * Usage:
 *   yarn tsx scripts/seed-hagman-recipes.ts
 *
 * Requires DATABASE_URL in .env. Idempotent — safe to re-run.
 */

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

const AUTHOR_EMAIL = 'hagman.dan@gmail.com'

// ---------------------------------------------------------------------------
// Canonical ingredients needed across all recipes
// ---------------------------------------------------------------------------

const INGREDIENTS: Array<{ name: string; typeSlug: string }> = [
  // Poultry
  { name: 'chicken breast', typeSlug: 'poultry' },
  { name: 'whole chicken', typeSlug: 'poultry' },
  { name: 'chicken wings', typeSlug: 'poultry' },
  // Meat
  { name: 'flank steak', typeSlug: 'meat' },
  { name: 'bacon', typeSlug: 'meat' },
  { name: 'ground beef', typeSlug: 'meat' },
  // Eggs & Dairy
  { name: 'eggs', typeSlug: 'eggs' },
  { name: 'butter', typeSlug: 'dairy' },
  { name: 'milk', typeSlug: 'dairy' },
  { name: 'dairy-free milk', typeSlug: 'dairy' },
  { name: 'coconut milk', typeSlug: 'dairy' },
  // Cheese
  { name: 'gorgonzola', typeSlug: 'cheese' },
  { name: 'parmesan', typeSlug: 'cheese' },
  // Produce
  { name: 'potato', typeSlug: 'produce' },
  { name: 'russet potatoes', typeSlug: 'produce' },
  { name: 'carrots', typeSlug: 'produce' },
  { name: 'brussels sprouts', typeSlug: 'produce' },
  { name: 'cauliflower', typeSlug: 'produce' },
  { name: 'broccoli', typeSlug: 'produce' },
  { name: 'zucchini', typeSlug: 'produce' },
  { name: 'green beans', typeSlug: 'produce' },
  { name: 'portobello mushrooms', typeSlug: 'produce' },
  { name: 'mushrooms', typeSlug: 'produce' },
  { name: 'onion', typeSlug: 'produce' },
  { name: 'yellow onion', typeSlug: 'produce' },
  { name: 'garlic', typeSlug: 'produce' },
  { name: 'scallions', typeSlug: 'produce' },
  { name: 'jalapeño', typeSlug: 'produce' },
  { name: 'celery', typeSlug: 'produce' },
  { name: 'leeks', typeSlug: 'produce' },
  { name: 'lemon', typeSlug: 'produce' },
  { name: 'fennel', typeSlug: 'produce' },
  { name: 'spinach', typeSlug: 'produce' },
  { name: 'cilantro', typeSlug: 'produce' },
  { name: 'fresh thyme', typeSlug: 'herbs' },
  { name: 'fresh rosemary', typeSlug: 'herbs' },
  { name: 'fresh sage', typeSlug: 'herbs' },
  { name: 'fresh parsley', typeSlug: 'herbs' },
  // Grains & Legumes
  { name: 'steel-cut oats', typeSlug: 'grains' },
  { name: 'jasmine rice', typeSlug: 'grains' },
  { name: 'long-grain white rice', typeSlug: 'grains' },
  { name: 'long-grain brown rice', typeSlug: 'grains' },
  { name: 'quinoa', typeSlug: 'grains' },
  { name: 'brown lentils', typeSlug: 'legumes' },
  { name: 'chickpeas', typeSlug: 'legumes' },
  { name: 'gluten-free breadcrumbs', typeSlug: 'bread-bakery' },
  // Oils & Fats
  { name: 'olive oil', typeSlug: 'oils-fats' },
  { name: 'vegetable oil', typeSlug: 'oils-fats' },
  { name: 'bacon fat', typeSlug: 'oils-fats' },
  // Sauces & Condiments
  { name: 'soy sauce', typeSlug: 'condiments' },
  { name: 'worcestershire sauce', typeSlug: 'condiments' },
  { name: 'dijon mustard', typeSlug: 'condiments' },
  { name: 'ketchup', typeSlug: 'condiments' },
  { name: 'tomato paste', typeSlug: 'canned-goods' },
  // Vinegars & Acids
  { name: 'red wine vinegar', typeSlug: 'vinegars-acids' },
  { name: 'apple cider vinegar', typeSlug: 'vinegars-acids' },
  { name: 'white vinegar', typeSlug: 'vinegars-acids' },
  { name: 'lemon juice', typeSlug: 'vinegars-acids' },
  // Sweeteners
  { name: 'brown sugar', typeSlug: 'sweeteners' },
  { name: 'molasses', typeSlug: 'sweeteners' },
  // Broth & Stock
  { name: 'chicken broth', typeSlug: 'broth-stock' },
  { name: 'vegetable broth', typeSlug: 'broth-stock' },
  // Alcohol
  { name: 'white wine', typeSlug: 'alcohol-wine' },
  // Baking
  { name: 'all-purpose flour', typeSlug: 'baking' },
  // Spices
  { name: 'salt', typeSlug: 'spices' },
  { name: 'black pepper', typeSlug: 'spices' },
  { name: 'paprika', typeSlug: 'spices' },
  { name: 'smoked paprika', typeSlug: 'spices' },
  { name: 'garlic powder', typeSlug: 'spices' },
  { name: 'onion powder', typeSlug: 'spices' },
  { name: 'cumin', typeSlug: 'spices' },
  { name: 'coriander', typeSlug: 'spices' },
  { name: 'turmeric', typeSlug: 'spices' },
  { name: 'chili powder', typeSlug: 'spices' },
  { name: 'cayenne pepper', typeSlug: 'spices' },
  { name: 'cinnamon', typeSlug: 'spices' },
  { name: 'pumpkin spice', typeSlug: 'spices' },
  { name: 'bay leaf', typeSlug: 'spices' },
  { name: 'oregano', typeSlug: 'spices' },
  { name: 'thyme', typeSlug: 'spices' },
  { name: 'ginger powder', typeSlug: 'spices' },
  { name: 'curry powder', typeSlug: 'spices' },
]

// ---------------------------------------------------------------------------
// Recipe definitions
// ---------------------------------------------------------------------------

type IngredientRow = {
  name: string
  quantity: string
  unit?: string
  preparation?: string
  groupLabel?: string
}

type RecipeDef = {
  slug: string
  title: string
  description: string
  prepTimeMins?: number
  cookTimeMins?: number
  servings?: number
  cuisine?: string
  difficulty?: string
  dietaryRestrictions?: string[]
  cookingMethods?: string[]
  tagSlugs?: string[]
  ingredients: IngredientRow[]
  steps: string[]
}

const RECIPES: RecipeDef[] = [
  // ─── Instant Pot ──────────────────────────────────────────────────────────

  {
    slug: 'instant-pot-shredded-chicken',
    title: 'Instant Pot Shredded Chicken',
    description:
      'Juicy, perfectly seasoned shredded chicken made fast in the Instant Pot. Great for meal prep — use in tacos, grain bowls, salads, or on its own.',
    prepTimeMins: 5,
    cookTimeMins: 20,
    servings: 6,
    cuisine: 'American',
    difficulty: 'Easy',
    dietaryRestrictions: ['Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Pressure Cooked'],
    tagSlugs: ['instant-pot', 'meal-prep', 'make-ahead', 'batch-cooking', 'healthy'],
    ingredients: [
      { name: 'chicken breast', quantity: '3', unit: 'lbs' },
      { name: 'chicken broth', quantity: '1', unit: 'cup' },
      { name: 'salt', quantity: '1', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
      { name: 'paprika', quantity: '1', unit: 'tsp' },
      { name: 'garlic powder', quantity: '1', unit: 'tsp' },
      { name: 'bay leaf', quantity: '1' },
    ],
    steps: [
      'Season chicken breasts generously with salt, pepper, paprika, and garlic powder.',
      'Place chicken in the Instant Pot. Add 1 cup of chicken broth and the bay leaf.',
      'Seal the lid and cook on Manual High Pressure for 10 minutes.',
      'Allow Natural Pressure Release for 5 minutes, then carefully quick-release any remaining pressure.',
      'Remove the bay leaf. Shred the chicken using two forks directly in the pot.',
      'Return shredded chicken to the pot with the juices. Optionally, sauté on Low for 10 minutes to reduce and intensify the flavor.',
    ],
  },

  {
    slug: 'instant-pot-hard-boiled-eggs',
    title: 'Instant Pot Hard Boiled Eggs',
    description:
      'Foolproof hard boiled eggs every time, with shells that practically slip off. The 5-5-5 method (5 min cook, 5 min NPR, 5 min ice bath) is the secret.',
    prepTimeMins: 2,
    cookTimeMins: 15,
    servings: 6,
    difficulty: 'Easy',
    dietaryRestrictions: ['Gluten-Free', 'Dairy-Free', 'Vegetarian'],
    cookingMethods: ['Pressure Cooked'],
    tagSlugs: ['instant-pot', 'breakfast', 'meal-prep', '30-minutes-or-less', 'healthy'],
    ingredients: [
      { name: 'eggs', quantity: '6' },
      { name: 'salt', quantity: '1', unit: 'tsp' },
    ],
    steps: [
      'Pour 1 cup of water into the Instant Pot and place the trivet/steam rack inside.',
      'Arrange eggs in a single layer on the trivet.',
      'Seal the lid and cook on Manual High Pressure for 5 minutes.',
      'Allow Natural Pressure Release for 5 minutes, then quick-release remaining pressure.',
      'Transfer eggs immediately to an ice bath and let sit for 5 minutes.',
      'Peel and enjoy, or refrigerate unpeeled for up to 1 week.',
    ],
  },

  {
    slug: 'instant-pot-steel-cut-oats',
    title: 'Instant Pot Steel-Cut Oats',
    description:
      'Hearty, creamy steel-cut oats with warm fall spices — made completely hands-off in the Instant Pot. Great for batch cooking breakfast for the week.',
    prepTimeMins: 2,
    cookTimeMins: 20,
    servings: 4,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Dairy-Free', 'Gluten-Free'],
    cookingMethods: ['Pressure Cooked'],
    tagSlugs: ['instant-pot', 'breakfast', 'meal-prep', 'batch-cooking', 'healthy'],
    ingredients: [
      { name: 'steel-cut oats', quantity: '1', unit: 'cup' },
      { name: 'pumpkin spice', quantity: '1', unit: 'tsp' },
      { name: 'cinnamon', quantity: '1/2', unit: 'tsp' },
      { name: 'salt', quantity: '1/4', unit: 'tsp' },
    ],
    steps: [
      'Add oats, 3 cups of water, pumpkin spice, cinnamon, and a pinch of salt to the Instant Pot. Stir to combine.',
      'Seal the lid and cook on Manual High Pressure for 4 minutes.',
      'Allow Natural Pressure Release for 15 minutes — do not rush this step, the oats continue cooking.',
      'Stir well before serving. Top with fruit, nuts, maple syrup, or your favorite toppings.',
    ],
  },

  {
    slug: 'instant-pot-jasmine-rice',
    title: 'Instant Pot Jasmine Rice',
    description:
      'Perfectly fluffy jasmine rice every time with subtle savory aromatics. The 1:1 ratio and natural release are the keys to non-mushy pressure cooker rice.',
    prepTimeMins: 2,
    cookTimeMins: 18,
    servings: 4,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Pressure Cooked'],
    tagSlugs: ['instant-pot', 'side-dish', 'weeknight', '30-minutes-or-less', 'meal-prep'],
    ingredients: [
      { name: 'jasmine rice', quantity: '1', unit: 'cup' },
      { name: 'chicken broth', quantity: '1', unit: 'cup' },
      { name: 'garlic', quantity: '2', unit: 'cloves', preparation: 'smashed' },
      { name: 'ginger powder', quantity: '1/4', unit: 'tsp' },
      { name: 'bay leaf', quantity: '1' },
      { name: 'salt', quantity: '1/2', unit: 'tsp' },
    ],
    steps: [
      'Rinse rice until the water runs mostly clear, then drain.',
      'Combine rice, broth (1:1 ratio), garlic, ginger, bay leaf, and salt in the Instant Pot.',
      'Seal the lid and cook on Manual High Pressure for 5 minutes.',
      'Allow Natural Pressure Release for 10 minutes, then quick-release remaining pressure.',
      'Remove the bay leaf and garlic cloves, fluff with a fork, and serve.',
    ],
  },

  {
    slug: 'instant-pot-brown-rice',
    title: 'Instant Pot Long Grain Brown Rice',
    description:
      'Nutty, perfectly cooked long grain brown rice with a slightly savory edge. Slightly more water (1:1.25) and a longer cook than white rice are the key adjustments.',
    prepTimeMins: 2,
    cookTimeMins: 35,
    servings: 4,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Pressure Cooked'],
    tagSlugs: ['instant-pot', 'side-dish', 'meal-prep', 'batch-cooking', 'healthy'],
    ingredients: [
      { name: 'long-grain brown rice', quantity: '1', unit: 'cup' },
      { name: 'chicken broth', quantity: '1.25', unit: 'cups' },
      { name: 'garlic', quantity: '2', unit: 'cloves', preparation: 'smashed' },
      { name: 'ginger powder', quantity: '1/4', unit: 'tsp' },
      { name: 'bay leaf', quantity: '1' },
      { name: 'salt', quantity: '1/2', unit: 'tsp' },
    ],
    steps: [
      'Rinse rice until water runs mostly clear, then drain.',
      'Combine rice, broth (1:1.25 ratio), garlic, ginger, bay leaf, and salt in the Instant Pot.',
      'Seal the lid and cook on Manual High Pressure for 22 minutes.',
      'Allow Natural Pressure Release for 10 minutes, then quick-release remaining pressure.',
      'Remove the bay leaf and garlic, fluff with a fork, and serve.',
    ],
  },

  {
    slug: 'instant-pot-lentils',
    title: 'Instant Pot Lentils',
    description:
      'Tender, subtly seasoned brown or green lentils cooked quickly under pressure. A protein-packed base for bowls, soups, or salads.',
    prepTimeMins: 5,
    cookTimeMins: 22,
    servings: 4,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Pressure Cooked'],
    tagSlugs: ['instant-pot', 'meal-prep', 'batch-cooking', 'healthy', 'budget-friendly'],
    ingredients: [
      { name: 'brown lentils', quantity: '1', unit: 'cup' },
      { name: 'vegetable broth', quantity: '2', unit: 'cups' },
      { name: 'garlic', quantity: '2', unit: 'cloves', preparation: 'smashed' },
      { name: 'bay leaf', quantity: '1' },
      { name: 'fresh thyme', quantity: '2', unit: 'sprigs' },
      { name: 'salt', quantity: '3/4', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/4', unit: 'tsp' },
    ],
    steps: [
      'Rinse and pick over lentils, discarding any debris.',
      'Combine lentils, broth (1:2 ratio), garlic, bay leaf, and thyme in the Instant Pot.',
      'Seal the lid and cook on Manual High Pressure for 10 minutes.',
      'Allow Natural Pressure Release for 10 minutes, then quick-release remaining pressure.',
      'Remove the bay leaf and thyme stems. Season with salt and pepper. Drain excess liquid if desired.',
    ],
  },

  {
    slug: 'instant-pot-quinoa',
    title: 'Instant Pot Quinoa',
    description:
      'Light, fluffy quinoa cooked in minutes under pressure. Rinsing before cooking is essential to remove the bitter saponin coating.',
    prepTimeMins: 5,
    cookTimeMins: 15,
    servings: 4,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Pressure Cooked'],
    tagSlugs: ['instant-pot', 'side-dish', 'meal-prep', '30-minutes-or-less', 'healthy'],
    ingredients: [
      { name: 'quinoa', quantity: '1', unit: 'cup' },
      { name: 'chicken broth', quantity: '1.5', unit: 'cups' },
      { name: 'garlic', quantity: '1', unit: 'clove', preparation: 'smashed' },
      { name: 'bay leaf', quantity: '1' },
      { name: 'salt', quantity: '1/2', unit: 'tsp' },
    ],
    steps: [
      'Rinse quinoa thoroughly in a fine-mesh strainer under cold water for at least 30 seconds.',
      'Combine quinoa, broth (1:1.5 ratio), garlic, bay leaf, and salt in the Instant Pot.',
      'Seal the lid and cook on Manual High Pressure for 2 minutes.',
      'Allow Natural Pressure Release for 10 minutes, then quick-release remaining pressure.',
      'Remove the bay leaf and garlic. Fluff quinoa gently with a fork and serve.',
    ],
  },

  {
    slug: 'instant-pot-vegan-vegetable-soup',
    title: 'Instant Pot Vegan Vegetable Soup',
    description:
      'A cozy, nourishing vegetable soup with a coconut milk base and warming spices. Everything goes in the pot together — minimal effort, maximum comfort.',
    prepTimeMins: 15,
    cookTimeMins: 20,
    servings: 6,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Pressure Cooked', 'Sautéed'],
    tagSlugs: ['instant-pot', 'soup', 'dinner', 'weeknight', 'one-pot', 'healthy'],
    ingredients: [
      { name: 'onion', quantity: '1', preparation: 'diced' },
      { name: 'garlic', quantity: '4', unit: 'cloves', preparation: 'minced' },
      { name: 'carrots', quantity: '1', unit: 'lb', preparation: 'diced' },
      { name: 'leeks', quantity: '1', preparation: 'sliced' },
      { name: 'potato', quantity: '2', unit: 'lbs', preparation: 'cubed' },
      { name: 'cauliflower', quantity: '1', unit: 'head', preparation: 'cut into florets' },
      { name: 'celery', quantity: '1', unit: 'heart', preparation: 'sliced' },
      { name: 'vegetable broth', quantity: '2', unit: 'cups' },
      { name: 'coconut milk', quantity: '2', unit: 'cups' },
      { name: 'lemon', quantity: '1' },
      { name: 'olive oil', quantity: '2', unit: 'tbsp' },
      { name: 'thyme', quantity: '1', unit: 'tsp' },
      { name: 'oregano', quantity: '1', unit: 'tsp' },
      { name: 'bay leaf', quantity: '2' },
      { name: 'paprika', quantity: '1', unit: 'tsp' },
      { name: 'cumin', quantity: '1/2', unit: 'tsp' },
      { name: 'turmeric', quantity: '1/2', unit: 'tsp' },
      { name: 'ginger powder', quantity: '1/2', unit: 'tsp' },
      { name: 'salt', quantity: '1', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
      { name: 'brown lentils', quantity: '1', unit: 'cup', groupLabel: 'Optional add-ins' },
      { name: 'mushrooms', quantity: '1', unit: 'pack', preparation: 'sliced', groupLabel: 'Optional add-ins' },
    ],
    steps: [
      'Set Instant Pot to Sauté. Heat olive oil and cook onion, garlic, and leeks until softened, about 3 minutes.',
      'Add all spices (thyme, oregano, paprika, cumin, turmeric, ginger) and stir for 30 seconds.',
      'Add all vegetables (carrots, celery, potatoes, cauliflower), broth, coconut milk, and bay leaves. If adding lentils or mushrooms, add them now.',
      'Seal the lid and cook on Manual High Pressure for 5 minutes.',
      'Allow Natural Pressure Release for about 5 minutes, then quick-release remaining pressure.',
      'Remove bay leaves. Use an immersion blender to partially or fully blend the soup to your preferred consistency.',
      'Add lemon juice to taste, adjust seasoning, and serve.',
    ],
  },

  // ─── Oven Roasted ─────────────────────────────────────────────────────────

  {
    slug: 'roasted-potato-wedges',
    title: 'Crispy Oven Roasted Potato Wedges',
    description:
      'Golden, crispy potato wedges seasoned simply with garlic and onion powder. High heat (425°F) and giving them space on the pan are the secrets to getting the crisp.',
    prepTimeMins: 10,
    cookTimeMins: 25,
    servings: 4,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Roasted'],
    tagSlugs: ['baked', 'side-dish', 'weeknight', '30-minutes-or-less', 'kid-friendly'],
    ingredients: [
      { name: 'potato', quantity: '2', unit: 'lbs', preparation: 'cut into wedges' },
      { name: 'olive oil', quantity: '2', unit: 'tbsp' },
      { name: 'salt', quantity: '1', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
      { name: 'garlic powder', quantity: '1', unit: 'tsp' },
      { name: 'onion powder', quantity: '1', unit: 'tsp' },
    ],
    steps: [
      'Preheat oven to 425°F. Line a large sheet pan with parchment or foil.',
      'Toss potato wedges with olive oil, salt, pepper, garlic powder, and onion powder until evenly coated.',
      'Spread wedges in a single layer, cut side down, with space between them. Crowding causes steaming, not crisping.',
      'Roast for 25 minutes, flipping halfway, until golden brown and crispy.',
      'Season with additional salt if needed and serve immediately.',
    ],
  },

  {
    slug: 'roasted-carrots',
    title: 'Simple Oven Roasted Carrots',
    description:
      'Sweet, caramelized carrots roasted at high heat until tender. One of the best low-effort side dishes there is.',
    prepTimeMins: 5,
    cookTimeMins: 18,
    servings: 4,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Roasted'],
    tagSlugs: ['baked', 'side-dish', 'weeknight', '30-minutes-or-less', 'healthy'],
    ingredients: [
      { name: 'carrots', quantity: '1', unit: 'lb', preparation: 'peeled and cut into sticks' },
      { name: 'olive oil', quantity: '1.5', unit: 'tbsp' },
      { name: 'salt', quantity: '3/4', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/4', unit: 'tsp' },
      { name: 'garlic powder', quantity: '1/2', unit: 'tsp' },
    ],
    steps: [
      'Preheat oven to 425°F.',
      'Toss carrots with olive oil, salt, pepper, and garlic powder.',
      'Spread in a single layer on a sheet pan.',
      'Roast for 18 minutes, turning once halfway, until tender and caramelized at the edges.',
    ],
  },

  {
    slug: 'roasted-brussels-sprouts',
    title: 'Crispy Roasted Brussels Sprouts',
    description:
      'Crispy, caramelized Brussels sprouts with nutty browned edges. The key is a very hot oven and making sure they are cut-side-down on the pan.',
    prepTimeMins: 8,
    cookTimeMins: 15,
    servings: 4,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Roasted'],
    tagSlugs: ['baked', 'side-dish', 'weeknight', '30-minutes-or-less', 'healthy'],
    ingredients: [
      { name: 'brussels sprouts', quantity: '1', unit: 'lb', preparation: 'trimmed and halved' },
      { name: 'olive oil', quantity: '2', unit: 'tbsp' },
      { name: 'salt', quantity: '3/4', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
      { name: 'garlic powder', quantity: '1/2', unit: 'tsp' },
    ],
    steps: [
      'Preheat oven to 425°F.',
      'Trim the ends off sprouts and halve them lengthwise. Toss with olive oil, salt, pepper, and garlic powder.',
      'Place cut-side down in a single layer on a sheet pan — this maximizes caramelization.',
      'Roast for 15 minutes until crispy and deeply browned on the cut side. Serve immediately.',
    ],
  },

  {
    slug: 'roasted-chickpeas',
    title: 'Crispy Roasted Chickpeas',
    description:
      'Crunchy, protein-packed roasted chickpeas that work as a snack or salad topper. The spice blend here uses curry powder for a savory warmth, but harissa or shawarma spice are equally great.',
    prepTimeMins: 5,
    cookTimeMins: 20,
    servings: 4,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Roasted'],
    tagSlugs: ['baked', 'side-dish', 'snack', 'healthy', 'budget-friendly'],
    ingredients: [
      { name: 'chickpeas', quantity: '15', unit: 'oz', preparation: 'drained, rinsed, and dried' },
      { name: 'olive oil', quantity: '1.5', unit: 'tbsp' },
      { name: 'salt', quantity: '3/4', unit: 'tsp' },
      { name: 'garlic powder', quantity: '1/2', unit: 'tsp' },
      { name: 'curry powder', quantity: '1', unit: 'tsp' },
    ],
    steps: [
      'Preheat oven to 425°F.',
      'Drain, rinse, and thoroughly dry the chickpeas — moisture is the enemy of crispiness. Pat dry with a towel.',
      'Toss chickpeas with olive oil, salt, garlic powder, and curry powder.',
      'Spread in a single layer on a sheet pan. Roast for 20 minutes, shaking the pan halfway through, until golden and crispy.',
      'They will crisp up further as they cool. Serve as a snack or sprinkle over salads and grain bowls.',
    ],
  },

  // ─── Air Fryer ────────────────────────────────────────────────────────────

  {
    slug: 'air-fryer-cauliflower',
    title: 'Air Fryer Spiced Cauliflower',
    description:
      'Golden, tender cauliflower florets spiced with turmeric, paprika, and garlic. The air fryer gets everything beautifully caramelized in just 15 minutes.',
    prepTimeMins: 8,
    cookTimeMins: 15,
    servings: 3,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Air Fryer'],
    tagSlugs: ['air-fryer', 'side-dish', 'weeknight', '30-minutes-or-less', 'healthy'],
    ingredients: [
      { name: 'cauliflower', quantity: '1', unit: 'head', preparation: 'cut into florets' },
      { name: 'olive oil', quantity: '2', unit: 'tbsp' },
      { name: 'turmeric', quantity: '1/2', unit: 'tsp' },
      { name: 'paprika', quantity: '1/2', unit: 'tsp' },
      { name: 'garlic powder', quantity: '1/2', unit: 'tsp' },
      { name: 'salt', quantity: '3/4', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/4', unit: 'tsp' },
    ],
    steps: [
      'Toss cauliflower florets with olive oil, turmeric, paprika, garlic powder, salt, and pepper until evenly coated.',
      'Arrange in the air fryer basket in a single layer (cook in batches if needed).',
      'Air fry at 400°F for 15 minutes, shaking the basket halfway through, until golden and tender.',
    ],
  },

  {
    slug: 'air-fryer-broccoli',
    title: 'Air Fryer Broccoli',
    description:
      'Quick, crispy-edged broccoli florets out of the air fryer in just 8 minutes. Season however you like — this is a blueprint, not a prescription.',
    prepTimeMins: 5,
    cookTimeMins: 8,
    servings: 3,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Air Fryer'],
    tagSlugs: ['air-fryer', 'side-dish', 'weeknight', '30-minutes-or-less', 'healthy'],
    ingredients: [
      { name: 'broccoli', quantity: '1', unit: 'head', preparation: 'cut into florets' },
      { name: 'olive oil', quantity: '1.5', unit: 'tbsp' },
      { name: 'salt', quantity: '1/2', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/4', unit: 'tsp' },
      { name: 'garlic powder', quantity: '1/2', unit: 'tsp' },
    ],
    steps: [
      'Toss broccoli with olive oil, salt, pepper, and garlic powder.',
      'Air fry at 375°F for 8 minutes, shaking the basket once halfway through.',
      'Florets should be tender with slightly charred, crispy edges. Add additional seasonings to taste.',
    ],
  },

  // ─── Full Recipes ─────────────────────────────────────────────────────────

  {
    slug: 'dry-rub-chicken-wings',
    title: 'Dry Rub Chicken Wings',
    description:
      'Bold, smoky-spiced chicken wings with a deeply flavored crust — no sauce needed. This dry rub blend is heavy on aromatic herbs and smoked paprika.',
    prepTimeMins: 10,
    cookTimeMins: 45,
    servings: 4,
    cuisine: 'American',
    difficulty: 'Easy',
    dietaryRestrictions: ['Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Baked'],
    tagSlugs: ['baked', 'dinner', 'game-day', 'weekend'],
    ingredients: [
      { name: 'chicken wings', quantity: '4', unit: 'lbs' },
      { name: 'salt', quantity: '1.5', unit: 'tbsp' },
      { name: 'oregano', quantity: '2', unit: 'tsp' },
      { name: 'thyme', quantity: '2', unit: 'tsp' },
      { name: 'garlic powder', quantity: '2', unit: 'tsp' },
      { name: 'onion powder', quantity: '2', unit: 'tsp' },
      { name: 'smoked paprika', quantity: '2', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
      { name: 'chili powder', quantity: '1/2', unit: 'tsp' },
      { name: 'cumin', quantity: '1/2', unit: 'tsp' },
      { name: 'coriander', quantity: '1/2', unit: 'tsp' },
    ],
    steps: [
      'Pat wings completely dry with paper towels — this is the most important step for crispy skin.',
      'Combine all dry rub spices in a bowl. Toss wings with the spice mix until every piece is well coated.',
      'For best results, let wings rest uncovered in the fridge for at least 1 hour (or up to overnight).',
      'Preheat oven to 425°F. Place wings on a wire rack set over a sheet pan.',
      'Bake for 40–45 minutes, flipping halfway, until deeply browned and the skin is crispy.',
      'Rest for 5 minutes before serving.',
    ],
  },

  {
    slug: 'homemade-bbq-sauce',
    title: 'Quick Homemade BBQ Sauce',
    description:
      'A balanced, tangy-sweet BBQ sauce built on tomato paste rather than ketchup for a more complex, less cloyingly sweet result. Ready in 10 minutes.',
    prepTimeMins: 5,
    cookTimeMins: 10,
    servings: 8,
    cuisine: 'American',
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['No-Cook'],
    tagSlugs: ['make-ahead', 'budget-friendly'],
    ingredients: [
      { name: 'tomato paste', quantity: '2', unit: 'tbsp' },
      { name: 'apple cider vinegar', quantity: '2', unit: 'tbsp' },
      { name: 'brown sugar', quantity: '2', unit: 'tbsp' },
      { name: 'molasses', quantity: '2', unit: 'tbsp' },
      { name: 'dijon mustard', quantity: '1/2', unit: 'tbsp' },
      { name: 'worcestershire sauce', quantity: '1', unit: 'tsp' },
      { name: 'smoked paprika', quantity: '1', unit: 'tsp' },
      { name: 'garlic powder', quantity: '1/4', unit: 'tsp' },
      { name: 'onion powder', quantity: '1/4', unit: 'tsp' },
      { name: 'cayenne pepper', quantity: '1/8', unit: 'tsp' },
    ],
    steps: [
      'Whisk all ingredients together in a small saucepan until smooth.',
      'Simmer over medium-low heat for 8–10 minutes, stirring occasionally, until slightly thickened.',
      'Taste and adjust: more vinegar for tang, more brown sugar for sweetness, more cayenne for heat.',
      'Use immediately or store in a jar in the fridge for up to 2 weeks.',
    ],
  },

  {
    slug: 'marinated-flank-steak',
    title: 'Marinated Flank Steak',
    description:
      'A classic steakhouse-style flank steak marinade with soy, vinegar, and Worcestershire. Marinate for at least 2 hours — overnight is better. Slice thin against the grain.',
    prepTimeMins: 10,
    cookTimeMins: 15,
    servings: 4,
    cuisine: 'American',
    difficulty: 'Easy',
    dietaryRestrictions: ['Dairy-Free'],
    cookingMethods: ['Grilled'],
    tagSlugs: ['grilled', 'dinner', 'weekend', 'date-night'],
    ingredients: [
      { name: 'flank steak', quantity: '1.5', unit: 'lbs' },
      { name: 'soy sauce', quantity: '1/3', unit: 'cup' },
      { name: 'vegetable oil', quantity: '1/2', unit: 'cup' },
      { name: 'lemon juice', quantity: '2', unit: 'tbsp' },
      { name: 'red wine vinegar', quantity: '1/4', unit: 'cup' },
      { name: 'worcestershire sauce', quantity: '1.5', unit: 'tbsp' },
      { name: 'dijon mustard', quantity: '1', unit: 'tbsp' },
      { name: 'garlic', quantity: '2', unit: 'cloves', preparation: 'minced' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
    ],
    steps: [
      'Whisk together all marinade ingredients (everything except the steak).',
      'Place steak in a zip-lock bag or shallow dish. Pour marinade over and seal.',
      'Marinate in the refrigerator for at least 2 hours, or up to 24 hours for deeper flavor.',
      'Remove steak from marinade and pat dry. Discard marinade.',
      'Grill over high heat for 5–7 minutes per side for medium-rare (internal temp 130–135°F).',
      'Rest for 10 minutes, then slice thin against the grain.',
    ],
  },

  {
    slug: 'herb-butter-roast-chicken',
    title: 'Herb Butter Roast Chicken',
    description:
      'A whole roasted chicken with compound herb butter rubbed under the skin and a fragrant aromatic cavity. The vegetables roast underneath, catching all the drippings.',
    prepTimeMins: 30,
    cookTimeMins: 75,
    servings: 4,
    cuisine: 'American',
    difficulty: 'Medium',
    dietaryRestrictions: ['Gluten-Free'],
    cookingMethods: ['Roasted'],
    tagSlugs: ['baked', 'dinner', 'weekend', 'comfort-food'],
    ingredients: [
      { name: 'whole chicken', quantity: '1', preparation: '4–5 lbs, giblets removed' },
      { name: 'salt', quantity: '1', unit: 'tsp', groupLabel: 'Cavity & exterior' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp', groupLabel: 'Cavity & exterior' },
      { name: 'onion powder', quantity: '1/2', unit: 'tsp', groupLabel: 'Cavity & exterior' },
      { name: 'fresh thyme', quantity: '4', unit: 'sprigs', groupLabel: 'Cavity aromatics' },
      { name: 'fresh rosemary', quantity: '2', unit: 'sprigs', groupLabel: 'Cavity aromatics' },
      { name: 'garlic', quantity: '4', unit: 'cloves', preparation: 'whole', groupLabel: 'Cavity aromatics' },
      { name: 'celery', quantity: '1', unit: 'rib', preparation: 'diced', groupLabel: 'Cavity aromatics' },
      { name: 'yellow onion', quantity: '1/2', preparation: 'diced', groupLabel: 'Cavity aromatics' },
      { name: 'lemon', quantity: '1', preparation: 'zested and halved', groupLabel: 'Cavity aromatics' },
      { name: 'butter', quantity: '4', unit: 'tbsp', preparation: 'softened', groupLabel: 'Herb butter' },
      { name: 'garlic', quantity: '3', unit: 'cloves', preparation: 'minced', groupLabel: 'Herb butter' },
      { name: 'fresh sage', quantity: '1', unit: 'tbsp', preparation: 'finely chopped', groupLabel: 'Herb butter' },
      { name: 'fresh rosemary', quantity: '2', unit: 'tsp', preparation: 'finely chopped', groupLabel: 'Herb butter' },
      { name: 'fresh parsley', quantity: '1', unit: 'tbsp', preparation: 'finely chopped', groupLabel: 'Herb butter' },
      { name: 'fresh thyme', quantity: '1/2', unit: 'tsp', groupLabel: 'Herb butter' },
      { name: 'lemon juice', quantity: '1', unit: 'tbsp', groupLabel: 'Herb butter' },
      { name: 'yellow onion', quantity: '1', preparation: 'large dice', groupLabel: 'Roasting bed' },
      { name: 'carrots', quantity: '4', preparation: 'large dice', groupLabel: 'Roasting bed' },
      { name: 'celery', quantity: '2', unit: 'ribs', preparation: 'large dice', groupLabel: 'Roasting bed' },
      { name: 'fennel', quantity: '1', preparation: 'cut into wedges', groupLabel: 'Roasting bed' },
      { name: 'white wine', quantity: '1', unit: 'cup', groupLabel: 'Roasting bed' },
      { name: 'potato', quantity: '2', preparation: 'large dice', groupLabel: 'Roasting bed' },
    ],
    steps: [
      'Remove chicken from the fridge 30 minutes before cooking. Pat completely dry with paper towels.',
      'Make the herb butter: mash together softened butter, minced garlic, sage, rosemary, parsley, thyme, and lemon juice.',
      'Season the chicken cavity generously with salt, pepper, and onion powder. Stuff the cavity with thyme, rosemary, garlic cloves, celery, onion, and lemon halves.',
      'Using your fingers, gently separate the skin from the breast meat. Spread half the herb butter directly under the skin. Rub the remaining butter all over the exterior of the bird.',
      'Preheat oven to 450°F. Scatter the roasting vegetables and white wine in the bottom of a roasting pan. Place the chicken on top, breast side up.',
      'Roast at 450°F for 10 minutes to brown the skin, then reduce heat to 350°F.',
      'Continue roasting for about 65–75 minutes, basting with pan juices at 30 and 60 minutes, until a thermometer inserted in the thickest part of the thigh reads 165°F.',
      'Rest the chicken uncovered for 15 minutes before carving. Serve with the roasted vegetables and pan drippings.',
    ],
  },

  {
    slug: 'green-rice-arroz-verde',
    title: 'Green Rice (Arroz Verde)',
    description:
      'Vibrant, herby rice tinted green by a spinach and cilantro purée cooked directly into the grains. A stunning and flavorful side dish that pairs with anything.',
    prepTimeMins: 10,
    cookTimeMins: 35,
    servings: 6,
    cuisine: 'Mexican',
    difficulty: 'Medium',
    dietaryRestrictions: ['Vegetarian', 'Gluten-Free'],
    cookingMethods: ['Sautéed'],
    tagSlugs: ['side-dish', 'dinner', 'weeknight', 'comfort-food'],
    ingredients: [
      { name: 'spinach', quantity: '1', unit: 'cup', preparation: 'packed' },
      { name: 'cilantro', quantity: '1/2', unit: 'cup', preparation: 'packed sprigs' },
      { name: 'chicken broth', quantity: '1.25', unit: 'cups' },
      { name: 'milk', quantity: '1.25', unit: 'cups' },
      { name: 'salt', quantity: '1', unit: 'tsp' },
      { name: 'olive oil', quantity: '1', unit: 'tbsp' },
      { name: 'butter', quantity: '3', unit: 'tbsp' },
      { name: 'long-grain white rice', quantity: '1.5', unit: 'cups' },
      { name: 'jalapeño', quantity: '1', preparation: 'deseeded and diced' },
      { name: 'onion', quantity: '1/4', unit: 'cup', preparation: 'finely minced' },
      { name: 'garlic', quantity: '1', unit: 'clove', preparation: 'minced' },
    ],
    steps: [
      'Blend cilantro, spinach, and chicken broth in a blender until smooth. Add the milk and salt and blend again briefly.',
      'In a medium 3-quart saucepan over medium heat, heat olive oil and butter until the butter melts.',
      'Add rice and toast, stirring every 30 seconds, until it just begins to turn golden, 3–4 minutes.',
      'Add onion, garlic, and jalapeño and cook for 1 minute, stirring constantly.',
      'Pour in the blended green mixture, stir well, and bring to a boil over high heat.',
      'Cover, reduce heat to very low, and cook for 20 minutes without lifting the lid.',
      'Gently stir once, re-cover, and cook another 5 minutes.',
      'Remove from heat and let the rice steam in the covered pot for 10 minutes. Fluff and serve hot.',
    ],
  },

  {
    slug: 'stuffed-mushrooms-bacon-gorgonzola',
    title: 'Stuffed Portobello Mushrooms with Bacon and Gorgonzola',
    description:
      'Savory stuffed mushroom caps loaded with caramelized scallions, jalapeño, garlic, and crispy bacon, finished with crumbled gorgonzola. Bacon fat is the secret binding ingredient.',
    prepTimeMins: 20,
    cookTimeMins: 60,
    servings: 4,
    cuisine: 'American',
    difficulty: 'Medium',
    dietaryRestrictions: ['Gluten-Free'],
    cookingMethods: ['Baked'],
    tagSlugs: ['baked', 'appetizer', 'dinner', 'weekend', 'comfort-food'],
    ingredients: [
      { name: 'portobello mushrooms', quantity: '8', preparation: 'de-stemmed' },
      { name: 'bacon', quantity: '8', unit: 'slices' },
      { name: 'scallions', quantity: '4', unit: 'bunches', preparation: 'chopped' },
      { name: 'garlic', quantity: '2', unit: 'bulbs', preparation: 'minced' },
      { name: 'jalapeño', quantity: '4', preparation: 'deseeded and diced' },
      { name: 'bacon fat', quantity: '3', unit: 'tbsp' },
      { name: 'gorgonzola', quantity: '4', unit: 'oz', preparation: 'crumbled' },
      { name: 'black pepper', quantity: '1', unit: 'tsp', preparation: 'generous amount, to taste' },
    ],
    steps: [
      'Bake bacon at 335°F for 35 minutes on a wire rack over a parchment-lined sheet pan until crispy. Reserve the rendered bacon fat.',
      'Once bacon is cooled, roughly chop it. Finely chop the scallions, garlic, and jalapeños (deseed to your heat preference).',
      'Mix bacon, scallions, garlic, and jalapeños together. Add bacon fat, a little at a time, until everything is well coated but not swimming in fat.',
      'Season generously with black pepper.',
      'Remove the stems from mushroom caps. Optionally coat the caps with a thin layer of bacon fat.',
      'Scoop the filling into each mushroom cap, pressing gently to pack. Top each cap with crumbled gorgonzola.',
      'Roast at 450°F on a wire rack for 25 minutes (or 350°F directly on a tray for 35 minutes) until the mushrooms are tender and the cheese is melted and golden.',
    ],
  },

  {
    slug: 'classic-meatloaf',
    title: 'Classic Meatloaf with BBQ Glaze',
    description:
      'A juicy, old-school meatloaf with mushrooms for umami depth and a tangy-sweet BBQ-style glaze. The oat milk and breadcrumbs keep it moist; the double-bake caramelizes the glaze.',
    prepTimeMins: 20,
    cookTimeMins: 60,
    servings: 6,
    cuisine: 'American',
    difficulty: 'Medium',
    dietaryRestrictions: ['Dairy-Free'],
    cookingMethods: ['Baked'],
    tagSlugs: ['baked', 'dinner', 'comfort-food', 'weeknight', 'make-ahead'],
    ingredients: [
      { name: 'ground beef', quantity: '2', unit: 'lbs', groupLabel: 'Meatloaf' },
      { name: 'eggs', quantity: '2', groupLabel: 'Meatloaf' },
      { name: 'onion', quantity: '1', preparation: 'finely grated', groupLabel: 'Meatloaf' },
      { name: 'garlic', quantity: '3', unit: 'cloves', preparation: 'minced', groupLabel: 'Meatloaf' },
      { name: 'gluten-free breadcrumbs', quantity: '3/4', unit: 'cup', groupLabel: 'Meatloaf' },
      { name: 'dairy-free milk', quantity: '1/3', unit: 'cup', groupLabel: 'Meatloaf' },
      { name: 'ketchup', quantity: '3', unit: 'tbsp', groupLabel: 'Meatloaf' },
      { name: 'worcestershire sauce', quantity: '1', unit: 'tbsp', groupLabel: 'Meatloaf' },
      { name: 'mushrooms', quantity: '2', unit: 'cups', preparation: 'finely chopped', groupLabel: 'Meatloaf' },
      { name: 'garlic powder', quantity: '1', unit: 'tsp', groupLabel: 'Meatloaf' },
      { name: 'onion powder', quantity: '1', unit: 'tsp', groupLabel: 'Meatloaf' },
      { name: 'salt', quantity: '1', unit: 'tsp', groupLabel: 'Meatloaf' },
      { name: 'black pepper', quantity: '1/4', unit: 'tsp', groupLabel: 'Meatloaf' },
      { name: 'ketchup', quantity: '3/4', unit: 'cup', groupLabel: 'Glaze' },
      { name: 'white vinegar', quantity: '1', unit: 'tsp', groupLabel: 'Glaze' },
      { name: 'apple cider vinegar', quantity: '1', unit: 'tsp', groupLabel: 'Glaze' },
      { name: 'brown sugar', quantity: '2', unit: 'tbsp', groupLabel: 'Glaze' },
      { name: 'dijon mustard', quantity: '1', unit: 'tsp', groupLabel: 'Glaze' },
    ],
    steps: [
      'Preheat oven to 350°F. Mix all glaze ingredients together and set aside.',
      'In a large bowl, combine all meatloaf ingredients. Mix until just combined — do not overmix or the texture will be dense.',
      'For best results, let the mixture rest in the fridge for 30 minutes to 24 hours.',
      'Shape into a loaf on a rimmed sheet pan (or in a 9x5 loaf pan).',
      'Bake for 40–45 minutes until nearly set through.',
      'Spread glaze generously over the top. Increase oven temp to 400°F and bake another 10–15 minutes until the glaze is caramelized and the internal temperature reaches 160°F.',
      'Rest for 10 minutes before slicing.',
    ],
  },

  {
    slug: 'dairy-free-scalloped-potatoes',
    title: 'Dairy-Free Scalloped Potatoes',
    description:
      'Creamy, layered scalloped potatoes made entirely without dairy. The sauce uses dairy-free butter and milk and gets time in the oven to develop that classic golden-edged finish.',
    prepTimeMins: 20,
    cookTimeMins: 90,
    servings: 8,
    difficulty: 'Medium',
    dietaryRestrictions: ['Dairy-Free', 'Vegan', 'Vegetarian'],
    cookingMethods: ['Baked'],
    tagSlugs: ['baked', 'side-dish', 'comfort-food', 'weekend', 'make-ahead'],
    ingredients: [
      { name: 'russet potatoes', quantity: '6', unit: 'cups', preparation: 'peeled and sliced ⅛" thin' },
      { name: 'butter', quantity: '4', unit: 'tbsp', preparation: 'dairy-free' },
      { name: 'all-purpose flour', quantity: '4', unit: 'tbsp' },
      { name: 'dairy-free milk', quantity: '3', unit: 'cups', preparation: 'unsweetened' },
      { name: 'salt', quantity: '1.5', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
      { name: 'fresh thyme', quantity: '1', unit: 'tbsp' },
    ],
    steps: [
      'Preheat oven to 350°F. Grease a 9"x13" casserole dish.',
      'Peel and slice potatoes to ⅛" thickness. Place in a bowl of water to prevent browning as you work.',
      'Make the sauce: melt dairy-free butter in a large saucepan over medium heat. Add flour and cook, stirring, for 2 minutes.',
      'Gradually pour in the dairy-free milk, whisking constantly until smooth. Bring to a low boil and cook until thickened, about 10–15 minutes. Season with salt and pepper.',
      'Drain the potatoes and pat dry. Layer ⅓ of the potatoes in the dish, overlapping slightly. Pour ⅓ of the sauce over top. Repeat two more times.',
      'Cover with foil and bake for 30 minutes. Uncover and bake for another 60 minutes until golden and the potatoes are completely tender.',
      'Sprinkle with fresh thyme and let stand 10 minutes before serving — the sauce will thicken as it cools.',
    ],
  },
]

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

async function upsertIngredients() {
  const ingredientIdByName = new Map<string, string>()

  for (const ing of INGREDIENTS) {
    const type = await prisma.ingredientType.findUnique({
      where: { slug: ing.typeSlug },
      select: { id: true },
    })
    if (!type) {
      console.warn(`  ⚠ ingredient type not found: ${ing.typeSlug}, skipping "${ing.name}"`)
      continue
    }

    const record = await prisma.ingredient.upsert({
      where: { name: ing.name },
      update: { typeId: type.id },
      create: { name: ing.name, typeId: type.id },
      select: { id: true, name: true },
    })
    ingredientIdByName.set(record.name, record.id)
  }

  return ingredientIdByName
}

async function seedRecipe(
  recipe: RecipeDef,
  authorId: string,
  ingredientIdByName: Map<string, string>,
  tagIdBySlug: Map<string, string>
) {
  const upserted = await prisma.recipe.upsert({
    where: { slug: recipe.slug },
    update: {
      title: recipe.title,
      description: recipe.description,
      prepTimeMins: recipe.prepTimeMins ?? null,
      cookTimeMins: recipe.cookTimeMins ?? null,
      servings: recipe.servings ?? null,
      cuisine: recipe.cuisine ?? null,
      difficulty: recipe.difficulty ?? null,
      dietaryRestrictions: recipe.dietaryRestrictions ?? [],
      cookingMethods: recipe.cookingMethods ?? [],
      status: 'published',
      authorId,
    },
    create: {
      slug: recipe.slug,
      title: recipe.title,
      description: recipe.description,
      prepTimeMins: recipe.prepTimeMins ?? null,
      cookTimeMins: recipe.cookTimeMins ?? null,
      servings: recipe.servings ?? null,
      cuisine: recipe.cuisine ?? null,
      difficulty: recipe.difficulty ?? null,
      dietaryRestrictions: recipe.dietaryRestrictions ?? [],
      cookingMethods: recipe.cookingMethods ?? [],
      status: 'published',
      authorId,
    },
    select: { id: true, slug: true },
  })

  // Replace steps, ingredients, tags on each run
  await prisma.step.deleteMany({ where: { recipeId: upserted.id } })
  await prisma.recipeIngredient.deleteMany({ where: { recipeId: upserted.id } })
  await prisma.recipeTag.deleteMany({ where: { recipeId: upserted.id } })

  await prisma.step.createMany({
    data: recipe.steps.map((content, i) => ({
      recipeId: upserted.id,
      order: i + 1,
      content,
    })),
  })

  const ingredientData = []
  for (let i = 0; i < recipe.ingredients.length; i++) {
    const ing = recipe.ingredients[i]
    const ingredientId = ingredientIdByName.get(ing.name)
    if (!ingredientId) {
      console.warn(`  ⚠ ingredient not found: "${ing.name}" in recipe "${recipe.slug}"`)
      continue
    }
    ingredientData.push({
      recipeId: upserted.id,
      ingredientId,
      quantity: ing.quantity,
      unit: ing.unit ?? null,
      preparation: ing.preparation ?? null,
      groupLabel: ing.groupLabel ?? null,
      display: null,
      order: i + 1,
    })
  }
  if (ingredientData.length > 0) {
    await prisma.recipeIngredient.createMany({ data: ingredientData })
  }

  const tagData = (recipe.tagSlugs ?? [])
    .map((slug) => tagIdBySlug.get(slug))
    .filter((id): id is string => !!id)
    .map((tagId) => ({ recipeId: upserted.id, tagId }))
  if (tagData.length > 0) {
    await prisma.recipeTag.createMany({ data: tagData })
  }

  return upserted.slug
}

async function main() {
  console.log("🌱 Seeding Dan Hagman's recipes...\n")

  const author = await prisma.user.findUnique({
    where: { email: AUTHOR_EMAIL },
    select: { id: true, displayName: true },
  })
  if (!author) {
    throw new Error(
      `User not found: ${AUTHOR_EMAIL}. Make sure you've signed in to the app at least once to create your account.`
    )
  }
  console.log(`  ✓ author: ${author.displayName} (${AUTHOR_EMAIL})`)

  const ingredientIdByName = await upsertIngredients()
  console.log(`  ✓ ingredients: ${ingredientIdByName.size} upserted`)

  const tags = await prisma.tag.findMany({ select: { id: true, slug: true } })
  const tagIdBySlug = new Map(tags.map((t) => [t.slug, t.id]))

  console.log('\n  Seeding recipes:')
  for (const recipe of RECIPES) {
    const slug = await seedRecipe(recipe, author.id, ingredientIdByName, tagIdBySlug)
    console.log(`    ✓ /recipes/${slug}`)
  }

  console.log(`\n✅ Done — ${RECIPES.length} recipes seeded under ${author.displayName}'s account.`)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
