import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ChapterList } from '../ChapterList'
import { getBookBySlug } from '@/data'

describe('ChapterList', () => {
  const book = getBookBySlug('the-call-of-cthulhu')!
  const chapters = book.chapters.slice(0, 3)

  it('renders all chapters with titles', () => {
    render(
      <MemoryRouter>
        <ChapterList chapters={chapters} bookSlug={book.slug} />
      </MemoryRouter>,
    )

    for (const chapter of chapters) {
      expect(screen.getByText(chapter.title)).toBeInTheDocument()
    }
  })

  it('renders chapter numbers', () => {
    render(
      <MemoryRouter>
        <ChapterList chapters={chapters} bookSlug={book.slug} />
      </MemoryRouter>,
    )

    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('2.')).toBeInTheDocument()
    expect(screen.getByText('3.')).toBeInTheDocument()
  })

  it('renders links to typing console with first page', () => {
    render(
      <MemoryRouter>
        <ChapterList chapters={chapters} bookSlug={book.slug} />
      </MemoryRouter>,
    )

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '/typing-console/the-call-of-cthulhu/0/0')
    expect(links[1]).toHaveAttribute('href', '/typing-console/the-call-of-cthulhu/1/0')
    expect(links[2]).toHaveAttribute('href', '/typing-console/the-call-of-cthulhu/2/0')
  })

  it('navigates on click', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ChapterList chapters={chapters} bookSlug={book.slug} />
      </MemoryRouter>,
    )

    const firstChapter = screen.getByText(chapters[0].title)
    await user.click(firstChapter)

    // Clicking a link doesn't error — link is interactive
    expect(firstChapter.closest('a')).toHaveAttribute(
      'href',
      '/typing-console/the-call-of-cthulhu/0/0',
    )
  })

  it('renders page count for each chapter', () => {
    render(
      <MemoryRouter>
        <ChapterList chapters={chapters} bookSlug={book.slug} />
      </MemoryRouter>,
    )

    // Each chapter should show "N pages" or "1 page"
    const pageTexts = screen.getAllByText(/page?s?$/)
    expect(pageTexts).toHaveLength(chapters.length)
  })

  it('renders nothing when chapters array is empty', () => {
    render(
      <MemoryRouter>
        <ChapterList chapters={[]} bookSlug={book.slug} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
