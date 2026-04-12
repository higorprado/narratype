import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeToggle } from '../ThemeToggle'
import { SettingsProvider } from '@/context/SettingsContext'

function mockMatchMedia(prefersDark: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark') ? prefersDark : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <SettingsProvider>{ui}</SettingsProvider>
    </MemoryRouter>,
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    mockMatchMedia(true)
  })

  it('renders a toggle button', () => {
    renderWithProviders(<ThemeToggle />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows Light label when theme is dark', () => {
    renderWithProviders(<ThemeToggle />)
    expect(screen.getByText('Light')).toBeInTheDocument()
  })

  it('shows Dark label when theme is light', () => {
    localStorage.setItem(
      'narratype-settings',
      JSON.stringify({ theme: 'classic-light' }),
    )
    renderWithProviders(<ThemeToggle />)
    expect(screen.getByText('Dark')).toBeInTheDocument()
  })

  it('toggles theme on click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ThemeToggle />)

    expect(screen.getByText('Light')).toBeInTheDocument()

    await user.click(screen.getByRole('button'))

    expect(screen.getByText('Dark')).toBeInTheDocument()
  })

  it('has accessible label describing the switch action', () => {
    renderWithProviders(<ThemeToggle />)
    expect(
      screen.getByRole('button', { name: /switch to light theme/i }),
    ).toBeInTheDocument()
  })
})
