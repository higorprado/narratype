import { Link } from 'react-router-dom'
import type { Book } from '@/types'
import { useProgress } from '@/context/ProgressContext'
import styles from './BookCard.module.css'

interface BookCardProps {
  book: Book
  onDelete?: (bookId: string) => void
  onEdit?: (bookId: string) => void
}

export default function BookCard({ book, onDelete, onEdit }: BookCardProps) {
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
      {book.isImported && (onDelete || onEdit) && (
        <div className={styles.actions}>
          {onEdit && (
            <button
              className={styles.editButton}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEdit(book.slug)
              }}
              aria-label={`Edit ${book.title}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.editIcon}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
          )}
          {onDelete && (
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
      )}
    </div>
  )
}
