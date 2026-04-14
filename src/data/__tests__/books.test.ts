import { describe, it, expect } from 'vitest'
import { books } from '../books'
import { getAllBooks, getBookBySlug, getChapter, getPage, getPageCount } from '../index'

describe('books data', () => {
  it('has exactly 3 books', () => {
    expect(books).toHaveLength(3)
  })

  it('each book has required fields', () => {
    for (const book of books) {
      expect(book.slug).toBeTruthy()
      expect(book.title).toBeTruthy()
      expect(book.author).toBeTruthy()
      expect(book.language).toBe('en')
      expect(book.coverUrl).toBeDefined()
      expect(Array.isArray(book.chapters)).toBe(true)
      expect(book.chapters.length).toBeGreaterThan(0)
    }
  })

  it('each chapter has non-empty title and text', () => {
    for (const book of books) {
      for (const chapter of book.chapters) {
        expect(chapter.title.trim().length).toBeGreaterThan(0)
        expect(chapter.text.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('slugs are unique', () => {
    const slugs = books.map((b) => b.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('contains expected books', () => {
    const slugs = books.map((b) => b.slug)
    expect(slugs).toContain('alice-in-wonderland')
    expect(slugs).toContain('the-call-of-cthulhu')
    expect(slugs).toContain('a-christmas-carol')
  })

  it('Alice in Wonderland has 12 chapters', () => {
    const book = getBookBySlug('alice-in-wonderland')!
    expect(book.chapters).toHaveLength(12)
  })

  it('The Call of Cthulhu has 3 sections', () => {
    const book = getBookBySlug('the-call-of-cthulhu')!
    expect(book.chapters).toHaveLength(3)
  })

  it('A Christmas Carol has 5 staves', () => {
    const book = getBookBySlug('a-christmas-carol')!
    expect(book.chapters).toHaveLength(5)
  })
})

describe('getAllBooks', () => {
  it('returns all books', () => {
    expect(getAllBooks()).toEqual(books)
  })
})

describe('getBookBySlug', () => {
  it('returns the correct book for a valid slug', () => {
    const book = getBookBySlug('the-call-of-cthulhu')
    expect(book).toBeDefined()
    expect(book!.slug).toBe('the-call-of-cthulhu')
  })

  it('returns undefined for an invalid slug', () => {
    expect(getBookBySlug('nonexistent')).toBeUndefined()
  })
})

describe('getChapter', () => {
  it('returns the correct chapter for valid indices', () => {
    const chapter = getChapter('the-call-of-cthulhu', 0)
    expect(chapter).toBeDefined()
    expect(chapter!.title).toBeTruthy()
    expect(chapter!.text).toBeTruthy()
  })

  it('returns undefined for negative index', () => {
    expect(getChapter('the-call-of-cthulhu', -1)).toBeUndefined()
  })

  it('returns undefined for out-of-bounds index', () => {
    const book = getBookBySlug('the-call-of-cthulhu')!
    expect(getChapter('the-call-of-cthulhu', book.chapters.length)).toBeUndefined()
  })

  it('returns undefined for invalid book slug', () => {
    expect(getChapter('nonexistent', 0)).toBeUndefined()
  })
})

describe('getPage', () => {
  it('returns a page with correct text for valid inputs', () => {
    const page = getPage('the-call-of-cthulhu', 0, 0)
    expect(page).toBeDefined()
    expect(page!.text).toBeTruthy()
    expect(page!.chapterIndex).toBe(0)
    expect(page!.pageIndex).toBe(0)
  })

  it('returns undefined for negative page index', () => {
    expect(getPage('the-call-of-cthulhu', 0, -1)).toBeUndefined()
  })

  it('returns undefined for out-of-bounds page index', () => {
    const count = getPageCount('the-call-of-cthulhu', 0)
    expect(getPage('the-call-of-cthulhu', 0, count)).toBeUndefined()
  })

  it('returns undefined for invalid chapter index', () => {
    expect(getPage('the-call-of-cthulhu', -1, 0)).toBeUndefined()
  })

  it('returns undefined for invalid book slug', () => {
    expect(getPage('nonexistent', 0, 0)).toBeUndefined()
  })
})

describe('getPageCount', () => {
  it('returns a positive number for valid inputs', () => {
    const count = getPageCount('the-call-of-cthulhu', 0)
    expect(count).toBeGreaterThan(0)
  })

  it('returns 0 for invalid book slug', () => {
    expect(getPageCount('nonexistent', 0)).toBe(0)
  })

  it('returns 0 for invalid chapter index', () => {
    expect(getPageCount('the-call-of-cthulhu', -1)).toBe(0)
    expect(getPageCount('the-call-of-cthulhu', 999)).toBe(0)
  })
})
