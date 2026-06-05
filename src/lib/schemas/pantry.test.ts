// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { AddPantryItemSchema, UpdatePantryItemSchema, PANTRY_LIMITS } from './pantry'

describe('AddPantryItemSchema', () => {
  it('requires a non-empty ingredient name', () => {
    expect(AddPantryItemSchema.safeParse({ ingredientName: '' }).success).toBe(false)
    expect(AddPantryItemSchema.safeParse({ ingredientName: 'flour' }).success).toBe(true)
  })

  it('treats blank optional fields as undefined', () => {
    const parsed = AddPantryItemSchema.parse({
      ingredientName: 'flour',
      amount: '   ',
      unit: '',
      note: '  ',
      typeId: '',
    })
    expect(parsed.amount).toBeUndefined()
    expect(parsed.unit).toBeUndefined()
    expect(parsed.note).toBeUndefined()
    expect(parsed.typeId).toBeUndefined()
  })

  it('trims provided values', () => {
    const parsed = AddPantryItemSchema.parse({
      ingredientName: 'flour',
      amount: ' 2 ',
      unit: ' cup ',
    })
    expect(parsed.amount).toBe('2')
    expect(parsed.unit).toBe('cup')
  })

  it('rejects an over-length ingredient name', () => {
    const long = 'a'.repeat(PANTRY_LIMITS.INGREDIENT_NAME + 1)
    expect(AddPantryItemSchema.safeParse({ ingredientName: long }).success).toBe(false)
  })
})

describe('UpdatePantryItemSchema', () => {
  it('accepts an all-empty payload (clears fields)', () => {
    const parsed = UpdatePantryItemSchema.parse({ amount: '', unit: '', note: '' })
    expect(parsed.amount).toBeUndefined()
    expect(parsed.unit).toBeUndefined()
    expect(parsed.note).toBeUndefined()
  })

  it('rejects an over-length note', () => {
    const long = 'n'.repeat(PANTRY_LIMITS.NOTE + 1)
    expect(UpdatePantryItemSchema.safeParse({ note: long }).success).toBe(false)
  })
})
