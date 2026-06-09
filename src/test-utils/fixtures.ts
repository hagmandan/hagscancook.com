// src/test-utils/fixtures.ts
import type { RecipeFormValues } from '@/lib/schemas/recipe'

export const defaultTags = [
  { id: 'tag-1', name: 'Dinner' },
  { id: 'tag-2', name: 'Weeknight' },
]

export const defaultIngredientTypes = [
  { id: 'type-1', name: 'Produce' },
]

export const validRecipeForm: Partial<RecipeFormValues> = {
  title: 'Lemon Pasta',
  description: 'A bright weeknight pasta.',
  ingredients: [
    { ingredientName: 'pasta', quantity: '1', unit: 'lb', preparation: '', groupLabel: '', typeId: '' },
  ],
  steps: [{ content: 'Boil the pasta.' }],
}
