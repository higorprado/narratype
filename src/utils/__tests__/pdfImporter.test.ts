import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetTextContent = vi.fn()
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
    // pdfjs uses 1-indexed pages
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
    const result = await importPdf(file)

    expect(result.meta.title).toBe('test')
    expect(result.meta.author).toBe('Unknown Author')
    expect(result.chapters).toHaveLength(1)
    expect(result.chapters[0].text).toContain('Hello world')
    expect(result.chapters[0].title).toBe('Chapter 1')
    expect(mockDestroy).toHaveBeenCalled()
  })

  it('groups pages into chapters based on pagesPerChapter', async () => {
    setupPdf([
      ['Page 1 text'],
      ['Page 2 text'],
      ['Page 3 text'],
      ['Page 4 text'],
      ['Page 5 text'],
      ['Page 6 text'],
    ])

    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })
    const result = await importPdf(file, 3)

    expect(result.chapters).toHaveLength(2)
    expect(result.chapters[0].text).toContain('Page 1 text')
    expect(result.chapters[0].text).toContain('Page 3 text')
    expect(result.chapters[1].text).toContain('Page 4 text')
    expect(result.chapters[1].text).toContain('Page 6 text')
    expect(result.meta.chapterCount).toBe(2)
  })

  it('handles single page per chapter (pagesPerChapter=1)', async () => {
    setupPdf([['Page A'], ['Page B'], ['Page C']])

    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })
    const result = await importPdf(file, 1)

    expect(result.chapters).toHaveLength(3)
    expect(result.chapters[0].text).toContain('Page A')
    expect(result.chapters[2].text).toContain('Page C')
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

  it('keeps chapters that have at least some non-empty text', async () => {
    // First page empty, second page has text, third page empty
    setupPdf([[''], ['Real content'], ['']])

    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })
    const result = await importPdf(file, 3)

    // All 3 pages in one chapter; the joined text contains "Real content" so it's kept
    expect(result.chapters).toHaveLength(1)
    expect(result.chapters[0].text).toContain('Real content')
  })

  it('generates correct slug and metadata', async () => {
    setupPdf([['Some text']])

    const file = new File(['data'], 'My Great Book.pdf', { type: 'application/pdf' })
    const result = await importPdf(file)

    expect(result.meta.title).toBe('My Great Book')
    expect(result.meta.slug).toBe('my-great-book-unknown-author')
    expect(result.meta.language).toBe('en')
    expect(result.meta.coverUrl).toBe('')
    expect(result.meta.importDate).toBeGreaterThan(0)
    expect(result.meta.id).toBeTruthy()
  })

  it('uses default pagesPerChapter of 5', async () => {
    // 7 pages with default grouping = 2 chapters (5 + 2)
    const pageTexts = Array.from({ length: 7 }, (_, i) => [`Page ${i + 1}`])
    setupPdf(pageTexts)

    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })
    const result = await importPdf(file)

    expect(result.chapters).toHaveLength(2)
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
