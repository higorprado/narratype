import { describe, it, expect } from 'vitest'
import { normalizeBookText } from '../textNormalizer'

describe('normalizeBookText', () => {
  it('replaces single newlines with spaces', () => {
    const input = 'first line\nsecond line'
    expect(normalizeBookText(input)).toBe('first line second line')
  })

  it('preserves double newlines as paragraph breaks', () => {
    const input = 'first paragraph\n\nsecond paragraph'
    expect(normalizeBookText(input)).toBe('first paragraph\n\nsecond paragraph')
  })

  it('handles multiple consecutive newlines by collapsing to double', () => {
    const input = 'para one\n\n\n\npara two'
    expect(normalizeBookText(input)).toBe('para one\n\npara two')
  })

  it('handles mixed single and double newlines', () => {
    const input = 'line one\nline two\n\nline three\nline four\n\nline five'
    expect(normalizeBookText(input)).toBe('line one line two\n\nline three line four\n\nline five')
  })

  it('collapses multiple spaces created by newline replacement', () => {
    const input = 'word \n word'
    expect(normalizeBookText(input)).toBe('word word')
  })

  it('trims leading and trailing whitespace', () => {
    const input = '  hello world  '
    expect(normalizeBookText(input)).toBe('hello world')
  })

  it('handles text with only single newlines (no paragraph breaks)', () => {
    const input = 'line one\nline two\nline three'
    expect(normalizeBookText(input)).toBe('line one line two line three')
  })

  it('handles empty string', () => {
    expect(normalizeBookText('')).toBe('')
  })

  it('handles text that is already normalized', () => {
    const input = 'clean text with no newlines'
    expect(normalizeBookText(input)).toBe('clean text with no newlines')
  })

  it('handles leading/trailing newlines', () => {
    const input = '\nhello world\n'
    expect(normalizeBookText(input)).toBe('hello world')
  })

  it('preserves single newline at start of double-newline pair', () => {
    const input = 'para one\n\npara two'
    const result = normalizeBookText(input)
    expect(result).toContain('\n\n')
    expect(result.indexOf('\n')).toBe(result.lastIndexOf('\n') - 1)
  })

  it('handles real Project Gutenberg text patterns', () => {
    const input = `Ts’ao Kung, in defining the meaning of the Chinese for the title of
this chapter, says it refers to the deliberations in the temple
selected by the general for his temporary use.

1. Sun Tzŭ said: The art of war is of vital importance to the State.`
    const result = normalizeBookText(input)
    // Single newlines should be replaced with spaces
    expect(result).not.toMatch(/(?<!\n)\n(?!\n)/)
    // Paragraph break should be preserved
    expect(result).toContain('\n\n')
  })
})
