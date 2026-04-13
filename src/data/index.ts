import { books } from './books'
import type { Book, BookSlug, Page } from '@/types/book'
import { splitTextIntoPages } from '@/utils/textSplitter'
import { normalizeBookText } from '@/utils/textNormalizer'

export function getAllBooks(): Book[] {
  return books
}

export function getBookBySlug(slug: BookSlug): Book | undefined {
  return books.find((b) => b.slug === slug)
}

export function getChapter(bookSlug: BookSlug, chapterIndex: number) {
  const book = getBookBySlug(bookSlug)
  if (!book || chapterIndex < 0 || chapterIndex >= book.chapters.length) return undefined
  const chapter = book.chapters[chapterIndex]
  return { ...chapter, text: normalizeBookText(chapter.text) }
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
