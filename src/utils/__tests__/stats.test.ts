import { describe, it, expect } from 'vitest'
import { calculateWPM, calculateAccuracy, calculateStats } from '../stats'

describe('calculateWPM', () => {
  it('should calculate WPM from correct chars and elapsed time', () => {
    // 300 correct chars in 1 minute = 60 WPM (300/5 = 60 words)
    const wpm = calculateWPM(300, 60_000)
    expect(wpm).toBe(60)
  })

  it('should return 0 when elapsed time is 0', () => {
    expect(calculateWPM(300, 0)).toBe(0)
  })

  it('should return 0 when correct chars is 0', () => {
    expect(calculateWPM(0, 60_000)).toBe(0)
  })

  it('should handle fractional minutes correctly', () => {
    // 150 correct chars in 30 seconds = (150/5) / 0.5 = 60 WPM
    const wpm = calculateWPM(150, 30_000)
    expect(wpm).toBe(60)
  })

  it('should return 0 when less than 3 seconds have elapsed', () => {
    // 5 correct chars in 2 seconds — too early for reliable WPM
    expect(calculateWPM(5, 2_000)).toBe(0)
    // Exactly 3 seconds should compute
    expect(calculateWPM(25, 3_000)).toBe(100)
  })
})

describe('calculateAccuracy', () => {
  it('should calculate accuracy from correct and total typed chars', () => {
    // 90 correct out of 100 total = 90%
    expect(calculateAccuracy(90, 100)).toBe(90)
  })

  it('should return 100 when no chars typed yet', () => {
    expect(calculateAccuracy(0, 0)).toBe(100)
  })

  it('should return 0 when all chars are incorrect', () => {
    expect(calculateAccuracy(0, 100)).toBe(0)
  })

  it('should return 100 when all chars are correct', () => {
    expect(calculateAccuracy(100, 100)).toBe(100)
  })

  it('should handle partial accuracy', () => {
    expect(calculateAccuracy(75, 100)).toBe(75)
  })
})

describe('calculateStats', () => {
  it('should return combined stats', () => {
    const stats = calculateStats({
      correctChars: 250,
      totalTypedChars: 300,
      elapsedMs: 60_000,
    })
    expect(stats.wpm).toBe(50) // (250/5) / 1 = 50
    expect(stats.accuracy).toBe(83)
    expect(stats.correctChars).toBe(250)
    expect(stats.totalTypedChars).toBe(300)
    expect(stats.elapsedMs).toBe(60_000)
  })

  it('should handle zero elapsed time', () => {
    const stats = calculateStats({
      correctChars: 100,
      totalTypedChars: 100,
      elapsedMs: 0,
    })
    expect(stats.wpm).toBe(0)
    expect(stats.accuracy).toBe(100)
  })
})
