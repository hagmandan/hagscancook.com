/**
 * Predefined cuisine list for recipe classification.
 *
 * Single-select on the recipe form. Stored as a plain `text?` column on the
 * `recipes` table — no junction table or DB enum needed for MVP.
 *
 * To add a cuisine: append to the array. No migration required.
 */

export const CUISINES = [
  'American',
  'Brazilian',
  'Caribbean',
  'Chinese',
  'Ethiopian',
  'Filipino',
  'French',
  'German',
  'Greek',
  'Indian',
  'Italian',
  'Japanese',
  'Korean',
  'Mediterranean',
  'Mexican',
  'Middle Eastern',
  'Moroccan',
  'Spanish',
  'Thai',
  'Vietnamese',
] as const

/** Union type of valid cuisine strings, inferred from the constant array. */
export type Cuisine = (typeof CUISINES)[number]
