import { getAllBooks } from '@/data'
import BookList from '@/components/BookList'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import styles from './HomePage.module.css'

export default function HomePage() {
  const books = getAllBooks()
  useDocumentTitle('Narratype - Practice Typing with Classic Literature')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.hero}>Practice typing by retyping classic literature</p>
      </header>
      <main className={styles.content}>
        <BookList books={books} />
      </main>
    </div>
  )
}
