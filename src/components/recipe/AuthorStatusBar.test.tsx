import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthorStatusBar } from './AuthorStatusBar'

vi.mock('./StatusToggle', () => ({
  StatusToggle: ({ recipeId, currentStatus }: { recipeId: string; currentStatus: string }) => (
    <button type="button">
      Toggle {recipeId} {currentStatus}
    </button>
  ),
}))

vi.mock('./AuthorStatusBar.module.css', () => ({
  default: {
    bar: 'bar',
    label: 'label',
  },
}))

describe('AuthorStatusBar', () => {
  it('renders draft status copy and status toggle', () => {
    render(<AuthorStatusBar recipeId="recipe-1" currentStatus="draft" />)

    expect(screen.getByText('Draft — only you can see this')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Toggle recipe-1 draft' })).toBeInTheDocument()
  })

  it('renders published status copy and status toggle', () => {
    render(<AuthorStatusBar recipeId="recipe-1" currentStatus="published" />)

    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Toggle recipe-1 published' })).toBeInTheDocument()
  })
})
