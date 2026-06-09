import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserMenu } from './UserMenu'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

const mockUseAuth = vi.fn()

vi.mock('./Providers', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault()
        onClick?.(event)
      }}
      {...props}
    >
      {children}
    </a>
  ),
}))

vi.mock('./UserMenu.module.css', () => ({
  default: {
    skeleton: 'skeleton',
    guestActions: 'guestActions',
    signIn: 'signIn',
    signUp: 'signUp',
    userMenu: 'userMenu',
    dropdown: 'dropdown',
    trigger: 'trigger',
    avatar: 'avatar',
    avatarFallback: 'avatarFallback',
    displayName: 'displayName',
    menu: 'menu',
    menuItem: 'menuItem',
    divider: 'divider',
  },
}))

const user = {
  displayName: 'Hags',
  email: 'hags@example.com',
  photoURL: null,
}

function getDetails(container: HTMLElement) {
  const details = container.querySelector('details')
  if (!details) throw new Error('Expected user menu details element')
  return details
}

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders guest links when signed out', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn() })

    render(<UserMenu />)

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Sign up free' })).toHaveAttribute('href', '/signup')
  })

  it('renders a loading skeleton while auth state resolves', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, logout: vi.fn() })

    const { container } = render(<UserMenu />)

    expect(container.querySelector('.skeleton')).toBeInTheDocument()
  })

  it('opens and closes the authenticated dropdown from the trigger', async () => {
    mockUseAuth.mockReturnValue({ user, loading: false, logout: vi.fn() })
    const { container } = render(<UserMenu />)
    const details = getDetails(container)

    await userEvent.click(screen.getByLabelText('User menu'))
    expect(details).toHaveAttribute('open')

    await userEvent.click(screen.getByLabelText('User menu'))
    expect(details).not.toHaveAttribute('open')
  })

  it('closes the dropdown when a menu link is clicked', async () => {
    mockUseAuth.mockReturnValue({ user, loading: false, logout: vi.fn() })
    const { container } = render(<UserMenu />)
    const details = getDetails(container)

    await userEvent.click(screen.getByLabelText('User menu'))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Favorites' }))

    expect(details).not.toHaveAttribute('open')
  })

  it('closes the dropdown and signs out when Sign out is clicked', async () => {
    const logout = vi.fn()
    mockUseAuth.mockReturnValue({ user, loading: false, logout })
    const { container } = render(<UserMenu />)
    const details = getDetails(container)

    await userEvent.click(screen.getByLabelText('User menu'))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))

    expect(details).not.toHaveAttribute('open')
    expect(logout).toHaveBeenCalledOnce()
  })

  it('closes the dropdown when clicking outside', async () => {
    mockUseAuth.mockReturnValue({ user, loading: false, logout: vi.fn() })
    const { container } = render(
      <>
        <UserMenu />
        <button type="button">Outside</button>
      </>,
    )
    const details = getDetails(container)

    await userEvent.click(screen.getByLabelText('User menu'))
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }))

    expect(details).not.toHaveAttribute('open')
  })
})
