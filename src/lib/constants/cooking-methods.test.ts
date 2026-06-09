import { describe, expect, it } from 'vitest'
import { COOKING_METHODS } from './cooking-methods'

describe('COOKING_METHODS', () => {
  it('contains common cooking methods in display order', () => {
    expect(COOKING_METHODS.slice(0, 5)).toEqual([
      'Baked',
      'Boiled',
      'Braised',
      'Broiled',
      'Deep-Fried',
    ])
    expect(COOKING_METHODS).toContain('No-Cook')
    expect(COOKING_METHODS).toContain('Sous Vide')
  })

  it('does not contain duplicate labels', () => {
    expect(new Set(COOKING_METHODS).size).toBe(COOKING_METHODS.length)
  })
})
