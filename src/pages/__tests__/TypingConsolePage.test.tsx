import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { SettingsProvider } from '@/context/SettingsContext'
import { ProgressProvider } from '@/context/ProgressContext'
import TypingConsolePage from '../../pages/TypingConsolePage'

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

function renderWithRoute(path: string) {
  return render(
    <SettingsProvider>
      <ProgressProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path="/typing-console/:bookSlug/:chapterIndex/:pageIndex"
              element={<TypingConsolePage />}
            />
          </Routes>
        </MemoryRouter>
      </ProgressProvider>
    </SettingsProvider>,
  )
}

describe('TypingConsolePage', () => {
  it('renders page content for valid book/chapter/page', () => {
    renderWithRoute('/typing-console/the-art-of-war/0/0')

    expect(screen.getByText('The Art of War')).toBeInTheDocument()
    expect(screen.getByTestId('stats-bar')).toBeInTheDocument()
    expect(screen.getByTestId('typing-area')).toBeInTheDocument()
  })

  it('shows breadcrumb navigation', () => {
    renderWithRoute('/typing-console/the-art-of-war/0/0')

    expect(screen.getByText('Books')).toBeInTheDocument()
    expect(screen.getByText('The Art of War')).toBeInTheDocument()
  })

  it('shows page info', () => {
    renderWithRoute('/typing-console/the-art-of-war/0/0')

    const pageInfo = screen.getByText(/Page \d+ \/ \d+/)
    expect(pageInfo).toBeInTheDocument()
  })

  it('shows Restart button', () => {
    renderWithRoute('/typing-console/the-art-of-war/0/0')

    expect(screen.getByText('Restart')).toBeInTheDocument()
  })

  it('shows Previous Page and Next Page buttons', () => {
    renderWithRoute('/typing-console/the-art-of-war/0/0')

    expect(screen.getByText('Previous Page')).toBeInTheDocument()
    expect(screen.getByText('Next Page')).toBeInTheDocument()
  })

  it('disables Previous Page on first page', () => {
    renderWithRoute('/typing-console/the-art-of-war/0/0')

    expect(screen.getByText('Previous Page')).toBeDisabled()
  })

  it('shows book not found for invalid slug', () => {
    renderWithRoute('/typing-console/nonexistent-book/0/0')

    expect(screen.getByText('Book not found')).toBeInTheDocument()
  })

  it('shows page not found for invalid chapter index', () => {
    renderWithRoute('/typing-console/the-art-of-war/999/0')

    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })

  it('shows page not found for invalid page index', () => {
    renderWithRoute('/typing-console/the-art-of-war/0/9999')

    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })

  it('has a link back to home on error pages', () => {
    renderWithRoute('/typing-console/nonexistent-book/0/0')

    expect(screen.getByText('Return to home')).toBeInTheDocument()
  })
})
