/**
 * Predefined cooking method options for the recipe form.
 * Stored as a text[] array on the Recipe model (cookingMethods field).
 * Users may also type custom values not in this list.
 */
export const COOKING_METHODS = [
  'Baked',
  'Boiled',
  'Braised',
  'Broiled',
  'Deep-Fried',
  'Fermented',
  'Fried',
  'Grilled',
  'No-Cook',
  'Pan-Seared',
  'Pickled',
  'Poached',
  'Pressure Cooked',
  'Raw',
  'Roasted',
  'Sautéed',
  'Smoked',
  'Steamed',
  'Stir-Fried',
  'Slow Cooked',
  'Air Fryer',
  'Instant Pot',
  'Sous Vide',
  'Wok',
] as const satisfies readonly string[]
