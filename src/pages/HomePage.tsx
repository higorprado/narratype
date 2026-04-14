import { useState, useCallback } from 'react'
import { getAllBooks } from '@/data'
import BookList from '@/components/BookList'
import ImportButton from '@/components/ImportButton'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useImportedBooks } from '@/hooks/useImportedBooks'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { importStatus, importError, importBook, deleteBook } = useImportedBooks()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  // getAllBooks merges built-in + registered imported books
  const books = getAllBooks()
  useDocumentTitle('Narratype - Practice Typing with Classic Literature')

  const pendingDeleteBook = books.find((b) => b.slug === pendingDeleteId)

  const handleDeleteRequest = useCallback((bookId: string) => {
    setPendingDeleteId(bookId)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (pendingDeleteId) {
      await deleteBook(pendingDeleteId)
      setPendingDeleteId(null)
    }
  }, [pendingDeleteId, deleteBook])

  const handleDeleteCancel = useCallback(() => {
    setPendingDeleteId(null)
  }, [])

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
        <BookList books={books} onDelete={handleDeleteRequest} />
      </main>
      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Delete Book"
        message={pendingDeleteBook ? `Delete "${pendingDeleteBook.title}"? This cannot be undone.` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}
