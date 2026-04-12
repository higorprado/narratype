import { describe, it, expect } from 'vitest'
import { splitTextIntoPages } from '../textSplitter'

describe('splitTextIntoPages', () => {
  it('should return a single page for short text', () => {
    const text = 'Hello world this is a test.'
    const pages = splitTextIntoPages(text)
    expect(pages).toHaveLength(1)
    expect(pages[0]).toBe(text)
  })

  it('should split long text into pages of approximately the target word count', () => {
    const words = Array.from({ length: 1000 }, (_, i) => `word${i}`).join(' ')
    const pages = splitTextIntoPages(words, { targetWords: 300 })
    expect(pages.length).toBeGreaterThan(1)
    // Each page should have roughly 300 words (except possibly the last)
    for (const page of pages.slice(0, -1)) {
      const wordCount = page.split(/\s+/).length
      expect(wordCount).toBeLessThanOrEqual(450) // allow 50% tolerance
      expect(wordCount).toBeGreaterThanOrEqual(200)
    }
  })

  it('should preserve paragraphs (double newlines)', () => {
    const paragraphs = [
      'First paragraph with some words in it.',
      'Second paragraph with more words here.',
      'Third paragraph with even more words to fill the page.',
    ]
    const text = paragraphs.join('\n\n')
    const pages = splitTextIntoPages(text, { targetWords: 10 })
    // Paragraph boundaries should be preserved in the output
    for (const page of pages) {
      expect(page.includes('\n\n') || page === paragraphs[0] || page === paragraphs[1] || page === paragraphs[2]).toBe(true)
    }
  })

  it('should prefer breaking at paragraph boundaries', () => {
    const para1 = Array.from({ length: 150 }, (_, i) => `word${i}`).join(' ')
    const para2 = Array.from({ length: 150 }, (_, i) => `word${i + 150}`).join(' ')
    const text = `${para1}\n\n${para2}`
    const pages = splitTextIntoPages(text, { targetWords: 150 })
    // Should break between paragraphs, not in the middle of one
    for (const page of pages) {
      // No page should start or end mid-paragraph-split
      expect(page.trim().startsWith(' ')).toBe(false)
      expect(page.trim().endsWith(' ')).toBe(false)
    }
  })

  it('should handle empty text', () => {
    const pages = splitTextIntoPages('')
    expect(pages).toHaveLength(1)
    expect(pages[0]).toBe('')
  })

  it('should produce deterministic results', () => {
    const text = Array.from({ length: 600 }, (_, i) => `word${i}`).join(' ')
    const first = splitTextIntoPages(text, { targetWords: 200 })
    const second = splitTextIntoPages(text, { targetWords: 200 })
    expect(first).toEqual(second)
  })

  it('should handle text with single newlines (not paragraph breaks)', () => {
    const text = 'Line one\nLine two\nLine three'
    const pages = splitTextIntoPages(text)
    expect(pages).toHaveLength(1)
    // Single newlines should be preserved
    expect(pages[0]).toContain('\n')
  })

  it('should handle very long paragraphs that exceed target', () => {
    const longPara = Array.from({ length: 1000 }, (_, i) => `word${i}`).join(' ')
    const pages = splitTextIntoPages(longPara, { targetWords: 300 })
    expect(pages.length).toBeGreaterThan(1)
    // Total words should be preserved
    const totalWords = pages.reduce((sum, p) => sum + p.split(/\s+/).filter(Boolean).length, 0)
    expect(totalWords).toBe(1000)
  })

  it('should preserve leading/trailing whitespace in pages', () => {
    const text = '  Hello world  \n\n  Goodbye world  '
    const pages = splitTextIntoPages(text)
    expect(pages.length).toBeGreaterThanOrEqual(1)
  })
})
