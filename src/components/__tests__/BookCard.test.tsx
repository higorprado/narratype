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
  it('does not show delete button for non-imported books', () => {
    renderWithRouter(<BookCard book={mockBook} />)
    expect(screen.queryByLabelText(/Delete/)).not.toBeInTheDocument()
  })

  it('does not show delete button when onDelete is not provided', () => {
    const importedBook: Book = { ...mockBook, isImported: true }
    renderWithRouter(<BookCard book={importedBook} />)
    expect(screen.queryByLabelText(/Delete/)).not.toBeInTheDocument()
  })

  it('shows delete button for imported books when onDelete is provided', () => {
    const onDelete = vi.fn()
    const importedBook: Book = { ...mockBook, isImported: true }
    renderWithRouter(<BookCard book={importedBook} onDelete={onDelete} />)
    expect(screen.getByLabelText('Delete Test Book Title')).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn()
    const importedBook: Book = { ...mockBook, isImported: true }
    renderWithRouter(<BookCard book={importedBook} onDelete={onDelete} />)

    await userEvent.setup().click(screen.getByLabelText('Delete Test Book Title'))
    expect(onDelete).toHaveBeenCalledWith('test-book')
  })
})
