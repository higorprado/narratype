import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { SettingsProvider } from '@/context/SettingsContext'
import { ProgressProvider } from '@/context/ProgressContext'
import TypingConsolePage from '../../pages/TypingConsolePage'

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

function renderWithRoute(path: string) {
  const user = userEvent.setup()
  const result = render(
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
  return { user, ...result }
}

describe('TypingConsolePage', () => {
  it('renders page content for valid book/chapter/page', () => {
    renderWithRoute('/typing-console/the-call-of-cthulhu/0/0')

    expect(screen.getByText('The Call of Cthulhu')).toBeInTheDocument()
    expect(screen.getByTestId('stats-bar')).toBeInTheDocument()
    expect(screen.getByTestId('typing-area')).toBeInTheDocument()
  })

  it('shows breadcrumb navigation', () => {
    renderWithRoute('/typing-console/the-call-of-cthulhu/0/0')

    expect(screen.getByText('Books')).toBeInTheDocument()
    expect(screen.getByText('The Call of Cthulhu')).toBeInTheDocument()
  })

  it('shows page info', () => {
    renderWithRoute('/typing-console/the-call-of-cthulhu/0/0')

    const pageInfo = screen.getByText(/Page \d+ \/ \d+/)
    expect(pageInfo).toBeInTheDocument()
  })

  it('shows Restart button', () => {
    renderWithRoute('/typing-console/the-call-of-cthulhu/0/0')

    expect(screen.getByText('Restart')).toBeInTheDocument()
  })

  it('shows Previous Page and Next Page buttons', () => {
    renderWithRoute('/typing-console/the-call-of-cthulhu/0/0')

    expect(screen.getByText('Previous Page')).toBeInTheDocument()
    expect(screen.getByText('Next Page')).toBeInTheDocument()
  })

  it('disables Previous Page on first page', () => {
    renderWithRoute('/typing-console/the-call-of-cthulhu/0/0')

    expect(screen.getByText('Previous Page')).toBeDisabled()
  })

  it('shows book not found for invalid slug', () => {
    renderWithRoute('/typing-console/nonexistent-book/0/0')

    expect(screen.getByText('Book not found')).toBeInTheDocument()
  })

  it('shows page not found for invalid chapter index', () => {
    renderWithRoute('/typing-console/the-call-of-cthulhu/999/0')

    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })

  it('shows page not found for invalid page index', () => {
    renderWithRoute('/typing-console/the-call-of-cthulhu/0/9999')

    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })

  it('has a link back to home on error pages', () => {
    renderWithRoute('/typing-console/nonexistent-book/0/0')

    expect(screen.getByText('Return to home')).toBeInTheDocument()
  })

  it('does not show inactivity overlay initially', () => {
    renderWithRoute('/typing-console/the-call-of-cthulhu/0/0')

    expect(screen.queryByText('Paused')).not.toBeInTheDocument()
  })

  it('does not show completion overlay initially', () => {
    renderWithRoute('/typing-console/the-call-of-cthulhu/0/0')

    expect(screen.queryByText('Page complete!')).not.toBeInTheDocument()
  })

  it('renders Settings button', () => {
    renderWithRoute('/typing-console/the-call-of-cthulhu/0/0')

    expect(
      screen.getByRole('button', { name: /settings/i }),
    ).toBeInTheDocument()
  })

  it('hides restart confirmation dialog initially', () => {
    renderWithRoute('/typing-console/the-call-of-cthulhu/0/0')

    expect(
      screen.queryByText('Restart this chapter from the beginning?'),
    ).not.toBeInTheDocument()
  })

  it('shows restart confirmation when restart button is clicked', async () => {
    const { user } = renderWithRoute('/typing-console/the-call-of-cthulhu/0/0')

    // There are two Restart buttons (header + bottom bar); click the first one
    const restartButtons = screen.getAllByRole('button', { name: /restart/i })
    await user.click(restartButtons[0])

    expect(
      screen.getByText('Restart this chapter from the beginning?'),
    ).toBeInTheDocument()
  })

  it('can dismiss restart confirmation by clicking Cancel', async () => {
    const { user } = renderWithRoute('/typing-console/the-call-of-cthulhu/0/0')

    const restartButtons = screen.getAllByRole('button', { name: /restart/i })
    await user.click(restartButtons[0])
    expect(
      screen.getByText('Restart this chapter from the beginning?'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(
      screen.queryByText('Restart this chapter from the beginning?'),
    ).not.toBeInTheDocument()
  })
})
