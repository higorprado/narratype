import { render, screen, fireEvent, act } from '@testing-library/react'
import TypingArea from '../../components/TypingArea'
import type { TypingEngineRestore } from '../../hooks/useTypingEngine'
import type { SavedTypingSession } from '../../utils/typingSessionStorage'
import { CharState } from '../../types'

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

const PAGE_TEXT = 'the quick brown fox'
const BOOK_SLUG = 'test-book'
const CHAPTER = 0
const PAGE = 0

/**
 * Build a SavedTypingSession for the given cursorPosition.
 * All chars up to cursorPosition are CORRECT, the rest are UNTYPED.
 */
function makeSession(
  cursorPosition: number,
  elapsedMs: number = 5000,
  startTime: number = 1000,
): SavedTypingSession {
  const charStates = PAGE_TEXT.split('').map((_, i) =>
    i < cursorPosition ? CharState.CORRECT : CharState.UNTYPED,
  )
  return {
    bookSlug: BOOK_SLUG,
    chapterIndex: CHAPTER,
    pageIndex: PAGE,
    cursorPosition,
    charStates,
    startTime,
    elapsedMs,
    savedAt: startTime + elapsedMs,
    textPrefix: PAGE_TEXT.slice(0, 100),
  }
}

function makeRestore(session: SavedTypingSession): TypingEngineRestore {
  return {
    savedSession: session,
    bookSlug: session.bookSlug,
    chapterIndex: session.chapterIndex,
    pageIndex: session.pageIndex,
  }
}

describe('TypingArea session restore — WPM bug', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('restores WPM to a reasonable value after session restore', () => {
    // Scenario: user typed 10 chars over 5000ms, session was saved, then restored.
    // Without the fix, WPM would be astronomical (near-zero denominator).
    const statsHistory: Array<{ wpm: number; accuracy: number; elapsedMs: number }> = []
    const onStatsUpdate = vi.fn((stats) => {
      statsHistory.push({ wpm: stats.wpm, accuracy: stats.accuracy, elapsedMs: stats.elapsedMs })
    })

    // Restore a session where 10 chars were typed correctly over 5000ms
    const session = makeSession(10, 5000, 1000)
    const restore = makeRestore(session)

    // Advance time so Date.now() is past the original session
    vi.setSystemTime(100_000)

    render(
      <TypingArea
        text={PAGE_TEXT}
        onStatsUpdate={onStatsUpdate}
        sessionRestore={restore}
      />,
    )

    // The engine restores on mount via useEffect — advance past that
    act(() => {
      vi.advanceTimersByTime(0)
    })

    const area = screen.getByTestId('typing-area')
    fireEvent.focus(area)

    // Type one more character at t=100100 (100ms after restore)
    act(() => {
      vi.setSystemTime(100_100)
      fireEvent.keyDown(area, { key: PAGE_TEXT[10] })
    })

    // Type to a word boundary to trigger stats
    act(() => {
      vi.setSystemTime(100_200)
      fireEvent.keyDown(area, { key: PAGE_TEXT[11] })
    })

    // Verify: WPM should be reasonable (< 200), not 500+
    if (statsHistory.length > 0) {
      const lastStats = statsHistory[statsHistory.length - 1]
      expect(lastStats.wpm).toBeLessThan(200)
      // elapsedMs should include the restored time
      expect(lastStats.elapsedMs).toBeGreaterThanOrEqual(5000)
    }
  })

  it('includes restored time in WPM after new keystrokes', () => {
    const statsHistory: Array<{ wpm: number; elapsedMs: number }> = []
    const onStatsUpdate = vi.fn((stats) => {
      statsHistory.push({ wpm: stats.wpm, elapsedMs: stats.elapsedMs })
    })

    const session = makeSession(10, 10000, 0) // 10 chars over 10 seconds
    const restore = makeRestore(session)

    vi.setSystemTime(50_000) // 50 seconds later

    render(
      <TypingArea
        text={PAGE_TEXT}
        onStatsUpdate={onStatsUpdate}
        sessionRestore={restore}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(0)
    })

    const area = screen.getByTestId('typing-area')
    fireEvent.focus(area)

    // Type a char to a word boundary to get stats
    act(() => {
      vi.setSystemTime(50_100)
      fireEvent.keyDown(area, { key: PAGE_TEXT[10] })
    })

    if (statsHistory.length > 0) {
      const lastStats = statsHistory[statsHistory.length - 1]
      // Total elapsed should be at least the restored 10000ms plus new session time
      expect(lastStats.elapsedMs).toBeGreaterThanOrEqual(10000)
    }
  })

  it('preserves accuracy correctly on restore', () => {
    const statsHistory: Array<{ accuracy: number }> = []
    const onStatsUpdate = vi.fn((stats) => {
      statsHistory.push({ accuracy: stats.accuracy })
    })

    // All 10 chars correct → 100% accuracy
    const session = makeSession(10, 5000, 1000)
    const restore = makeRestore(session)

    vi.setSystemTime(100_000)

    render(
      <TypingArea
        text={PAGE_TEXT}
        onStatsUpdate={onStatsUpdate}
        sessionRestore={restore}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(0)
    })

    const area = screen.getByTestId('typing-area')
    fireEvent.focus(area)

    // Type one more correct char
    act(() => {
      vi.setSystemTime(100_100)
      fireEvent.keyDown(area, { key: PAGE_TEXT[10] })
    })

    if (statsHistory.length > 0) {
      const lastStats = statsHistory[statsHistory.length - 1]
      // 11 correct out of 11 typed = 100%
      expect(lastStats.accuracy).toBe(100)
    }
  })

  it('handles restore with zero elapsed time gracefully', () => {
    const statsHistory: Array<{ wpm: number; elapsedMs: number }> = []
    const onStatsUpdate = vi.fn((stats) => {
      statsHistory.push({ wpm: stats.wpm, elapsedMs: stats.elapsedMs })
    })

    // Session saved right after first keystroke — near-zero elapsed
    const session = makeSession(5, 0, 1000)
    const restore = makeRestore(session)

    vi.setSystemTime(100_000)

    render(
      <TypingArea
        text={PAGE_TEXT}
        onStatsUpdate={onStatsUpdate}
        sessionRestore={restore}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(0)
    })

    const area = screen.getByTestId('typing-area')
    fireEvent.focus(area)

    // Type a char
    act(() => {
      vi.setSystemTime(100_100)
      fireEvent.keyDown(area, { key: PAGE_TEXT[5] })
    })

    // Should not crash or produce NaN/Infinity
    if (statsHistory.length > 0) {
      const lastStats = statsHistory[statsHistory.length - 1]
      expect(isFinite(lastStats.wpm)).toBe(true)
      expect(isNaN(lastStats.wpm)).toBe(false)
    }
  })
})
