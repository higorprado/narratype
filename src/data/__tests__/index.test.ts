import { describe, it, expect, beforeEach } from 'vitest'
import type { Book } from '@/types/book'
import {
  registerImportedBooks,
  getAllBooks,
  getBookBySlug,
  getChapter,
  getPage,
  getPageCount,
} from '@/data'

const fakeImportedBook: Book = {
  slug: 'fake-imported-book',
  title: 'Fake Imported Book',
  author: 'Test Author',
  language: 'en',
  coverUrl: '',
  chapters: [
    { title: 'Chapter One', text: 'Hello world from imported book chapter one.' },
    { title: 'Chapter Two', text: 'Second chapter of the imported book.' },
  ],
  isImported: true,
}

describe('data/index', () => {
  beforeEach(() => {
    registerImportedBooks([])
  })

  describe('getAllBooks', () => {
    it('returns built-in books', () => {
      const all = getAllBooks()
      expect(all.length).toBeGreaterThan(0)
      const slugs = all.map((b) => b.slug)
      expect(slugs).toContain('the-art-of-war')
    })

    it('includes both built-in and imported books', () => {
      registerImportedBooks([fakeImportedBook])
      const all = getAllBooks()
      const slugs = all.map((b) => b.slug)
      expect(slugs).toContain('the-art-of-war')
      expect(slugs).toContain('fake-imported-book')
    })
  })

  describe('registerImportedBooks', () => {
    it('adds imported books to the list', () => {
      registerImportedBooks([fakeImportedBook])
      const all = getAllBooks()
      expect(all.some((b) => b.slug === 'fake-imported-book')).toBe(true)
    })
  })

  describe('getBookBySlug', () => {
    it('finds a built-in book', () => {
      const book = getBookBySlug('the-art-of-war')
      expect(book).toBeDefined()
      expect(book!.slug).toBe('the-art-of-war')
      expect(book!.chapters.length).toBeGreaterThan(0)
    })

    it('returns undefined for unknown slug', () => {
      const book = getBookBySlug('nonexistent-book-slug')
      expect(book).toBeUndefined()
    })

    it('finds an imported book', () => {
      registerImportedBooks([fakeImportedBook])
      const book = getBookBySlug('fake-imported-book')
      expect(book).toBeDefined()
      expect(book!.title).toBe('Fake Imported Book')
    })
  })

  describe('getChapter', () => {
    it('returns chapter from built-in book', () => {
      const chapter = getChapter('the-art-of-war', 0)
      expect(chapter).toBeDefined()
      expect(chapter!.title).toBeDefined()
      expect(chapter!.text.length).toBeGreaterThan(0)
    })

    it('returns undefined for invalid index', () => {
      const book = getBookBySlug('the-art-of-war')!
      const outOfBounds = book.chapters.length + 10
      expect(getChapter('the-art-of-war', outOfBounds)).toBeUndefined()
      expect(getChapter('the-art-of-war', -1)).toBeUndefined()
    })
  })

  describe('getPage', () => {
    it('returns page text', () => {
      const page = getPage('the-art-of-war', 0, 0)
      expect(page).toBeDefined()
      expect(page!.text.length).toBeGreaterThan(0)
      expect(page!.chapterIndex).toBe(0)
      expect(page!.pageIndex).toBe(0)
    })

    it('returns undefined for invalid page', () => {
      const page = getPage('the-art-of-war', 0, 99999)
      expect(page).toBeUndefined()
    })

    it('returns undefined for invalid chapter', () => {
      const page = getPage('the-art-of-war', 99999, 0)
      expect(page).toBeUndefined()
    })

    it('splits with custom targetWords parameter', () => {
      const chapter = getChapter('the-art-of-war', 0)!
      // Use a very small targetWords to force many pages
      const pageCountSmall = getPageCount('the-art-of-war', 0, 10)
      const pageCountDefault = getPageCount('the-art-of-war', 0)
      expect(pageCountSmall).toBeGreaterThan(pageCountDefault)

      const page = getPage('the-art-of-war', 0, 0, 10)
      expect(page).toBeDefined()
      expect(page!.text.length).toBeLessThan(chapter.text.length)
    })
  })

  describe('getPageCount', () => {
    it('returns correct count', () => {
      const count = getPageCount('the-art-of-war', 0)
      expect(count).toBeGreaterThan(0)
      // Verify consistency: requesting page at count-1 should succeed, at count should fail
      expect(getPage('the-art-of-war', 0, count - 1)).toBeDefined()
      expect(getPage('the-art-of-war', 0, count)).toBeUndefined()
    })

    it('returns 0 for invalid chapter', () => {
      expect(getPageCount('the-art-of-war', 99999)).toBe(0)
      expect(getPageCount('nonexistent-book', 0)).toBe(0)
    })
  })
})
