import { describe, it, expect } from 'vitest'
import { compareChars, isPunctuation, shouldSkipPunctuation } from '../charComparator'
import { CharState } from '@/types'

describe('compareChars', () => {
  it('should return CORRECT for matching characters', () => {
    expect(compareChars('a', 'a')).toBe(CharState.CORRECT)
  })

  it('should return INCORRECT for non-matching characters', () => {
    expect(compareChars('b', 'a')).toBe(CharState.INCORRECT)
  })

  it('should match space with space', () => {
    expect(compareChars(' ', ' ')).toBe(CharState.CORRECT)
  })

  it('should match newline with newline', () => {
    expect(compareChars('\n', '\n')).toBe(CharState.CORRECT)
  })

  describe('ignoreCapitalization', () => {
    it('should match lowercase with uppercase when enabled', () => {
      expect(compareChars('a', 'A', { ignoreCapitalization: true })).toBe(CharState.CORRECT)
    })

    it('should match uppercase with lowercase when enabled', () => {
      expect(compareChars('A', 'a', { ignoreCapitalization: true })).toBe(CharState.CORRECT)
    })

    it('should not match different letters even with ignoreCapitalization', () => {
      expect(compareChars('a', 'B', { ignoreCapitalization: true })).toBe(CharState.INCORRECT)
    })

    it('should be case-sensitive when disabled', () => {
      expect(compareChars('a', 'A', { ignoreCapitalization: false })).toBe(CharState.INCORRECT)
    })
  })

  describe('internationalMode', () => {
    it('should convert double hyphen to em-dash', () => {
      // When user types '--' and expected is em-dash
      expect(compareChars('\u2014', '\u2014', { internationalMode: true })).toBe(CharState.CORRECT)
    })
  })

  describe('skipPunctuation', () => {
    it('should mark punctuation as CORRECT when enabled and typed char matches', () => {
      expect(compareChars('.', '.', { skipPunctuation: true })).toBe(CharState.CORRECT)
    })

    it('should still mark punctuation as INCORRECT when wrong punctuation typed', () => {
      expect(compareChars('.', ',', { skipPunctuation: true })).toBe(CharState.INCORRECT)
    })
  })

  describe('combined options', () => {
    it('should apply ignoreCapitalization and skipPunctuation together', () => {
      expect(compareChars('a', 'A', { ignoreCapitalization: true, skipPunctuation: true })).toBe(CharState.CORRECT)
    })
  })
})


describe('isPunctuation', () => {
  it('returns true for common punctuation', () => {
    const chars = ['.', ',', ';', ':', '!', '?', '"', "'", '(', ')', '-', '\u2014', '\u2013']
    for (const ch of chars) {
      expect(isPunctuation(ch)).toBe(true)
    }
  })

  it('returns false for letters', () => {
    expect(isPunctuation('a')).toBe(false)
    expect(isPunctuation('Z')).toBe(false)
  })

  it('returns false for digits', () => {
    expect(isPunctuation('1')).toBe(false)
  })

  it('returns false for space', () => {
    expect(isPunctuation(' ')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isPunctuation('')).toBe(false)
  })
})

describe('shouldSkipPunctuation', () => {
  it('returns true for punctuation characters', () => {
    const chars = ['.', ',', ';', ':', '!', '?', '"', "'", '(', ')', '-', '\u2014', '\u2013']
    for (const ch of chars) {
      expect(shouldSkipPunctuation(ch)).toBe(true)
    }
  })

  it('returns false for non-punctuation characters', () => {
    expect(shouldSkipPunctuation('a')).toBe(false)
    expect(shouldSkipPunctuation('Z')).toBe(false)
    expect(shouldSkipPunctuation('1')).toBe(false)
    expect(shouldSkipPunctuation(' ')).toBe(false)
    expect(shouldSkipPunctuation('')).toBe(false)
  })
})