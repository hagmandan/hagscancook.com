import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toast } from './Toast'
import type { ToastItem } from '@/lib/toast'

const errorToast: ToastItem = {
  id: 'test-1',
  type: 'error',
  title: 'Error',
  message: 'Could not update favorite',
}

const successToast: ToastItem = {
  id: 'test-2',
  type: 'success',
  title: 'Done',
  message: 'Recipe deleted',
}

describe('Toast', () => {
  it('renders the title and message', () => {
    render(<Toast toast={errorToast} onDismiss={() => {}} />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Could not update favorite')).toBeInTheDocument()
  })

  it('renders a dismiss button with accessible label', () => {
    render(<Toast toast={errorToast} onDismiss={() => {}} />)
    expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = vi.fn()
    render(<Toast toast={errorToast} onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    // onDismiss is called after the 250ms exit animation
    await new Promise((r) => setTimeout(r, 260))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('renders a success toast', () => {
    render(<Toast toast={successToast} onDismiss={() => {}} />)
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Recipe deleted')).toBeInTheDocument()
  })

  it('has role="status" for screen readers', () => {
    render(<Toast toast={errorToast} onDismiss={() => {}} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
