import type { ImportedBookMeta, ImportedChapter, Book } from '@/types/book'
import { generateSlug } from '@/utils/slugify'

const DB_NAME = 'narratype-imported'
const DB_VERSION = 1
const BOOKS_STORE = 'books'
const CHAPTERS_STORE = 'chapters'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(BOOKS_STORE)) {
        const bookStore = db.createObjectStore(BOOKS_STORE, { keyPath: 'id' })
        bookStore.createIndex('slug', 'slug', { unique: true })
      }
      if (!db.objectStoreNames.contains(CHAPTERS_STORE)) {
        db.createObjectStore(CHAPTERS_STORE, { keyPath: ['bookId', 'index'] })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function withTransaction<T>(
  mode: IDBTransactionMode,
  stores: string[],
  fn: (tx: IDBTransaction) => Promise<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(stores, mode)
        tx.oncomplete = () => resolve(undefined as T)
        tx.onerror = () => reject(tx.error)
        fn(tx).catch(reject)
      }),
  )
}

// --- Reads ---

export async function getAllImportedBooks(): Promise<ImportedBookMeta[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKS_STORE, 'readonly')
    const store = tx.objectStore(BOOKS_STORE)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getImportedBook(slug: string): Promise<ImportedBookMeta | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKS_STORE, 'readonly')
    const store = tx.objectStore(BOOKS_STORE)
    const index = store.index('slug')
    const request = index.get(slug)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getChapter(
  bookId: string,
  chapterIndex: number,
): Promise<ImportedChapter | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHAPTERS_STORE, 'readonly')
    const store = tx.objectStore(CHAPTERS_STORE)
    const request = store.get([bookId, chapterIndex])
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllChapters(bookId: string): Promise<ImportedChapter[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHAPTERS_STORE, 'readonly')
    const store = tx.objectStore(CHAPTERS_STORE)
    const request = store.getAll()
    request.onsuccess = () => {
      const all = request.result as ImportedChapter[]
      resolve(all.filter((ch) => ch.bookId === bookId).sort((a, b) => a.index - b.index))
    }
    request.onerror = () => reject(request.error)
  })
}

/** Convert ImportedBookMeta + chapters into the app's Book interface. */
export async function importedBookToBook(meta: ImportedBookMeta): Promise<Book> {
  const chapters = await getAllChapters(meta.id)
  return {
    slug: meta.slug,
    title: meta.title,
    author: meta.author,
    language: meta.language,
    coverUrl: meta.coverUrl,
    chapters: chapters.map((ch) => ({ title: ch.title, text: ch.text })),
    isImported: true,
  }
}

// --- Writes ---

export async function saveImportedBook(
  meta: ImportedBookMeta,
  chapters: ImportedChapter[],
): Promise<void> {
  await withTransaction('readwrite', [BOOKS_STORE, CHAPTERS_STORE], async (tx) => {
    const bookStore = tx.objectStore(BOOKS_STORE)
    bookStore.put(meta)
    const chapterStore = tx.objectStore(CHAPTERS_STORE)
    for (const chapter of chapters) {
      chapterStore.put(chapter)
    }
  })
}

export async function deleteImportedBook(bookId: string): Promise<void> {
  await withTransaction('readwrite', [BOOKS_STORE, CHAPTERS_STORE], async (tx) => {
    tx.objectStore(BOOKS_STORE).delete(bookId)
    // Delete all chapters for this book
    const chapterStore = tx.objectStore(CHAPTERS_STORE)
    await new Promise<void>((resolve, reject) => {
      const request = chapterStore.getAll()
      request.onsuccess = () => {
        const all = request.result as ImportedChapter[]
        for (const ch of all) {
          if (ch.bookId === bookId) {
            chapterStore.delete([ch.bookId, ch.index])
          }
        }
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  })
}

export async function updateImportedBook(
  id: string,
  updates: { title?: string; author?: string },
): Promise<ImportedBookMeta> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BOOKS_STORE, 'readwrite')
    const store = tx.objectStore(BOOKS_STORE)
    const request = store.get(id)
    request.onsuccess = () => {
      const meta = request.result as ImportedBookMeta | undefined
      if (!meta) {
        reject(new Error(`Book not found: ${id}`))
        return
      }
      const updated = { ...meta, ...updates }
      updated.slug = generateSlug(updated.title, updated.author)
      store.put(updated)
      tx.oncomplete = () => resolve(updated)
      tx.onerror = () => reject(tx.error)
    }
    request.onerror = () => reject(request.error)
  })
}
