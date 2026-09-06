// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Login } from '../pages/Login'
import { AppStoreProvider } from '../store'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('Executive Login Authentication & Persona Routing', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders executive login and authenticates to client portal by default', async () => {
    mockNavigate.mockReset()
    render(
      <AppStoreProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AppStoreProvider>
    )

    // Check institutional branding
    expect(screen.getByText(/Royal Square Financial/i)).toBeDefined()
    expect(screen.getByText(/FATF Grey-List Compliant Architecture/i)).toBeDefined()

    // Primary submit button for client
    const submitBtn = screen.getByRole('button', { name: /Enter Private Client Portal/i })
    expect(submitBtn).toBeDefined()

    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    }, { timeout: 1000 })
  })

  it('switching to Adviser Workspace routes to /adviser on submit', async () => {
    mockNavigate.mockReset()
    render(
      <AppStoreProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AppStoreProvider>
    )

    // Switch to adviser
    const adviserTab = screen.getByRole('button', { name: /Adviser Workspace/i })
    fireEvent.click(adviserTab)

    const submitBtn = screen.getByRole('button', { name: /Enter Adviser Workspace/i })
    expect(submitBtn).toBeDefined()

    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/adviser')
    }, { timeout: 1000 })
  })

  it('clicking register portfolio link routes to /onboarding', async () => {
    mockNavigate.mockReset()
    render(
      <AppStoreProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AppStoreProvider>
    )

    const registerBtn = screen.getByText(/Register a new portfolio/i)
    fireEvent.click(registerBtn)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding')
    }, { timeout: 1000 })
  })

  it('toggles theme between Cashmere Silk and Obsidian Reserve', async () => {
    render(
      <AppStoreProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AppStoreProvider>
    )

    const themeBtn = screen.getByTitle(/Switch to Obsidian Reserve/i)
    expect(themeBtn).toBeDefined()
    fireEvent.click(themeBtn)

    expect(screen.getByTitle(/Switch to Cashmere Silk/i)).toBeDefined()
  })

  it('renders full executive landing page manifesto on the hero column', () => {
    render(
      <AppStoreProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AppStoreProvider>
    )

    expect(screen.getByText(/Private Client & Adviser Portal/i)).toBeDefined()
    expect(screen.getByRole('heading', { level: 1, name: /Bespoke wealth architecture for South Africa’s discerning investors/i })).toBeDefined()
    expect(screen.getByText(/claims tracking in one secure sovereign environment/i)).toBeDefined()
    expect(screen.getByText(/Sovereign Private Wealth Lounge · Sandton 2196/i)).toBeDefined()
  })
})
