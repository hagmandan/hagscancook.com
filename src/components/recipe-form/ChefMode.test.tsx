// src/components/recipe-form/ChefMode.test.tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { useTitleAvailability } from '@/lib/hooks/useTitleAvailability'

// ── CSS module mocks ──────────────────────────────────────────────────────────
vi.mock('./RecipeForm.module.css', () => ({ default: {} }))
vi.mock('./FormHeader.module.css', () => ({ default: {} }))
vi.mock('./ChefMode.module.css', () => ({ default: {} }))
vi.mock('./IngredientsField.module.css', () => ({ default: {} }))
vi.mock('./StepsField.module.css', () => ({ default: {} }))
vi.mock('@/components/ui/MultiSelect.module.css', () => ({ default: {} }))
vi.mock('@/components/ui/UnitSelect.module.css', () => ({ default: {} }))
vi.mock('@/components/ui/CharCounter.module.css', () => ({ default: {} }))
vi.mock('./GuidedMode.module.css', () => ({ default: {} }))

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

// ── Badge helpers mock (badges.ts imports db; mock to avoid DATABASE_URL requirement) ──
vi.mock('@/lib/badges', () => ({
  checkAndAwardBadges: vi.fn().mockResolvedValue([]),
  tierLabel: vi.fn((tier: string) => tier),
  badgeLabel: vi.fn((type: string) => type),
  badgeSubtitle: vi.fn(() => ''),
  nextThreshold: vi.fn(() => null),
  BADGE_THRESHOLDS: [],
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
import { renderRecipeForm, setupRecipeFormMocks } from '@/test-utils/render-recipe-form'

beforeEach(() => {
  vi.clearAllMocks()
  setupRecipeFormMocks('chef')
})

describe('ChefMode', () => {
  describe('title field', () => {
    it('renders the title input', () => {
      renderRecipeForm({ mode: 'chef' })
      expect(screen.getByTestId('recipe-title')).toBeInTheDocument()
    })

    it('updates the char counter as the user types', async () => {
      const user = userEvent.setup()
      renderRecipeForm({ mode: 'chef' })
      await user.type(screen.getByTestId('recipe-title'), 'Tacos')
      expect(screen.getByText(/5\s*\/\s*\d+/)).toBeInTheDocument()
    })

    it('shows a validation error when title is empty on submit', async () => {
      const user = userEvent.setup()
      renderRecipeForm({ mode: 'chef' })
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'Save' }))
      })
      await waitFor(() =>
        expect(screen.getByText('Title is required')).toBeInTheDocument()
      )
    })

    it('shows a duplicate-title warning when useTitleAvailability returns taken=true', () => {
      vi.mocked(useTitleAvailability).mockReturnValue({ taken: true })
      renderRecipeForm({ mode: 'chef', initialValues: { title: 'Existing Recipe' } })
      expect(screen.getByText(/Another recipe with this title exists/)).toBeInTheDocument()
    })
  })

  describe('description field', () => {
    it('renders the description textarea', () => {
      renderRecipeForm({ mode: 'chef' })
      expect(screen.getByTestId('recipe-description')).toBeInTheDocument()
    })

    it('updates the char counter as the user types', async () => {
      const user = userEvent.setup()
      renderRecipeForm({ mode: 'chef' })
      await user.type(screen.getByTestId('recipe-description'), 'Hello')
      expect(screen.getAllByText(/5\s*\/\s*\d+/)[0]).toBeInTheDocument()
    })
  })

  describe('timing fields', () => {
    it('renders prep, cook, and servings inputs', () => {
      renderRecipeForm({ mode: 'chef' })
      expect(screen.getByLabelText('Prep')).toBeInTheDocument()
      expect(screen.getByLabelText('Cook')).toBeInTheDocument()
      expect(screen.getByLabelText('Serves')).toBeInTheDocument()
    })
  })

  describe('cuisine select', () => {
    it('renders the cuisine dropdown', () => {
      renderRecipeForm({ mode: 'chef' })
      expect(screen.getByLabelText('Cuisine')).toBeInTheDocument()
    })

    it('updates the form when a cuisine is selected', async () => {
      const user = userEvent.setup()
      renderRecipeForm({ mode: 'chef' })
      const select = screen.getByLabelText('Cuisine') as HTMLSelectElement
      await user.selectOptions(select, 'Italian')
      expect(select).toHaveValue('Italian')
    })
  })

  describe('difficulty select', () => {
    it('renders Easy, Medium, and Advanced options', () => {
      renderRecipeForm({ mode: 'chef' })
      const select = screen.getByLabelText('Difficulty')
      expect(select).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Easy' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Medium' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Advanced' })).toBeInTheDocument()
    })

    it('updates the form when a difficulty is selected', async () => {
      const user = userEvent.setup()
      renderRecipeForm({ mode: 'chef' })
      const select = screen.getByLabelText('Difficulty') as HTMLSelectElement
      await user.selectOptions(select, 'Easy')
      expect(select).toHaveValue('Easy')
    })
  })

  describe('dietary multi-select', () => {
    it('renders the dietary restrictions select', () => {
      renderRecipeForm({ mode: 'chef' })
      expect(screen.getByRole('listbox', { name: 'dietary' })).toBeInTheDocument()
    })

    it('updates the form when a dietary restriction is selected', async () => {
      const user = userEvent.setup()
      renderRecipeForm({ mode: 'chef' })
      const listbox = screen.getByRole('listbox', { name: 'dietary' })
      await user.selectOptions(listbox, 'Vegetarian')
      expect(listbox).toHaveValue(['Vegetarian'])
    })
  })

  describe('cook style creatable multi-select', () => {
    it('renders the cook style select', () => {
      renderRecipeForm({ mode: 'chef' })
      expect(screen.getByRole('listbox', { name: 'cookingMethods' })).toBeInTheDocument()
    })

    it('adds a custom cook style value on Enter', async () => {
      const user = userEvent.setup()
      renderRecipeForm({ mode: 'chef' })
      const input = screen.getByRole('textbox', { name: 'cookingMethods input' })
      await user.type(input, 'Slow-cooked')
      await user.keyboard('{Enter}')
      expect(screen.getByRole('listbox', { name: 'cookingMethods' })).toHaveValue(['Slow-cooked'])
    })
  })

  describe('tags multi-select', () => {
    it('renders the tags select when tags are provided', () => {
      renderRecipeForm({ mode: 'chef' })
      expect(screen.getByRole('listbox', { name: 'tags' })).toBeInTheDocument()
    })

    it('does not render the tags select when no tags are provided', () => {
      renderRecipeForm({ mode: 'chef', tags: [] })
      expect(screen.queryByRole('listbox', { name: 'tags' })).toBeNull()
    })
  })

  describe('sidebar toggle (mobile)', () => {
    it('starts collapsed', () => {
      renderRecipeForm({ mode: 'chef' })
      expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'false')
    })

    it('expands on click', async () => {
      const user = userEvent.setup()
      renderRecipeForm({ mode: 'chef' })
      const toggle = screen.getByRole('button', { name: 'Details' })
      await user.click(toggle)
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('cover photo consent', () => {
    it('disables the upload button until the consent checkbox is checked', async () => {
      const user = userEvent.setup()
      renderRecipeForm({ mode: 'chef' })
      const uploadButton = screen.getByRole('button', { name: /upload photo/i })
      expect(uploadButton).toBeDisabled()
      const checkbox = screen.getByLabelText(/I confirm/)
      await user.click(checkbox)
      expect(uploadButton).toBeEnabled()
    })
  })

  describe('cover image status banners', () => {
    it('shows a pending-approval message', () => {
      renderRecipeForm({ mode: 'chef', coverImageStatus: 'pending_approval' })
      expect(screen.getByText(/Image under review/)).toBeInTheDocument()
    })

    it('shows a rejection message', () => {
      renderRecipeForm({ mode: 'chef', coverImageStatus: 'rejected' })
      expect(screen.getByText(/Image rejected/)).toBeInTheDocument()
    })
  })

  describe('ingredients and steps sections', () => {
    it('renders the Ingredients section heading', () => {
      renderRecipeForm({ mode: 'chef' })
      expect(screen.getByRole('heading', { name: 'Ingredients' })).toBeInTheDocument()
    })

    it('renders the Steps section heading', () => {
      renderRecipeForm({ mode: 'chef' })
      expect(screen.getByRole('heading', { name: 'Steps' })).toBeInTheDocument()
    })
  })
})
