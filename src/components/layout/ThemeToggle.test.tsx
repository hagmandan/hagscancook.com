import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'

vi.mock('./ThemeToggle.module.css', () => ({
  default: {
    toggle: 'toggle',
    placeholder: 'placeholder',
  },
}))

describe('ThemeToggle', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme')
    localStorage.clear()
  })

  it('renders the dark-theme action by default after mounting', async () => {
    render(<ThemeToggle />)

    expect(await screen.findByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })

  it('initializes from the html data-theme attribute', async () => {
    document.documentElement.setAttribute('data-theme', 'dark')

    render(<ThemeToggle />)

    expect(await screen.findByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
  })

  it('switches to dark theme and persists the preference', async () => {
    render(<ThemeToggle />)

    const button = await screen.findByRole('button', { name: 'Switch to dark theme' })
    await userEvent.click(button)

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
    })
  })

  it('switches to light theme and persists the preference', async () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    render(<ThemeToggle />)

    const button = await screen.findByRole('button', { name: 'Switch to light theme' })
    await userEvent.click(button)

    expect(document.documentElement).not.toHaveAttribute('data-theme')
    expect(localStorage.getItem('theme')).toBe('light')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
    })
  })
})
