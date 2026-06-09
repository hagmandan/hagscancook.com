// src/components/recipe-form/RecipeForm.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { createRecipe, updateRecipe } from '@/lib/actions/recipes'
import { useToast } from '@/lib/toast'
import type { RecipeFormValues } from '@/lib/schemas/recipe'

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
vi.mock('react-select', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  type Option = { label: string; value: string }
  function MockSelect({ inputId, options, value, onChange, placeholder }: {
    inputId?: string; options: Option[]; value: Option[]; onChange: (v: Option[]) => void; placeholder?: string
    components?: unknown
  }) {
    return React.createElement('div', null,
      React.createElement('select', {
        'aria-label': inputId ?? 'multi-select', id: inputId, multiple: true,
        value: value.map((o) => o.value),
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
          const selected = Array.from(e.currentTarget.selectedOptions).map((o) => o.value)
          onChange(options.filter((o) => selected.includes(o.value)))
        },
      }, options.map((o) => React.createElement('option', { key: o.value, value: o.value }, o.label))),
      React.createElement('span', null, placeholder)
    )
  }
  return { default: MockSelect, components: { MultiValueLabel: ({ children }: { children: ReactNode }) => React.createElement(React.Fragment, null, children) } }
})

vi.mock('react-select/creatable', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  type Option = { label: string; value: string }
  function MockCreatable({ inputId, options, value, onChange, placeholder, formatCreateLabel }: {
    inputId?: string; options: Option[]; value: Option[]; onChange: (v: Option[]) => void; placeholder?: string; formatCreateLabel: (s: string) => string
  }) {
    const [input, setInput] = React.useState('')
    return React.createElement('div', null,
      React.createElement('select', {
        'aria-label': inputId ?? 'creatable-select', id: inputId, multiple: true,
        value: value.map((o) => o.value),
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
          const selected = Array.from(e.currentTarget.selectedOptions).map((o) => o.value)
          onChange(options.filter((o) => selected.includes(o.value)))
        },
      }, options.map((o) => React.createElement('option', { key: o.value, value: o.value }, o.label))),
      React.createElement('input', {
        'aria-label': `${inputId ?? 'creatable-select'} input`, value: input, placeholder,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.currentTarget.value),
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter' && input) { e.preventDefault(); onChange([...value, { label: input, value: input }]) }
        },
      }),
      React.createElement('span', null, input ? formatCreateLabel(input) : placeholder)
    )
  }
  return { default: MockCreatable }
})

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {}, listeners: {}, setNodeRef: vi.fn(),
    transform: null, transition: undefined, isDragging: false,
  })),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => undefined) } },
}))

// ── Import component under test (after all vi.mock calls) ─────────────────────
import { RecipeForm } from './RecipeForm'

// ── Shared test data ──────────────────────────────────────────────────────────
const defaultTags = [{ id: 'tag-1', name: 'Dinner' }]
const defaultIngredientTypes = [{ id: 'type-1', name: 'Produce' }]

const validForm: Partial<RecipeFormValues> = {
  title: 'Lemon Pasta',
  description: 'A bright weeknight pasta.',
  ingredients: [{ ingredientName: 'pasta', quantity: '1', unit: 'lb', preparation: '', groupLabel: '', typeId: '' }],
  steps: [{ content: 'Boil the pasta.' }],
}

const mockPush = vi.fn()
const mockToastError = vi.fn()

function renderForm(overrides: Partial<React.ComponentProps<typeof RecipeForm>> = {}) {
  return render(
    <RecipeForm
      tags={defaultTags}
      ingredientTypes={defaultIngredientTypes}
      {...overrides}
    />
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useSearchParams).mockReturnValue({ get: vi.fn().mockReturnValue(null) } as never)
  vi.mocked(useRouter).mockReturnValue({ push: mockPush } as never)
  vi.mocked(usePathname).mockReturnValue('/recipes/new')
  vi.mocked(useToast).mockReturnValue({ error: mockToastError, success: vi.fn() } as never)
  vi.mocked(createRecipe).mockResolvedValue({ slug: 'test-slug' })
  vi.mocked(updateRecipe).mockResolvedValue({ slug: 'test-slug' })
})

describe('RecipeForm', () => {
  describe('mode rendering', () => {
    it('renders chef mode by default when no mode param', () => {
      renderForm()
      expect(screen.getByTestId('recipe-title')).toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'About' })).not.toBeInTheDocument()
    })

    it('renders guided mode when ?mode=guided', () => {
      vi.mocked(useSearchParams).mockReturnValue({ get: vi.fn().mockReturnValue('guided') } as never)
      renderForm()
      expect(screen.getByRole('tab', { name: 'About' })).toBeInTheDocument()
    })
  })

  describe('mode switch preserves form state', () => {
    it('retains typed values when switching from chef to guided', async () => {
      const user = userEvent.setup()
      const { rerender } = renderForm()

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
      renderForm({ initialValues: validForm })

      await user.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(createRecipe).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Lemon Pasta' }),
          false
        )
        expect(mockPush).toHaveBeenCalledWith('/recipes/test-slug')
      })
    })

    it('calls createRecipe with publish=true when Save and Publish clicked', async () => {
      const user = userEvent.setup()
      renderForm({ initialValues: validForm })

      await user.click(screen.getByRole('button', { name: 'Save and Publish' }))

      await waitFor(() => {
        expect(createRecipe).toHaveBeenCalledWith(expect.any(Object), true)
      })
    })
  })

  describe('edit flow', () => {
    it('calls updateRecipe instead of createRecipe when recipeId is provided', async () => {
      const user = userEvent.setup()
      renderForm({ initialValues: validForm, recipeId: 'recipe-123' })

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
      renderForm({ initialValues: validForm })

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
      renderForm({ initialValues: validForm })

      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

      resolveAction({ slug: 'test-slug' })
      await waitFor(() => expect(mockPush).toHaveBeenCalled())
    })
  })
})
