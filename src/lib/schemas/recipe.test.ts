// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { IngredientRowSchema, LIMITS, RecipeSchema, StepRowSchema } from './recipe'

const validRecipe = {
  title: 'Lemon Pasta',
  description: 'A bright weeknight pasta.',
  coverImageUrl: '',
  prepTimeMins: '',
  cookTimeMins: '',
  servings: '',
  cuisine: '',
  difficulty: '',
  dietaryRestrictions: [],
  cookingMethods: [],
  tagIds: [],
  ingredients: [{ ingredientName: 'pasta', quantity: '1 lb' }],
  steps: [{ content: 'Boil the pasta.' }],
}

describe('RecipeSchema', () => {
  it('coerces optional positive integer fields', () => {
    const parsed = RecipeSchema.parse({
      ...validRecipe,
      prepTimeMins: '15',
      cookTimeMins: 20,
      servings: '4',
    })

    expect(parsed.prepTimeMins).toBe(15)
    expect(parsed.cookTimeMins).toBe(20)
    expect(parsed.servings).toBe(4)
  })

  it('treats blank, zero, and invalid optional integer fields as undefined', () => {
    const parsed = RecipeSchema.parse({
      ...validRecipe,
      prepTimeMins: '',
      cookTimeMins: '0',
      servings: 'abc',
    })

    expect(parsed.prepTimeMins).toBeUndefined()
    expect(parsed.cookTimeMins).toBeUndefined()
    expect(parsed.servings).toBeUndefined()
  })

  it('converts empty cuisine and difficulty values to undefined', () => {
    const parsed = RecipeSchema.parse({
      ...validRecipe,
      cuisine: '',
      difficulty: '',
    })

    expect(parsed.cuisine).toBeUndefined()
    expect(parsed.difficulty).toBeUndefined()
  })

  it('accepts valid cuisine and difficulty values', () => {
    const parsed = RecipeSchema.parse({
      ...validRecipe,
      cuisine: 'Italian',
      difficulty: 'Easy',
    })

    expect(parsed.cuisine).toBe('Italian')
    expect(parsed.difficulty).toBe('Easy')
  })

  it('rejects invalid tag ids', () => {
    expect(RecipeSchema.safeParse({ ...validRecipe, tagIds: ['not-a-uuid'] }).success).toBe(false)
  })

  it('enforces title and description limits', () => {
    expect(RecipeSchema.safeParse({ ...validRecipe, title: '' }).success).toBe(false)
    expect(RecipeSchema.safeParse({ ...validRecipe, title: 'a'.repeat(LIMITS.TITLE + 1) }).success).toBe(false)
    expect(RecipeSchema.safeParse({ ...validRecipe, description: '' }).success).toBe(false)
    expect(
      RecipeSchema.safeParse({ ...validRecipe, description: 'a'.repeat(LIMITS.DESCRIPTION + 1) }).success,
    ).toBe(false)
  })
})

describe('IngredientRowSchema', () => {
  it('requires ingredient name and quantity', () => {
    expect(IngredientRowSchema.safeParse({ ingredientName: '', quantity: '1 cup' }).success).toBe(false)
    expect(IngredientRowSchema.safeParse({ ingredientName: 'flour', quantity: '' }).success).toBe(false)
    expect(IngredientRowSchema.safeParse({ ingredientName: 'flour', quantity: '1 cup' }).success).toBe(true)
  })

  it('enforces ingredient field limits', () => {
    expect(
      IngredientRowSchema.safeParse({
        ingredientName: 'a'.repeat(LIMITS.INGREDIENT_NAME + 1),
        quantity: '1',
      }).success,
    ).toBe(false)
    expect(
      IngredientRowSchema.safeParse({
        ingredientName: 'flour',
        quantity: 'a'.repeat(LIMITS.INGREDIENT_QTY + 1),
      }).success,
    ).toBe(false)
    expect(
      IngredientRowSchema.safeParse({
        ingredientName: 'flour',
        quantity: '1',
        unit: 'a'.repeat(LIMITS.INGREDIENT_UNIT + 1),
        preparation: 'a'.repeat(LIMITS.INGREDIENT_PREP + 1),
        groupLabel: 'a'.repeat(LIMITS.INGREDIENT_GROUP + 1),
      }).success,
    ).toBe(false)
  })
})

describe('StepRowSchema', () => {
  it('requires step content', () => {
    expect(StepRowSchema.safeParse({ content: '' }).success).toBe(false)
    expect(StepRowSchema.safeParse({ content: 'Mix everything.' }).success).toBe(true)
  })

  it('enforces the step content limit', () => {
    expect(StepRowSchema.safeParse({ content: 'a'.repeat(LIMITS.STEP_CONTENT + 1) }).success).toBe(false)
  })
})
