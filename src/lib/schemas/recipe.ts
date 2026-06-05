/**
 * Zod schema for recipe form validation.
 *
 * Shared between the client (React Hook Form resolver) and the server
 * (Server Action validation). Number fields may arrive as strings or numbers
 * depending on RHF version and input type — the schema handles both.
 */

import { z } from 'zod'
import { CUISINES } from '@/lib/constants/cuisines'
import { DIETARY_RESTRICTIONS } from '@/lib/constants/dietary-restrictions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses an optional positive integer from a string or number form field.
 * `<input type="number">` in React Hook Form can submit either a string or a
 * native number depending on browser/RHF version — this handles both.
 * Empty string or undefined → undefined. Non-positive → undefined.
 */
const optionalPositiveInt = z
  .union([z.string(), z.number()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null || val === '') return undefined
    const n = typeof val === 'number' ? val : parseInt(String(val), 10)
    return isNaN(n) || n < 1 ? undefined : n
  })

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Field limits — shared with HTML maxLength / max attributes in the form UI
// ---------------------------------------------------------------------------

export const LIMITS = {
  TITLE: 100,
  DESCRIPTION: 500,
  INGREDIENT_NAME: 80,
  INGREDIENT_QTY: 20,
  INGREDIENT_UNIT: 30,
  INGREDIENT_PREP: 60,
  INGREDIENT_GROUP: 60,
  STEP_CONTENT: 600,
  TIMING: 999,
  SERVINGS: 999,
} as const

export const IngredientRowSchema = z.object({
  /** Canonical ingredient name (used to find-or-create the Ingredient row). */
  ingredientName: z.string().min(1, 'Ingredient name is required').max(LIMITS.INGREDIENT_NAME),
  quantity: z.string().min(1, 'Quantity is required').max(LIMITS.INGREDIENT_QTY),
  unit: z.string().max(LIMITS.INGREDIENT_UNIT).optional(),
  preparation: z.string().max(LIMITS.INGREDIENT_PREP).optional(),
  groupLabel: z.string().max(LIMITS.INGREDIENT_GROUP).optional(),
  /** Ingredient type UUID. Used when creating a new canonical Ingredient row;
   *  silently ignored for ingredients that already exist in the DB. */
  typeId: z.string().optional(),
})

export const StepRowSchema = z.object({
  content: z.string().min(1, 'Step content is required').max(LIMITS.STEP_CONTENT),
})

// ---------------------------------------------------------------------------
// Main schema
// ---------------------------------------------------------------------------

export const RecipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(LIMITS.TITLE),
  description: z.string().min(1, 'Description is required').max(LIMITS.DESCRIPTION),
  coverImageUrl: z.string().optional(),
  prepTimeMins: optionalPositiveInt,
  cookTimeMins: optionalPositiveInt,
  servings: optionalPositiveInt,
  cuisine: z
    .enum(CUISINES)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
  difficulty: z
    .enum(['Easy', 'Medium', 'Advanced'])
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
  dietaryRestrictions: z.array(z.enum(DIETARY_RESTRICTIONS)),
  /** Free-text cooking methods (from COOKING_METHODS list or custom values). */
  cookingMethods: z.array(z.string()),
  tagIds: z.array(z.string().uuid()),
  ingredients: z.array(IngredientRowSchema),
  steps: z.array(StepRowSchema),
})

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type RecipeFormValues = {
  title: string
  description: string
  coverImageUrl: string
  /** Stored as string in the form input, coerced to number on parse. */
  prepTimeMins: string
  cookTimeMins: string
  servings: string
  cuisine: string
  difficulty: string
  dietaryRestrictions: string[]
  cookingMethods: string[]
  tagIds: string[]
  ingredients: {
    ingredientName: string
    quantity: string
    unit: string
    preparation: string
    groupLabel: string
    typeId: string
  }[]
  steps: {
    content: string
  }[]
}

/** Parsed and validated recipe data — safe to pass to Server Actions. */
export type RecipeData = z.infer<typeof RecipeSchema>
