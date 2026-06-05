/**
 * Zod schemas for the Pantry feature.
 *
 * Shared between the client (form validation) and the server (Server Action
 * re-validation). Mirrors the conventions in recipe.ts.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Field limits — shared with HTML maxLength attributes in the UI
// ---------------------------------------------------------------------------

export const PANTRY_LIMITS = {
  INGREDIENT_NAME: 80,
  AMOUNT: 20,
  UNIT: 30,
  NOTE: 120,
} as const

/** Optional bounded string that treats empty/whitespace as undefined. */
const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((v) => {
      const trimmed = v?.trim()
      return trimmed ? trimmed : undefined
    })

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/** Quick-add a pantry item by ingredient name. */
export const AddPantryItemSchema = z.object({
  ingredientName: z
    .string()
    .min(1, 'Ingredient name is required')
    .max(PANTRY_LIMITS.INGREDIENT_NAME),
  amount: optionalText(PANTRY_LIMITS.AMOUNT),
  unit: optionalText(PANTRY_LIMITS.UNIT),
  note: optionalText(PANTRY_LIMITS.NOTE),
  /** Ingredient type UUID — only used when creating a brand-new canonical
   *  ingredient. Ignored for ingredients that already exist. */
  typeId: optionalText(64),
})

/** Edit the amount/unit/note of an existing pantry item. */
export const UpdatePantryItemSchema = z.object({
  amount: optionalText(PANTRY_LIMITS.AMOUNT),
  unit: optionalText(PANTRY_LIMITS.UNIT),
  note: optionalText(PANTRY_LIMITS.NOTE),
})

export type AddPantryItemInput = z.input<typeof AddPantryItemSchema>
export type UpdatePantryItemInput = z.input<typeof UpdatePantryItemSchema>
