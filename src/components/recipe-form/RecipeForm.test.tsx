// src/components/recipe-form/RecipeForm.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { createRecipe, updateRecipe } from '@/lib/actions/recipes'
import { useToast } from '@/lib/toast'

// ── CSS module mocks ──────────────────────────────────────────────────────────
vi.mock('./RecipeForm.module.css', () => ({ default: {} }))
vi.mock('./FormHeader.module.css', () => ({ default: {} }))
vi.mock('./ChefMode.module.css', () => ({ default: {} }))
vi.mock('./GuidedMode.module.css', () => ({ default: {} }))
vi.mock('./IngredientsField.module.css', () => ({ default: {} }))
vi.mock('./StepsField.module.css', () => ({ default: {} }))
vi.mock('@/components/ui/MultiSelect.module.css', () => ({ default: {} }))
vi.mock('@/components/ui/UnitSelect.module.css', () => ({ default: {} }))
vi.mock('@/components/ui/CharCounter.module.css', () => ({ default: {} }))

// ── Next.js mocks ─────────────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

// ── Server action mocks ───────────────────────────────────────────────────────
vi.mock('@/lib/actions/recipes', () => ({
  createRecipe: vi.fn(),
  updateRecipe: vi.fn(),
}))

// ── Hook mocks ────────────────────────────────────────────────────────────────
vi.mock('@/lib/toast', () => ({
  useToast: vi.fn(),
}))

vi.mock('@/lib/hooks/useTitleAvailability', () => ({
  useTitleAvailability: vi.fn(() => ({ taken: false })),
}))

vi.mock('./useCoverUpload', () => ({
  useCoverUpload: vi.fn(() => ({
    isUploading: false,
    uploadError: null,
    fileInputRef: { current: null },
    handleCoverUpload: vi.fn(),
  })),
}))

// ── Third-party UI mocks ──────────────────────────────────────────────────────
vi.mock('react-select')
vi.mock('react-select/creatable')

vi.mock('@dnd-kit/core')
vi.mock('@dnd-kit/sortable')
vi.mock('@dnd-kit/utilities')

// ── Import component under test (after all vi.mock calls) ─────────────────────
import { RecipeForm } from './RecipeForm'
import { renderRecipeForm, setupRecipeFormMocks, mockPush, mockToastError } from '@/test-utils/render-recipe-form'
import { defaultTags, defaultIngredientTypes, validRecipeForm } from '@/test-utils/fixtures'

beforeEach(() => {
  vi.clearAllMocks()
  setupRecipeFormMocks()
})

describe('RecipeForm', () => {
  describe('mode rendering', () => {
    it('renders chef mode by default when no mode param', () => {
      renderRecipeForm()
      expect(screen.getByTestId('recipe-title')).toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'About' })).not.toBeInTheDocument()
    })

    it('renders guided mode when ?mode=guided', () => {
      vi.mocked(useSearchParams).mockReturnValue({ get: vi.fn().mockReturnValue('guided') } as never)
      renderRecipeForm()
      expect(screen.getByRole('tab', { name: 'About' })).toBeInTheDocument()
    })
  })

  describe('mode switch preserves form state', () => {
    it('retains typed values when switching from chef to guided', async () => {
      const user = userEvent.setup()
      const { rerender } = renderRecipeForm()

      await user.type(screen.getByTestId('recipe-title'), 'My Cake')

      vi.mocked(useSearchParams).mockReturnValue({ get: vi.fn().mockReturnValue('guided') } as never)
      rerender(
        <RecipeForm tags={defaultTags} ingredientTypes={defaultIngredientTypes} />
      )

      expect(screen.getByTestId('recipe-title')).toHaveValue('My Cake')
    })
  })

  describe('create flow', () => {
    it('calls createRecipe with publish=false and navigates to the returned slug', async () => {
      const user = userEvent.setup()
      renderRecipeForm({ initialValues: validRecipeForm })

      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(createRecipe).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Lemon Pasta' }),
          false
        )
        expect(updateRecipe).not.toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith('/recipes/test-slug')
      })
    })

    it('calls createRecipe with publish=true when Save and Publish clicked', async () => {
      const user = userEvent.setup()
      renderRecipeForm({ initialValues: validRecipeForm })

      await user.click(screen.getByRole('button', { name: 'Save and Publish' }))

      await waitFor(() => {
        expect(createRecipe).toHaveBeenCalledWith(expect.any(Object), true)
        expect(updateRecipe).not.toHaveBeenCalled()
      })
    })
  })

  describe('edit flow', () => {
    it('calls updateRecipe instead of createRecipe when recipeId is provided', async () => {
      const user = userEvent.setup()
      renderRecipeForm({ initialValues: validRecipeForm, recipeId: 'recipe-123' })

      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(updateRecipe).toHaveBeenCalledWith('recipe-123', expect.any(Object), false)
        expect(createRecipe).not.toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('shows error toast and does not navigate when action returns an error', async () => {
      vi.mocked(createRecipe).mockResolvedValue({ error: 'Something went wrong' })
      const user = userEvent.setup()
      renderRecipeForm({ initialValues: validRecipeForm })

      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Error', 'Something went wrong')
        expect(mockPush).not.toHaveBeenCalled()
      })
    })
  })

  describe('submit state', () => {
    it('disables the Save button while a submission is in flight', async () => {
      let resolveAction!: (v: { slug: string }) => void
      vi.mocked(createRecipe).mockReturnValue(
        new Promise((res) => { resolveAction = res })
      )
      const user = userEvent.setup()
      renderRecipeForm({ initialValues: validRecipeForm })

      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

      await act(async () => { resolveAction({ slug: 'test-slug' }) })
      await waitFor(() => expect(mockPush).toHaveBeenCalled())
    })
  })
})
