/**
 * Curated common pantry ingredients grouped by grocery-aisle sections.
 * Used for quick-add pills in the Categories view.
 *
 * Each section lives in its own file under ./sections/ for easy expansion.
 * `items`     — shown immediately as quick-add pills (kept to ~10 per section)
 * `moreItems` — shown in the expanded "More options" modal
 */

export type { PantryCommonItem, PantrySection } from './types'

import { PRODUCE_SECTION } from './sections/produce'
import { MEAT_SEAFOOD_SECTION } from './sections/meat-seafood'
import { DAIRY_EGGS_SECTION } from './sections/dairy-eggs'
import { SPICES_HERBS_SECTION } from './sections/spices-herbs'
import { GRAINS_PASTA_SECTION } from './sections/grains-pasta'
import { PANTRY_STAPLES_SECTION } from './sections/pantry-staples'
import { BAKING_SECTION } from './sections/baking'
import { BEVERAGES_SECTION } from './sections/beverages'
import { FROZEN_SECTION } from './sections/frozen'

export const PANTRY_SECTIONS = [
  PRODUCE_SECTION,
  MEAT_SEAFOOD_SECTION,
  DAIRY_EGGS_SECTION,
  SPICES_HERBS_SECTION,
  GRAINS_PASTA_SECTION,
  PANTRY_STAPLES_SECTION,
  BAKING_SECTION,
  BEVERAGES_SECTION,
  FROZEN_SECTION,
] as const

/** Resolve which aisle section an ingredient type slug belongs to. */
export function sectionIdForTypeSlug(typeSlug: string): string | undefined {
  for (const section of PANTRY_SECTIONS) {
    if ((section.typeSlugs as readonly string[]).includes(typeSlug)) return section.id
  }
  return undefined
}
