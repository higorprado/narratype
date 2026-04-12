import { Link } from 'react-router-dom'
import type { Book } from '@/types'
import styles from './BookCard.module.css'

interface BookCardProps {
  book: Book
}

export default function BookCard({ book }: BookCardProps) {
  return (
    <Link to={`/chapters/${book.slug}`} className={styles.card}>
      <h2 className={styles.title}>{book.title}</h2>
      <p className={styles.author}>{book.author}</p>
      <p className={styles.chapters}>
        {book.chapters.length} {book.chapters.length === 1 ? 'chapter' : 'chapters'}
      </p>
    </Link>
  )
}
