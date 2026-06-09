// src/test-utils/render-recipe-form.tsx
import { vi } from 'vitest'
import { render } from '@testing-library/react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useToast } from '@/lib/toast'
import { useTitleAvailability } from '@/lib/hooks/useTitleAvailability'
import { createRecipe, updateRecipe } from '@/lib/actions/recipes'
import { RecipeForm } from '@/components/recipe-form/RecipeForm'
import { defaultTags, defaultIngredientTypes } from './fixtures'
import type { RecipeFormValues } from '@/lib/schemas/recipe'

export type RenderRecipeFormOptions = {
  mode?: 'chef' | 'guided'
  initialValues?: Partial<RecipeFormValues>
  recipeId?: string
  coverImageStatus?: 'pending_approval' | 'approved' | 'rejected' | null
  tags?: { id: string; name: string }[]
  ingredientTypes?: { id: string; name: string }[]
}

export const mockPush = vi.fn()
export const mockToastError = vi.fn()

export function setupRecipeFormMocks(mode: 'chef' | 'guided' = 'chef') {
  vi.mocked(useSearchParams).mockReturnValue({
    get: vi.fn().mockReturnValue(mode === 'guided' ? 'guided' : null),
  } as never)
  vi.mocked(useRouter).mockReturnValue({ push: mockPush } as never)
  vi.mocked(usePathname).mockReturnValue('/recipes/new')
  vi.mocked(useToast).mockReturnValue({ error: mockToastError, success: vi.fn() } as never)
  vi.mocked(useTitleAvailability).mockReturnValue({ taken: false })
  vi.mocked(createRecipe).mockResolvedValue({ slug: 'test-slug' })
  vi.mocked(updateRecipe).mockResolvedValue({ slug: 'test-slug' })
}

export function renderRecipeForm({
  mode = 'chef',
  initialValues,
  recipeId,
  coverImageStatus,
  tags = defaultTags,
  ingredientTypes = defaultIngredientTypes,
}: RenderRecipeFormOptions = {}) {
  // mode is consumed by setupRecipeFormMocks; the component reads it from useSearchParams
  void mode
  return render(
    <RecipeForm
      tags={tags}
      ingredientTypes={ingredientTypes}
      initialValues={initialValues}
      recipeId={recipeId}
      coverImageStatus={coverImageStatus}
    />
  )
}
