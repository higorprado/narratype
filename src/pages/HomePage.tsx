import { getAllBooks } from '@/data'
import BookList from '@/components/BookList'
import ImportButton from '@/components/ImportButton'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useImportedBooks } from '@/hooks/useImportedBooks'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { importStatus, importError, importBook } = useImportedBooks()
  // getAllBooks merges built-in + registered imported books
  const books = getAllBooks()
  useDocumentTitle('Narratype - Practice Typing with Classic Literature')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.hero}>Practice typing by retyping classic literature</p>
      </header>
      <main className={styles.content}>
        <ImportButton
          onImport={importBook}
          status={importStatus}
          error={importError}
        />
        <BookList books={books} />
      </main>
    </div>
  )
}
