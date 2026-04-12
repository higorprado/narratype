import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BookCard from '../BookCard'
import { ProgressProvider } from '@/context/ProgressContext'
import type { Book } from '@/types'

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter><ProgressProvider>{ui}</ProgressProvider></MemoryRouter>)
}

const mockBook: Book = {
  slug: 'test-book',
  title: 'Test Book Title',
  author: 'Test Author',
  language: 'en',
  coverUrl: '',
  chapters: [
    { title: 'Chapter 1', text: 'text 1' },
    { title: 'Chapter 2', text: 'text 2' },
    { title: 'Chapter 3', text: 'text 3' },
  ],
}

describe('BookCard', () => {
  it('renders book title, author, and chapter count', () => {
    renderWithRouter(<BookCard book={mockBook} />)

    expect(screen.getByText('Test Book Title')).toBeInTheDocument()
    expect(screen.getByText('Test Author')).toBeInTheDocument()
    expect(screen.getByText('3 chapters')).toBeInTheDocument()
  })

  it('renders singular "chapter" for a single chapter book', () => {
    const singleChapterBook: Book = {
      ...mockBook,
      chapters: [{ title: 'Only Chapter', text: 'text' }],
    }

    renderWithRouter(<BookCard book={singleChapterBook} />)

    expect(screen.getByText('1 chapter')).toBeInTheDocument()
  })

  it('links to the correct chapter page', () => {
    renderWithRouter(<BookCard book={mockBook} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/chapters/test-book')
  })

  it('navigates on click', async () => {
    const user = userEvent.setup()
    renderWithRouter(<BookCard book={mockBook} />)

    const link = screen.getByRole('link')
    await user.click(link)

    expect(link).toHaveAttribute('href', '/chapters/test-book')
  })
})
