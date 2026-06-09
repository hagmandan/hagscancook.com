# Recipe Form Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehensive integration tests for `RecipeForm`, `ChefMode`, and `GuidedMode` (currently 0% coverage), then extract shared test infrastructure that eliminates duplication across all recipe-form and UI tests.

**Architecture:** Three integration-style test files render `RecipeForm` as a whole, mocking only external I/O (server actions, Next.js router, hooks with network calls, third-party UI libs). Phase C extracts the repeated mock boilerplate into a root-level `__mocks__/` directory (for node_modules) and `src/test-utils/` (for render helpers and fixtures).

**Tech Stack:** Vitest 4, React Testing Library 16, `@testing-library/user-event` 14, React Hook Form 7, Zod 4, Next.js 16 App Router.

---

## File Map

**Phase A — create:**
- `src/components/recipe-form/RecipeForm.test.tsx`
- `src/components/recipe-form/ChefMode.test.tsx`
- `src/components/recipe-form/GuidedMode.test.tsx`

**Phase C — create:**
- `__mocks__/react-select.tsx`
- `__mocks__/react-select/creatable.tsx`
- `__mocks__/@dnd-kit/core.ts`
- `__mocks__/@dnd-kit/sortable.ts`
- `__mocks__/@dnd-kit/utilities.ts`
- `src/test-utils/fixtures.ts`
- `src/test-utils/render-recipe-form.tsx`

**Phase C — modify:**
- `src/components/ui/MultiSelect.test.tsx` — replace inline react-select factory with `vi.mock('react-select')` (no factory)
- `src/components/recipe-form/IngredientsField.test.tsx` — replace inline dnd-kit factories with `vi.mock('@dnd-kit/...')` (no factory)
- `src/components/recipe-form/RecipeForm.test.tsx` — use `renderRecipeForm` helper
- `src/components/recipe-form/ChefMode.test.tsx` — use `renderRecipeForm` helper
- `src/components/recipe-form/GuidedMode.test.tsx` — use `renderRecipeForm` helper

---

## Task 1: RecipeForm.test.tsx — orchestration tests

Tests mode switching, form state persistence across mode switches, create/edit submit wiring, error toast, and disabled state during in-flight requests.

**Files:**
- Create: `src/components/recipe-form/RecipeForm.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// src/components/recipe-form/RecipeForm.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createRecipe, updateRecipe } from '@/lib/actions/recipes'
import { useToast } from '@/lib/toast'
import type { RecipeFormValues } from '@/lib/schemas/recipe'

// ── CSS module mocks ──────────────────────────────────────────────────────────
const css = () => ({ default: {} })
vi.mock('./RecipeForm.module.css', css)
vi.mock('./FormHeader.module.css', css)
vi.mock('./ChefMode.module.css', css)
vi.mock('./GuidedMode.module.css', css)
vi.mock('./IngredientsField.module.css', css)
vi.mock('./StepsField.module.css', css)
vi.mock('@/components/ui/MultiSelect.module.css', css)
vi.mock('@/components/ui/UnitSelect.module.css', css)
vi.mock('@/components/ui/CharCounter.module.css', css)

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
  vi.mocked(usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/recipes/new')
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
```

- [ ] **Step 2: Run the tests and verify they pass**

```bash
yarn test src/components/recipe-form/RecipeForm.test.tsx
```

Expected: all tests pass. If a CSS module import causes a failure (e.g. `Unknown file extension`), add a `vi.mock` line for that module following the same `css` factory pattern.

- [ ] **Step 3: Commit**

```bash
git add src/components/recipe-form/RecipeForm.test.tsx
git commit -m "test: add RecipeForm integration tests (orchestration)"
```

---

## Task 2: ChefMode.test.tsx — chef mode field tests

Tests every field section in the ChefMode layout: title, description, timing, cuisine, difficulty, dietary, cook style, tags, sidebar toggle, cover consent, cover status banners, and the title-taken warning.

**Files:**
- Create: `src/components/recipe-form/ChefMode.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// src/components/recipe-form/ChefMode.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useToast } from '@/lib/toast'
import { useTitleAvailability } from '@/lib/hooks/useTitleAvailability'

// ── CSS module mocks ──────────────────────────────────────────────────────────
const css = () => ({ default: {} })
vi.mock('./RecipeForm.module.css', css)
vi.mock('./FormHeader.module.css', css)
vi.mock('./ChefMode.module.css', css)
vi.mock('./IngredientsField.module.css', css)
vi.mock('./StepsField.module.css', css)
vi.mock('@/components/ui/MultiSelect.module.css', css)
vi.mock('@/components/ui/UnitSelect.module.css', css)
vi.mock('@/components/ui/CharCounter.module.css', css)

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
    inputId?: string; options: Option[]; value: Option[]; onChange: (v: Option[]) => void; placeholder?: string; components?: unknown
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
  closestCenter: vi.fn(), KeyboardSensor: vi.fn(), PointerSensor: vi.fn(),
  useSensor: vi.fn(), useSensors: vi.fn(() => []),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(), verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null, transition: undefined, isDragging: false })),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => undefined) } },
}))

import { RecipeForm } from './RecipeForm'

const defaultTags = [{ id: 'tag-1', name: 'Dinner' }, { id: 'tag-2', name: 'Weeknight' }]
const defaultIngredientTypes = [{ id: 'type-1', name: 'Produce' }]

function renderChefMode(overrides: Partial<React.ComponentProps<typeof RecipeForm>> = {}) {
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
  // chef mode: get('mode') returns null → defaults to 'chef'
  vi.mocked(useSearchParams).mockReturnValue({ get: vi.fn().mockReturnValue(null) } as never)
  vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as never)
  vi.mocked(usePathname).mockReturnValue('/recipes/new')
  vi.mocked(useToast).mockReturnValue({ error: vi.fn(), success: vi.fn() } as never)
  vi.mocked(useTitleAvailability).mockReturnValue({ taken: false })
})

describe('ChefMode', () => {
  describe('title field', () => {
    it('renders the title input', () => {
      renderChefMode()
      expect(screen.getByTestId('recipe-title')).toBeInTheDocument()
    })

    it('updates the char counter as the user types', async () => {
      const user = userEvent.setup()
      renderChefMode()
      await user.type(screen.getByTestId('recipe-title'), 'Tacos')
      expect(screen.getByText(/5\s*\/\s*\d+/)).toBeInTheDocument()
    })

    it('shows a validation error when title is empty on submit', async () => {
      const user = userEvent.setup()
      renderChefMode()
      await user.click(screen.getByRole('button', { name: 'Save' }))
      expect(await screen.findByText('Title is required')).toBeInTheDocument()
    })

    it('shows a duplicate-title warning when useTitleAvailability returns taken=true', () => {
      vi.mocked(useTitleAvailability).mockReturnValue({ taken: true })
      renderChefMode({ initialValues: { title: 'Existing Recipe' } })
      expect(screen.getByText(/Another recipe with this title exists/)).toBeInTheDocument()
    })
  })

  describe('description field', () => {
    it('renders the description textarea', () => {
      renderChefMode()
      expect(screen.getByTestId('recipe-description')).toBeInTheDocument()
    })

    it('updates the char counter as the user types', async () => {
      const user = userEvent.setup()
      renderChefMode()
      await user.type(screen.getByTestId('recipe-description'), 'Hello')
      expect(screen.getAllByText(/5\s*\/\s*\d+/)[0]).toBeInTheDocument()
    })
  })

  describe('timing fields', () => {
    it('renders prep, cook, and servings inputs', () => {
      renderChefMode()
      expect(screen.getByLabelText('Prep')).toBeInTheDocument()
      expect(screen.getByLabelText('Cook')).toBeInTheDocument()
      expect(screen.getByLabelText('Serves')).toBeInTheDocument()
    })
  })

  describe('cuisine select', () => {
    it('renders the cuisine dropdown', () => {
      renderChefMode()
      expect(screen.getByLabelText('Cuisine')).toBeInTheDocument()
    })

    it('updates the form when a cuisine is selected', async () => {
      const user = userEvent.setup()
      renderChefMode()
      await user.selectOptions(screen.getByLabelText('Cuisine'), 'Italian')
      expect(screen.getByLabelText('Cuisine')).toHaveValue('Italian')
    })
  })

  describe('difficulty select', () => {
    it('renders Easy, Medium, and Advanced options', () => {
      renderChefMode()
      const select = screen.getByLabelText('Difficulty')
      expect(select).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Easy' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Medium' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Advanced' })).toBeInTheDocument()
    })

    it('updates the form when a difficulty is selected', async () => {
      const user = userEvent.setup()
      renderChefMode()
      await user.selectOptions(screen.getByLabelText('Difficulty'), 'Easy')
      expect(screen.getByLabelText('Difficulty')).toHaveValue('Easy')
    })
  })

  describe('dietary multi-select', () => {
    it('renders the dietary restrictions select', () => {
      renderChefMode()
      expect(screen.getByRole('listbox', { name: 'dietary' })).toBeInTheDocument()
    })

    it('updates the form when a dietary restriction is selected', async () => {
      const user = userEvent.setup()
      renderChefMode()
      await user.selectOptions(screen.getByRole('listbox', { name: 'dietary' }), 'Vegetarian')
      expect(screen.getByRole('listbox', { name: 'dietary' })).toHaveValue(['Vegetarian'])
    })
  })

  describe('cook style creatable multi-select', () => {
    it('renders the cook style select', () => {
      renderChefMode()
      expect(screen.getByRole('listbox', { name: 'cookingMethods' })).toBeInTheDocument()
    })

    it('adds a custom cook style value on Enter', async () => {
      const user = userEvent.setup()
      renderChefMode()
      await user.type(screen.getByRole('textbox', { name: 'cookingMethods input' }), 'Slow-cooked')
      await user.keyboard('{Enter}')
      expect(screen.getByRole('listbox', { name: 'cookingMethods' })).toHaveValue(['Slow-cooked'])
    })
  })

  describe('tags multi-select', () => {
    it('renders the tags select when tags are provided', () => {
      renderChefMode()
      expect(screen.getByRole('listbox', { name: 'tags' })).toBeInTheDocument()
    })

    it('does not render the tags select when no tags are provided', () => {
      renderChefMode({ tags: [] })
      expect(screen.queryByRole('listbox', { name: 'tags' })).not.toBeInTheDocument()
    })
  })

  describe('sidebar toggle (mobile)', () => {
    it('starts collapsed', () => {
      renderChefMode()
      expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'false')
    })

    it('expands on click', async () => {
      const user = userEvent.setup()
      renderChefMode()
      await user.click(screen.getByRole('button', { name: 'Details' }))
      expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('cover photo consent', () => {
    it('disables the upload button until the consent checkbox is checked', async () => {
      const user = userEvent.setup()
      renderChefMode()
      expect(screen.getByRole('button', { name: /upload photo/i })).toBeDisabled()
      await user.click(screen.getByRole('checkbox', { name: /I confirm/i }))
      expect(screen.getByRole('button', { name: /upload photo/i })).toBeEnabled()
    })
  })

  describe('cover image status banners', () => {
    it('shows a pending-approval message', () => {
      renderChefMode({ coverImageStatus: 'pending_approval' })
      expect(screen.getByText(/Image under review/)).toBeInTheDocument()
    })

    it('shows a rejection message', () => {
      renderChefMode({ coverImageStatus: 'rejected' })
      expect(screen.getByText(/Image rejected/)).toBeInTheDocument()
    })
  })

  describe('ingredients and steps sections', () => {
    it('renders the Ingredients section heading', () => {
      renderChefMode()
      expect(screen.getByRole('heading', { name: 'Ingredients' })).toBeInTheDocument()
    })

    it('renders the Steps section heading', () => {
      renderChefMode()
      expect(screen.getByRole('heading', { name: 'Steps' })).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run the tests and verify they pass**

```bash
yarn test src/components/recipe-form/ChefMode.test.tsx
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/recipe-form/ChefMode.test.tsx
git commit -m "test: add ChefMode integration tests"
```

---

## Task 3: GuidedMode.test.tsx — guided mode wizard tests

Tests the tabbed wizard: tab activation, progress bar, Next/Back navigation, all tab panel contents, and the live preview tab.

**Files:**
- Create: `src/components/recipe-form/GuidedMode.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// src/components/recipe-form/GuidedMode.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useToast } from '@/lib/toast'
import { useTitleAvailability } from '@/lib/hooks/useTitleAvailability'

// ── CSS module mocks ──────────────────────────────────────────────────────────
const css = () => ({ default: {} })
vi.mock('./RecipeForm.module.css', css)
vi.mock('./FormHeader.module.css', css)
vi.mock('./GuidedMode.module.css', css)
vi.mock('./IngredientsField.module.css', css)
vi.mock('./StepsField.module.css', css)
vi.mock('@/components/ui/MultiSelect.module.css', css)
vi.mock('@/components/ui/UnitSelect.module.css', css)
vi.mock('@/components/ui/CharCounter.module.css', css)

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
    isUploading: false, uploadError: null,
    fileInputRef: { current: null }, handleCoverUpload: vi.fn(),
  })),
}))

// ── Third-party UI mocks ──────────────────────────────────────────────────────
vi.mock('react-select', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  type Option = { label: string; value: string }
  function MockSelect({ inputId, options, value, onChange, placeholder }: {
    inputId?: string; options: Option[]; value: Option[]; onChange: (v: Option[]) => void; placeholder?: string; components?: unknown
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
  closestCenter: vi.fn(), KeyboardSensor: vi.fn(), PointerSensor: vi.fn(),
  useSensor: vi.fn(), useSensors: vi.fn(() => []),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(), verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null, transition: undefined, isDragging: false })),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => undefined) } },
}))

import { RecipeForm } from './RecipeForm'

const defaultTags = [{ id: 'tag-1', name: 'Dinner' }]
const defaultIngredientTypes = [{ id: 'type-1', name: 'Produce' }]

function renderGuidedMode(overrides: Partial<React.ComponentProps<typeof RecipeForm>> = {}) {
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
  // guided mode: get('mode') returns 'guided'
  vi.mocked(useSearchParams).mockReturnValue({ get: vi.fn().mockReturnValue('guided') } as never)
  vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as never)
  vi.mocked(usePathname).mockReturnValue('/recipes/new')
  vi.mocked(useToast).mockReturnValue({ error: vi.fn(), success: vi.fn() } as never)
  vi.mocked(useTitleAvailability).mockReturnValue({ taken: false })
})

describe('GuidedMode', () => {
  describe('initial state', () => {
    it('activates the About tab by default', () => {
      renderGuidedMode()
      expect(screen.getByRole('tab', { name: 'About' })).toHaveAttribute('aria-selected', 'true')
    })

    it('shows 20% progress on the first tab', () => {
      renderGuidedMode()
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20')
    })
  })

  describe('tab navigation', () => {
    it('activates a tab and updates the progress bar when clicked', async () => {
      const user = userEvent.setup()
      renderGuidedMode()

      await user.click(screen.getByRole('tab', { name: 'Details' }))

      expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40')
    })

    it('advances through all five tabs', async () => {
      const user = userEvent.setup()
      renderGuidedMode()

      for (const [label, progress] of [['Details', '40'], ['Ingredients', '60'], ['Steps', '80'], ['Preview', '100']] as const) {
        await user.click(screen.getByRole('tab', { name: label }))
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', progress)
      }
    })
  })

  describe('Next / Back navigation buttons', () => {
    it('shows "Details →" and no Back on the first tab', () => {
      renderGuidedMode()
      expect(screen.getByRole('button', { name: 'Details →' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /←/ })).not.toBeInTheDocument()
    })

    it('advances to the next tab when Next is clicked', async () => {
      const user = userEvent.setup()
      renderGuidedMode()
      await user.click(screen.getByRole('button', { name: 'Details →' }))
      expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true')
    })

    it('returns to the previous tab when Back is clicked', async () => {
      const user = userEvent.setup()
      renderGuidedMode()
      await user.click(screen.getByRole('tab', { name: 'Details' }))
      await user.click(screen.getByRole('button', { name: '← About' }))
      expect(screen.getByRole('tab', { name: 'About' })).toHaveAttribute('aria-selected', 'true')
    })

    it('shows "← Steps" and no Next on the last tab', async () => {
      const user = userEvent.setup()
      renderGuidedMode()
      await user.click(screen.getByRole('tab', { name: 'Preview' }))
      expect(screen.getByRole('button', { name: '← Steps' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /→/ })).not.toBeInTheDocument()
    })
  })

  describe('About tab', () => {
    it('renders title input and description textarea', () => {
      renderGuidedMode()
      expect(screen.getByTestId('recipe-title')).toBeInTheDocument()
      expect(screen.getByTestId('recipe-description')).toBeInTheDocument()
    })

    it('updates the char counter as the title is typed', async () => {
      const user = userEvent.setup()
      renderGuidedMode()
      await user.type(screen.getByTestId('recipe-title'), 'Soup')
      expect(screen.getByText(/4\s*\/\s*\d+/)).toBeInTheDocument()
    })

    it('shows a validation error when title is empty on submit', async () => {
      const user = userEvent.setup()
      renderGuidedMode()
      await user.click(screen.getByRole('button', { name: 'Save' }))
      expect(await screen.findByText('Title is required')).toBeInTheDocument()
    })

    it('shows a duplicate-title warning when useTitleAvailability returns taken=true', () => {
      vi.mocked(useTitleAvailability).mockReturnValue({ taken: true })
      renderGuidedMode({ initialValues: { title: 'Existing Recipe' } })
      expect(screen.getByText(/Another recipe with this title exists/)).toBeInTheDocument()
    })

    it('disables the upload button until consent is checked', async () => {
      const user = userEvent.setup()
      renderGuidedMode()
      expect(screen.getByRole('button', { name: /upload photo/i })).toBeDisabled()
      await user.click(screen.getByRole('checkbox', { name: /I confirm/i }))
      expect(screen.getByRole('button', { name: /upload photo/i })).toBeEnabled()
    })

    it('shows pending-approval banner when coverImageStatus is pending_approval', () => {
      renderGuidedMode({ coverImageStatus: 'pending_approval' })
      expect(screen.getByText(/Image under review/)).toBeInTheDocument()
    })

    it('shows rejection banner when coverImageStatus is rejected', () => {
      renderGuidedMode({ coverImageStatus: 'rejected' })
      expect(screen.getByText(/Image rejected/)).toBeInTheDocument()
    })
  })

  describe('Details tab', () => {
    beforeEach(async () => {
      renderGuidedMode()
      await userEvent.setup().click(screen.getByRole('tab', { name: 'Details' }))
    })

    it('renders prep, cook, and servings inputs', () => {
      expect(screen.getByLabelText('Prep (min)')).toBeInTheDocument()
      expect(screen.getByLabelText('Cook (min)')).toBeInTheDocument()
      expect(screen.getByLabelText('Serves')).toBeInTheDocument()
    })

    it('renders cuisine and difficulty dropdowns', () => {
      expect(screen.getByLabelText('Cuisine')).toBeInTheDocument()
      expect(screen.getByLabelText('Difficulty')).toBeInTheDocument()
    })

    it('renders dietary and cook style multi-selects', () => {
      expect(screen.getByRole('listbox', { name: 'g-dietary' })).toBeInTheDocument()
      expect(screen.getByRole('listbox', { name: 'g-cookingMethods' })).toBeInTheDocument()
    })

    it('renders the tags multi-select when tags are provided', () => {
      expect(screen.getByRole('listbox', { name: 'g-tags' })).toBeInTheDocument()
    })
  })

  describe('Ingredients tab', () => {
    it('renders the IngredientsField when the Ingredients tab is active', async () => {
      const user = userEvent.setup()
      renderGuidedMode()
      await user.click(screen.getByRole('tab', { name: 'Ingredients' }))
      expect(screen.getByText(/Add your ingredients/)).toBeInTheDocument()
    })
  })

  describe('Steps tab', () => {
    it('renders the StepsField when the Steps tab is active', async () => {
      const user = userEvent.setup()
      renderGuidedMode()
      await user.click(screen.getByRole('tab', { name: 'Steps' }))
      expect(screen.getByText(/Walk cooks through each step/)).toBeInTheDocument()
    })
  })

  describe('Preview tab', () => {
    it('shows "Untitled recipe" when title is blank', async () => {
      const user = userEvent.setup()
      renderGuidedMode()
      await user.click(screen.getByRole('tab', { name: 'Preview' }))
      expect(screen.getByText('Untitled recipe')).toBeInTheDocument()
    })

    it('reflects the live title, description, and timing from earlier tabs', async () => {
      const user = userEvent.setup()
      renderGuidedMode({
        initialValues: {
          title: 'My Soup',
          description: 'A warming bowl.',
          prepTimeMins: '10',
          cookTimeMins: '20',
          servings: '2',
        },
      })
      await user.click(screen.getByRole('tab', { name: 'Preview' }))
      expect(screen.getByText('My Soup')).toBeInTheDocument()
      expect(screen.getByText('A warming bowl.')).toBeInTheDocument()
      expect(screen.getByText('30 min')).toBeInTheDocument()
      expect(screen.getByText('Serves 2')).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run the tests and verify they pass**

```bash
yarn test src/components/recipe-form/GuidedMode.test.tsx
```

Expected: all tests pass.

- [ ] **Step 3: Run the full test suite to confirm no regressions**

```bash
yarn test
```

Expected: all 37+ test files pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/recipe-form/GuidedMode.test.tsx
git commit -m "test: add GuidedMode integration tests"
```

---

## Task 4: Extract react-select mocks to `__mocks__/`

Removes the duplicated 50-line react-select factory from all three recipe-form test files and `MultiSelect.test.tsx`, replacing each with a one-liner `vi.mock('react-select')`.

**Files:**
- Create: `__mocks__/react-select.tsx`
- Create: `__mocks__/react-select/creatable.tsx`
- Modify: `src/components/ui/MultiSelect.test.tsx`
- Modify: `src/components/recipe-form/RecipeForm.test.tsx`
- Modify: `src/components/recipe-form/ChefMode.test.tsx`
- Modify: `src/components/recipe-form/GuidedMode.test.tsx`

- [ ] **Step 1: Create `__mocks__/react-select.tsx`**

```tsx
// __mocks__/react-select.tsx
import React from 'react'
import type { ReactNode } from 'react'

type Option = { label: string; value: string }

function MultiValueLabel({ children }: { children: ReactNode }) {
  return React.createElement(React.Fragment, null, children)
}

function MockSelect({ inputId, options, value, onChange, placeholder }: {
  inputId?: string
  options: Option[]
  value: Option[]
  onChange: (v: Option[]) => void
  placeholder?: string
  components?: unknown
}) {
  return React.createElement(
    'div',
    null,
    React.createElement(
      'select',
      {
        'aria-label': inputId ?? 'multi-select',
        id: inputId,
        multiple: true,
        value: value.map((o) => o.value),
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
          const selected = Array.from(e.currentTarget.selectedOptions).map((o) => o.value)
          onChange(options.filter((o) => selected.includes(o.value)))
        },
      },
      options.map((o) => React.createElement('option', { key: o.value, value: o.value }, o.label))
    ),
    React.createElement('span', null, placeholder)
  )
}

export default MockSelect
export const components = { MultiValueLabel }
```

- [ ] **Step 2: Create `__mocks__/react-select/creatable.tsx`**

```tsx
// __mocks__/react-select/creatable.tsx
import React from 'react'

type Option = { label: string; value: string }

function MockCreatableSelect({ inputId, options, value, onChange, placeholder, formatCreateLabel }: {
  inputId?: string
  options: Option[]
  value: Option[]
  onChange: (v: Option[]) => void
  placeholder?: string
  formatCreateLabel: (input: string) => string
}) {
  const [inputValue, setInputValue] = React.useState('')
  const createLabel = inputValue ? formatCreateLabel(inputValue) : placeholder

  return React.createElement(
    'div',
    null,
    React.createElement(
      'select',
      {
        'aria-label': inputId ?? 'creatable-select',
        id: inputId,
        multiple: true,
        value: value.map((o) => o.value),
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
          const selected = Array.from(e.currentTarget.selectedOptions).map((o) => o.value)
          onChange(options.filter((o) => selected.includes(o.value)))
        },
      },
      options.map((o) => React.createElement('option', { key: o.value, value: o.value }, o.label))
    ),
    React.createElement('input', {
      'aria-label': `${inputId ?? 'creatable-select'} input`,
      value: inputValue,
      placeholder,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.currentTarget.value),
      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue) {
          e.preventDefault()
          onChange([...value, { label: inputValue, value: inputValue }])
        }
      },
    }),
    React.createElement('span', null, createLabel)
  )
}

export default MockCreatableSelect
```

- [ ] **Step 3: Replace the inline react-select factory in `MultiSelect.test.tsx`**

In `src/components/ui/MultiSelect.test.tsx`, remove the two large `vi.mock('react-select', async () => { ... })` and `vi.mock('react-select/creatable', async () => { ... })` blocks and replace them with:

```ts
vi.mock('react-select')
vi.mock('react-select/creatable')
```

- [ ] **Step 4: Replace the inline react-select factories in the three recipe-form test files**

In each of `RecipeForm.test.tsx`, `ChefMode.test.tsx`, and `GuidedMode.test.tsx`, remove the two `vi.mock('react-select', async () => { ... })` and `vi.mock('react-select/creatable', async () => { ... })` blocks and replace each pair with:

```ts
vi.mock('react-select')
vi.mock('react-select/creatable')
```

- [ ] **Step 5: Run the full test suite to confirm nothing broke**

```bash
yarn test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add __mocks__/react-select.tsx "__mocks__/react-select/creatable.tsx" \
  src/components/ui/MultiSelect.test.tsx \
  src/components/recipe-form/RecipeForm.test.tsx \
  src/components/recipe-form/ChefMode.test.tsx \
  src/components/recipe-form/GuidedMode.test.tsx
git commit -m "test: extract react-select mock to __mocks__"
```

---

## Task 5: Extract dnd-kit mocks to `__mocks__/`

Removes the duplicated dnd-kit factories from `IngredientsField.test.tsx` and all three recipe-form test files.

**Files:**
- Create: `__mocks__/@dnd-kit/core.ts`
- Create: `__mocks__/@dnd-kit/sortable.ts`
- Create: `__mocks__/@dnd-kit/utilities.ts`
- Modify: `src/components/recipe-form/IngredientsField.test.tsx`
- Modify: `src/components/recipe-form/RecipeForm.test.tsx`
- Modify: `src/components/recipe-form/ChefMode.test.tsx`
- Modify: `src/components/recipe-form/GuidedMode.test.tsx`

- [ ] **Step 1: Create `__mocks__/@dnd-kit/core.ts`**

```ts
// __mocks__/@dnd-kit/core.ts
import { vi } from 'vitest'
import type { ReactNode } from 'react'
import React from 'react'

export const DndContext = ({ children }: { children: ReactNode }) => React.createElement(React.Fragment, null, children)
export const closestCenter = vi.fn()
export const KeyboardSensor = vi.fn()
export const PointerSensor = vi.fn()
export const useSensor = vi.fn()
export const useSensors = vi.fn(() => [])
```

- [ ] **Step 2: Create `__mocks__/@dnd-kit/sortable.ts`**

```ts
// __mocks__/@dnd-kit/sortable.ts
import { vi } from 'vitest'
import type { ReactNode } from 'react'
import React from 'react'

export const SortableContext = ({ children }: { children: ReactNode }) => React.createElement(React.Fragment, null, children)
export const sortableKeyboardCoordinates = vi.fn()
export const verticalListSortingStrategy = vi.fn()
export const useSortable = vi.fn(() => ({
  attributes: {},
  listeners: {},
  setNodeRef: vi.fn(),
  transform: null,
  transition: undefined,
  isDragging: false,
}))
```

- [ ] **Step 3: Create `__mocks__/@dnd-kit/utilities.ts`**

```ts
// __mocks__/@dnd-kit/utilities.ts
import { vi } from 'vitest'

export const CSS = {
  Transform: { toString: vi.fn(() => undefined) },
}
```

- [ ] **Step 4: Replace inline dnd-kit factories in `IngredientsField.test.tsx`**

In `src/components/recipe-form/IngredientsField.test.tsx`, remove the three `vi.mock('@dnd-kit/...', () => { ... })` blocks and replace them with:

```ts
vi.mock('@dnd-kit/core')
vi.mock('@dnd-kit/sortable')
vi.mock('@dnd-kit/utilities')
```

- [ ] **Step 5: Replace inline dnd-kit factories in the three recipe-form test files**

In each of `RecipeForm.test.tsx`, `ChefMode.test.tsx`, and `GuidedMode.test.tsx`, remove the three `vi.mock('@dnd-kit/...', () => { ... })` blocks and replace them with:

```ts
vi.mock('@dnd-kit/core')
vi.mock('@dnd-kit/sortable')
vi.mock('@dnd-kit/utilities')
```

- [ ] **Step 6: Run the full test suite**

```bash
yarn test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add "__mocks__/@dnd-kit/core.ts" "__mocks__/@dnd-kit/sortable.ts" "__mocks__/@dnd-kit/utilities.ts" \
  src/components/recipe-form/IngredientsField.test.tsx \
  src/components/recipe-form/RecipeForm.test.tsx \
  src/components/recipe-form/ChefMode.test.tsx \
  src/components/recipe-form/GuidedMode.test.tsx
git commit -m "test: extract dnd-kit mocks to __mocks__"
```

---

## Task 6: Create shared fixtures and `renderRecipeForm` helper

Extracts the repeated render boilerplate and test fixtures into `src/test-utils/`, then updates all three recipe-form test files to use them.

**Files:**
- Create: `src/test-utils/fixtures.ts`
- Create: `src/test-utils/render-recipe-form.tsx`
- Modify: `src/components/recipe-form/RecipeForm.test.tsx`
- Modify: `src/components/recipe-form/ChefMode.test.tsx`
- Modify: `src/components/recipe-form/GuidedMode.test.tsx`

- [ ] **Step 1: Create `src/test-utils/fixtures.ts`**

```ts
// src/test-utils/fixtures.ts
import type { RecipeFormValues } from '@/lib/schemas/recipe'

export const defaultTags = [
  { id: 'tag-1', name: 'Dinner' },
  { id: 'tag-2', name: 'Weeknight' },
]

export const defaultIngredientTypes = [
  { id: 'type-1', name: 'Produce' },
]

export const validRecipeForm: RecipeFormValues = {
  title: 'Lemon Pasta',
  description: 'A bright weeknight pasta.',
  coverImageUrl: '',
  prepTimeMins: '15',
  cookTimeMins: '20',
  servings: '4',
  cuisine: 'Italian',
  difficulty: 'Easy',
  dietaryRestrictions: ['Vegetarian'],
  cookingMethods: ['Boil'],
  tagIds: ['tag-1'],
  ingredients: [
    { ingredientName: 'pasta', quantity: '1', unit: 'lb', preparation: '', groupLabel: '', typeId: '' },
  ],
  steps: [{ content: 'Boil the pasta.' }],
}
```

- [ ] **Step 2: Create `src/test-utils/render-recipe-form.tsx`**

```tsx
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
```

- [ ] **Step 3: Update `RecipeForm.test.tsx` to use the shared helper**

In `src/components/recipe-form/RecipeForm.test.tsx`:

1. Add imports at the top:
```ts
import { renderRecipeForm, setupRecipeFormMocks, mockPush, mockToastError } from '@/test-utils/render-recipe-form'
import { validRecipeForm } from '@/test-utils/fixtures'
```

2. Replace the inline `renderForm` function and `beforeEach` setup block:
```ts
// Remove the local renderForm function and the local mockPush/mockToastError consts

beforeEach(() => {
  vi.clearAllMocks()
  setupRecipeFormMocks()
})
```

3. Replace every call to `renderForm(...)` with `renderRecipeForm(...)`.

4. Remove the local `defaultTags`, `defaultIngredientTypes`, `validForm`, `mockPush`, and `mockToastError` declarations (now imported).

- [ ] **Step 4: Update `ChefMode.test.tsx` to use the shared helper**

In `src/components/recipe-form/ChefMode.test.tsx`:

1. Add imports:
```ts
import { renderRecipeForm, setupRecipeFormMocks } from '@/test-utils/render-recipe-form'
```

2. Replace `beforeEach` setup:
```ts
beforeEach(() => {
  vi.clearAllMocks()
  setupRecipeFormMocks('chef')
})
```

3. Replace every call to `renderChefMode(overrides)` with `renderRecipeForm({ mode: 'chef', ...overrides })`.

4. Remove the local `renderChefMode`, `defaultTags`, and `defaultIngredientTypes` declarations.

- [ ] **Step 5: Update `GuidedMode.test.tsx` to use the shared helper**

In `src/components/recipe-form/GuidedMode.test.tsx`:

1. Add imports:
```ts
import { renderRecipeForm, setupRecipeFormMocks } from '@/test-utils/render-recipe-form'
```

2. Replace `beforeEach` setup:
```ts
beforeEach(() => {
  vi.clearAllMocks()
  setupRecipeFormMocks('guided')
})
```

3. Replace every call to `renderGuidedMode(overrides)` with `renderRecipeForm({ mode: 'guided', ...overrides })`.

4. Remove the local `renderGuidedMode`, `defaultTags`, and `defaultIngredientTypes` declarations.

- [ ] **Step 6: Run the full test suite**

```bash
yarn test
```

Expected: all tests pass.

- [ ] **Step 7: Run coverage to verify the new coverage numbers**

```bash
yarn test:coverage
```

Expected: `components/recipe-form` overall coverage above 70%.

- [ ] **Step 8: Commit**

```bash
git add src/test-utils/fixtures.ts src/test-utils/render-recipe-form.tsx \
  src/components/recipe-form/RecipeForm.test.tsx \
  src/components/recipe-form/ChefMode.test.tsx \
  src/components/recipe-form/GuidedMode.test.tsx
git commit -m "test: add shared fixtures and renderRecipeForm helper"
```
