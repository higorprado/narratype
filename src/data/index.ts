import { books } from './books'
import type { Book, BookSlug, Page } from '@/types/book'
import { splitTextIntoPages } from '@/utils/textSplitter'
import { normalizeBookText } from '@/utils/textNormalizer'

/** In-memory cache of imported books populated by useImportedBooks hook. */
let importedBooksCache: Book[] = []

/** Register imported books in the data layer. Called by useImportedBooks. */
export function registerImportedBooks(imported: Book[]): void {
  importedBooksCache = imported
}

/** Get all books (built-in + imported). */
export function getAllBooks(): Book[] {
  return [...books, ...importedBooksCache]
}

export function getBookBySlug(slug: BookSlug): Book | undefined {
  return getAllBooks().find((b) => b.slug === slug)
}

export function getChapter(bookSlug: BookSlug, chapterIndex: number) {
  const book = getBookBySlug(bookSlug)
  if (!book || chapterIndex < 0 || chapterIndex >= book.chapters.length) return undefined
  const chapter = book.chapters[chapterIndex]
  // Imported books are already normalized; built-in books need normalization
  const text = book.isImported ? chapter.text : normalizeBookText(chapter.text)
  return { ...chapter, text }
}

export function getPage(bookSlug: BookSlug, chapterIndex: number, pageIndex: number): Page | undefined {
  const chapter = getChapter(bookSlug, chapterIndex)
  if (!chapter) return undefined
  const pages = splitTextIntoPages(chapter.text)
  if (pageIndex < 0 || pageIndex >= pages.length) return undefined
  return { text: pages[pageIndex], chapterIndex, pageIndex }
}

export function getPageCount(bookSlug: BookSlug, chapterIndex: number): number {
  const chapter = getChapter(bookSlug, chapterIndex)
  if (!chapter) return 0
  return splitTextIntoPages(chapter.text).length
}
