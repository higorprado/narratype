import { useState, useCallback } from 'react'
import { getAllBooks } from '@/data'
import BookList from '@/components/BookList'
import ImportButton from '@/components/ImportButton'
import ConfirmDialog from '@/components/ConfirmDialog'
import EditBookDialog from '@/components/EditBookDialog'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useImportedBooks } from '@/hooks/useImportedBooks'
import styles from './HomePage.module.css'

export default function HomePage() {
  const { importStatus, importError, importBook, deleteBook, updateBook } = useImportedBooks()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [pendingEditId, setPendingEditId] = useState<string | null>(null)
  // getAllBooks merges built-in + registered imported books
  const books = getAllBooks()
  useDocumentTitle('Narratype - Practice Typing with Classic Literature')

  const pendingDeleteBook = books.find((b) => b.slug === pendingDeleteId)
  const pendingEditBook = books.find((b) => b.slug === pendingEditId)

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

  const handleEditRequest = useCallback((bookId: string) => {
    setPendingEditId(bookId)
  }, [])

  const handleEditSave = useCallback(async (updates: { title: string; author: string }) => {
    if (pendingEditId) {
      await updateBook(pendingEditId, updates)
      setPendingEditId(null)
    }
  }, [pendingEditId, updateBook])

  const handleEditCancel = useCallback(() => {
    setPendingEditId(null)
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
        <BookList books={books} onDelete={handleDeleteRequest} onEdit={handleEditRequest} />
      </main>
      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Delete Book"
        message={pendingDeleteBook ? `Delete "${pendingDeleteBook.title}"? This cannot be undone.` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
      {pendingEditBook && (
        <EditBookDialog
          isOpen={pendingEditId !== null}
          title={pendingEditBook.title}
          author={pendingEditBook.author}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
        />
      )}
    </div>
  )
}
