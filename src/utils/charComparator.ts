import { CharState } from '@/types'

export interface CompareOptions {
  ignoreCapitalization?: boolean
  internationalMode?: boolean
  skipPunctuation?: boolean
}

const PUNCTUATION = new Set([
  '.', ',', ';', ':', '!', '?', '"', "'", 
  '(', ')', '[', ']', '{', '}', '-', 
  '\u2014', '\u2013', '\u201C', '\u201D', '\u2018', '\u2019',
])

/**
 * Compare a typed character against the expected character.
 * Returns CORRECT or INCORRECT based on matching rules and active options.
 */
export function compareChars(
  typed: string,
  expected: string,
  options: CompareOptions = {},
): CharState {
  // International mode: em-dash handling
  if (options.internationalMode && expected === '\u2014' && typed === '-') {
    // First dash of a double-dash sequence — caller handles the two-char mapping.
    // For now, treat individual '-' against em-dash as incorrect
    // (the typing engine handles the '--' -> em-dash conversion)
  }

  // Direct match
  if (typed === expected) return CharState.CORRECT

  // Ignore capitalization
  if (options.ignoreCapitalization) {
    if (typed.toLowerCase() === expected.toLowerCase()) {
      return CharState.CORRECT
    }
  }

  return CharState.INCORRECT
}

/**
 * Check if a character is punctuation.
 */
export function isPunctuation(char: string): boolean {
  return PUNCTUATION.has(char)
}

/**
 * Check if a typed character should be treated as a skip-over for punctuation.
 * When skipPunctuation is enabled, the typing engine auto-advances past punctuation.
 */
export function shouldSkipPunctuation(char: string): boolean {
  return PUNCTUATION.has(char)
}
