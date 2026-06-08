import { describe, it, expect } from 'vitest'
import { parsePage } from './pagination'

describe('parsePage', () => {
  it('returns 1 for undefined', () => {
    expect(parsePage(undefined)).toBe(1)
  })

  it('returns 1 for a non-numeric string', () => {
    expect(parsePage('abc')).toBe(1)
  })

  it('returns 1 for zero', () => {
    expect(parsePage('0')).toBe(1)
  })

  it('returns 1 for negative numbers', () => {
    expect(parsePage('-3')).toBe(1)
  })

  it('parses valid page numbers', () => {
    expect(parsePage('1')).toBe(1)
    expect(parsePage('5')).toBe(5)
    expect(parsePage('100')).toBe(100)
  })
})
