import { describe, it, expect } from 'vitest'
import { htmlToPlainText } from '../epubImporter'
import { normalizeBookText } from '../textNormalizer'

describe('htmlToPlainText', () => {
  it('should extract text from simple HTML', () => {
    const result = htmlToPlainText('<p>Hello world</p>')
    expect(result.trim()).toBe('Hello world')
  })

  it('should preserve paragraph breaks between block elements', () => {
    const html = '<p>First paragraph</p><p>Second paragraph</p>'
    const result = htmlToPlainText(html).trim()
    expect(result).toBe('First paragraph\n\nSecond paragraph')
  })

  it('should separate headings from paragraphs', () => {
    const html = '<h1>Title</h1><p>Content</p>'
    const result = htmlToPlainText(html).trim()
    expect(result).toBe('Title\n\nContent')
  })

  it('should handle nested block elements', () => {
    const html = '<div><p>Inner</p></div><p>Next</p>'
    const result = htmlToPlainText(html).trim()
    expect(result).toContain('Inner')
    expect(result).toContain('Next')
    expect(result).toContain('\n\n')
  })

  it('should handle <br> as single newline', () => {
    const html = '<p>Line 1<br>Line 2</p>'
    const result = htmlToPlainText(html).trim()
    expect(result).toContain('Line 1\nLine 2')
  })

  it('should handle list items as separate blocks', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'
    const result = htmlToPlainText(html).trim()
    expect(result).toContain('Item 1')
    expect(result).toContain('Item 2')
    expect(result).toContain('\n\n')
  })

  it('should collapse excessive newlines to max two', () => {
    const html = '<p>A</p><p></p><p>B</p>'
    const result = htmlToPlainText(html)
    expect(result).not.toMatch(/\n{3,}/)
  })

  it('should trim whitespace from line starts and ends', () => {
    const html = '<p>  Hello  </p><p>  World  </p>'
    const result = htmlToPlainText(html)
    expect(result).not.toMatch(/(^|\n) +/)
    expect(result).not.toMatch(/ +(\n|$)/)
  })

  it('should collapse horizontal whitespace', () => {
    const html = '<p>Hello     world</p>'
    const result = htmlToPlainText(html)
    expect(result).toContain('Hello world')
    expect(result).not.toContain('  ')
  })

  it('should return empty string for empty body', () => {
    expect(htmlToPlainText('')).toBe('')
  })

  it('should produce \\n\\n between paragraphs that survive normalizeBookText', () => {
    // The key integration requirement: htmlToPlainText output fed through
    // normalizeBookText should preserve paragraph breaks as \n\n
    const html = '<p>First paragraph.</p><p>Second paragraph.</p>'
    const raw = htmlToPlainText(html)
    const normalized = normalizeBookText(raw)
    expect(normalized).toContain('\n\n')
    expect(normalized).toContain('First paragraph.')
    expect(normalized).toContain('Second paragraph.')
  })
})

import { vi, beforeEach } from 'vitest'
import { importEpub } from '../epubImporter'

const mockDestroy = vi.fn()
const mockLoadChapter = vi.fn()
const mockGetMetadata = vi.fn()
const mockGetSpine = vi.fn()
const mockEpub = {
  getMetadata: mockGetMetadata,
  getSpine: mockGetSpine,
  loadChapter: mockLoadChapter,
  destroy: mockDestroy,
}

vi.mock('@lingo-reader/epub-parser', () => ({
  initEpubFile: vi.fn(() => Promise.resolve(mockEpub)),
}))

function makeFile(name: string): File {
  return new File([], name, { type: 'application/epub+zip' })
}

describe('importEpub', () => {
  beforeEach(() => {
    mockGetMetadata.mockReset()
    mockGetSpine.mockReset()
    mockLoadChapter.mockReset()
    mockDestroy.mockReset()
  })

  it('extracts metadata and chapters from valid EPUB', async () => {
    mockGetMetadata.mockReturnValue({
      title: 'Test Book',
      creator: [{ contributor: 'Jane Doe' }],
      language: 'en',
    })
    mockGetSpine.mockReturnValue([
      { id: 'ch1', href: 'ch1.xhtml', mediaType: 'application/xhtml+xml' },
      { id: 'ch2', href: 'ch2.xhtml', mediaType: 'application/xhtml+xml' },
    ])
    mockLoadChapter
      .mockResolvedValueOnce({ html: '<p>Chapter one content</p>', css: [] })
      .mockResolvedValueOnce({ html: '<p>Chapter two content</p>', css: [] })

    const result = await importEpub(makeFile('test.epub'))

    expect(result.meta.title).toBe('Test Book')
    expect(result.meta.author).toBe('Jane Doe')
    expect(result.meta.language).toBe('en')
    expect(result.chapters).toHaveLength(2)
    expect(result.chapters[0].title).toBe('Chapter 1')
    expect(result.chapters[1].title).toBe('Chapter 2')
  })

  it('falls back to filename when title is empty', async () => {
    mockGetMetadata.mockReturnValue({
      title: '',
      creator: [{ contributor: 'Jane Doe' }],
      language: 'en',
    })
    mockGetSpine.mockReturnValue([
      { id: 'ch1', href: 'ch1.xhtml', mediaType: 'application/xhtml+xml' },
    ])
    mockLoadChapter.mockResolvedValue({ html: '<p>Content</p>', css: [] })

    const result = await importEpub(makeFile('my-book.epub'))

    expect(result.meta.title).toBe('my-book')
  })

  it('falls back to Unknown Author when no creator', async () => {
    mockGetMetadata.mockReturnValue({ title: 'Some Book', language: 'en' })
    mockGetSpine.mockReturnValue([
      { id: 'ch1', href: 'ch1.xhtml', mediaType: 'application/xhtml+xml' },
    ])
    mockLoadChapter.mockResolvedValue({ html: '<p>Content</p>', css: [] })

    const result = await importEpub(makeFile('test.epub'))

    expect(result.meta.author).toBe('Unknown Author')
  })

  it('skips empty chapters and re-indexes', async () => {
    mockGetMetadata.mockReturnValue({
      title: 'Test Book',
      creator: [{ contributor: 'Author' }],
      language: 'en',
    })
    mockGetSpine.mockReturnValue([
      { id: 'ch1', href: 'ch1.xhtml', mediaType: 'application/xhtml+xml' },
      { id: 'ch2', href: 'ch2.xhtml', mediaType: 'application/xhtml+xml' },
      { id: 'ch3', href: 'ch3.xhtml', mediaType: 'application/xhtml+xml' },
    ])
    mockLoadChapter
      .mockResolvedValueOnce({ html: '<p>First</p>', css: [] })
      .mockResolvedValueOnce({ html: '<p></p>', css: [] })
      .mockResolvedValueOnce({ html: '<p>Third</p>', css: [] })

    const result = await importEpub(makeFile('test.epub'))

    expect(result.chapters).toHaveLength(2)
    expect(result.chapters[0].index).toBe(0)
    expect(result.chapters[0].title).toBe('Chapter 1')
    expect(result.chapters[1].index).toBe(1)
    expect(result.chapters[1].title).toBe('Chapter 2')
  })

  it('throws when spine is empty', async () => {
    mockGetMetadata.mockReturnValue({
      title: 'Empty',
      creator: [{ contributor: 'Author' }],
      language: 'en',
    })
    mockGetSpine.mockReturnValue([])

    await expect(importEpub(makeFile('empty.epub'))).rejects.toThrow(
      'EPUB has no readable chapters',
    )
  })

  it('throws when all chapters are empty', async () => {
    mockGetMetadata.mockReturnValue({
      title: 'NoText',
      creator: [{ contributor: 'Author' }],
      language: 'en',
    })
    mockGetSpine.mockReturnValue([
      { id: 'ch1', href: 'ch1.xhtml', mediaType: 'application/xhtml+xml' },
      { id: 'ch2', href: 'ch2.xhtml', mediaType: 'application/xhtml+xml' },
    ])
    mockLoadChapter.mockResolvedValue({ html: '<p></p>', css: [] })

    await expect(importEpub(makeFile('notext.epub'))).rejects.toThrow(
      'EPUB contains no extractable text content',
    )
  })

  it('skips individual chapters that fail to load', async () => {
    mockGetMetadata.mockReturnValue({
      title: 'Partial',
      creator: [{ contributor: 'Author' }],
      language: 'en',
    })
    mockGetSpine.mockReturnValue([
      { id: 'ch1', href: 'ch1.xhtml', mediaType: 'application/xhtml+xml' },
      { id: 'ch2', href: 'ch2.xhtml', mediaType: 'application/xhtml+xml' },
      { id: 'ch3', href: 'ch3.xhtml', mediaType: 'application/xhtml+xml' },
    ])
    mockLoadChapter
      .mockResolvedValueOnce({ html: '<p>First</p>', css: [] })
      .mockRejectedValueOnce(new Error('load failed'))
      .mockResolvedValueOnce({ html: '<p>Third</p>', css: [] })

    const result = await importEpub(makeFile('partial.epub'))

    expect(result.chapters).toHaveLength(2)
    expect(result.chapters[0].title).toBe('Chapter 1')
    expect(result.chapters[1].title).toBe('Chapter 2')
  })

  it('calls destroy in finally block even on error', async () => {
    mockGetMetadata.mockReturnValue({
      title: 'Fail',
      creator: [{ contributor: 'Author' }],
      language: 'en',
    })
    mockGetSpine.mockReturnValue([])

    await expect(importEpub(makeFile('fail.epub'))).rejects.toThrow()
    expect(mockDestroy).toHaveBeenCalled()
  })

  it('generates slug from title and author', async () => {
    mockGetMetadata.mockReturnValue({
      title: 'My Great Book',
      creator: [{ contributor: 'Jane Doe' }],
      language: 'en',
    })
    mockGetSpine.mockReturnValue([
      { id: 'ch1', href: 'ch1.xhtml', mediaType: 'application/xhtml+xml' },
    ])
    mockLoadChapter.mockResolvedValue({ html: '<p>Content</p>', css: [] })

    const result = await importEpub(makeFile('test.epub'))

    // generateSlug('My Great Book', 'Jane Doe') -> 'my-great-book-jane-doe'
    expect(result.meta.slug).toBe('my-great-book-jane-doe')
  })
})
