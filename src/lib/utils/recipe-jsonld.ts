/**
 * Generates a schema.org Recipe JSON-LD object from a recipe DB row.
 *
 * Schema.org is treated as an output format for SEO/interoperability, not as
 * the primary data model. Generate from the canonical internal recipe shape
 * and inject as `<script type="application/ld+json">` in the page `<head>`.
 *
 * Reference: https://schema.org/Recipe
 * Google guidance: https://developers.google.com/search/docs/appearance/structured-data/recipe
 */

// ---------------------------------------------------------------------------
// Type — minimal subset of the Prisma recipe query result needed here
// ---------------------------------------------------------------------------

export interface RecipeForJsonLd {
  title: string
  description: string
  coverImageUrl?: string | null
  prepTimeMins?: number | null
  cookTimeMins?: number | null
  servings?: number | null
  cuisine?: string | null
  dietaryRestrictions: string[]
  cookingMethods: string[]
  createdAt: Date
  updatedAt: Date
  sourceUrl?: string | null
  sourceAttribution?: string | null
  author: { displayName: string }
  steps: { order: number; content: string }[]
  recipeIngredients: {
    quantity: string
    unit?: string | null
    preparation?: string | null
    display?: string | null
    ingredient: { name: string }
  }[]
  tags: { tag: { name: string } }[]
}

// ---------------------------------------------------------------------------
// Dietary restriction → schema.org RestrictedDiet mapping
// Only include values that have an official schema.org equivalent.
// ---------------------------------------------------------------------------

const DIET_MAP: Record<string, string> = {
  'Vegan': 'https://schema.org/VeganDiet',
  'Vegetarian': 'https://schema.org/VegetarianDiet',
  'Gluten-Free': 'https://schema.org/GlutenFreeDiet',
  'Dairy-Free': 'https://schema.org/LowLactoseDiet',
  'Halal': 'https://schema.org/HalalDiet',
  'Kosher': 'https://schema.org/KosherDiet',
  'Diabetic-Friendly': 'https://schema.org/DiabeticDiet',
  'Low-Sodium': 'https://schema.org/LowSaltDiet',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converts minutes to ISO 8601 duration (e.g. 65 → "PT65M", 90 → "PT1H30M"). */
export function minutesToIsoDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `PT${m}M`
  if (m === 0) return `PT${h}H`
  return `PT${h}H${m}M`
}

/**
 * Formats a single RecipeIngredient into a display string.
 * Uses the `display` field if available (imported recipes), otherwise
 * constructs from structured fields (user-authored recipes).
 */
function formatIngredient(ri: RecipeForJsonLd['recipeIngredients'][number]): string {
  if (ri.display) return ri.display
  const parts = [ri.quantity, ri.unit, ri.ingredient.name].filter(Boolean).join(' ')
  return ri.preparation ? `${parts}, ${ri.preparation}` : parts
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Builds a schema.org `Recipe` JSON-LD object suitable for embedding in a
 * `<script type="application/ld+json">` tag.
 *
 * @param recipe - Recipe data from the DB (see RecipeForJsonLd interface)
 * @param canonicalUrl - Absolute URL of the recipe page (for `@id` and `url`)
 */
export function toRecipeJsonLd(recipe: RecipeForJsonLd, canonicalUrl: string) {
  const suitableForDiet = recipe.dietaryRestrictions
    .map((d) => DIET_MAP[d])
    .filter(Boolean)

  const keywords = recipe.tags.map((t) => t.tag.name).join(', ')

  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    '@id': canonicalUrl,
    url: canonicalUrl,

    name: recipe.title,
    description: recipe.description,
    ...(recipe.coverImageUrl ? { image: [recipe.coverImageUrl] } : {}),

    author: {
      '@type': 'Person',
      name: recipe.author.displayName,
    },

    datePublished: recipe.createdAt.toISOString().split('T')[0],
    dateModified: recipe.updatedAt.toISOString().split('T')[0],

    ...(recipe.prepTimeMins
      ? { prepTime: minutesToIsoDuration(recipe.prepTimeMins) }
      : {}),
    ...(recipe.cookTimeMins
      ? { cookTime: minutesToIsoDuration(recipe.cookTimeMins) }
      : {}),
    ...(recipe.prepTimeMins || recipe.cookTimeMins
      ? {
          totalTime: minutesToIsoDuration(
            (recipe.prepTimeMins ?? 0) + (recipe.cookTimeMins ?? 0)
          ),
        }
      : {}),

    ...(recipe.servings ? { recipeYield: `${recipe.servings} servings` } : {}),
    ...(recipe.cuisine ? { recipeCuisine: recipe.cuisine } : {}),
    ...(recipe.cookingMethods.length > 0
      ? { cookingMethod: recipe.cookingMethods }
      : {}),
    ...(suitableForDiet.length > 0 ? { suitableForDiet } : {}),
    ...(keywords ? { keywords } : {}),

    recipeIngredient: recipe.recipeIngredients.map(formatIngredient),

    recipeInstructions: recipe.steps.map((step) => ({
      '@type': 'HowToStep',
      position: step.order,
      text: step.content,
    })),

    ...(recipe.sourceUrl
      ? {
          isBasedOn: {
            '@type': 'WebPage',
            url: recipe.sourceUrl,
            ...(recipe.sourceAttribution
              ? { name: recipe.sourceAttribution }
              : {}),
          },
        }
      : {}),
  }
}
