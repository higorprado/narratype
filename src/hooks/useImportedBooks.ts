import { useSettings } from '@/context/SettingsContext'

import { useState, useEffect, useCallback } from 'react'
import type { Book } from '@/types/book'
import {
  getAllImportedBooks,
  saveImportedBook,
  deleteImportedBook as deleteFromStorage,
  importedBookToBook,
} from '@/storage/importedBooks'
import { importEpub } from '@/utils/epubImporter'
import { importPdf } from '@/utils/pdfImporter'
import { registerImportedBooks } from '@/data'

export type ImportStatus = 'idle' | 'loading' | 'success' | 'error'

export interface ImportedBooksState {
  books: Book[]
  importStatus: ImportStatus
  importError: string | null
  importBook: (file: File, options?: { wordsPerChapter?: number }) => Promise<void>
  deleteBook: (bookId: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useImportedBooks(): ImportedBooksState {
  const { settings } = useSettings()
  const [books, setBooks] = useState<Book[]>([])
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [importError, setImportError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const allMetas = await getAllImportedBooks()
      const allBooks = await Promise.all(allMetas.map(importedBookToBook))
      setBooks(allBooks)
      registerImportedBooks(allBooks)
    } catch {
      // IndexedDB unavailable or corrupted — treat as empty
      setBooks([])
      registerImportedBooks([])
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const importBook = useCallback(
    async (file: File, options?: { wordsPerChapter?: number }) => {
      setImportStatus('loading')
      setImportError(null)
      try {
        const ext = file.name.split('.').pop()?.toLowerCase()
        const result = ext === 'pdf'
          ? await importPdf(file, options?.wordsPerChapter ?? settings.pdfWordsPerChapter)
          : await importEpub(file)
        await saveImportedBook(result.meta, result.chapters)
        await refresh()
        setImportStatus('success')
      } catch (err) {
        setImportStatus('error')
        setImportError(err instanceof Error ? err.message : 'Failed to import book')
      }
    },
    [refresh],
  )

  const deleteBook = useCallback(
    async (bookId: string) => {
      await deleteFromStorage(bookId)
      await refresh()
    },
    [refresh],
  )

  return { books, importStatus, importError, importBook, deleteBook, refresh }
}
