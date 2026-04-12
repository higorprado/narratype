import { Link, useParams } from 'react-router-dom'
import { getBookBySlug } from '@/data'
import { ChapterList } from '@/components/ChapterList'
import styles from './ChaptersPage.module.css'

export function ChaptersPage() {
  const { bookSlug } = useParams<{ bookSlug: string }>()
  const book = bookSlug ? getBookBySlug(bookSlug) : undefined

  if (!book) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <p className={styles.notFoundTitle}>Book not found</p>
          <Link to="/" className={styles.backLink}>
            Back to Books
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumb}>
        <Link to="/" className={styles.breadcrumbLink}>
          Books
        </Link>
        <span className={styles.separator}>&gt;</span>
        <span>{book.title}</span>
      </nav>

      <h1 className={styles.heading}>{book.title}</h1>

      <ChapterList chapters={book.chapters} bookSlug={book.slug} />

      <Link to="/" className={styles.backLink}>
        Back to Books
      </Link>
    </div>
  )
}
