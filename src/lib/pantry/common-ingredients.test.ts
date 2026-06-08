import { describe, expect, it } from 'vitest'
import { PANTRY_SECTIONS, sectionIdForTypeSlug } from './common-ingredients'

describe('sectionIdForTypeSlug', () => {
  it('maps produce slug to produce section', () => {
    expect(sectionIdForTypeSlug('produce')).toBe('produce')
  })

  it('maps poultry slug to meat-seafood section', () => {
    expect(sectionIdForTypeSlug('poultry')).toBe('meat-seafood')
  })

  it('maps cheese slug to dairy-eggs section', () => {
    expect(sectionIdForTypeSlug('cheese')).toBe('dairy-eggs')
  })

  it('returns undefined for unmapped slugs', () => {
    expect(sectionIdForTypeSlug('unknown')).toBeUndefined()
    expect(sectionIdForTypeSlug('other')).toBeUndefined()
  })
})

describe('PANTRY_SECTIONS', () => {
  it('has roughly 80 curated items', () => {
    const count = PANTRY_SECTIONS.reduce((n, s) => n + s.items.length, 0)
    expect(count).toBeGreaterThanOrEqual(75)
    expect(count).toBeLessThanOrEqual(90)
  })

  it('uses unique ingredient names across all sections', () => {
    const names = PANTRY_SECTIONS.flatMap((s) => s.items.map((i) => i.name))
    expect(new Set(names).size).toBe(names.length)
  })
})
