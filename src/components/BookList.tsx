import type { Book } from '@/types'
import BookCard from './BookCard'
import styles from './BookList.module.css'

interface BookListProps {
  books: Book[]
  onDelete?: (bookId: string) => void
}

export default function BookList({ books, onDelete }: BookListProps) {
  if (books.length === 0) {
    return <p className={styles.empty}>No books available yet.</p>
  }

  return (
    <ul className={styles.grid}>
      {books.map((book) => (
        <li key={book.slug}>
          <BookCard book={book} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  )
}
