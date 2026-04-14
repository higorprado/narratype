import { Link } from 'react-router-dom'
import type { Book } from '@/types'
import { useProgress } from '@/context/ProgressContext'
import styles from './BookCard.module.css'

interface BookCardProps {
  book: Book
  onDelete?: (bookId: string) => void
}

export default function BookCard({ book, onDelete }: BookCardProps) {
  const { getBookCompletionPercent } = useProgress()
  const percent = getBookCompletionPercent(book.slug)

  return (
    <div className={styles.card}>
      <Link to={`/chapters/${book.slug}`} className={styles.cardLink}>
        <h2 className={styles.title}>{book.title}</h2>
        <p className={styles.author}>{book.author}</p>
        <p className={styles.chapters}>
          {book.chapters.length} {book.chapters.length === 1 ? 'chapter' : 'chapters'}
        </p>
        {percent > 0 && (
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${percent}%` }} />
            </div>
            <span className={styles.progressLabel}>{percent}% complete</span>
          </div>
        )}
      </Link>
      {book.isImported && onDelete && (
        <button
          className={styles.deleteButton}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete(book.slug)
          }}
          aria-label={`Delete ${book.title}`}
        >
          &times;
        </button>
      )}
    </div>
  )
}
