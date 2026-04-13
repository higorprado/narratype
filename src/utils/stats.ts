import type { TypingStats } from '@/types'

export interface StatsInput {
  correctChars: number
  totalTypedChars: number
  elapsedMs: number
}

/**
 * Calculate Words Per Minute.
 * Standard formula: WPM = (correctChars / 5) / minutes
 * A "word" is standardized as 5 characters.
 *
 * Returns 0 if less than 3 seconds have elapsed — WPM readings from
 * sub-second intervals are wildly inaccurate and jittery.
 */
const MIN_WPM_ELAPSED_MS = 3_000

export function calculateWPM(correctChars: number, elapsedMs: number): number {
  if (elapsedMs < MIN_WPM_ELAPSED_MS || correctChars === 0) return 0
  const minutes = elapsedMs / 60_000
  return Math.round((correctChars / 5) / minutes)
}

/**
 * Calculate typing accuracy as a percentage.
 * ACC = (correctChars / totalTypedChars) * 100
 */
export function calculateAccuracy(
  correctChars: number,
  totalTypedChars: number,
): number {
  if (totalTypedChars === 0) return 100
  return Math.round((correctChars / totalTypedChars) * 100)
}

/**
 * Calculate all typing stats at once.
 */
export function calculateStats(input: StatsInput): TypingStats {
  return {
    wpm: calculateWPM(input.correctChars, input.elapsedMs),
    accuracy: calculateAccuracy(input.correctChars, input.totalTypedChars),
    correctChars: input.correctChars,
    totalTypedChars: input.totalTypedChars,
    elapsedMs: input.elapsedMs,
  }
}
