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
    // Curly apostrophe should be normalized to straight
    expect(result).toContain("Ts'ao")
    expect(result).not.toContain('\u2019')
  })

  it('normalizes curly single quotes to straight apostrophes', () => {
    expect(normalizeBookText('it\u2019s')).toBe("it's")
    expect(normalizeBookText('\u2018hello\u2019')).toBe("'hello'")
  })

  it('normalizes curly double quotes to straight quotes', () => {
    expect(normalizeBookText('\u201Chello\u201D')).toBe('"hello"')
  })

  it('normalizes guillemets to straight quotes', () => {
    expect(normalizeBookText('\u00ABhello\u00BB')).toBe('"hello"')
  })

  it('handles mixed curly and straight quotes', () => {
    const input = `He said \u201Cit\u2019s fine\u201D and left`
    expect(normalizeBookText(input)).toBe('He said "it\'s fine" and left')
  })

  it('normalizes breve-u to plain u', () => {
    expect(normalizeBookText('Sun Tz\u016D')).toBe('Sun Tzu')
  })

  it('normalizes ligatures', () => {
    expect(normalizeBookText('\u0153uvre')).toBe('oeuvre')
    expect(normalizeBookText('\u0152uvre')).toBe('Oeuvre')
  })

  it('normalizes section sign', () => {
    expect(normalizeBookText('see \u00A726')).toBe('see sec.26')
  })

  it('normalizes ellipsis', () => {
    expect(normalizeBookText('wait\u2026')).toBe('wait...')
  })

  it('normalizes accented characters to ASCII', () => {
    expect(normalizeBookText('caf\u00E9')).toBe('cafe')
    expect(normalizeBookText('\u00FCber')).toBe('uber')
    expect(normalizeBookText('r\u00F4le')).toBe('role')
  })
})
