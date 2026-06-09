import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InstructionsGate } from './InstructionsGate'

vi.mock('./InstructionsGate.module.css', () => ({
  default: {
    empty: 'empty',
    stepList: 'stepList',
    step: 'step',
    stepNumber: 'stepNumber',
    stepContent: 'stepContent',
    gate: 'gate',
    gateBlur: 'gateBlur',
    fakeLine: 'fakeLine',
    gatePrompt: 'gatePrompt',
    gateTitle: 'gateTitle',
    gateSubtitle: 'gateSubtitle',
    gateActions: 'gateActions',
    gateCtaPrimary: 'gateCtaPrimary',
    gateCtaSecondary: 'gateCtaSecondary',
  },
}))

const steps = [
  { id: 'step-1', order: 1, content: 'Boil the pasta.' },
  { id: 'step-2', order: 2, content: 'Toss with lemon.' },
]

describe('InstructionsGate', () => {
  it('renders ordered instructions for authenticated users', () => {
    render(<InstructionsGate isAuthenticated steps={steps} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Boil the pasta.')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Toss with lemon.')).toBeInTheDocument()
    expect(screen.queryByText('Sign up to view the full recipe')).not.toBeInTheDocument()
  })

  it('renders an empty state for authenticated users with no steps', () => {
    render(<InstructionsGate isAuthenticated steps={[]} />)

    expect(screen.getByText('No instructions added yet.')).toBeInTheDocument()
  })

  it('renders signup and login prompts for guests', () => {
    render(<InstructionsGate isAuthenticated={false} steps={steps} />)

    expect(screen.getByText('Sign up to view the full recipe')).toBeInTheDocument()
    expect(
      screen.getByText('Create a free account to see instructions, save favorites, and share your own recipes.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign up free' })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
    expect(screen.queryByText('Boil the pasta.')).not.toBeInTheDocument()
  })
})
