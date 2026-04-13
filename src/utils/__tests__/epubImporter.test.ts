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
