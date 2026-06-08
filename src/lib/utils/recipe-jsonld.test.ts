import { describe, expect, it } from 'vitest'
import { minutesToIsoDuration, toRecipeJsonLd, type RecipeForJsonLd } from './recipe-jsonld'

const baseRecipe: RecipeForJsonLd = {
  title: 'Lemon Pasta',
  description: 'A bright weeknight pasta.',
  coverImageUrl: null,
  prepTimeMins: null,
  cookTimeMins: null,
  servings: null,
  cuisine: null,
  dietaryRestrictions: [],
  cookingMethods: [],
  createdAt: new Date('2026-01-02T10:00:00.000Z'),
  updatedAt: new Date('2026-01-03T11:00:00.000Z'),
  sourceUrl: null,
  sourceAttribution: null,
  author: { displayName: 'Hags' },
  steps: [
    { order: 1, content: 'Boil the pasta.' },
    { order: 2, content: 'Toss with lemon.' },
  ],
  recipeIngredients: [
    {
      quantity: '1',
      unit: 'lb',
      preparation: null,
      display: null,
      ingredient: { name: 'pasta' },
    },
  ],
  tags: [],
}

describe('minutesToIsoDuration', () => {
  it('formats durations under an hour', () => {
    expect(minutesToIsoDuration(0)).toBe('PT0M')
    expect(minutesToIsoDuration(45)).toBe('PT45M')
  })

  it('formats hour-only and hour-plus-minute durations', () => {
    expect(minutesToIsoDuration(60)).toBe('PT1H')
    expect(minutesToIsoDuration(90)).toBe('PT1H30M')
  })
})

describe('toRecipeJsonLd', () => {
  it('maps core recipe fields and instructions', () => {
    const jsonLd = toRecipeJsonLd(baseRecipe, 'https://hagscancook.com/recipes/lemon-pasta')

    expect(jsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      '@id': 'https://hagscancook.com/recipes/lemon-pasta',
      url: 'https://hagscancook.com/recipes/lemon-pasta',
      name: 'Lemon Pasta',
      description: 'A bright weeknight pasta.',
      author: {
        '@type': 'Person',
        name: 'Hags',
      },
      datePublished: '2026-01-02',
      dateModified: '2026-01-03',
      recipeIngredient: ['1 lb pasta'],
      recipeInstructions: [
        { '@type': 'HowToStep', position: 1, text: 'Boil the pasta.' },
        { '@type': 'HowToStep', position: 2, text: 'Toss with lemon.' },
      ],
    })
  })

  it('uses display ingredients when present and formats structured ingredients otherwise', () => {
    const jsonLd = toRecipeJsonLd(
      {
        ...baseRecipe,
        recipeIngredients: [
          {
            quantity: '',
            unit: null,
            preparation: null,
            display: 'A handful of basil leaves',
            ingredient: { name: 'basil' },
          },
          {
            quantity: '2',
            unit: 'tbsp',
            preparation: 'melted',
            display: null,
            ingredient: { name: 'butter' },
          },
        ],
      },
      'https://hagscancook.com/recipes/lemon-pasta',
    )

    expect(jsonLd.recipeIngredient).toEqual(['A handful of basil leaves', '2 tbsp butter, melted'])
  })

  it('includes optional fields when present', () => {
    const jsonLd = toRecipeJsonLd(
      {
        ...baseRecipe,
        coverImageUrl: 'https://cdn.example.com/lemon-pasta.jpg',
        prepTimeMins: 15,
        cookTimeMins: 20,
        servings: 4,
        cuisine: 'Italian',
        dietaryRestrictions: ['Vegetarian', 'Gluten-Free', 'Whole30'],
        cookingMethods: ['Boil', 'Sauté'],
        sourceUrl: 'https://example.com/source',
        sourceAttribution: 'Original Source',
        tags: [{ tag: { name: 'Weeknight' } }, { tag: { name: 'Pasta' } }],
      },
      'https://hagscancook.com/recipes/lemon-pasta',
    )

    expect(jsonLd).toMatchObject({
      image: ['https://cdn.example.com/lemon-pasta.jpg'],
      prepTime: 'PT15M',
      cookTime: 'PT20M',
      totalTime: 'PT35M',
      recipeYield: '4 servings',
      recipeCuisine: 'Italian',
      cookingMethod: ['Boil', 'Sauté'],
      suitableForDiet: ['https://schema.org/VegetarianDiet', 'https://schema.org/GlutenFreeDiet'],
      keywords: 'Weeknight, Pasta',
      isBasedOn: {
        '@type': 'WebPage',
        url: 'https://example.com/source',
        name: 'Original Source',
      },
    })
  })

  it('omits optional fields when absent', () => {
    const jsonLd = toRecipeJsonLd(baseRecipe, 'https://hagscancook.com/recipes/lemon-pasta')

    expect(jsonLd).not.toHaveProperty('image')
    expect(jsonLd).not.toHaveProperty('prepTime')
    expect(jsonLd).not.toHaveProperty('cookTime')
    expect(jsonLd).not.toHaveProperty('totalTime')
    expect(jsonLd).not.toHaveProperty('recipeYield')
    expect(jsonLd).not.toHaveProperty('recipeCuisine')
    expect(jsonLd).not.toHaveProperty('cookingMethod')
    expect(jsonLd).not.toHaveProperty('suitableForDiet')
    expect(jsonLd).not.toHaveProperty('keywords')
    expect(jsonLd).not.toHaveProperty('isBasedOn')
  })
})
