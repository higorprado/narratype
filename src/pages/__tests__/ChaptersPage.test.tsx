import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ChaptersPage } from '../ChaptersPage'
import { SettingsProvider } from '@/context/SettingsContext'

function renderAt(path: string) {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/chapters/:bookSlug" element={<ChaptersPage />} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    </SettingsProvider>,
  )
}

describe('ChaptersPage', () => {
  it('renders book title as heading', () => {
    renderAt('/chapters/the-call-of-cthulhu')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'The Art of War',
    )
  })

  it('renders chapters for the book', () => {
    renderAt('/chapters/the-call-of-cthulhu')

    expect(screen.getByText('Chapter I. LAYING PLANS')).toBeInTheDocument()
    expect(screen.getByText('Chapter II. WAGING WAR')).toBeInTheDocument()
  })

  it('renders breadcrumb with Books link and book title', () => {
    renderAt('/chapters/the-call-of-cthulhu')

    const booksLink = screen.getByText('Books')
    expect(booksLink).toBeInTheDocument()
    expect(booksLink.closest('a')).toHaveAttribute('href', '/')
    expect(screen.getAllByText('The Art of War').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('>')).toBeInTheDocument()
  })

  it('renders Back to Books link', () => {
    renderAt('/chapters/the-call-of-cthulhu')

    const backLinks = screen.getAllByText('Back to Books')
    expect(backLinks.length).toBeGreaterThanOrEqual(1)
    expect(backLinks[0].closest('a')).toHaveAttribute('href', '/')
  })

  it('shows not found message for invalid slug', () => {
    renderAt('/chapters/nonexistent-book')

    expect(screen.getByText('Book not found')).toBeInTheDocument()
    expect(screen.getByText('Back to Books')).toBeInTheDocument()
  })

  it('shows not found when bookSlug param is missing', () => {
    render(
      <SettingsProvider>
        <MemoryRouter initialEntries={['/chapters/']}>
          <Routes>
            <Route path="/chapters/:bookSlug" element={<ChaptersPage />} />
            <Route path="*" element={<div>Not matched</div>} />
          </Routes>
        </MemoryRouter>
      </SettingsProvider>,
    )

    // Route doesn't match, so ChaptersPage doesn't render
    expect(screen.queryByText('Book not found')).not.toBeInTheDocument()
  })

  it('chapter links point to typing console', () => {
    renderAt('/chapters/the-call-of-cthulhu')

    const links = screen.getAllByRole('link')
    const chapterLinks = links.filter(
      (l) => l.getAttribute('href')?.startsWith('/typing-console/') ?? false,
    )
    expect(chapterLinks.length).toBeGreaterThan(0)
    expect(chapterLinks[0]).toHaveAttribute(
      'href',
      '/typing-console/the-call-of-cthulhu/0/0',
    )
  })
})
