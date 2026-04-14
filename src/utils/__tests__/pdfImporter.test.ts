import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetPage = vi.fn()
const mockDestroy = vi.fn()
const mockGetDocument = vi.fn()

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: (...args: unknown[]) => mockGetDocument(...args),
}))

import { importPdf } from '@/utils/pdfImporter'

function makeTextItem(str: string, hasEOL = false) {
  return { str, hasEOL, dir: 'ltr', transform: [], width: 0, height: 0 }
}

let pages: Array<{ getTextContent: ReturnType<typeof vi.fn> }>

function setupPdf(pageTexts: string[][]) {
  pages = pageTexts.map((items) => {
    const getTextContent = vi.fn().mockResolvedValue({
      items: items.map((str) => makeTextItem(str, true)),
    })
    return { getTextContent }
  })

  mockGetPage.mockImplementation((pageNum: number) => {
    const page = pages[pageNum - 1]
    if (!page) throw new Error(`Page ${pageNum} not found`)
    return Promise.resolve(page)
  })

  mockGetDocument.mockReturnValue({
    promise: Promise.resolve({
      numPages: pages.length,
      getPage: mockGetPage,
      destroy: mockDestroy,
    }),
  })
}

describe('importPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('extracts text from a single-page PDF', async () => {
    setupPdf([['Hello world']])

    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })
    const result = await importPdf(file, 100)

    expect(result.meta.title).toBe('test')
    expect(result.meta.author).toBe('Unknown Author')
    expect(result.chapters).toHaveLength(1)
    expect(result.chapters[0].text).toContain('Hello world')
    expect(result.chapters[0].title).toBe('Chapter 1')
    expect(mockDestroy).toHaveBeenCalled()
  })

  it('splits text into chapters by word count', async () => {
    // 6 words per page, 3 pages = 18 words total
    setupPdf([
      ['word1 word2 word3 word4 word5 word6'],
      ['word7 word8 word9 word10 word11 word12'],
      ['word13 word14 word15 word16 word17 word18'],
    ])

    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })
    // 10 words per chapter -> first chapter gets ~10, second gets ~8
    const result = await importPdf(file, 10)

    expect(result.chapters.length).toBeGreaterThanOrEqual(2)
    expect(result.meta.chapterCount).toBe(result.chapters.length)
  })

  it('keeps paragraphs together when both fit under the word limit', async () => {
    // Two short paragraphs: 4 words each, total 8 words
    setupPdf([['para1 w1 w2 w3\n\npara2 w1 w2 w3']])

    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })
    const result = await importPdf(file, 15)

    // Both paragraphs in one chapter (4+4=8 < 15)
    expect(result.chapters).toHaveLength(1)
    expect(result.chapters[0].text).toContain('para1')
    expect(result.chapters[0].text).toContain('para2')
  })

  it('breaks at paragraph boundary when next paragraph would exceed limit', async () => {
    // Page 1 has two paragraphs of 8 words each, page 2 has one of 8
    setupPdf([
      ['para1 w1 w2 w3 w4 w5 w6 w7 w8\n\npara2 w1 w2 w3 w4 w5 w6 w7 w8'],
    ])

    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })
    const result = await importPdf(file, 10)

    // First paragraph (8 words) < 10, so it stays alone
    // Second paragraph (8 words) would make it 16 > 10, so new chapter
    expect(result.chapters).toHaveLength(2)
    expect(result.chapters[0].text).toContain('para1')
    expect(result.chapters[0].text).not.toContain('para2')
    expect(result.chapters[1].text).toContain('para2')
  })

  it('throws when PDF has no pages', async () => {
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 0,
        getPage: mockGetPage,
        destroy: mockDestroy,
      }),
    })

    const file = new File(['data'], 'empty.pdf', { type: 'application/pdf' })
    await expect(importPdf(file)).rejects.toThrow('PDF has no pages')
  })

  it('throws when all pages have no extractable text', async () => {
    setupPdf([[''], ['   ']])

    const file = new File(['data'], 'blank.pdf', { type: 'application/pdf' })
    await expect(importPdf(file)).rejects.toThrow('PDF contains no extractable text content')
  })

  it('generates correct slug and metadata', async () => {
    setupPdf([['Some text here']])

    const file = new File(['data'], 'My Great Book.pdf', { type: 'application/pdf' })
    const result = await importPdf(file, 100)

    expect(result.meta.title).toBe('My Great Book')
    expect(result.meta.slug).toBe('my-great-book-unknown-author')
    expect(result.meta.language).toBe('en')
    expect(result.meta.coverUrl).toBe('')
    expect(result.meta.importDate).toBeGreaterThan(0)
    expect(result.meta.id).toBeTruthy()
  })

  it('uses default wordsPerChapter of 1750', async () => {
    const pageTexts = Array.from({ length: 7 }, (_, i) => [`Page ${i + 1} text content here`])
    setupPdf(pageTexts)

    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })
    const result = await importPdf(file) // no wordsPerChapter arg

    // With only ~7 words per page × 7 pages = 49 total, and 1750 words/chapter -> 1 chapter
    expect(result.chapters).toHaveLength(1)
  })

  it('calls doc.destroy() even on error', async () => {
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockRejectedValue(new Error('page load failed')),
        destroy: mockDestroy,
      }),
    })

    const file = new File(['data'], 'broken.pdf', { type: 'application/pdf' })
    await expect(importPdf(file)).rejects.toThrow('page load failed')
    expect(mockDestroy).toHaveBeenCalled()
  })
})
