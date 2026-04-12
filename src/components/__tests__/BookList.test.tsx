import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BookList from '../BookList'
import type { Book } from '@/types'

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

const makeBook = (slug: string, chapterCount = 1): Book => ({
  slug,
  title: `Book ${slug}`,
  author: `Author ${slug}`,
  language: 'en',
  coverUrl: '',
  chapters: Array.from({ length: chapterCount }, (_, i) => ({
    title: `Chapter ${i + 1}`,
    text: `Text ${i + 1}`,
  })),
})

describe('BookList', () => {
  it('renders the correct number of book cards', () => {
    const books = [makeBook('a'), makeBook('b'), makeBook('c')]

    renderWithRouter(<BookList books={books} />)

    expect(screen.getAllByRole('link')).toHaveLength(3)
  })

  it('renders each book title', () => {
    const books = [makeBook('alpha'), makeBook('beta')]

    renderWithRouter(<BookList books={books} />)

    expect(screen.getByText('Book alpha')).toBeInTheDocument()
    expect(screen.getByText('Book beta')).toBeInTheDocument()
  })

  it('shows empty message when no books are provided', () => {
    renderWithRouter(<BookList books={[]} />)

    expect(screen.getByText('No books available yet.')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
