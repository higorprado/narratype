import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetPage = vi.fn()
const mockDestroy = vi.fn()
const mockGetDocument = vi.fn()

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: (...args: unknown[]) => mockGetDocument(...args),
}))

import { importPdf } from '@/utils/pdfImporter'

/**
 * Create a text content item with position data.
 * Items are placed in a simple single-column layout by default.
 */
function makeTextItem(str: string, opts?: { x?: number; y?: number; width?: number; height?: number }) {
  return {
    str,
    dir: 'ltr',
    transform: [12, 0, 0, 12, opts?.x ?? 50, opts?.y ?? 400],
    width: opts?.width ?? str.length * 7,
    height: opts?.height ?? 12,
    fontName: 'g_font',
  }
}

/**
 * Create text items for a simple page layout where each string is on its own line.
 * Lines are spaced 20 units apart, starting from y=400 downward.
 */
function makePageItems(texts: string[]): ReturnType<typeof makeTextItem>[] {
  return texts.map((text, i) => makeTextItem(text, { y: 400 - i * 20 }))
}

let pages: Array<{ getTextContent: ReturnType<typeof vi.fn> }>

function setupPdf(pageTextArrays: string[][]) {
  pages = pageTextArrays.map((texts) => {
    const getTextContent = vi.fn().mockResolvedValue({
      items: makePageItems(texts),
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
    setupPdf([
      ['word1 word2 word3 word4 word5 word6'],
      ['word7 word8 word9 word10 word11 word12'],
      ['word13 word14 word15 word16 word17 word18'],
    ])

    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })
    const result = await importPdf(file, 10)

    expect(result.chapters.length).toBeGreaterThanOrEqual(2)
    expect(result.meta.chapterCount).toBe(result.chapters.length)
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
    // Pages with only whitespace strings — these get filtered by trim check
    pages = [
      {
        getTextContent: vi.fn().mockResolvedValue({
          items: [makeTextItem('   ', { y: 400 })],
        }),
      },
      {
        getTextContent: vi.fn().mockResolvedValue({
          items: [makeTextItem('  ', { y: 400 })],
        }),
      },
    ]

    mockGetPage.mockImplementation((pageNum: number) => {
      return Promise.resolve(pages[pageNum - 1])
    })

    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage: mockGetPage,
        destroy: mockDestroy,
      }),
    })

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
    const result = await importPdf(file)

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

  it('filters out repeating header/footer text', async () => {
    // 12 pages with the same header/footer at fixed positions, unique body each page
    pages = Array.from({ length: 12 }, (_, i) => ({
      getTextContent: vi.fn().mockResolvedValue({
        items: [
          makeTextItem('Page Header', { x: 50, y: 500 }),
          makeTextItem(`Body text page ${i + 1}`, { x: 50, y: 400 }),
          makeTextItem('Page Footer', { x: 50, y: 10 }),
        ],
      }),
    }))

    mockGetPage.mockImplementation((pageNum: number) => {
      return Promise.resolve(pages[pageNum - 1])
    })

    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: pages.length,
        getPage: mockGetPage,
        destroy: mockDestroy,
      }),
    })

    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })
    const result = await importPdf(file, 1000)

    const fullText = result.chapters.map(c => c.text).join(' ')
    expect(fullText).toContain('Body text page 1')
    // Header and footer should be filtered (appear on 12/12 >= 75% of 12 scanned)
    expect(fullText).not.toContain('Page Header')
    expect(fullText).not.toContain('Page Footer')
  })

  it('keeps non-repeating text that shares a page with headers', async () => {
    // 10 pages: all have header, but each has unique body text
    pages = Array.from({ length: 10 }, (_, i) => ({
      getTextContent: vi.fn().mockResolvedValue({
        items: [
          makeTextItem('Repeated Header', { x: 50, y: 500 }),
          makeTextItem(`Unique page ${i + 1} text`, { x: 50, y: 400 }),
        ],
      }),
    }))

    mockGetPage.mockImplementation((pageNum: number) => {
      return Promise.resolve(pages[pageNum - 1])
    })

    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: pages.length,
        getPage: mockGetPage,
        destroy: mockDestroy,
      }),
    })

    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' })
    const result = await importPdf(file, 1000)

    const fullText = result.chapters.map(c => c.text).join(' ')
    expect(fullText).not.toContain('Repeated Header')
    expect(fullText).toContain('Unique page 1')
    expect(fullText).toContain('Unique page 10')
  })

  it('separates multi-column text within a single line', async () => {
    // Single page with two columns: left at x=50, right at x=400
    pages = [{
      getTextContent: vi.fn().mockResolvedValue({
        items: [
          makeTextItem('Left column text', { x: 50, y: 400, width: 150 }),
          makeTextItem('Right column text', { x: 400, y: 400, width: 150 }),
        ],
      }),
    }]

    mockGetPage.mockImplementation((pageNum: number) => {
      return Promise.resolve(pages[pageNum - 1])
    })

    mockGetDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: mockGetPage,
        destroy: mockDestroy,
      }),
    })

    const file = new File(['data'], 'twocol.pdf', { type: 'application/pdf' })
    const result = await importPdf(file, 1000)

    const fullText = result.chapters[0].text
    expect(fullText).toContain('Left column text')
    expect(fullText).toContain('Right column text')
    // The two columns should be on separate lines, not concatenated
    expect(fullText).not.toContain('Left column text Right column text')
  })
})
