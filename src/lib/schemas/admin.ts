import { z } from 'zod'

export const TagSchema = z.object({
  name: z.string().min(1).max(60),
})

export const IngredientTypeSchema = z.object({
  name: z.string().min(1).max(60),
})

export const IngredientSchema = z.object({
  name: z.string().min(1).max(120),
  typeId: z.string().uuid(),
})
