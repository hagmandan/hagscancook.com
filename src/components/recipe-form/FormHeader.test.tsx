import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { RecipeFormValues } from '@/lib/schemas/recipe'
import { FormHeader } from './FormHeader'

const mockUsePathname = vi.fn()
const mockSearchParamsGet = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('./FormHeader.module.css', () => ({
  default: {
    header: 'header',
    inner: 'inner',
    back: 'back',
    title: 'title',
    titlePlaceholder: 'titlePlaceholder',
    modeToggle: 'modeToggle',
    modeButton: 'modeButton',
    modeActive: 'modeActive',
    actions: 'actions',
    draftButton: 'draftButton',
    publishButton: 'publishButton',
    loading: 'loading',
  },
}))

function createForm(title: string): UseFormReturn<RecipeFormValues> {
  return {
    watch: vi.fn(() => title),
  } as unknown as UseFormReturn<RecipeFormValues>
}

describe('FormHeader', () => {
  const onSave = vi.fn()
  const onSaveAndPublish = vi.fn()

  beforeEach(() => {
    onSave.mockReset()
    onSaveAndPublish.mockReset()
    mockUsePathname.mockReturnValue('/recipes/new')
    mockSearchParamsGet.mockReturnValue(null)
  })

  it('renders navigation, title, and chef mode by default', () => {
    render(
      <FormHeader
        form={createForm('Lemon Pasta')}
        onSave={onSave}
        onSaveAndPublish={onSaveAndPublish}
        isSubmitting={false}
        initialStatus="draft"
      />
    )

    expect(screen.getByRole('link', { name: '← My Recipes' })).toHaveAttribute(
      'href',
      '/my-recipes'
    )
    expect(screen.getByText('Lemon Pasta')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Chef mode' })).toHaveAttribute(
      'href',
      '/recipes/new?mode=chef'
    )
    expect(screen.getByRole('link', { name: 'Chef mode' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getByRole('link', { name: 'Guide me' })).toHaveAttribute(
      'href',
      '/recipes/new?mode=guided'
    )
  })

  it('shows a placeholder title and marks guided mode active', () => {
    mockSearchParamsGet.mockReturnValue('guided')

    render(
      <FormHeader
        form={createForm('')}
        onSave={onSave}
        onSaveAndPublish={onSaveAndPublish}
        isSubmitting={false}
        initialStatus="draft"
      />
    )

    expect(screen.getByText('Untitled recipe')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Guide me' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  it('runs save actions for draft recipes', async () => {
    render(
      <FormHeader
        form={createForm('Soup')}
        onSave={onSave}
        onSaveAndPublish={onSaveAndPublish}
        isSubmitting={false}
        initialStatus="draft"
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save and Publish' }))

    expect(onSave).toHaveBeenCalledOnce()
    expect(onSaveAndPublish).toHaveBeenCalledOnce()
  })

  it('hides publish action for published recipes and disables save while submitting', () => {
    render(
      <FormHeader
        form={createForm('Soup')}
        onSave={onSave}
        onSaveAndPublish={onSaveAndPublish}
        isSubmitting
        initialStatus="published"
      />
    )

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Save and Publish' })).not.toBeInTheDocument()
  })
})
