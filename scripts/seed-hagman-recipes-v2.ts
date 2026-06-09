/**
 * Seed v2: remaining recipes from Food.xlsx tabs + ChatGPT cookbook export.
 * Run after seed-hagman-recipes.ts (v1). Idempotent.
 *
 * Usage:  yarn tsx scripts/seed-hagman-recipes-v2.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

const AUTHOR_EMAIL = 'hagman.dan@gmail.com'

const INGREDIENTS: Array<{ name: string; typeSlug: string }> = [
  // Poultry
  { name: 'ground turkey', typeSlug: 'poultry' },
  { name: 'chicken thighs', typeSlug: 'poultry' },
  { name: 'ground chicken', typeSlug: 'poultry' },
  // Meat
  { name: 'ground bison', typeSlug: 'meat' },
  { name: 'beef chuck roast', typeSlug: 'meat' },
  { name: 'beef stew meat', typeSlug: 'meat' },
  { name: 'pork shoulder', typeSlug: 'meat' },
  { name: 'center-cut pork chops', typeSlug: 'meat' },
  { name: 'Italian sausage', typeSlug: 'meat' },
  { name: 'ground beef', typeSlug: 'meat' },
  { name: 'ground lamb', typeSlug: 'meat' },
  { name: 'ham', typeSlug: 'meat' },
  // Seafood
  { name: 'salmon fillets', typeSlug: 'seafood' },
  // Eggs & Dairy
  { name: 'heavy cream', typeSlug: 'dairy' },
  { name: 'cream cheese', typeSlug: 'dairy' },
  { name: 'sour cream', typeSlug: 'dairy' },
  { name: 'Greek yogurt', typeSlug: 'dairy' },
  { name: 'buttermilk', typeSlug: 'dairy' },
  { name: 'half and half', typeSlug: 'dairy' },
  { name: 'oat milk', typeSlug: 'dairy' },
  { name: 'ghee', typeSlug: 'dairy' },
  // Cheese
  { name: 'goat cheese', typeSlug: 'cheese' },
  { name: 'feta cheese', typeSlug: 'cheese' },
  // Produce
  { name: 'snap peas', typeSlug: 'produce' },
  { name: 'shallots', typeSlug: 'produce' },
  { name: 'red bell pepper', typeSlug: 'produce' },
  { name: 'green bell pepper', typeSlug: 'produce' },
  { name: 'poblano pepper', typeSlug: 'produce' },
  { name: 'cherry tomatoes', typeSlug: 'produce' },
  { name: 'roma tomatoes', typeSlug: 'produce' },
  { name: 'canned crushed tomatoes', typeSlug: 'canned-goods' },
  { name: 'canned diced tomatoes', typeSlug: 'canned-goods' },
  { name: 'fire-roasted tomatoes', typeSlug: 'canned-goods' },
  { name: 'avocado', typeSlug: 'produce' },
  { name: 'cabbage', typeSlug: 'produce' },
  { name: 'broccoli slaw mix', typeSlug: 'produce' },
  { name: 'kale', typeSlug: 'produce' },
  { name: 'parsnip', typeSlug: 'produce' },
  { name: 'corn kernels', typeSlug: 'produce' },
  { name: 'frozen peas', typeSlug: 'frozen' },
  { name: 'red potatoes', typeSlug: 'produce' },
  { name: 'sweet potatoes', typeSlug: 'produce' },
  { name: 'zucchini', typeSlug: 'produce' },
  { name: 'broccolini', typeSlug: 'produce' },
  { name: 'shiitake mushrooms', typeSlug: 'produce' },
  { name: 'strawberries', typeSlug: 'produce' },
  { name: 'apples', typeSlug: 'produce' },
  { name: 'orange', typeSlug: 'produce' },
  { name: 'lime', typeSlug: 'produce' },
  { name: 'ginger', typeSlug: 'produce' },
  { name: 'fresh chives', typeSlug: 'herbs' },
  { name: 'fresh tarragon', typeSlug: 'herbs' },
  { name: 'fresh basil', typeSlug: 'herbs' },
  { name: 'rosemary', typeSlug: 'herbs' },
  // Grains & Legumes
  { name: 'fettuccine', typeSlug: 'pasta' },
  { name: 'pasta shells', typeSlug: 'pasta' },
  { name: 'egg noodles', typeSlug: 'pasta' },
  { name: 'short-grain rice', typeSlug: 'grains' },
  { name: 'farro', typeSlug: 'grains' },
  { name: 'red kidney beans', typeSlug: 'legumes' },
  { name: 'pinto beans', typeSlug: 'legumes' },
  { name: 'black beans', typeSlug: 'legumes' },
  { name: 'cannellini beans', typeSlug: 'legumes' },
  { name: 'soybean sprouts', typeSlug: 'produce' },
  { name: 'daikon radish', typeSlug: 'produce' },
  { name: 'panko breadcrumbs', typeSlug: 'bread-bakery' },
  { name: 'pie crust', typeSlug: 'baking' },
  // Oils & Fats
  { name: 'sesame oil', typeSlug: 'oils-fats' },
  { name: 'coconut oil', typeSlug: 'oils-fats' },
  // Sauces & Condiments
  { name: 'mayo', typeSlug: 'condiments' },
  { name: 'tomato sauce', typeSlug: 'canned-goods' },
  { name: 'hot sauce', typeSlug: 'condiments' },
  { name: 'sweet chili sauce', typeSlug: 'condiments' },
  { name: 'gochujang', typeSlug: 'condiments' },
  { name: 'miso paste', typeSlug: 'condiments' },
  { name: 'peanut butter', typeSlug: 'condiments' },
  { name: 'capers', typeSlug: 'condiments' },
  { name: 'anchovy fillets', typeSlug: 'seafood' },
  { name: 'olives', typeSlug: 'condiments' },
  { name: 'kimchi', typeSlug: 'condiments' },
  // Vinegars & Acids
  { name: 'rice vinegar', typeSlug: 'vinegars-acids' },
  { name: 'balsamic vinegar', typeSlug: 'vinegars-acids' },
  { name: 'orange juice', typeSlug: 'beverages' },
  { name: 'lime juice', typeSlug: 'vinegars-acids' },
  // Sweeteners
  { name: 'maple syrup', typeSlug: 'sweeteners' },
  { name: 'honey', typeSlug: 'sweeteners' },
  { name: 'sugar', typeSlug: 'sweeteners' },
  { name: 'mirin', typeSlug: 'condiments' },
  // Broth & Stock
  { name: 'beef broth', typeSlug: 'broth-stock' },
  // Alcohol
  { name: 'beer', typeSlug: 'alcohol-wine' },
  { name: 'red wine', typeSlug: 'alcohol-wine' },
  // Baking
  { name: 'cornstarch', typeSlug: 'baking' },
  { name: 'tapioca starch', typeSlug: 'baking' },
  // Spices
  { name: 'garam masala', typeSlug: 'spices' },
  { name: 'mustard powder', typeSlug: 'spices' },
  { name: 'allspice', typeSlug: 'spices' },
  { name: 'fennel seed', typeSlug: 'spices' },
  { name: 'smoked salt', typeSlug: 'spices' },
  { name: 'red pepper flakes', typeSlug: 'spices' },
  { name: 'za\'atar', typeSlug: 'spices' },
  { name: 'sumac', typeSlug: 'spices' },
  { name: 'cocoa powder', typeSlug: 'baking' },
  // Other
  { name: 'vegetable stock', typeSlug: 'broth-stock' },
  { name: 'apple cider', typeSlug: 'beverages' },
  { name: 'whole peppercorns', typeSlug: 'spices' },
  { name: 'allspice berries', typeSlug: 'spices' },
  { name: 'cloves', typeSlug: 'spices' },
  { name: 'orange peel', typeSlug: 'produce' },
  { name: 'kosher salt', typeSlug: 'spices' },
  { name: 'sage', typeSlug: 'spices' },
  { name: 'kalamata olives', typeSlug: 'condiments' },
]

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
  // ─── Soups & Stews ────────────────────────────────────────────────────────

  {
    slug: 'instant-pot-beef-stew',
    title: 'Instant Pot Beef Stew',
    description:
      'A hearty, deeply flavored beef stew built in the Instant Pot. Garam masala and curry powder give it unusual warmth — a blend that sounds odd and tastes essential.',
    prepTimeMins: 20,
    cookTimeMins: 45,
    servings: 8,
    cuisine: 'American',
    difficulty: 'Medium',
    dietaryRestrictions: ['Dairy-Free', 'Gluten-Free'],
    cookingMethods: ['Pressure Cooked', 'Sautéed'],
    tagSlugs: ['instant-pot', 'dinner', 'comfort-food', 'one-pot', 'make-ahead', 'batch-cooking'],
    ingredients: [
      { name: 'beef stew meat', quantity: '2.5', unit: 'lbs', preparation: '1-inch cubes' },
      { name: 'butter', quantity: '2', unit: 'tbsp' },
      { name: 'yellow onion', quantity: '1', preparation: 'large dice' },
      { name: 'garlic', quantity: '6', unit: 'cloves', preparation: 'minced' },
      { name: 'ginger', quantity: '1', unit: 'thumb', preparation: 'grated' },
      { name: 'russet potatoes', quantity: '1', unit: 'lb', preparation: '1-inch cubes' },
      { name: 'carrots', quantity: '6', preparation: 'cut large' },
      { name: 'celery', quantity: '1', unit: 'heart', preparation: 'cut large' },
      { name: 'mushrooms', quantity: '1', unit: 'pack', preparation: 'sliced' },
      { name: 'brown lentils', quantity: '1', unit: 'cup' },
      { name: 'frozen peas', quantity: '1', unit: 'cup', preparation: 'added at the end' },
      { name: 'beef broth', quantity: '4', unit: 'cups' },
      { name: 'tomato paste', quantity: '2', unit: 'tbsp' },
      { name: 'worcestershire sauce', quantity: '2', unit: 'tbsp' },
      { name: 'bay leaf', quantity: '2' },
      { name: 'allspice', quantity: '1', unit: 'tbsp' },
      { name: 'thyme', quantity: '2', unit: 'tsp' },
      { name: 'rosemary', quantity: '2', unit: 'tsp' },
      { name: 'garam masala', quantity: '2', unit: 'tsp' },
      { name: 'curry powder', quantity: '2', unit: 'tsp' },
      { name: 'paprika', quantity: '1/2', unit: 'tsp' },
      { name: 'salt', quantity: '1', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
      { name: 'cornstarch', quantity: '2', unit: 'tbsp', preparation: 'mixed with 2 tbsp water to thicken' },
    ],
    steps: [
      'Season beef cubes with salt, pepper, and allspice.',
      'Set Instant Pot to Sauté High. Melt butter and sear beef in batches until browned on all sides, 2–3 minutes per batch. Remove and set aside.',
      'Add onion, potatoes, carrots, celery, garlic, ginger, and mushrooms to the pot. Add broth, tomato paste, Worcestershire sauce, thyme, rosemary, garam masala, curry, paprika, and bay leaves. Stir to combine.',
      'Return beef to the pot. Add lentils. Stir everything together.',
      'Seal the lid. Manual High Pressure for 22 minutes, then Natural Pressure Release for 10 minutes.',
      'Remove bay leaves. Stir in frozen peas — the residual heat will cook them through in about 1 minute.',
      'To thicken, whisk cornstarch with 2 tbsp cold water. Switch to Sauté mode and stir in the slurry until the stew reaches your preferred consistency.',
      'Puree the lentils with a bit of reserved broth for a creamier texture, or leave them whole for more body.',
    ],
  },

  {
    slug: 'chicken-stewoup',
    title: 'Chicken Stewoup (Southwestern Chicken Stew)',
    description:
      'A Southwestern broth-based hybrid — thicker than soup, looser than stew. Built for bulk prep: shredded chicken stirred in after pressure cooking keeps it tender no matter the batch size.',
    prepTimeMins: 20,
    cookTimeMins: 35,
    servings: 6,
    cuisine: 'American',
    difficulty: 'Easy',
    dietaryRestrictions: ['Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Pressure Cooked', 'Sautéed'],
    tagSlugs: ['instant-pot', 'soup', 'dinner', 'one-pot', 'meal-prep', 'batch-cooking'],
    ingredients: [
      { name: 'chicken breast', quantity: '3', unit: 'lbs', preparation: 'cooked and shredded (cook separately)' },
      { name: 'olive oil', quantity: '2.5', unit: 'tbsp' },
      { name: 'onion', quantity: '1', preparation: 'white, diced' },
      { name: 'garlic', quantity: '6', unit: 'cloves', preparation: 'minced' },
      { name: 'celery', quantity: '2', unit: 'stalks', preparation: 'diced' },
      { name: 'carrots', quantity: '3', unit: 'medium', preparation: 'diced' },
      { name: 'parsnip', quantity: '1', unit: 'medium', preparation: 'diced' },
      { name: 'red bell pepper', quantity: '1', preparation: 'diced' },
      { name: 'corn kernels', quantity: '1.5', unit: 'cups', preparation: 'fresh or frozen' },
      { name: 'fire-roasted tomatoes', quantity: '2', unit: '14-oz cans' },
      { name: 'chicken broth', quantity: '7', unit: 'cups' },
      { name: 'black beans', quantity: '2', unit: 'cups', preparation: 'drained and rinsed' },
      { name: 'paprika', quantity: '1.5', unit: 'tsp' },
      { name: 'cumin', quantity: '1.25', unit: 'tsp' },
      { name: 'chili powder', quantity: '1.25', unit: 'tsp' },
      { name: 'oregano', quantity: '1.25', unit: 'tsp' },
      { name: 'coriander', quantity: '1/2', unit: 'tsp' },
      { name: 'bay leaf', quantity: '2' },
      { name: 'salt', quantity: '1', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
      { name: 'lime', quantity: '1', preparation: 'juiced, added after cooking' },
    ],
    steps: [
      'Set Instant Pot to Sauté. Heat olive oil, then cook onion, celery, carrots, parsnip, and garlic for 5 minutes.',
      'Add bell pepper, corn, and all spices. Cook 2 minutes, stirring.',
      'Add fire-roasted tomatoes, beans, broth, and bay leaves. Bring to a simmer on Sauté mode.',
      'For a thicker, richer result: seal lid and Pressure Cook Low for 3 minutes, then NPR 15 minutes. For lighter/firmer vegetables: Low 2 minutes, NPR 10 minutes.',
      'Remove bay leaves. Stir in the pre-cooked shredded chicken to heat through — do not pressure cook the chicken with the base.',
      'Add lime juice. Taste and adjust salt and chili. Serve with fresh cilantro if available.',
    ],
  },

  {
    slug: 'instant-pot-minestrone',
    title: 'Instant Pot Minestrone',
    description:
      'A big, hearty Italian vegetable soup with three types of beans, pasta, and a rich tomato-herb base. Vinegar stirred in at the end lifts the whole thing.',
    prepTimeMins: 15,
    cookTimeMins: 25,
    servings: 8,
    cuisine: 'Italian',
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Dairy-Free'],
    cookingMethods: ['Pressure Cooked', 'Sautéed'],
    tagSlugs: ['instant-pot', 'soup', 'dinner', 'one-pot', 'healthy', 'budget-friendly'],
    ingredients: [
      { name: 'olive oil', quantity: '2', unit: 'tbsp' },
      { name: 'yellow onion', quantity: '1', preparation: 'diced' },
      { name: 'garlic', quantity: '8', unit: 'cloves', preparation: 'minced' },
      { name: 'carrots', quantity: '2', preparation: 'large, diced' },
      { name: 'celery', quantity: '2', unit: 'stalks', preparation: 'diced' },
      { name: 'zucchini', quantity: '1', preparation: 'large, chopped' },
      { name: 'canned crushed tomatoes', quantity: '28', unit: 'oz' },
      { name: 'vegetable broth', quantity: '6', unit: 'cups' },
      { name: 'red kidney beans', quantity: '1', unit: '14-oz can', preparation: 'drained and rinsed' },
      { name: 'cannellini beans', quantity: '1', unit: '14-oz can', preparation: 'drained and rinsed' },
      { name: 'black beans', quantity: '1', unit: '14-oz can', preparation: 'drained and rinsed' },
      { name: 'pasta shells', quantity: '1/2', unit: 'cup' },
      { name: 'spinach', quantity: '2', unit: 'cups', preparation: 'chopped, stirred in after cooking' },
      { name: 'bay leaf', quantity: '2' },
      { name: 'basil', quantity: '1.5', unit: 'tsp' },
      { name: 'oregano', quantity: '1', unit: 'tsp' },
      { name: 'thyme', quantity: '1', unit: 'tsp' },
      { name: 'rosemary', quantity: '1', unit: 'tsp' },
      { name: 'paprika', quantity: '1', unit: 'tsp' },
      { name: 'fennel seed', quantity: '1/4', unit: 'tsp' },
      { name: 'salt', quantity: '1', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
      { name: 'red wine vinegar', quantity: '1', unit: 'tsp', preparation: 'added at the end' },
    ],
    steps: [
      'Set Instant Pot to Sauté High. Heat olive oil, then cook onion and garlic for 2 minutes.',
      'Add carrots, celery, and zucchini. Cook 2 minutes. Add half the spices (not bay leaves) and stir.',
      'Add tomatoes, beans, pasta, remaining spices, broth, and bay leaves. Stir to combine.',
      'Seal lid. Cook on Soup/Manual High for 5 minutes. NPR for 5–10 minutes, then quick-release.',
      'Remove bay leaves. Stir in spinach — it will wilt in the residual heat.',
      'Add a splash of red wine vinegar. Taste and adjust salt. Garnish with parsley and parmesan if desired.',
    ],
  },

  {
    slug: 'dwellers-stew-v1',
    title: "Dweller's Stew — v1 (Hags Chili, Original)",
    description:
      'The original crockpot Hags Chili: ground beef, Italian sausage, kidney and pinto beans, whole peeled tomatoes, and a proper cumin-heavy spice blend. Slow cooked 10 hours. Do not overwrite.',
    prepTimeMins: 30,
    cookTimeMins: 600,
    servings: 12,
    cuisine: 'American',
    difficulty: 'Medium',
    cookingMethods: ['Slow Cooked'],
    tagSlugs: ['dinner', 'comfort-food', 'make-ahead', 'batch-cooking', 'weekend'],
    ingredients: [
      { name: 'ground beef', quantity: '2', unit: 'lbs', preparation: '85–95% lean' },
      { name: 'Italian sausage', quantity: '1.5', unit: 'lbs', preparation: 'casings removed' },
      { name: 'bacon', quantity: '1', unit: 'pack', preparation: 'baked, crumbled — optional garnish; reserve fat', groupLabel: 'Optional' },
      { name: 'red bell pepper', quantity: '1', preparation: 'diced large' },
      { name: 'green bell pepper', quantity: '1', preparation: 'diced large' },
      { name: 'onion', quantity: '1', preparation: 'diced large' },
      { name: 'poblano pepper', quantity: '1', preparation: 'diced large' },
      { name: 'garlic', quantity: '1', unit: 'bulb', preparation: 'minced' },
      { name: 'jalapeño', quantity: '3', preparation: 'diced, deseeded to preference' },
      { name: 'celery', quantity: '5', unit: 'stalks', preparation: 'diced large' },
      { name: 'canned diced tomatoes', quantity: '48', unit: 'oz', preparation: '2 large cans, loosely hand-crushed' },
      { name: 'tomato paste', quantity: '2', unit: 'tbsp' },
      { name: 'fresh parsley', quantity: '1', unit: 'bunch', preparation: 'stems removed, diced' },
      { name: 'beer', quantity: '12', unit: 'oz', preparation: 'IPA or Arrogant Bastard' },
      { name: 'red kidney beans', quantity: '1', unit: '15-oz can', preparation: 'drained and rinsed' },
      { name: 'pinto beans', quantity: '1', unit: '15-oz can', preparation: 'drained and rinsed' },
      { name: 'cumin', quantity: '2', unit: 'tbsp' },
      { name: 'oregano', quantity: '3', unit: 'tsp' },
      { name: 'chili powder', quantity: '2.5', unit: 'tbsp' },
      { name: 'cayenne pepper', quantity: '1', unit: 'tsp' },
      { name: 'paprika', quantity: '1', unit: 'tsp' },
      { name: 'cocoa powder', quantity: '1', unit: 'tsp' },
      { name: 'bay leaf', quantity: '1' },
      { name: 'worcestershire sauce', quantity: '2', unit: 'tbsp' },
      { name: 'salt', quantity: '2', unit: 'tsp' },
      { name: 'black pepper', quantity: '1', unit: 'tsp' },
    ],
    steps: [
      'Grind whole cumin seed if using, then mix all spices together in a bowl.',
      'Brown the ground beef and Italian sausage together in a skillet. When partly cooked, add garlic, onions, and poblano. Continue cooking until meat is done and vegetables have softened.',
      'In a separate bowl, mix together beans, green chiles, peppers, and celery.',
      'Layer into the crockpot in this order: peppers and beans mix, then meat, then beer, then spices, then parsley, then tomatoes. Settle each layer before adding the next.',
      'Cook on Low for 10 hours.',
      'Optional: after 2 hours, gently stir. Taste and adjust seasoning near the end.',
      'Serve with crumbled bacon garnish if using.',
    ],
  },

  {
    slug: 'dwellers-stew-v2',
    title: "Dweller's Stew — v2 (Dark Winter Chili)",
    description:
      'A darker, deeper evolution: oven-braised shredded beef, ground bison, Italian sausage, IPA, cocoa, and separately sautéed mushrooms for umami depth. Dutch oven primary. Built for winter.',
    prepTimeMins: 45,
    cookTimeMins: 180,
    servings: 10,
    cuisine: 'American',
    difficulty: 'Advanced',
    cookingMethods: ['Braised'],
    tagSlugs: ['dinner', 'comfort-food', 'make-ahead', 'batch-cooking', 'weekend'],
    ingredients: [
      { name: 'beef stew meat', quantity: '2', unit: 'lbs', preparation: 'oven-braised until shreddable, then shredded', groupLabel: 'Beef' },
      { name: 'ground bison', quantity: '1', unit: 'lb', groupLabel: 'Proteins' },
      { name: 'Italian sausage', quantity: '0.5', unit: 'lb', preparation: 'casings removed, accent only', groupLabel: 'Proteins' },
      { name: 'mushrooms', quantity: '10', unit: 'oz', preparation: 'sautéed separately until browned', groupLabel: 'Vegetables' },
      { name: 'onion', quantity: '1', preparation: 'diced', groupLabel: 'Vegetables' },
      { name: 'celery', quantity: '3', unit: 'stalks', preparation: 'diced', groupLabel: 'Vegetables' },
      { name: 'carrots', quantity: '1', preparation: 'small, fine-diced', groupLabel: 'Vegetables' },
      { name: 'garlic', quantity: '1', unit: 'bulb', preparation: 'minced', groupLabel: 'Vegetables' },
      { name: 'tomato paste', quantity: '3', unit: 'tbsp', groupLabel: 'Liquids & Base' },
      { name: 'beer', quantity: '12', unit: 'oz', preparation: 'IPA', groupLabel: 'Liquids & Base' },
      { name: 'canned diced tomatoes', quantity: '28', unit: 'oz', groupLabel: 'Liquids & Base' },
      { name: 'red kidney beans', quantity: '1', unit: '15-oz can', preparation: 'drained and rinsed', groupLabel: 'Liquids & Base' },
      { name: 'black beans', quantity: '1', unit: '15-oz can', preparation: 'drained and rinsed', groupLabel: 'Liquids & Base' },
      { name: 'cocoa powder', quantity: '1', unit: 'tbsp', groupLabel: 'Liquids & Base' },
      { name: 'soy sauce', quantity: '1', unit: 'tbsp', preparation: 'umami booster', groupLabel: 'Liquids & Base' },
      { name: 'chili powder', quantity: '2', unit: 'tbsp', groupLabel: 'Spices' },
      { name: 'cumin', quantity: '1.5', unit: 'tbsp', groupLabel: 'Spices' },
      { name: 'oregano', quantity: '2', unit: 'tsp', groupLabel: 'Spices' },
      { name: 'cayenne pepper', quantity: '1', unit: 'tsp', groupLabel: 'Spices' },
      { name: 'salt', quantity: '2', unit: 'tsp', groupLabel: 'Spices' },
      { name: 'black pepper', quantity: '1', unit: 'tsp', groupLabel: 'Spices' },
      { name: 'olive oil', quantity: '2', unit: 'tbsp' },
    ],
    steps: [
      'Season beef stew meat and sear in batches in a Dutch oven with a thin layer of avocado oil, building a deep fond.',
      'Cover and oven-braise at 325°F until the beef is fully shreddable, about 2–2.5 hours. Shred and reserve.',
      'In the same Dutch oven over medium-high heat, brown the ground bison. Season as it cooks. Do not add oil unless the pot is completely dry.',
      'Add onion, celery, and fine-diced carrot. Add oil only if sticking. Season lightly.',
      'Fry tomato paste directly in the pot for 1–2 minutes until it darkens slightly. Do not add oil during this step. Bloom the spices in the tomato paste for 30 seconds.',
      'Add IPA, tomatoes, beans, cocoa, and soy sauce. Return the shredded beef. Simmer on low, partially covered, for at least 45 minutes.',
      'Meanwhile, sauté mushrooms separately in a pan until all moisture releases and they are deeply browned. Add to the chili.',
      'Near the end, adjust salt, heat, acidity, and cocoa balance to taste.',
    ],
  },

  {
    slug: 'instant-pot-pot-roast',
    title: 'Instant Pot Pot Roast',
    description:
      'A classic chuck roast with mushrooms, root vegetables, and a savory wine-soy braising liquid. 60–70 minutes under high pressure turns a tough cut fork-tender.',
    prepTimeMins: 20,
    cookTimeMins: 90,
    servings: 6,
    cuisine: 'American',
    difficulty: 'Medium',
    dietaryRestrictions: ['Dairy-Free', 'Gluten-Free'],
    cookingMethods: ['Pressure Cooked'],
    tagSlugs: ['instant-pot', 'dinner', 'comfort-food', 'weekend'],
    ingredients: [
      { name: 'beef chuck roast', quantity: '3', unit: 'lbs' },
      { name: 'red potatoes', quantity: '1', unit: 'lb', preparation: 'mini, halved' },
      { name: 'carrots', quantity: '4', preparation: 'large, cut into chunks' },
      { name: 'mushrooms', quantity: '8', unit: 'oz', preparation: 'baby bella, halved' },
      { name: 'celery', quantity: '4', unit: 'stalks', preparation: 'cut large' },
      { name: 'yellow onion', quantity: '1', preparation: 'quartered' },
      { name: 'garlic', quantity: '6', unit: 'cloves', preparation: 'chopped' },
      { name: 'red wine', quantity: '1', unit: 'cup' },
      { name: 'beef broth', quantity: '1.5', unit: 'cups' },
      { name: 'tomato paste', quantity: '2', unit: 'tbsp' },
      { name: 'worcestershire sauce', quantity: '2', unit: 'tbsp' },
      { name: 'soy sauce', quantity: '1/4', unit: 'cup' },
      { name: 'butter', quantity: '4', unit: 'tbsp' },
      { name: 'thyme', quantity: '1', unit: 'tsp' },
      { name: 'rosemary', quantity: '1', unit: 'tsp' },
      { name: 'oregano', quantity: '2', unit: 'tsp' },
      { name: 'paprika', quantity: '2', unit: 'tsp' },
      { name: 'bay leaf', quantity: '2' },
      { name: 'salt', quantity: '1', unit: 'tsp' },
      { name: 'black pepper', quantity: '1', unit: 'tsp' },
      { name: 'cornstarch', quantity: '2', unit: 'tbsp', preparation: 'mixed with water for gravy' },
    ],
    steps: [
      'Season roast generously with salt and pepper. Set Instant Pot to Sauté High.',
      'Melt butter and sear roast 3–5 minutes per side until browned. Remove and set aside.',
      'Add onion and garlic. Add tomato paste and cook 1 minute. Pour in red wine and scrape up any browned bits.',
      'Add broth, Worcestershire sauce, soy sauce, herbs, and vegetables. Place roast on top.',
      'Seal lid. Manual High Pressure 60–70 minutes. NPR 10–15 minutes.',
      'Remove roast and vegetables. Whisk cornstarch with 2 tbsp cold water; stir into the hot drippings on Sauté mode until gravy thickens.',
    ],
  },

  {
    slug: 'carnitas',
    title: 'Instant Pot Carnitas',
    description:
      'Crispy, citrus-braised pork shoulder that gets a final run under the broiler for those irresistible caramelized edges. The orange-lime-beer braising liquid is the whole flavor.',
    prepTimeMins: 15,
    cookTimeMins: 50,
    servings: 8,
    cuisine: 'Mexican',
    difficulty: 'Medium',
    dietaryRestrictions: ['Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Pressure Cooked'],
    tagSlugs: ['instant-pot', 'dinner', 'weekend', 'meal-prep', 'batch-cooking'],
    ingredients: [
      { name: 'pork shoulder', quantity: '4', unit: 'lbs', preparation: 'cut into 2–3-inch chunks' },
      { name: 'orange juice', quantity: '1/2', unit: 'cup', preparation: 'fresh (about 2 oranges)' },
      { name: 'lime juice', quantity: '1/4', unit: 'cup', preparation: '2 limes' },
      { name: 'beer', quantity: '12', unit: 'oz', preparation: 'lager or pilsner' },
      { name: 'garlic', quantity: '8', unit: 'cloves', preparation: 'smashed' },
      { name: 'cumin', quantity: '1', unit: 'tbsp' },
      { name: 'oregano', quantity: '2', unit: 'tsp' },
      { name: 'chili powder', quantity: '2', unit: 'tsp' },
      { name: 'brown sugar', quantity: '2', unit: 'tsp' },
      { name: 'coriander', quantity: '1', unit: 'tsp' },
      { name: 'paprika', quantity: '1', unit: 'tsp' },
      { name: 'salt', quantity: '1.5', unit: 'tsp' },
      { name: 'black pepper', quantity: '1', unit: 'tsp' },
    ],
    steps: [
      'Season pork chunks generously with salt, pepper, and half the spices.',
      'Set Instant Pot to Sauté High. Sear pork in batches until browned on all sides. Remove and set aside.',
      'Add beer, orange juice, lime juice, garlic, and remaining spices to the pot. Return pork.',
      'Seal lid. Manual High Pressure 30 minutes. NPR 10 minutes, then quick-release.',
      'Remove pork and shred with two forks. Spread on a rimmed sheet pan.',
      'Broil for 2–3 minutes until edges are caramelized and crispy. Watch closely.',
      'Serve in tortillas with your favorite toppings.',
    ],
  },

  // ─── Chicken ──────────────────────────────────────────────────────────────

  {
    slug: 'butter-chicken',
    title: 'Butter Chicken (Murgh Makhani)',
    description:
      'Deeply spiced marinated chicken in a silky tomato-cream sauce. Marinate overnight if you can — the yogurt tenderizes the chicken and the spices go deeper.',
    prepTimeMins: 30,
    cookTimeMins: 35,
    servings: 4,
    cuisine: 'Indian',
    difficulty: 'Medium',
    cookingMethods: ['Sautéed'],
    tagSlugs: ['dinner', 'comfort-food', 'weekend'],
    ingredients: [
      { name: 'chicken breast', quantity: '1.5', unit: 'lbs', preparation: '1-inch chunks', groupLabel: 'Marinade' },
      { name: 'Greek yogurt', quantity: '1/2', unit: 'cup', groupLabel: 'Marinade' },
      { name: 'garlic', quantity: '3', unit: 'cloves', preparation: 'minced', groupLabel: 'Marinade' },
      { name: 'ginger', quantity: '1', unit: 'tbsp', preparation: 'grated', groupLabel: 'Marinade' },
      { name: 'garam masala', quantity: '2', unit: 'tsp', groupLabel: 'Marinade' },
      { name: 'turmeric', quantity: '1', unit: 'tsp', groupLabel: 'Marinade' },
      { name: 'cumin', quantity: '1', unit: 'tsp', groupLabel: 'Marinade' },
      { name: 'cayenne pepper', quantity: '1/2', unit: 'tsp', groupLabel: 'Marinade' },
      { name: 'salt', quantity: '1', unit: 'tsp', groupLabel: 'Marinade' },
      { name: 'lemon juice', quantity: '1', unit: 'tbsp', preparation: 'optional, if marinating 3+ hours', groupLabel: 'Marinade' },
      { name: 'yellow onion', quantity: '1', preparation: 'large, diced', groupLabel: 'Curry Sauce' },
      { name: 'garlic', quantity: '3', unit: 'cloves', preparation: 'minced', groupLabel: 'Curry Sauce' },
      { name: 'ginger', quantity: '1', unit: 'tbsp', preparation: 'grated', groupLabel: 'Curry Sauce' },
      { name: 'canned crushed tomatoes', quantity: '24', unit: 'oz', groupLabel: 'Curry Sauce' },
      { name: 'tomato paste', quantity: '1', unit: 'cup', groupLabel: 'Curry Sauce' },
      { name: 'heavy cream', quantity: '1', unit: 'cup', groupLabel: 'Curry Sauce' },
      { name: 'ghee', quantity: '2', unit: 'tbsp', groupLabel: 'Curry Sauce' },
      { name: 'olive oil', quantity: '2', unit: 'tbsp', groupLabel: 'Curry Sauce' },
      { name: 'garam masala', quantity: '1.5', unit: 'tsp', groupLabel: 'Curry Sauce' },
      { name: 'cumin', quantity: '1.5', unit: 'tsp', groupLabel: 'Curry Sauce' },
      { name: 'coriander', quantity: '1', unit: 'tsp', groupLabel: 'Curry Sauce' },
      { name: 'cayenne pepper', quantity: '1', unit: 'tsp', groupLabel: 'Curry Sauce' },
      { name: 'brown sugar', quantity: '1', unit: 'tbsp', groupLabel: 'Curry Sauce' },
      { name: 'salt', quantity: '1.25', unit: 'tsp', groupLabel: 'Curry Sauce' },
    ],
    steps: [
      'Mix all marinade ingredients with the chicken. Marinate at least 30 minutes, ideally overnight.',
      'Heat ghee and olive oil in a wide pan over medium-high. Sear chicken in batches about 3 minutes per side until lightly browned. Remove and reserve.',
      'In the same pan, cook onion until softened and golden, about 5 minutes. Add garlic and ginger and cook 1 minute.',
      'Add all sauce spices and cook 20 seconds. Add tomato paste and let it toast for 1 minute.',
      'Add crushed tomatoes and simmer on medium-low for 15 minutes, stirring occasionally.',
      'Optional: use an immersion blender to smooth the sauce.',
      'Return chicken to the pan. Pour in heavy cream and add brown sugar. Simmer on low for 8 minutes until the chicken is cooked through and the sauce is glossy.',
    ],
  },

  {
    slug: 'soy-glazed-chicken-thighs',
    title: 'Soy-Glazed Chicken Thighs (HagsThighs)',
    description:
      'A ginger-forward soy glaze in a 3:2:1 ratio — soy to rice vinegar to sesame oil — that becomes a sticky, savory coating for chicken thighs. The scallion-heavy finish is not optional.',
    prepTimeMins: 15,
    cookTimeMins: 30,
    servings: 4,
    difficulty: 'Easy',
    cookingMethods: ['Sautéed'],
    tagSlugs: ['dinner', 'weeknight', 'under-1-hour'],
    ingredients: [
      { name: 'chicken thighs', quantity: '2.5', unit: 'lbs' },
      { name: 'soy sauce', quantity: '3', unit: 'parts (about 6 tbsp)' },
      { name: 'rice vinegar', quantity: '2', unit: 'parts (about 4 tbsp)' },
      { name: 'sesame oil', quantity: '1', unit: 'part (about 2 tbsp)' },
      { name: 'honey', quantity: '1', unit: 'tbsp' },
      { name: 'ginger', quantity: '4', unit: 'tbsp', preparation: 'grated (2 parts)' },
      { name: 'scallions', quantity: '2', unit: 'bunches', preparation: 'diced' },
      { name: 'garlic', quantity: '1', unit: 'bulb', preparation: 'minced' },
      { name: 'sesame seeds', quantity: '1', unit: 'tbsp', preparation: 'to taste' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
    ],
    steps: [
      'Whisk together soy sauce, rice vinegar, sesame oil, honey, ginger, and garlic in a bowl. Reserve half for basting; use the other half as the marinade.',
      'Marinate chicken thighs for at least 30 minutes, up to 24 hours.',
      'Heat a large skillet over medium-high. Sear chicken thighs skin-side down (if skin-on) for 5–6 minutes until the skin is golden and releases easily.',
      'Flip and cook another 5–7 minutes. Baste with reserved marinade in the last 2 minutes.',
      'Rest 5 minutes. Slice and top generously with diced scallions and sesame seeds.',
    ],
  },

  {
    slug: 'air-fryer-chicken-thighs',
    title: 'Air Fryer Chicken Thighs (HagsThighs)',
    description:
      'Crispy, deeply seasoned chicken thighs in the air fryer. The spice layer is broad and savory — garlic-forward, with dill, paprika, and a touch of cayenne. Panko adds textural contrast.',
    prepTimeMins: 10,
    cookTimeMins: 25,
    servings: 4,
    difficulty: 'Easy',
    cookingMethods: ['Air Fryer'],
    tagSlugs: ['air-fryer', 'dinner', 'weeknight', '30-minutes-or-less'],
    ingredients: [
      { name: 'chicken thighs', quantity: '2.5', unit: 'lbs' },
      { name: 'coconut oil', quantity: '1', unit: 'spray', preparation: 'for air fryer basket' },
      { name: 'panko breadcrumbs', quantity: '2', unit: 'tbsp', preparation: 'sprinkled loosely' },
      { name: 'garlic powder', quantity: '2', unit: 'tsp' },
      { name: 'black pepper', quantity: '1', unit: 'tsp' },
      { name: 'basil', quantity: '1', unit: 'tsp' },
      { name: 'oregano', quantity: '1', unit: 'tsp' },
      { name: 'paprika', quantity: '1', unit: 'tsp' },
      { name: 'thyme', quantity: '1/2', unit: 'tsp' },
      { name: 'salt', quantity: '1', unit: 'tsp' },
      { name: 'cayenne pepper', quantity: '1/4', unit: 'tsp' },
      { name: 'red pepper flakes', quantity: '1/4', unit: 'tsp' },
      { name: 'ginger powder', quantity: '1/4', unit: 'tsp' },
    ],
    steps: [
      'Pat chicken thighs dry. Mix all spices together.',
      'Spray thighs with coconut oil, then rub spice mix all over. Sprinkle panko loosely on top.',
      'Spray the air fryer basket with coconut oil. Arrange thighs skin-side up.',
      'Air fry at 400°F for 22–25 minutes until skin is crispy and internal temp reads 165°F.',
    ],
  },

  {
    slug: 'chicken-picatta',
    title: 'HagsCatta (Chicken Picatta)',
    description:
      'A lemon-caper chicken picatta built with plenty of garlic, shallots, and mushrooms expanding the classic Italian-American format. Pairs with pasta or mashed potatoes.',
    prepTimeMins: 15,
    cookTimeMins: 30,
    servings: 4,
    cuisine: 'Italian',
    difficulty: 'Medium',
    cookingMethods: ['Pan-Seared', 'Sautéed'],
    tagSlugs: ['dinner', 'weeknight', 'under-1-hour'],
    ingredients: [
      { name: 'chicken breast', quantity: '2', unit: 'lbs', preparation: 'pounded or butterfly-cut' },
      { name: 'lemon', quantity: '4', preparation: 'juiced' },
      { name: 'capers', quantity: '3', unit: 'tbsp' },
      { name: 'garlic', quantity: '1', unit: 'bulb', preparation: 'thinly sliced' },
      { name: 'shallots', quantity: '2', preparation: 'thinly sliced' },
      { name: 'mushrooms', quantity: '8', unit: 'oz', preparation: 'sliced' },
      { name: 'chicken broth', quantity: '2', unit: 'cups' },
      { name: 'butter', quantity: '3', unit: 'tbsp' },
      { name: 'olive oil', quantity: '2', unit: 'tbsp' },
      { name: 'all-purpose flour', quantity: '1/2', unit: 'cup', preparation: 'for dredging' },
      { name: 'salt', quantity: '1', unit: 'tsp' },
      { name: 'black pepper', quantity: '1', unit: 'tsp' },
    ],
    steps: [
      'Season chicken with salt and pepper, then dredge in flour, shaking off excess.',
      'Heat olive oil and 1 tbsp butter in a wide skillet over medium-high. Sear chicken 3–4 minutes per side until golden. Remove and set aside.',
      'In the same pan, sauté shallots, mushrooms, and garlic until softened and lightly browned.',
      'Add broth and lemon juice, scraping up any browned bits. Bring to a simmer and cook 5 minutes.',
      'Add capers. Swirl in remaining 2 tbsp butter until the sauce is glossy.',
      'Return chicken and simmer 3–5 minutes until cooked through. Serve immediately.',
    ],
  },

  {
    slug: 'bulk-instant-pot-shredded-chicken',
    title: 'Bulk Instant Pot Shredded Chicken (5 lb)',
    description:
      'A neutral 5-pound batch of shredded chicken designed as a weekly protein base. Goes into soups, grain bowls, casseroles, wraps, and stir-ins all week long.',
    prepTimeMins: 5,
    cookTimeMins: 25,
    servings: 10,
    cuisine: 'American',
    difficulty: 'Easy',
    dietaryRestrictions: ['Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Pressure Cooked'],
    tagSlugs: ['instant-pot', 'meal-prep', 'make-ahead', 'batch-cooking', 'healthy'],
    ingredients: [
      { name: 'chicken breast', quantity: '5', unit: 'lbs' },
      { name: 'chicken broth', quantity: '1.5', unit: 'cups' },
      { name: 'paprika', quantity: '2', unit: 'tsp' },
      { name: 'garlic powder', quantity: '2', unit: 'tsp' },
      { name: 'onion powder', quantity: '2', unit: 'tsp' },
      { name: 'salt', quantity: '1.5', unit: 'tsp' },
      { name: 'black pepper', quantity: '1', unit: 'tsp' },
    ],
    steps: [
      'Season chicken evenly with all spices.',
      'Place in Instant Pot with broth.',
      'Seal lid. Manual High Pressure 12 minutes. NPR 10 minutes, then quick-release.',
      'Shred with two forks. Divide into meal-sized portions and refrigerate up to 4 days, or freeze up to 3 months.',
    ],
  },

  {
    slug: 'sweet-thai-chili-grilled-wings',
    title: 'Sweet Thai Chili Grilled Wings',
    description:
      'Grilled wings glazed with sweet chili sauce spiked with soy and lime — a sticky, sweet-spicy counterpoint to the dry rub version. The glaze goes on late to avoid burning.',
    prepTimeMins: 10,
    cookTimeMins: 30,
    servings: 4,
    cuisine: 'American',
    difficulty: 'Easy',
    dietaryRestrictions: ['Dairy-Free'],
    cookingMethods: ['Grilled'],
    tagSlugs: ['grilled', 'dinner', 'game-day', 'weekend', 'kid-friendly'],
    ingredients: [
      { name: 'chicken wings', quantity: '4', unit: 'lbs' },
      { name: 'salt', quantity: '1.5', unit: 'tsp' },
      { name: 'garlic powder', quantity: '1', unit: 'tsp' },
      { name: 'onion powder', quantity: '1', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
      { name: 'smoked paprika', quantity: '1/2', unit: 'tsp', preparation: 'optional' },
      { name: 'sweet chili sauce', quantity: '3/4', unit: 'cup', groupLabel: 'Glaze' },
      { name: 'soy sauce', quantity: '2', unit: 'tbsp', groupLabel: 'Glaze' },
      { name: 'lime juice', quantity: '1', unit: 'tbsp', groupLabel: 'Glaze' },
      { name: 'ginger', quantity: '1', unit: 'tsp', preparation: 'grated, optional', groupLabel: 'Glaze' },
    ],
    steps: [
      'Pat wings completely dry. Season with salt, garlic powder, onion powder, pepper, and smoked paprika.',
      'Whisk glaze ingredients together and set aside.',
      'Grill over medium to medium-high heat, using two zones if possible. Turn wings often for even browning.',
      'Cook mostly without glaze — about 20–25 minutes — until nearly cooked through.',
      'Brush glaze over wings. Move to indirect heat if the glaze darkens too quickly.',
      'Finish until sticky and cooked through (internal 165°F). Add extra glaze after cooking for a saucier finish.',
    ],
  },

  {
    slug: 'soy-ginger-chicken-breast',
    title: 'Soy-Ginger Chicken Breast',
    description:
      'A ginger-forward, soy-based marinated chicken breast system. Cook whole, rest, then slice — never cube before cooking unless making a stir-fry.',
    prepTimeMins: 10,
    cookTimeMins: 20,
    servings: 4,
    difficulty: 'Easy',
    dietaryRestrictions: ['Dairy-Free'],
    cookingMethods: ['Pan-Seared'],
    tagSlugs: ['dinner', 'weeknight', 'meal-prep', 'healthy'],
    ingredients: [
      { name: 'chicken breast', quantity: '1.5', unit: 'lbs', preparation: 'cooked whole, sliced after resting' },
      { name: 'soy sauce', quantity: '1/4', unit: 'cup' },
      { name: 'ginger', quantity: '2', unit: 'tbsp', preparation: 'fresh, grated' },
      { name: 'garlic', quantity: '2', unit: 'cloves', preparation: 'minced' },
      { name: 'brown sugar', quantity: '1', unit: 'tbsp' },
      { name: 'rice vinegar', quantity: '1', unit: 'tbsp', preparation: 'optional' },
      { name: 'sesame oil', quantity: '1', unit: 'tsp', preparation: 'finishing only, not for cooking' },
    ],
    steps: [
      'Whisk together soy sauce, ginger, garlic, brown sugar, and rice vinegar.',
      'Marinate chicken breasts whole for at least 30 minutes, up to 24 hours.',
      'Heat a skillet over medium-high. Cook chicken whole (do not cube) for 6–7 minutes per side until cooked through (165°F).',
      'Rest 5 minutes, then slice against the grain. Finish with a few drops of sesame oil.',
    ],
  },

  // ─── Ground Meat ──────────────────────────────────────────────────────────

  {
    slug: 'bison-meatloaf',
    title: 'Bison Meatloaf',
    description:
      'A leaner, more complex meatloaf using ground bison with shredded vegetables for moisture and herbs de Provence for a distinctive herbal note. Bison is lower fat than beef — do not overbake.',
    prepTimeMins: 20,
    cookTimeMins: 75,
    servings: 6,
    cuisine: 'American',
    difficulty: 'Medium',
    dietaryRestrictions: ['Gluten-Free'],
    cookingMethods: ['Baked'],
    tagSlugs: ['baked', 'dinner', 'comfort-food', 'make-ahead'],
    ingredients: [
      { name: 'ground bison', quantity: '3', unit: 'lbs' },
      { name: 'red bell pepper', quantity: '1', preparation: 'finely diced' },
      { name: 'yellow onion', quantity: '1/2', preparation: 'finely diced' },
      { name: 'celery', quantity: '1/2', unit: 'cup', preparation: 'shredded' },
      { name: 'carrots', quantity: '1', unit: 'cup', preparation: 'shredded' },
      { name: 'mushrooms', quantity: '1', unit: 'cup', preparation: 'finely diced' },
      { name: 'eggs', quantity: '3', preparation: 'beaten' },
      { name: 'panko breadcrumbs', quantity: '1/2', unit: 'cup' },
      { name: 'parmesan', quantity: '1/2', unit: 'cup', preparation: 'optional' },
      { name: 'worcestershire sauce', quantity: '1', unit: 'tbsp' },
      { name: 'oregano', quantity: '1', unit: 'tbsp' },
      { name: 'allspice', quantity: '1', unit: 'tsp' },
      { name: 'salt', quantity: '2', unit: 'tsp' },
      { name: 'black pepper', quantity: '2', unit: 'tsp' },
    ],
    steps: [
      'Preheat oven to 350°F. Grease a loaf pan or rimmed sheet pan.',
      'Mix all ingredients together until just combined. Do not overmix — bison is lean and the texture will suffer.',
      'Shape into a loaf. Bake 60–75 minutes until internal temp reads 160°F.',
      'Rest 10 minutes before slicing.',
    ],
  },

  {
    slug: 'bison-beef-meat-sauce',
    title: 'Bison-Beef Meat Sauce',
    description:
      'A rich pasta meat sauce combining ground bison and lean ground beef with mushrooms, shredded carrots, celery, and jarred tomato sauce. The umami seasoning elevates a simple base.',
    prepTimeMins: 15,
    cookTimeMins: 45,
    servings: 8,
    cuisine: 'Italian',
    difficulty: 'Easy',
    dietaryRestrictions: ['Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Sautéed'],
    tagSlugs: ['dinner', 'weeknight', 'one-pot', 'make-ahead', 'batch-cooking'],
    ingredients: [
      { name: 'ground bison', quantity: '1', unit: 'lb' },
      { name: 'ground beef', quantity: '1', unit: 'lb', preparation: '96% lean' },
      { name: 'tomato sauce', quantity: '3', unit: 'jars', preparation: '24 oz each' },
      { name: 'garlic', quantity: '1', unit: 'bulb', preparation: 'minced' },
      { name: 'onion', quantity: '1.5', preparation: 'diced' },
      { name: 'mushrooms', quantity: '1.5', unit: 'packs', preparation: 'sliced' },
      { name: 'celery', quantity: '3', unit: 'stalks', preparation: 'diced' },
      { name: 'carrots', quantity: '1/2', unit: 'bag', preparation: 'shredded' },
      { name: 'olives', quantity: '1/2', unit: 'can', preparation: 'optional' },
      { name: 'basil', quantity: '1', unit: 'tbsp' },
      { name: 'oregano', quantity: '1', unit: 'tbsp' },
      { name: 'rosemary', quantity: '1', unit: 'tsp' },
      { name: 'thyme', quantity: '1', unit: 'tsp' },
      { name: 'salt', quantity: '1', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
    ],
    steps: [
      'Brown ground bison and beef together in a large pot over medium-high heat, breaking up as it cooks.',
      'Add garlic, onion, mushrooms, celery, and carrots. Cook 5–7 minutes until softened.',
      'Add all spices and stir.',
      'Pour in tomato sauce and olives if using. Stir well.',
      'Simmer on low for 30–45 minutes, stirring occasionally, until sauce is thick and flavors meld.',
      'Serve over pasta. Freezes well in portions.',
    ],
  },

  {
    slug: 'pan-fried-bison-meatballs',
    title: 'Pan-Fried Bison Meatballs',
    description:
      'Lean ground bison meatballs pan-fried for a deep, caramelized crust. A panade (breadcrumb soaked in liquid) is essential — without it, the lean meat will be dry.',
    prepTimeMins: 20,
    cookTimeMins: 20,
    servings: 4,
    cuisine: 'Italian',
    difficulty: 'Medium',
    cookingMethods: ['Pan-Seared'],
    tagSlugs: ['dinner', 'weeknight'],
    ingredients: [
      { name: 'ground bison', quantity: '2', unit: 'lbs' },
      { name: 'eggs', quantity: '2' },
      { name: 'panko breadcrumbs', quantity: '1/2', unit: 'cup' },
      { name: 'dairy-free milk', quantity: '1/4', unit: 'cup', preparation: 'for the panade' },
      { name: 'garlic', quantity: '3', unit: 'cloves', preparation: 'minced' },
      { name: 'onion', quantity: '1/4', unit: 'cup', preparation: 'finely minced' },
      { name: 'oregano', quantity: '1', unit: 'tsp' },
      { name: 'basil', quantity: '1', unit: 'tsp' },
      { name: 'salt', quantity: '1.5', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
      { name: 'olive oil', quantity: '2', unit: 'tbsp', preparation: 'for the pan' },
    ],
    steps: [
      'Mix breadcrumbs with milk and let soak 2 minutes to form a panade.',
      'Add all remaining ingredients. Mix gently until just combined — do not overwork.',
      'Form into meatballs, about 1.5 inches in diameter.',
      'Heat oil in a skillet over medium. Brown meatballs in batches, turning to brown all sides.',
      'Lower heat and cook through, or cover with a splash of sauce or broth to finish.',
    ],
  },

  {
    slug: 'ground-turkey-breakfast-sausage',
    title: 'Ground Turkey Breakfast Sausage Patties',
    description:
      'Breakfast sausage-style patties from lean ground turkey with warm savory spices. A touch of maple syrup gives the classic morning sausage character. Do not overmix or overcook.',
    prepTimeMins: 15,
    cookTimeMins: 15,
    servings: 4,
    cuisine: 'American',
    difficulty: 'Easy',
    dietaryRestrictions: ['Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Pan-Seared'],
    tagSlugs: ['breakfast', 'meal-prep', '30-minutes-or-less'],
    ingredients: [
      { name: 'ground turkey', quantity: '1', unit: 'lb' },
      { name: 'sage', quantity: '1', unit: 'tsp' },
      { name: 'thyme', quantity: '1/2', unit: 'tsp' },
      { name: 'garlic powder', quantity: '1/2', unit: 'tsp' },
      { name: 'onion powder', quantity: '1/2', unit: 'tsp' },
      { name: 'smoked paprika', quantity: '1/2', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
      { name: 'red pepper flakes', quantity: '1/4', unit: 'tsp', preparation: 'optional' },
      { name: 'maple syrup', quantity: '1.5', unit: 'tsp', preparation: 'optional, for breakfast character' },
      { name: 'salt', quantity: '1', unit: 'tsp' },
      { name: 'olive oil', quantity: '1', unit: 'tsp', preparation: 'especially if turkey is very lean' },
    ],
    steps: [
      'Mix all seasonings together first.',
      'Gently combine seasoning blend with turkey. Do not overmix.',
      'Form into small patties. Rest 10–15 minutes if possible.',
      'Cook in a lightly oiled skillet over medium heat, browning both sides until internal temp reads 165°F.',
    ],
  },

  // ─── Shepherd's Pie ───────────────────────────────────────────────────────

  {
    slug: 'shepherds-pie-deconstructed',
    title: "Shepherd's Pie (Deconstructed Bison Version)",
    description:
      'A deconstructed shepherd\'s pie using ground bison and seasonal vegetables assembled into a casserole with a parmesan mashed potato crown. Cherry tomatoes add brightness the original lacks.',
    prepTimeMins: 30,
    cookTimeMins: 60,
    servings: 6,
    cuisine: 'American',
    difficulty: 'Medium',
    cookingMethods: ['Baked', 'Sautéed'],
    tagSlugs: ['baked', 'dinner', 'comfort-food', 'weekend'],
    ingredients: [
      { name: 'ground bison', quantity: '1.5', unit: 'lbs', groupLabel: 'Meat Filling' },
      { name: 'onion', quantity: '1', unit: 'cup', preparation: 'chopped', groupLabel: 'Meat Filling' },
      { name: 'garlic', quantity: '2', unit: 'cloves', preparation: 'minced', groupLabel: 'Meat Filling' },
      { name: 'carrots', quantity: '2', preparation: 'diced', groupLabel: 'Meat Filling' },
      { name: 'cherry tomatoes', quantity: '2', unit: 'packs', preparation: 'halved', groupLabel: 'Meat Filling' },
      { name: 'mushrooms', quantity: '1', unit: 'pack', preparation: 'diced', groupLabel: 'Meat Filling' },
      { name: 'frozen peas', quantity: '1/2', unit: 'cup', groupLabel: 'Meat Filling' },
      { name: 'corn kernels', quantity: '1/2', unit: 'cup', preparation: 'frozen', groupLabel: 'Meat Filling' },
      { name: 'tomato paste', quantity: '2', unit: 'tbsp', groupLabel: 'Meat Filling' },
      { name: 'beef broth', quantity: '1', unit: 'cup', groupLabel: 'Meat Filling' },
      { name: 'worcestershire sauce', quantity: '1/2', unit: 'tbsp', groupLabel: 'Meat Filling' },
      { name: 'all-purpose flour', quantity: '2', unit: 'tbsp', groupLabel: 'Meat Filling' },
      { name: 'olive oil', quantity: '2', unit: 'tbsp', groupLabel: 'Meat Filling' },
      { name: 'rosemary', quantity: '2', unit: 'tsp', groupLabel: 'Meat Filling' },
      { name: 'thyme', quantity: '1', unit: 'tsp', groupLabel: 'Meat Filling' },
      { name: 'fresh parsley', quantity: '1', unit: 'bunch', preparation: 'chopped', groupLabel: 'Meat Filling' },
      { name: 'salt', quantity: '1', unit: 'tsp', groupLabel: 'Meat Filling' },
      { name: 'black pepper', quantity: '1', unit: 'tsp', groupLabel: 'Meat Filling' },
      { name: 'russet potatoes', quantity: '2', unit: 'lbs', preparation: 'peeled, 1-inch cubes', groupLabel: 'Potato Topping' },
      { name: 'butter', quantity: '8', unit: 'tbsp', groupLabel: 'Potato Topping' },
      { name: 'half and half', quantity: '1/3', unit: 'cup', groupLabel: 'Potato Topping' },
      { name: 'parmesan', quantity: '1/4', unit: 'cup', groupLabel: 'Potato Topping' },
      { name: 'garlic powder', quantity: '1/2', unit: 'tsp', groupLabel: 'Potato Topping' },
    ],
    steps: [
      'Boil potatoes until fork-tender, 10–15 minutes. Drain and let steam dry 1 minute. Mash with butter, half & half, garlic powder, salt, pepper, and parmesan until smooth.',
      'Heat oil in a large skillet over medium-high. Cook onion and carrots 3–4 minutes. Add garlic and cook 1 minute.',
      'Add ground bison and break apart. Cook until browned. Stir in flour and tomato paste.',
      'Add broth, Worcestershire sauce, rosemary, thyme, mushrooms, cherry tomatoes, peas, and corn. Simmer 10–12 minutes until sauce thickens slightly. Season with salt, pepper, and parsley.',
      'Preheat oven to 400°F. Pour filling into a 9x9 baking dish. Spoon mashed potatoes evenly over the top.',
      'Bake uncovered 25–30 minutes until golden and bubbling. Cool 15 minutes before serving.',
    ],
  },

  // ─── Salmon ───────────────────────────────────────────────────────────────

  {
    slug: 'baja-salmon-tacos',
    title: 'Baja-Style Salmon Tacos',
    description:
      'Chili-lime oven-roasted salmon flaked into warm tortillas with crunchy slaw and a creamy Baja sauce. Bake uncovered — covering traps steam and softens the surface.',
    prepTimeMins: 15,
    cookTimeMins: 15,
    servings: 4,
    cuisine: 'Mexican',
    difficulty: 'Easy',
    dietaryRestrictions: ['Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Baked'],
    tagSlugs: ['baked', 'dinner', 'weeknight', 'under-1-hour'],
    ingredients: [
      { name: 'salmon fillets', quantity: '1.5', unit: 'lbs', groupLabel: 'Salmon' },
      { name: 'chili powder', quantity: '1', unit: 'tsp', groupLabel: 'Salmon' },
      { name: 'smoked paprika', quantity: '1', unit: 'tsp', groupLabel: 'Salmon' },
      { name: 'cumin', quantity: '1/2', unit: 'tsp', groupLabel: 'Salmon' },
      { name: 'garlic powder', quantity: '1/2', unit: 'tsp', groupLabel: 'Salmon' },
      { name: 'onion powder', quantity: '1/2', unit: 'tsp', groupLabel: 'Salmon' },
      { name: 'lime juice', quantity: '2', unit: 'tbsp', groupLabel: 'Salmon' },
      { name: 'olive oil', quantity: '1', unit: 'tbsp', groupLabel: 'Salmon' },
      { name: 'salt', quantity: '3/4', unit: 'tsp', groupLabel: 'Salmon' },
      { name: 'black pepper', quantity: '1/4', unit: 'tsp', groupLabel: 'Salmon' },
      { name: 'Greek yogurt', quantity: '1/2', unit: 'cup', groupLabel: 'Baja Sauce' },
      { name: 'lime juice', quantity: '1', unit: 'tbsp', groupLabel: 'Baja Sauce' },
      { name: 'garlic powder', quantity: '1/4', unit: 'tsp', groupLabel: 'Baja Sauce' },
      { name: 'chili powder', quantity: '1/4', unit: 'tsp', groupLabel: 'Baja Sauce' },
      { name: 'salt', quantity: '1/4', unit: 'tsp', groupLabel: 'Baja Sauce' },
      { name: 'cabbage', quantity: '2', unit: 'cups', preparation: 'shredded, for slaw', groupLabel: 'Assembly' },
      { name: 'avocado', quantity: '1', preparation: 'sliced', groupLabel: 'Assembly' },
    ],
    steps: [
      'Preheat oven to 400°F. Lightly oil a Pyrex or baking dish.',
      'Mix salmon seasoning together. Coat salmon fillets and place skin-side down in the dish.',
      'Bake uncovered 12–15 minutes until salmon flakes and reaches 125–135°F (moist) or 145°F (fully cooked). Rest briefly.',
      'While salmon bakes, stir together Baja sauce ingredients.',
      'Flake salmon into large pieces. Serve in warm tortillas with shredded cabbage, Baja sauce, avocado, and lime.',
    ],
  },

  {
    slug: 'peanut-miso-salmon',
    title: 'Peanut-Miso Salmon with Broccolini',
    description:
      'Savory, nutty salmon with a peanut-miso sauce served over rice with crisp-tender broccolini. Apply the sauce after cooking, not before — it scorches at high heat.',
    prepTimeMins: 10,
    cookTimeMins: 20,
    servings: 2,
    difficulty: 'Easy',
    cookingMethods: ['Pan-Seared'],
    tagSlugs: ['dinner', 'weeknight', 'under-1-hour', 'healthy'],
    ingredients: [
      { name: 'salmon fillets', quantity: '2' },
      { name: 'broccolini', quantity: '1', unit: 'bunch' },
      { name: 'jasmine rice', quantity: '1', unit: 'cup', preparation: 'cooked' },
      { name: 'peanut butter', quantity: '2', unit: 'tbsp', groupLabel: 'Sauce' },
      { name: 'miso paste', quantity: '1', unit: 'tbsp', groupLabel: 'Sauce' },
      { name: 'soy sauce', quantity: '1', unit: 'tbsp', groupLabel: 'Sauce' },
      { name: 'rice vinegar', quantity: '1', unit: 'tsp', groupLabel: 'Sauce' },
      { name: 'maple syrup', quantity: '1', unit: 'tsp', groupLabel: 'Sauce' },
      { name: 'garlic', quantity: '1', unit: 'clove', preparation: 'grated', groupLabel: 'Sauce' },
      { name: 'ginger', quantity: '1', unit: 'tsp', preparation: 'grated', groupLabel: 'Sauce' },
      { name: 'salt', quantity: '1/2', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/4', unit: 'tsp' },
      { name: 'olive oil', quantity: '1', unit: 'tbsp' },
    ],
    steps: [
      'Whisk together all sauce ingredients. Add warm water a little at a time until pourable. Taste and adjust.',
      'Cook rice.',
      'Sauté or roast broccolini until crisp-tender.',
      'Pat salmon dry and season with salt and pepper. Cook in a nonstick skillet over medium heat, skin-side down, until the skin is crisp. Flip and cook until done to preference.',
      'Serve salmon over rice with broccolini. Spoon peanut-miso sauce over the top — do not add it to the pan.',
    ],
  },

  {
    slug: 'miso-maple-roasted-salmon',
    title: 'Miso-Maple Roasted Salmon',
    description:
      'Sheet pan salmon with a miso-maple glaze and roasted vegetables. The vegetables go in first; the glaze goes on the salmon near the end to avoid scorching.',
    prepTimeMins: 15,
    cookTimeMins: 40,
    servings: 2,
    difficulty: 'Easy',
    cookingMethods: ['Roasted'],
    tagSlugs: ['baked', 'dinner', 'weeknight', 'healthy'],
    ingredients: [
      { name: 'salmon fillets', quantity: '2' },
      { name: 'broccolini', quantity: '1', unit: 'bunch', preparation: 'trimmed' },
      { name: 'mushrooms', quantity: '1', unit: 'cup', preparation: 'sliced' },
      { name: 'yellow onion', quantity: '1/2', preparation: 'sliced' },
      { name: 'sweet potatoes', quantity: '1', preparation: 'diced' },
      { name: 'miso paste', quantity: '2', unit: 'tbsp', groupLabel: 'Glaze' },
      { name: 'maple syrup', quantity: '2', unit: 'tbsp', groupLabel: 'Glaze' },
      { name: 'soy sauce', quantity: '1', unit: 'tbsp', groupLabel: 'Glaze' },
      { name: 'rice vinegar', quantity: '1', unit: 'tsp', groupLabel: 'Glaze' },
      { name: 'garlic', quantity: '1', unit: 'clove', preparation: 'grated, optional', groupLabel: 'Glaze' },
      { name: 'olive oil', quantity: '2', unit: 'tbsp' },
      { name: 'salt', quantity: '3/4', unit: 'tsp' },
    ],
    steps: [
      'Preheat oven to 400°F. Toss sweet potatoes in olive oil and salt. Roast 15 minutes.',
      'Add onions and mushrooms to the pan. Roast another 10 minutes.',
      'Whisk together all glaze ingredients.',
      'Add broccolini to the pan. Nestle salmon onto the sheet pan. Brush salmon lightly with glaze.',
      'Roast 12–15 more minutes until salmon is cooked and broccolini is crisp-tender.',
      'Brush remaining glaze over salmon before serving.',
    ],
  },

  {
    slug: 'mushroom-lemon-caper-salmon',
    title: 'Mushroom Lemon Caper Salmon',
    description:
      'A skillet salmon with a bright, briny pan sauce built from the fond after searing. Mushrooms need time to brown before the sauce comes together — do not rush that step.',
    prepTimeMins: 10,
    cookTimeMins: 20,
    servings: 2,
    difficulty: 'Easy',
    cookingMethods: ['Pan-Seared'],
    tagSlugs: ['dinner', 'weeknight', 'under-1-hour'],
    ingredients: [
      { name: 'salmon fillets', quantity: '2' },
      { name: 'mushrooms', quantity: '8', unit: 'oz', preparation: 'sliced' },
      { name: 'lemon', quantity: '1', preparation: 'juiced' },
      { name: 'capers', quantity: '2', unit: 'tbsp' },
      { name: 'garlic', quantity: '2', unit: 'cloves', preparation: 'optional' },
      { name: 'butter', quantity: '2', unit: 'tbsp' },
      { name: 'chicken broth', quantity: '1/4', unit: 'cup' },
      { name: 'olive oil', quantity: '1', unit: 'tbsp' },
      { name: 'salt', quantity: '1/2', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/4', unit: 'tsp' },
    ],
    steps: [
      'Pat salmon dry and season with salt and pepper.',
      'Heat a nonstick skillet over medium-high. Sear salmon skin-side down first until crisp. Flip and finish to desired doneness. Remove and set aside.',
      'Add mushrooms to the same pan. Cook without stirring until all moisture releases and they are deeply browned, about 5 minutes.',
      'Add garlic if using and cook 30 seconds. Add capers, lemon juice, and broth. Scrape up any fond.',
      'Swirl in butter until the sauce is glossy.',
      'Return salmon to the pan briefly to coat, or spoon sauce over it.',
    ],
  },

  // ─── Vegetables & Salads ──────────────────────────────────────────────────

  {
    slug: 'brussels-sprouts-capers-goat-cheese',
    title: 'Roasted Brussels Sprouts with Capers and Goat Cheese',
    description:
      'A more composed Brussels sprouts dish: high-heat roasted with lemon and capers, then finished with crumbled goat cheese and optional crispy bacon. A clear upgrade from plain roasted.',
    prepTimeMins: 10,
    cookTimeMins: 25,
    servings: 4,
    difficulty: 'Easy',
    dietaryRestrictions: ['Gluten-Free'],
    cookingMethods: ['Roasted'],
    tagSlugs: ['baked', 'side-dish', 'weeknight', '30-minutes-or-less'],
    ingredients: [
      { name: 'brussels sprouts', quantity: '1', unit: 'lb', preparation: 'trimmed and halved' },
      { name: 'olive oil', quantity: '2', unit: 'tbsp' },
      { name: 'lemon', quantity: '1', preparation: 'juiced' },
      { name: 'capers', quantity: '1.5', unit: 'tbsp' },
      { name: 'garlic', quantity: '2', unit: 'cloves', preparation: 'minced' },
      { name: 'goat cheese', quantity: '2', unit: 'oz', preparation: 'crumbled, added after roasting' },
      { name: 'bacon', quantity: '4', unit: 'slices', preparation: 'cooked and crumbled, optional garnish' },
      { name: 'salt', quantity: '3/4', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
    ],
    steps: [
      'Preheat oven to 400°F.',
      'Toss Brussels sprouts with olive oil, garlic, salt, and pepper. Spread cut-side down on a sheet pan.',
      'Roast 20–22 minutes until deeply browned on the cut side.',
      'Remove from oven. Squeeze lemon juice over and scatter capers on top.',
      'Crumble goat cheese over the hot sprouts and top with crumbled bacon if using.',
    ],
  },

  {
    slug: 'creamy-mushroom-chicken-kale',
    title: 'Creamy Mushroom Chicken and Kale over Rice',
    description:
      'A stovetop skillet dish: deeply browned mushrooms, kale, and shredded chicken in a light oat milk sauce over rice. The key move is getting the mushrooms truly browned before anything else happens.',
    prepTimeMins: 10,
    cookTimeMins: 25,
    servings: 2,
    difficulty: 'Easy',
    dietaryRestrictions: ['Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['Sautéed'],
    tagSlugs: ['dinner', 'weeknight', 'healthy'],
    ingredients: [
      { name: 'chicken breast', quantity: '1/2', unit: 'cup', preparation: 'pre-cooked shredded' },
      { name: 'mushrooms', quantity: '2', unit: 'cups', preparation: 'sliced' },
      { name: 'kale', quantity: '2', unit: 'cups', preparation: 'finely shredded' },
      { name: 'onion', quantity: '1', unit: 'cup', preparation: 'diced' },
      { name: 'garlic', quantity: '3', unit: 'cloves', preparation: 'sliced' },
      { name: 'oat milk', quantity: '1/2', unit: 'cup' },
      { name: 'ghee', quantity: '1', unit: 'tbsp' },
      { name: 'soy sauce', quantity: '1', unit: 'tsp', preparation: 'optional umami boost' },
      { name: 'lemon juice', quantity: '1', unit: 'tsp', preparation: 'optional, to finish' },
      { name: 'jasmine rice', quantity: '1', unit: 'cup', preparation: 'cooked' },
      { name: 'salt', quantity: '1/2', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp' },
    ],
    steps: [
      'Heat a stainless skillet over medium-high. Add ghee.',
      'Add mushrooms without stirring. Let them cook until all moisture releases and they are deeply browned, about 5–6 minutes.',
      'Add onion and cook until softened. Add garlic and cook 30 seconds.',
      'Add kale in batches and wilt. Season with salt and pepper and a splash of soy sauce.',
      'Pour in oat milk and simmer gently — do not boil hard or it will taste sweet and split.',
      'Stir in shredded chicken and warm through. Reduce until lightly creamy. Finish with lemon juice.',
      'Serve over rice.',
    ],
  },

  {
    slug: 'coleslaw',
    title: 'Hags Coleslaw',
    description:
      'A creamy but tangy coleslaw using a mayo-Greek yogurt split for the base, balanced with dijon, brown sugar, and two vinegars. Uses multiple TJ\'s slaw blends for texture variety.',
    prepTimeMins: 15,
    cookTimeMins: 0,
    servings: 8,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegetarian', 'Gluten-Free'],
    cookingMethods: ['No-Cook'],
    tagSlugs: ['side-dish', 'make-ahead', 'healthy'],
    ingredients: [
      { name: 'broccoli slaw mix', quantity: '1', unit: 'bag', groupLabel: 'Vegetables' },
      { name: 'cabbage', quantity: '2', unit: 'bags', preparation: 'shredded red and green mix', groupLabel: 'Vegetables' },
      { name: 'scallions', quantity: '3', unit: 'bunches', preparation: 'sliced', groupLabel: 'Vegetables' },
      { name: 'mayo', quantity: '1/2', unit: 'cup', groupLabel: 'Dressing' },
      { name: 'Greek yogurt', quantity: '1', unit: 'cup', preparation: 'whole milk', groupLabel: 'Dressing' },
      { name: 'dijon mustard', quantity: '2', unit: 'tbsp', groupLabel: 'Dressing' },
      { name: 'brown sugar', quantity: '6', unit: 'tbsp', groupLabel: 'Dressing' },
      { name: 'apple cider vinegar', quantity: '2', unit: 'tbsp', groupLabel: 'Dressing' },
      { name: 'white vinegar', quantity: '2', unit: 'tbsp', groupLabel: 'Dressing' },
      { name: 'lemon', quantity: '1/2', preparation: 'juiced', groupLabel: 'Dressing' },
      { name: 'salt', quantity: '1', unit: 'tsp', groupLabel: 'Dressing' },
      { name: 'black pepper', quantity: '1/2', unit: 'tsp', groupLabel: 'Dressing' },
    ],
    steps: [
      'Whisk together all dressing ingredients until smooth. Taste and adjust vinegar, sugar, and salt.',
      'Combine all slaw vegetables in a large bowl.',
      'Pour dressing over vegetables and toss thoroughly to coat.',
      'Cover and refrigerate at least 1 hour — it improves as it sits.',
    ],
  },

  {
    slug: 'green-goddess-potato-salad',
    title: 'Green Goddess Potato Salad',
    description:
      'A creamy herbed potato salad with snap peas and a blended avocado-herb green goddess dressing. The anchovy fillets in the dressing add savory depth without tasting fishy.',
    prepTimeMins: 20,
    cookTimeMins: 15,
    servings: 6,
    difficulty: 'Easy',
    dietaryRestrictions: ['Gluten-Free'],
    cookingMethods: ['Boiled'],
    tagSlugs: ['side-dish', 'salad', 'make-ahead'],
    ingredients: [
      { name: 'red potatoes', quantity: '2', unit: 'lbs', preparation: 'about 12 small' },
      { name: 'snap peas', quantity: '4', unit: 'oz' },
      { name: 'celery', quantity: '3', unit: 'stalks', preparation: 'chopped' },
      { name: 'mayo', quantity: '1/2', unit: 'cup', groupLabel: 'Green Goddess Dressing' },
      { name: 'fresh parsley', quantity: '1/2', unit: 'cup', groupLabel: 'Green Goddess Dressing' },
      { name: 'buttermilk', quantity: '1/4', unit: 'cup', groupLabel: 'Green Goddess Dressing' },
      { name: 'fresh chives', quantity: '1/4', unit: 'cup', groupLabel: 'Green Goddess Dressing' },
      { name: 'lemon juice', quantity: '2', unit: 'tbsp', groupLabel: 'Green Goddess Dressing' },
      { name: 'fresh tarragon', quantity: '2', unit: 'tbsp', groupLabel: 'Green Goddess Dressing' },
      { name: 'anchovy fillets', quantity: '2', groupLabel: 'Green Goddess Dressing' },
      { name: 'shallots', quantity: '2', groupLabel: 'Green Goddess Dressing' },
      { name: 'avocado', quantity: '1', preparation: 'small, ripe', groupLabel: 'Green Goddess Dressing' },
      { name: 'salt', quantity: '1.5', unit: 'tsp', groupLabel: 'Green Goddess Dressing' },
    ],
    steps: [
      'Cover potatoes with cold salted water. Bring to a boil and cook until fork-tender, about 10 minutes. Remove with a slotted spoon.',
      'Blanch snap peas in the same boiling water for 1 minute. Drain and slice on an angle.',
      'Blend all dressing ingredients until smooth.',
      'Let potatoes cool slightly. Combine with snap peas and celery in a large bowl.',
      'Pour dressing over, season with remaining salt and pepper, and toss well.',
      'Refrigerate at least 1 hour. Toss again and garnish with extra parsley and chives before serving.',
    ],
  },

  // ─── Sauces & Condiments ──────────────────────────────────────────────────

  {
    slug: 'buffalo-sauce-umami-inferno',
    title: 'Buffalo Sauce — Umami Inferno (v3)',
    description:
      'A classic buffalo base pushed East-West with miso, ginger-garlic, and optional gochujang. Sesame oil goes in off-heat only — it scorches and turns bitter if cooked.',
    prepTimeMins: 5,
    cookTimeMins: 8,
    servings: 8,
    difficulty: 'Easy',
    cookingMethods: ['No-Cook'],
    tagSlugs: ['make-ahead', 'budget-friendly'],
    ingredients: [
      { name: 'hot sauce', quantity: '1/2', unit: 'cup', preparation: "Frank's RedHot or cayenne-based" },
      { name: 'butter', quantity: '4', unit: 'tbsp' },
      { name: 'white vinegar', quantity: '1', unit: 'tbsp' },
      { name: 'garlic', quantity: '2', unit: 'cloves', preparation: 'minced to a pulp' },
      { name: 'ginger', quantity: '1', unit: 'tsp', preparation: 'grated to a pulp' },
      { name: 'miso paste', quantity: '1', unit: 'tbsp' },
      { name: 'maple syrup', quantity: '1', unit: 'tsp' },
      { name: 'smoked paprika', quantity: '1/2', unit: 'tsp' },
      { name: 'mustard powder', quantity: '1/4', unit: 'tsp' },
      { name: 'gochujang', quantity: '1', unit: 'tsp', preparation: 'optional' },
      { name: 'sesame oil', quantity: '1/2', unit: 'tsp', preparation: 'finishing only, added off heat' },
    ],
    steps: [
      'Warm hot sauce, butter, and vinegar gently in a small saucepan over low heat.',
      'Stir in garlic and ginger pulp.',
      'Whisk in miso paste until fully dissolved — no lumps.',
      'Add maple syrup, smoked paprika, mustard powder, and gochujang if using.',
      'Simmer briefly on low, about 2–3 minutes. Do not scorch.',
      'Remove from heat. Stir in sesame oil. Taste before salting — miso adds significant salt.',
    ],
  },

  {
    slug: 'peanut-miso-sauce',
    title: 'Peanut-Miso Booster Sauce',
    description:
      'A versatile peanut-miso sauce for salmon, broccolini, chicken bowls, or noodles. Warm water thins it; too much makes it watery — add gradually.',
    prepTimeMins: 5,
    cookTimeMins: 0,
    servings: 4,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Dairy-Free', 'Gluten-Free'],
    cookingMethods: ['No-Cook'],
    tagSlugs: ['make-ahead', 'healthy'],
    ingredients: [
      { name: 'peanut butter', quantity: '3', unit: 'tbsp' },
      { name: 'miso paste', quantity: '1', unit: 'tbsp' },
      { name: 'soy sauce', quantity: '2', unit: 'tbsp' },
      { name: 'rice vinegar', quantity: '1', unit: 'tbsp' },
      { name: 'maple syrup', quantity: '1', unit: 'tsp' },
      { name: 'garlic', quantity: '1', unit: 'clove', preparation: 'grated' },
      { name: 'ginger', quantity: '1', unit: 'tsp', preparation: 'grated' },
      { name: 'gochujang', quantity: '1', unit: 'tsp', preparation: 'or chili crisp, optional' },
    ],
    steps: [
      'Whisk peanut butter and miso together first until smooth.',
      'Add soy sauce, rice vinegar, maple syrup, garlic, ginger, and chili if using.',
      'Add warm water gradually, 1 tbsp at a time, until pourable.',
      'Taste: adjust salt (soy), sweetness (maple), and acid (vinegar).',
    ],
  },

  {
    slug: 'soy-scallion-ginger-sauce',
    title: 'Quick Soy-Scallion / Ginger Garlic Sauce',
    description:
      'A flexible finishing sauce for rice bowls, fried rice, shredded chicken, broccolini, or steak. Ready in 5 minutes. The cooked version (garlic/ginger bloom in warm oil) is deeper; the raw version is brighter.',
    prepTimeMins: 5,
    cookTimeMins: 5,
    servings: 2,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Dairy-Free'],
    cookingMethods: ['No-Cook'],
    tagSlugs: ['make-ahead', 'healthy', '30-minutes-or-less'],
    ingredients: [
      { name: 'soy sauce', quantity: '2', unit: 'tbsp' },
      { name: 'sesame oil', quantity: '1', unit: 'tbsp' },
      { name: 'rice vinegar', quantity: '1.5', unit: 'tsp' },
      { name: 'mirin', quantity: '1', unit: 'tsp', preparation: 'or brown sugar/maple syrup, optional' },
      { name: 'garlic', quantity: '1', unit: 'clove', preparation: 'minced' },
      { name: 'ginger', quantity: '1', unit: 'tsp', preparation: 'grated' },
      { name: 'scallions', quantity: '2', preparation: 'sliced' },
      { name: 'red pepper flakes', quantity: '1/4', unit: 'tsp', preparation: 'optional' },
    ],
    steps: [
      'Cooked version: warm oil gently in a small pan. Add garlic and ginger, sauté briefly until fragrant but not browned.',
      'Add soy sauce, vinegar, and mirin. Simmer a few seconds. Remove from heat and stir in scallions.',
      'Raw version: simply whisk everything together cold and let sit 5 minutes.',
      'Thin with a splash of water to use as a drizzle sauce.',
    ],
  },

  {
    slug: 'strawberry-vinaigrette',
    title: 'Strawberry Vinaigrette',
    description:
      'A quick fresh strawberry vinaigrette. Pairs well with goat cheese salads, grains, chicken, or nuts. Hulling the strawberries (removing the green cap and firm pale core) is a step most people skip and should not.',
    prepTimeMins: 10,
    cookTimeMins: 0,
    servings: 6,
    difficulty: 'Easy',
    dietaryRestrictions: ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['No-Cook'],
    tagSlugs: ['make-ahead', 'healthy'],
    ingredients: [
      { name: 'strawberries', quantity: '1', unit: 'cup', preparation: 'hulled' },
      { name: 'apple cider vinegar', quantity: '2', unit: 'tbsp' },
      { name: 'olive oil', quantity: '3', unit: 'tbsp' },
      { name: 'dijon mustard', quantity: '1', unit: 'tsp', preparation: 'optional' },
      { name: 'honey', quantity: '1', unit: 'tsp', preparation: 'optional' },
      { name: 'salt', quantity: '1/4', unit: 'tsp' },
      { name: 'black pepper', quantity: '1/4', unit: 'tsp' },
    ],
    steps: [
      'Hull strawberries and mash or blend with vinegar.',
      'Add salt, pepper, dijon, and honey if using.',
      'Whisk or blend in olive oil until emulsified.',
      'Adjust acidity, sweetness, and salt to taste.',
    ],
  },

  // ─── Turkey Brines ────────────────────────────────────────────────────────

  {
    slug: 'wet-turkey-brine',
    title: 'Wet Turkey Brine',
    description:
      'A deeply aromatic wet brine for whole turkey. The apple cider and brown sugar provide mild sweetness; the spice blend and orange peels give the brine complexity. Scale liquid based on bird size.',
    prepTimeMins: 20,
    cookTimeMins: 30,
    servings: 1,
    difficulty: 'Easy',
    dietaryRestrictions: ['Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['No-Cook'],
    tagSlugs: ['make-ahead', 'weekend', 'holiday'],
    ingredients: [
      { name: 'vegetable stock', quantity: '3', unit: 'quarts' },
      { name: 'apple cider', quantity: '1', unit: 'quart' },
      { name: 'kosher salt', quantity: '1', unit: 'cup' },
      { name: 'brown sugar', quantity: '1', unit: 'cup' },
      { name: 'garlic', quantity: '2', unit: 'bulbs', preparation: 'halved crosswise' },
      { name: 'allspice berries', quantity: '1', unit: 'tsp' },
      { name: 'whole peppercorns', quantity: '3', unit: 'tbsp' },
      { name: 'cloves', quantity: '10', preparation: 'whole' },
      { name: 'bay leaf', quantity: '4' },
      { name: 'orange peel', quantity: '1', unit: 'orange', preparation: 'in strips' },
      { name: 'thyme', quantity: '1.5', unit: 'tbsp' },
      { name: 'sage', quantity: '1', unit: 'tbsp' },
      { name: 'fresh rosemary', quantity: '1', unit: 'tbsp' },
    ],
    steps: [
      'Combine vegetable stock, salt, and brown sugar in a large pot. Heat until salt and sugar dissolve.',
      'Add all remaining ingredients. Stir and let cool completely to room temperature, then refrigerate until cold.',
      'Submerge the turkey in the brine. Refrigerate 18–24 hours for an 18–22 lb bird.',
      'Remove turkey from brine, rinse, and pat completely dry before cooking.',
    ],
  },

  {
    slug: 'dry-turkey-brine',
    title: 'Dry Turkey Brine (Dry Rub Brine)',
    description:
      'A dry-rub brine for whole turkey. Salt draws moisture out, then it is reabsorbed — carrying the spices into the meat. No rinsing needed; the dry surface gives better skin browning.',
    prepTimeMins: 15,
    cookTimeMins: 0,
    servings: 1,
    difficulty: 'Easy',
    dietaryRestrictions: ['Gluten-Free', 'Dairy-Free'],
    cookingMethods: ['No-Cook'],
    tagSlugs: ['make-ahead', 'weekend', 'holiday'],
    ingredients: [
      { name: 'kosher salt', quantity: '1.25', unit: 'tsp per lb of turkey', preparation: 'Morton kosher (Diamond Crystal uses 2 tsp/lb)' },
      { name: 'black pepper', quantity: '1', unit: 'tbsp' },
      { name: 'thyme', quantity: '1', unit: 'tbsp' },
      { name: 'sage', quantity: '1', unit: 'tbsp' },
      { name: 'fresh rosemary', quantity: '1', unit: 'tbsp' },
      { name: 'brown sugar', quantity: '1/4', unit: 'of salt amount', preparation: 'optional' },
      { name: 'paprika', quantity: '1', unit: 'tsp' },
      { name: 'fennel seed', quantity: '1', unit: 'tsp', preparation: 'optional' },
      { name: 'coriander', quantity: '1', unit: 'tsp', preparation: 'optional' },
      { name: 'mustard powder', quantity: '1', unit: 'tsp', preparation: 'optional' },
    ],
    steps: [
      'Remove all cavity bits from the turkey. Pat dry inside and out — do not rinse.',
      'Mix salt and all herbs together. Add sugar and optional spices.',
      'Rub the brine all over the turkey, including under the skin over the breast if possible.',
      'Loosely cover with plastic wrap. Refrigerate at least 24 hours, ideally 48–72 hours.',
      'Do not rinse before cooking. The dry surface will give better skin browning.',
    ],
  },

  // ─── Breakfast & Dessert ──────────────────────────────────────────────────

  {
    slug: 'granny-smith-apple-pie',
    title: 'Granny Smith Apple Pie',
    description:
      'A classic apple pie using 8–9 Granny Smith apples in a frozen pie crust. The tart, firm Granny Smith holds up to baking without turning to mush. Let it cool fully — the filling sets as it cools.',
    prepTimeMins: 30,
    cookTimeMins: 55,
    servings: 8,
    difficulty: 'Medium',
    dietaryRestrictions: ['Vegetarian'],
    cookingMethods: ['Baked'],
    tagSlugs: ['baked', 'dessert', 'weekend', 'holiday', 'comfort-food'],
    ingredients: [
      { name: 'apples', quantity: '8', preparation: 'Granny Smith, peeled and sliced' },
      { name: 'pie crust', quantity: '1', preparation: 'frozen 9-inch' },
      { name: 'lemon juice', quantity: '2', unit: 'tbsp' },
      { name: 'sugar', quantity: '3/4', unit: 'cup', preparation: 'adjust to taste' },
      { name: 'brown sugar', quantity: '2', unit: 'tbsp', preparation: 'optional' },
      { name: 'cinnamon', quantity: '1.5', unit: 'tsp' },
      { name: 'nutmeg', quantity: '1/4', unit: 'tsp', preparation: 'optional' },
      { name: 'salt', quantity: '1/4', unit: 'tsp' },
      { name: 'cornstarch', quantity: '2', unit: 'tbsp', preparation: 'or flour/tapioca starch' },
      { name: 'butter', quantity: '2', unit: 'tbsp', preparation: 'optional, dotted on filling' },
    ],
    steps: [
      'Preheat oven to 375°F.',
      'Peel and slice apples. Toss with lemon juice, sugar, cinnamon, salt, nutmeg, and cornstarch.',
      'Let apples sit 10–15 minutes to draw out their juices.',
      'Fill the frozen pie crust with the apple mixture. Dot with butter if using.',
      'Bake 50–60 minutes until the filling is bubbling and the crust is golden brown. Cover the edges with foil if browning too fast.',
      'Cool on a rack for at least 2 hours before slicing — the filling will not set until cool.',
    ],
  },
]

// ---------------------------------------------------------------------------
// Seed runner (same pattern as v1)
// ---------------------------------------------------------------------------

async function upsertIngredients() {
  const ingredientIdByName = new Map<string, string>()

  // Upsert ingredients declared in this script
  for (const ing of INGREDIENTS) {
    const type = await prisma.ingredientType.findUnique({
      where: { slug: ing.typeSlug },
      select: { id: true },
    })
    if (!type) {
      console.warn(`  ⚠ type not found: ${ing.typeSlug}, skipping "${ing.name}"`)
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

  // Also load all existing ingredients (seeded by v1 or other scripts)
  const all = await prisma.ingredient.findMany({ select: { id: true, name: true } })
  for (const r of all) {
    if (!ingredientIdByName.has(r.name)) ingredientIdByName.set(r.name, r.id)
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
      console.warn(`  ⚠ ingredient not found: "${ing.name}" in "${recipe.slug}"`)
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
  console.log("Seeding Hags recipes v2...\n")

  const author = await prisma.user.findUnique({
    where: { email: AUTHOR_EMAIL },
    select: { id: true, displayName: true },
  })
  if (!author) throw new Error(`User not found: ${AUTHOR_EMAIL}`)
  console.log(`  author: ${author.displayName}`)

  const ingredientIdByName = await upsertIngredients()
  console.log(`  ingredients: ${ingredientIdByName.size} upserted`)

  const tags = await prisma.tag.findMany({ select: { id: true, slug: true } })
  const tagIdBySlug = new Map(tags.map((t) => [t.slug, t.id]))

  console.log('\n  Seeding recipes:')
  for (const recipe of RECIPES) {
    const slug = await seedRecipe(recipe, author.id, ingredientIdByName, tagIdBySlug)
    console.log(`    ✓ /recipes/${slug}`)
  }

  console.log(`\nDone: ${RECIPES.length} recipes seeded.`)
}

main()
  .catch((err) => { console.error('Seed failed:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
