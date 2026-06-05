/**
 * Canonical measurement units for recipe ingredients.
 *
 * Stored as a plain `text?` column on `recipe_ingredients` — same pattern as
 * `cuisine` on recipes. No DB enum or migration needed. The recipe form offers
 * these as a grouped <select>, with an "Other…" escape hatch for free-text, so
 * authoring is constrained-but-flexible: most rows use a canonical value, but
 * unusual units ("knob", "splash") are still allowed.
 *
 * Each unit carries `system` and `dimension` metadata so a future unit
 * converter / servings scaler can decide what is convertible. Count/misc units
 * (clove, can, pinch) have `dimension: 'count'` and are intentionally NOT
 * convertible.
 *
 * To add a unit: append to UNITS. To teach the normalizer a new spelling
 * variant (e.g. "tablespoons" → "tbsp"), add it to UNIT_ALIASES.
 */

export type UnitSystem = 'metric' | 'us'
export type UnitDimension = 'mass' | 'volume' | 'count'

export interface Unit {
  /** Canonical value persisted to the DB. */
  value: string
  /** Human-readable label shown in the dropdown. */
  label: string
  /** Measurement system, or null for system-agnostic count/misc units. */
  system: UnitSystem | null
  dimension: UnitDimension
}

export const UNITS = [
  // --- Mass ---
  { value: 'g', label: 'grams (g)', system: 'metric', dimension: 'mass' },
  { value: 'kg', label: 'kilograms (kg)', system: 'metric', dimension: 'mass' },
  { value: 'oz', label: 'ounces (oz)', system: 'us', dimension: 'mass' },
  { value: 'lb', label: 'pounds (lb)', system: 'us', dimension: 'mass' },

  // --- Volume ---
  { value: 'ml', label: 'milliliters (ml)', system: 'metric', dimension: 'volume' },
  { value: 'l', label: 'liters (l)', system: 'metric', dimension: 'volume' },
  { value: 'tsp', label: 'teaspoon (tsp)', system: 'us', dimension: 'volume' },
  { value: 'tbsp', label: 'tablespoon (tbsp)', system: 'us', dimension: 'volume' },
  { value: 'fl oz', label: 'fluid ounce (fl oz)', system: 'us', dimension: 'volume' },
  { value: 'cup', label: 'cup', system: 'us', dimension: 'volume' },
  { value: 'pt', label: 'pint (pt)', system: 'us', dimension: 'volume' },
  { value: 'qt', label: 'quart (qt)', system: 'us', dimension: 'volume' },
  { value: 'gal', label: 'gallon (gal)', system: 'us', dimension: 'volume' },

  // --- Count & misc (not convertible) ---
  { value: 'piece', label: 'piece', system: null, dimension: 'count' },
  { value: 'clove', label: 'clove', system: null, dimension: 'count' },
  { value: 'can', label: 'can', system: null, dimension: 'count' },
  { value: 'slice', label: 'slice', system: null, dimension: 'count' },
  { value: 'stick', label: 'stick', system: null, dimension: 'count' },
  { value: 'stalk', label: 'stalk', system: null, dimension: 'count' },
  { value: 'sprig', label: 'sprig', system: null, dimension: 'count' },
  { value: 'bunch', label: 'bunch', system: null, dimension: 'count' },
  { value: 'head', label: 'head', system: null, dimension: 'count' },
  { value: 'pinch', label: 'pinch', system: null, dimension: 'count' },
  { value: 'dash', label: 'dash', system: null, dimension: 'count' },
  { value: 'to taste', label: 'to taste', system: null, dimension: 'count' },
] as const satisfies readonly Unit[]

/** Canonical unit values, in dropdown order. */
export const UNIT_VALUES = UNITS.map((u) => u.value)

/** Dropdown groupings, in display order. */
export const UNIT_GROUPS: { label: string; dimension: UnitDimension }[] = [
  { label: 'Mass', dimension: 'mass' },
  { label: 'Volume', dimension: 'volume' },
  { label: 'Count & misc', dimension: 'count' },
]

const UNIT_VALUE_SET = new Set<string>(UNIT_VALUES)

/** True if `value` is a canonical unit (case-sensitive, as stored). */
export function isKnownUnit(value: string | null | undefined): boolean {
  return value != null && UNIT_VALUE_SET.has(value)
}

/**
 * Common free-text spellings → canonical value. Used by the one-time backfill
 * script (`prisma/normalize-units.ts`) and safe to reuse anywhere units arrive
 * as messy strings (e.g. imported recipes). Keys are matched case-insensitively
 * after trimming; see `normalizeUnit`.
 */
export const UNIT_ALIASES: Record<string, string> = {
  // mass
  gram: 'g', grams: 'g', gramme: 'g', grammes: 'g',
  kilogram: 'kg', kilograms: 'kg', kilo: 'kg', kilos: 'kg',
  ounce: 'oz', ounces: 'oz',
  pound: 'lb', pounds: 'lb', lbs: 'lb',
  // volume
  milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
  liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  teaspoon: 'tsp', teaspoons: 'tsp', tsps: 'tsp', t: 'tsp',
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsps: 'tbsp', tbs: 'tbsp', tbl: 'tbsp', T: 'tbsp',
  'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz', floz: 'fl oz',
  cups: 'cup', c: 'cup',
  pint: 'pt', pints: 'pt',
  quart: 'qt', quarts: 'qt',
  gallon: 'gal', gallons: 'gal',
  // count & misc
  pieces: 'piece', pcs: 'piece', pc: 'piece',
  cloves: 'clove',
  cans: 'can',
  slices: 'slice',
  sticks: 'stick',
  stalks: 'stalk',
  sprigs: 'sprig',
  bunches: 'bunch',
  heads: 'head',
  pinches: 'pinch',
  dashes: 'dash',
}

/**
 * Normalizes a free-text unit to its canonical value when recognized.
 * Returns the trimmed original string when no canonical mapping exists
 * (so unusual-but-valid units are preserved rather than discarded).
 */
export function normalizeUnit(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  if (trimmed === '') return null
  if (UNIT_VALUE_SET.has(trimmed)) return trimmed
  // Case-sensitive alias first (handles 'T' vs 't'), then case-insensitive.
  if (trimmed in UNIT_ALIASES) return UNIT_ALIASES[trimmed]
  const lower = trimmed.toLowerCase()
  if (lower in UNIT_ALIASES) return UNIT_ALIASES[lower]
  if (UNIT_VALUE_SET.has(lower)) return lower
  return trimmed
}
