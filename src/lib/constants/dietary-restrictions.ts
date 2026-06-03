/**
 * Predefined dietary restriction list for recipe classification.
 *
 * Multi-select on the recipe form. Stored as a PostgreSQL `text[]` array on
 * the `recipes` table — no junction table needed for MVP.
 *
 * To add a restriction: append to the array. No migration required.
 */

export const DIETARY_RESTRICTIONS = [
  'Dairy-Free',
  'Diabetic-Friendly',
  'Egg-Free',
  'Gluten-Free',
  'Halal',
  'Keto',
  'Kosher',
  'Low-Carb',
  'Low-Sodium',
  'Nut-Free',
  'Paleo',
  'Peanut-Free',
  'Pescatarian',
  'Raw',
  'Soy-Free',
  'Vegan',
  'Vegetarian',
  'Whole30',
] as const

/** Union type of valid dietary restriction strings, inferred from the constant array. */
export type DietaryRestriction = (typeof DIETARY_RESTRICTIONS)[number]
