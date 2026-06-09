// src/components/recipe-form/GuidedMode.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useToast } from '@/lib/toast'
import { useTitleAvailability } from '@/lib/hooks/useTitleAvailability'

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

function renderGuidedMode(overrides: Partial<React.ComponentProps<typeof RecipeForm>> = {}) {
  return render(
    <RecipeForm tags={defaultTags} ingredientTypes={defaultIngredientTypes} {...overrides} />
  )
}

beforeEach(() => {
  vi.clearAllMocks()
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
      const tabs = [
        { name: 'Details', progress: '40' },
        { name: 'Ingredients', progress: '60' },
        { name: 'Steps', progress: '80' },
        { name: 'Preview', progress: '100' },
      ]
      for (const { name, progress } of tabs) {
        await user.click(screen.getByRole('tab', { name }))
        expect(screen.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true')
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', progress)
      }
    })
  })

  describe('Next / Back navigation buttons', () => {
    it('shows "Details →" and no Back on the first tab', () => {
      renderGuidedMode()
      expect(screen.getByRole('button', { name: 'Details →' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /←/ })).toBeNull()
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
      expect(screen.queryByRole('button', { name: /→/ })).toBeNull()
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
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'Save' }))
      })
      await waitFor(() =>
        expect(screen.getByText('Title is required')).toBeInTheDocument()
      )
    })

    it('shows a duplicate-title warning when useTitleAvailability returns taken=true', () => {
      vi.mocked(useTitleAvailability).mockReturnValue({ taken: true })
      renderGuidedMode({ initialValues: { title: 'Existing Recipe' } })
      expect(screen.getByText(/Another recipe with this title exists/)).toBeInTheDocument()
    })

    it('disables the upload button until consent is checked', async () => {
      const user = userEvent.setup()
      renderGuidedMode()
      const uploadButton = screen.getByRole('button', { name: /upload photo/i })
      expect(uploadButton).toBeDisabled()
      const checkbox = screen.getByLabelText(/I confirm/)
      await user.click(checkbox)
      expect(uploadButton).toBeEnabled()
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
      // The preview h2 contains "Untitled recipe" (the header span may also show it)
      expect(screen.getByRole('heading', { name: 'Untitled recipe' })).toBeInTheDocument()
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
      expect(screen.getByRole('heading', { name: 'My Soup' })).toBeInTheDocument()
      expect(screen.getByText('A warming bowl.')).toBeInTheDocument()
      expect(screen.getByText('30 min')).toBeInTheDocument()
      expect(screen.getByText('Serves 2')).toBeInTheDocument()
    })
  })
})
