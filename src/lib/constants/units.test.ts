// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { UNITS, UNIT_VALUES, isKnownUnit, normalizeUnit } from './units'

describe('units constants', () => {
  it('has unique canonical values', () => {
    expect(new Set(UNIT_VALUES).size).toBe(UNIT_VALUES.length)
  })

  it('marks every count/misc unit as system-agnostic', () => {
    for (const u of UNITS.filter((x) => x.dimension === 'count')) {
      expect(u.system).toBeNull()
    }
  })
})

describe('isKnownUnit', () => {
  it('recognizes canonical values', () => {
    expect(isKnownUnit('cup')).toBe(true)
    expect(isKnownUnit('tbsp')).toBe(true)
  })

  it('rejects variants and junk', () => {
    expect(isKnownUnit('cups')).toBe(false)
    expect(isKnownUnit('knob')).toBe(false)
    expect(isKnownUnit('')).toBe(false)
    expect(isKnownUnit(null)).toBe(false)
    expect(isKnownUnit(undefined)).toBe(false)
  })
})

describe('normalizeUnit', () => {
  it('maps common plural/spelling variants to canonical values', () => {
    expect(normalizeUnit('cups')).toBe('cup')
    expect(normalizeUnit('tablespoons')).toBe('tbsp')
    expect(normalizeUnit('grams')).toBe('g')
    expect(normalizeUnit('cloves')).toBe('clove')
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(normalizeUnit('  Cups ')).toBe('cup')
    expect(normalizeUnit('TBSP')).toBe('tbsp')
  })

  it('honors case-sensitive aliases (T = tbsp, t = tsp)', () => {
    expect(normalizeUnit('T')).toBe('tbsp')
    expect(normalizeUnit('t')).toBe('tsp')
  })

  it('passes already-canonical values through unchanged', () => {
    expect(normalizeUnit('cup')).toBe('cup')
    expect(normalizeUnit('g')).toBe('g')
  })

  it('preserves unknown units rather than discarding them', () => {
    expect(normalizeUnit('knob')).toBe('knob')
  })

  it('returns null for empty/nullish input', () => {
    expect(normalizeUnit('')).toBeNull()
    expect(normalizeUnit('   ')).toBeNull()
    expect(normalizeUnit(null)).toBeNull()
    expect(normalizeUnit(undefined)).toBeNull()
  })
})
