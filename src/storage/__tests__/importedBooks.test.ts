import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getAllImportedBooks,
  getImportedBook,
  getChapter,
  getAllChapters,
  importedBookToBook,
  saveImportedBook,
  deleteImportedBook,
  updateImportedBook,
} from '@/storage/importedBooks'
import type { ImportedBookMeta, ImportedChapter } from '@/types/book'

const DB_NAME = 'narratype-imported'

/**
 * Clear all object stores by opening our own connection.
 * We can't deleteDatabase because the module under test opens
 * connections it never closes, which blocks deletion.
 */
function clearStores(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('books')) {
        const bookStore = db.createObjectStore('books', { keyPath: 'id' })
        bookStore.createIndex('slug', 'slug', { unique: true })
      }
      if (!db.objectStoreNames.contains('chapters')) {
        db.createObjectStore('chapters', { keyPath: ['bookId', 'index'] })
      }
    }
    req.onsuccess = () => {
      const db = req.result
      const storeNames = Array.from(db.objectStoreNames) as string[]
      if (!storeNames.includes('books') || !storeNames.includes('chapters')) {
        db.close()
        resolve()
        return
      }
      const tx = db.transaction(['books', 'chapters'], 'readwrite')
      tx.objectStore('books').clear()
      tx.objectStore('chapters').clear()
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => {
        db.close()
        reject(tx.error)
      }
    }
    req.onerror = () => reject(req.error)
  })
}

function makeMeta(overrides: Partial<ImportedBookMeta> = {}): ImportedBookMeta {
  return {
    id: 'book-1',
    slug: 'test-book',
    title: 'Test Book',
    author: 'Test Author',
    language: 'en',
    coverUrl: '',
    importDate: 1000,
    chapterCount: 2,
    ...overrides,
  }
}

function makeChapter(
  bookId: string,
  index: number,
  overrides: Partial<ImportedChapter> = {},
): ImportedChapter {
  return {
    bookId,
    index,
    title: `Chapter ${index}`,
    text: `Text of chapter ${index}`,
    ...overrides,
  }
}

describe('importedBooks storage', () => {
  beforeEach(async () => {
    await clearStores()
  })

  it('saveImportedBook stores meta and chapters', async () => {
    const meta = makeMeta()
    const chapters = [makeChapter('book-1', 0), makeChapter('book-1', 1)]

    await saveImportedBook(meta, chapters)

    const books = await getAllImportedBooks()
    expect(books).toHaveLength(1)
    expect(books[0]).toEqual(meta)

    const ch0 = await getChapter('book-1', 0)
    expect(ch0).toEqual(chapters[0])
  })

  it('getAllImportedBooks returns saved books', async () => {
    const meta1 = makeMeta({ id: 'a', slug: 'book-a', title: 'A' })
    const meta2 = makeMeta({ id: 'b', slug: 'book-b', title: 'B' })

    await saveImportedBook(meta1, [])
    await saveImportedBook(meta2, [])

    const books = await getAllImportedBooks()
    expect(books).toHaveLength(2)
    const titles = books.map((b) => b.title).sort()
    expect(titles).toEqual(['A', 'B'])
  })

  it('getImportedBook finds by slug', async () => {
    const meta = makeMeta({ slug: 'my-slug' })
    await saveImportedBook(meta, [])

    const found = await getImportedBook('my-slug')
    expect(found).toBeDefined()
    expect(found!.id).toBe('book-1')
  })

  it('getImportedBook returns undefined for unknown slug', async () => {
    const result = await getImportedBook('nonexistent')
    expect(result).toBeUndefined()
  })

  it('getChapter returns chapter by bookId and index', async () => {
    const meta = makeMeta()
    const ch = makeChapter('book-1', 3, { title: 'Third Chapter' })
    await saveImportedBook(meta, [ch])

    const result = await getChapter('book-1', 3)
    expect(result).toBeDefined()
    expect(result!.title).toBe('Third Chapter')
  })

  it('getAllChapters returns sorted chapters for a book', async () => {
    const meta = makeMeta()
    const chapters = [
      makeChapter('book-1', 2),
      makeChapter('book-1', 0),
      makeChapter('book-1', 1),
    ]
    await saveImportedBook(meta, chapters)

    const result = await getAllChapters('book-1')
    expect(result).toHaveLength(3)
    expect(result.map((c) => c.index)).toEqual([0, 1, 2])
  })

  it('importedBookToBook converts meta to Book format', async () => {
    const meta = makeMeta({ slug: 'converted-book', title: 'Converted' })
    const chapters = [
      makeChapter('book-1', 0, { title: 'Intro', text: 'Hello' }),
      makeChapter('book-1', 1, { title: 'Body', text: 'World' }),
    ]
    await saveImportedBook(meta, chapters)

    const book = await importedBookToBook(meta)
    expect(book.slug).toBe('converted-book')
    expect(book.title).toBe('Converted')
    expect(book.isImported).toBe(true)
    expect(book.chapters).toEqual([
      { title: 'Intro', text: 'Hello' },
      { title: 'Body', text: 'World' },
    ])
  })

  it('deleteImportedBook removes book and its chapters', async () => {
    const meta = makeMeta()
    const chapters = [makeChapter('book-1', 0), makeChapter('book-1', 1)]
    await saveImportedBook(meta, chapters)

    await deleteImportedBook('book-1')

    const books = await getAllImportedBooks()
    expect(books).toHaveLength(0)

    const ch = await getChapter('book-1', 0)
    expect(ch).toBeUndefined()
  })

  it('deleteImportedBook handles book with no chapters', async () => {
    const meta = makeMeta()
    await saveImportedBook(meta, [])

    await deleteImportedBook('book-1')

    const books = await getAllImportedBooks()
    expect(books).toHaveLength(0)
  })

  it('updateImportedBook updates title and regenerates slug', async () => {
    const meta = makeMeta()
    await saveImportedBook(meta, [])

    await updateImportedBook('book-1', { title: 'Updated Title' })

    const books = await getAllImportedBooks()
    expect(books).toHaveLength(1)
    expect(books[0].title).toBe('Updated Title')
    expect(books[0].slug).toBe('updated-title-test-author')
  })

  it('updateImportedBook updates author and regenerates slug', async () => {
    const meta = makeMeta()
    await saveImportedBook(meta, [])

    await updateImportedBook('book-1', { author: 'New Author' })

    const books = await getAllImportedBooks()
    expect(books).toHaveLength(1)
    expect(books[0].author).toBe('New Author')
    expect(books[0].slug).toBe('test-book-new-author')
  })

  it('updateImportedBook updates both title and author', async () => {
    const meta = makeMeta()
    await saveImportedBook(meta, [])

    await updateImportedBook('book-1', { title: 'New Title', author: 'New Author' })

    const books = await getAllImportedBooks()
    expect(books).toHaveLength(1)
    expect(books[0].title).toBe('New Title')
    expect(books[0].author).toBe('New Author')
    expect(books[0].slug).toBe('new-title-new-author')
  })

  it('updateImportedBook rejects for non-existent book', async () => {
    await expect(
      updateImportedBook('nonexistent', { title: 'X' }),
    ).rejects.toThrow('Book not found: nonexistent')
  })
})
