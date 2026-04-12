import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Header } from '../Header'
import { SettingsProvider } from '@/context/SettingsContext'

function mockMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark') ? true : false,
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

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear()
    mockMatchMedia()
  })

  it('renders app name as a link to home', () => {
    renderWithProviders(<Header />)
    const link = screen.getByRole('link', { name: /narratype/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders the ThemeToggle', () => {
    renderWithProviders(<Header />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
