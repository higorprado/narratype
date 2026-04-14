import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useImportedBooks } from '@/hooks/useImportedBooks'
import type { Book } from '@/types/book'
import { SettingsProvider } from '@/context/SettingsContext'

vi.mock('@/storage/importedBooks', () => ({
  getAllImportedBooks: vi.fn(),
  getImportedBook: vi.fn(),
  saveImportedBook: vi.fn(),
  deleteImportedBook: vi.fn(),
  importedBookToBook: vi.fn(),
}))

vi.mock('@/utils/epubImporter', () => ({
  importEpub: vi.fn(),
}))

vi.mock('@/utils/pdfImporter', () => ({
  importPdf: vi.fn(),
}))

vi.mock('@/data', () => ({
  registerImportedBooks: vi.fn(),
}))

import { getAllImportedBooks, getImportedBook, saveImportedBook, deleteImportedBook, importedBookToBook } from '@/storage/importedBooks'
import { importEpub } from '@/utils/epubImporter'
import { importPdf } from '@/utils/pdfImporter'
import { registerImportedBooks } from '@/data'

const fakeBook: Book = {
  slug: 'test-book',
  title: 'Test Book',
  author: 'Author',
  language: 'en',
  coverUrl: '',
  chapters: [{ title: 'Ch 1', text: 'Hello world' }],
  isImported: true,
}

const importResult = {
  meta: { id: '1', slug: 's', title: 'T', author: 'A', language: 'en', coverUrl: '', importDate: 0, chapterCount: 1 },
  chapters: [{ bookId: '1', index: 0, title: 'Ch 1', text: 'text' }],
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>
}

describe('useImportedBooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAllImportedBooks).mockResolvedValue([])
    vi.mocked(importedBookToBook).mockResolvedValue(fakeBook)
  })

  it('initializes with empty books and idle status', () => {
    const { result } = renderHook(() => useImportedBooks(), { wrapper })

    expect(result.current.books).toEqual([])
    expect(result.current.importStatus).toBe('idle')
    expect(result.current.importError).toBeNull()
  })

  it('loads books from storage on mount via refresh', async () => {
    const meta = { id: '1', slug: 'test-book', title: 'Test', author: 'Auth', language: 'en', coverUrl: '', importDate: 0, chapterCount: 1 }
    vi.mocked(getAllImportedBooks).mockResolvedValue([meta])

    const { result } = renderHook(() => useImportedBooks(), { wrapper })

    await waitFor(() => {
      expect(result.current.books).toEqual([fakeBook])
    })

    expect(getAllImportedBooks).toHaveBeenCalled()
    expect(importedBookToBook).toHaveBeenCalledWith(meta, expect.any(Number), expect.any(Array))
    expect(registerImportedBooks).toHaveBeenCalledWith([fakeBook])
  })

  it('handles storage error gracefully (empty books)', async () => {
    vi.mocked(getAllImportedBooks).mockRejectedValue(new Error('DB broken'))

    const { result } = renderHook(() => useImportedBooks(), { wrapper })

    await waitFor(() => {
      expect(result.current.books).toEqual([])
    })

    expect(registerImportedBooks).toHaveBeenCalledWith([])
  })

  describe('importBook', () => {
    it('dispatches to importEpub for .epub files', async () => {
      const file = new File(['content'], 'book.epub', { type: 'application/epub+zip' })
      vi.mocked(importEpub).mockResolvedValue(importResult)

      const { result } = renderHook(() => useImportedBooks(), { wrapper })

      await waitFor(() => expect(getAllImportedBooks).toHaveBeenCalled())

      await act(async () => {
        await result.current.importBook(file)
      })

      expect(importEpub).toHaveBeenCalledWith(file)
      expect(importPdf).not.toHaveBeenCalled()
      expect(saveImportedBook).toHaveBeenCalledWith(importResult.meta, importResult.chapters)
      expect(result.current.importStatus).toBe('success')
      expect(result.current.importError).toBeNull()
    })

    it('dispatches to importPdf for .pdf files with default wordsPerChapter', async () => {
      const file = new File(['content'], 'book.pdf', { type: 'application/pdf' })
      vi.mocked(importPdf).mockResolvedValue(importResult)

      const { result } = renderHook(() => useImportedBooks(), { wrapper })

      await waitFor(() => expect(getAllImportedBooks).toHaveBeenCalled())

      await act(async () => {
        await result.current.importBook(file)
      })

      expect(importPdf).toHaveBeenCalledWith(file, 1750) // default pdfWordsPerChapter
      expect(importEpub).not.toHaveBeenCalled()
      expect(saveImportedBook).toHaveBeenCalledWith(importResult.meta, importResult.chapters)
      expect(result.current.importStatus).toBe('success')
    })

    it('dispatches to importPdf for .pdf files with custom wordsPerChapter', async () => {
      const file = new File(['content'], 'book.pdf', { type: 'application/pdf' })
      vi.mocked(importPdf).mockResolvedValue(importResult)

      const { result } = renderHook(() => useImportedBooks(), { wrapper })

      await waitFor(() => expect(getAllImportedBooks).toHaveBeenCalled())

      await act(async () => {
        await result.current.importBook(file, { wordsPerChapter: 3000 })
      })

      expect(importPdf).toHaveBeenCalledWith(file, 3000)
      expect(result.current.importStatus).toBe('success')
    })

    it('handles import error (sets error status and message)', async () => {
      const file = new File(['content'], 'bad.epub', { type: 'application/epub+zip' })
      vi.mocked(importEpub).mockRejectedValue(new Error('Corrupt EPUB'))

      const { result } = renderHook(() => useImportedBooks(), { wrapper })

      await waitFor(() => expect(getAllImportedBooks).toHaveBeenCalled())

      await act(async () => {
        await result.current.importBook(file)
      })

      expect(result.current.importStatus).toBe('error')
      expect(result.current.importError).toBe('Corrupt EPUB')
    })

    it('handles non-Error thrown value (uses default message)', async () => {
      const file = new File(['content'], 'bad.epub', { type: 'application/epub+zip' })
      vi.mocked(importEpub).mockRejectedValue('string error')

      const { result } = renderHook(() => useImportedBooks(), { wrapper })

      await waitFor(() => expect(getAllImportedBooks).toHaveBeenCalled())

      await act(async () => {
        await result.current.importBook(file)
      })

      expect(result.current.importStatus).toBe('error')
      expect(result.current.importError).toBe('Failed to import book')
    })
  })

  describe('deleteBook', () => {
    it('looks up by slug, deletes by id, and refreshes', async () => {
      vi.mocked(getImportedBook).mockResolvedValue({ id: 'storage-id', slug: 'book-1', title: 'T', author: 'A', language: 'en', coverUrl: '', importDate: 0, chapterCount: 1 })
      vi.mocked(deleteImportedBook).mockResolvedValue(undefined)

      const { result } = renderHook(() => useImportedBooks(), { wrapper })

      await waitFor(() => expect(getAllImportedBooks).toHaveBeenCalled())

      await act(async () => {
        await result.current.deleteBook('book-1')
      })

      expect(getImportedBook).toHaveBeenCalledWith('book-1')
      expect(deleteImportedBook).toHaveBeenCalledWith('storage-id')
      expect(getAllImportedBooks).toHaveBeenCalledTimes(2)
    })
  })

  describe('refresh', () => {
    it('updates books from storage', async () => {
      const meta = { id: '2', slug: 'new-book', title: 'New', author: 'Auth', language: 'en', coverUrl: '', importDate: 0, chapterCount: 1 }
      vi.mocked(getAllImportedBooks).mockResolvedValue([])

      const { result } = renderHook(() => useImportedBooks(), { wrapper })

      await waitFor(() => {
        expect(result.current.books).toEqual([])
      })

      vi.mocked(getAllImportedBooks).mockResolvedValue([meta])

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.books).toEqual([fakeBook])
      expect(registerImportedBooks).toHaveBeenCalledWith([fakeBook])
    })

    it('handles storage failure', async () => {
      vi.mocked(getAllImportedBooks).mockResolvedValue([])

      const { result } = renderHook(() => useImportedBooks(), { wrapper })

      await waitFor(() => {
        expect(result.current.books).toEqual([])
      })

      vi.mocked(getAllImportedBooks).mockRejectedValue(new Error('disk full'))

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.books).toEqual([])
      expect(registerImportedBooks).toHaveBeenCalledWith([])
    })
  })
})
