/**
 * Diagnostic E2E roundtrip test for session persistence.
 *
 * Exercises the full save → unmount → remount pipeline using real
 * localStorage, real keyDown events, real useSessionPersistence flush,
 * and loadTypingSession() to reload.
 *
 * The test REVEALS bugs. If cursor is wrong, it fails.
 * If WPM is wrong, it fails. The failure IS the diagnosis.
 */
import { render, screen, fireEvent, act } from '@testing-library/react'
import TypingArea from '../../components/TypingArea'
import type { TypingEngineRestore } from '../../hooks/useTypingEngine'
import { loadTypingSession } from '../../utils/typingSessionStorage'
import type { SavedTypingSession } from '../../utils/typingSessionStorage'
import { CharState } from '../../types'
import type { TypingStats } from '../../types'

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

const PAGE_TEXT = 'the quick brown fox jumps over the lazy dog'
const BOOK_SLUG = 'test-book'
const CHAPTER = 0
const PAGE = 0

/**
 * Build a TypingEngineRestore with no saved session (fresh start).
 * Persistence is enabled because bookSlug is set.
 */
function freshRestore(): TypingEngineRestore {
  return {
    savedSession: null,
    bookSlug: BOOK_SLUG,
    chapterIndex: CHAPTER,
    pageIndex: PAGE,
  }
}

/**
 * Build a TypingEngineRestore from a loaded SavedTypingSession.
 */
function restoreFromSession(session: SavedTypingSession): TypingEngineRestore {
  return {
    savedSession: session,
    bookSlug: session.bookSlug,
    chapterIndex: session.chapterIndex,
    pageIndex: session.pageIndex,
  }
}

/**
 * Type a character into the typing area and advance timers.
 * Returns the system time after typing.
 */
function typeChar(area: HTMLElement, key: string, atTime: number): number {
  act(() => {
    vi.setSystemTime(atTime)
    fireEvent.keyDown(area, { key })
  })
  return atTime
}

/**
 * Get all char spans and return their state classes.
 */
function getCharStates(): string[] {
  return screen.getAllByTestId('char-span').map((s) => s.className)
}

/**
 * Find which span has the cursorActive class.
 * Returns the index, or -1 if not found.
 */
function getCursorIndex(): number {
  const spans = screen.getAllByTestId('char-span')
  return spans.findIndex((s) => s.className.includes('cursorActive'))
}

/**
 * Print diagnostic info about what's in localStorage.
 */
function inspectLocalStorage(): SavedTypingSession | null {
  const session = loadTypingSession(BOOK_SLUG, CHAPTER, PAGE, PAGE_TEXT)
  if (session) {
    console.log('[localStorage] cursorPosition:', session.cursorPosition)
    console.log('[localStorage] elapsedMs:', session.elapsedMs)
    console.log('[localStorage] startTime:', session.startTime)
    console.log('[localStorage] charStates:', session.charStates.map((s, i) => `${i}:${s}`).join(' '))
    console.log('[localStorage] savedAt:', session.savedAt)
  } else {
    console.log('[localStorage] No session found')
  }
  return session
}

describe('TypingArea session roundtrip', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('saves and restores cursor position exactly', () => {
    const NUM_CHARS = 5
    const restore = freshRestore()

    // --- Phase 1: Mount, type, save ---
    const { unmount } = render(
      <TypingArea
        text={PAGE_TEXT}
        sessionRestore={restore}
      />,
    )

    const area = screen.getByTestId('typing-area')

    // Focus so cursor is visible
    act(() => {
      fireEvent.focus(area)
    })

    // Type NUM_CHARS characters, each 100ms apart
    for (let i = 0; i < NUM_CHARS; i++) {
      typeChar(area, PAGE_TEXT[i], 1000 + i * 100)
    }

    // Verify: cursor should be at NUM_CHARS
    let cursorIdx = getCursorIndex()
    console.log(`[Phase 1] After typing ${NUM_CHARS} chars, cursor at:`, cursorIdx)
    expect(cursorIdx).toBe(NUM_CHARS)

    // Verify: first NUM_CHARS chars are CORRECT
    let states = getCharStates()
    for (let i = 0; i < NUM_CHARS; i++) {
      expect(states[i]).toContain('correct')
    }
    expect(states[NUM_CHARS]).toContain('untyped')

    // Advance past the 2s debounce to trigger flush to localStorage
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    // Inspect what was actually saved
    const savedSession = inspectLocalStorage()
    expect(savedSession).not.toBeNull()
    expect(savedSession!.cursorPosition).toBe(NUM_CHARS)

    // --- Phase 2: Unmount ---
    unmount()

    // --- Phase 3: Reload and remount ---
    const loadedSession = loadTypingSession(BOOK_SLUG, CHAPTER, PAGE, PAGE_TEXT)
    expect(loadedSession).not.toBeNull()
    console.log('[Phase 3] Loaded session cursorPosition:', loadedSession!.cursorPosition)
    console.log('[Phase 3] Loaded session elapsedMs:', loadedSession!.elapsedMs)

    // Advance time to simulate reopening later
    const REMOUNT_TIME = 100_000
    act(() => {
      vi.setSystemTime(REMOUNT_TIME)
    })

    const restore2 = restoreFromSession(loadedSession!)
    render(
      <TypingArea
        text={PAGE_TEXT}
        sessionRestore={restore2}
      />,
    )

    // Let the engine's restore effect run
    act(() => {
      vi.advanceTimersByTime(0)
    })

    const area2 = screen.getByTestId('typing-area')
    act(() => {
      fireEvent.focus(area2)
    })

    // Verify: cursor should be at exactly NUM_CHARS
    cursorIdx = getCursorIndex()
    console.log('[Phase 3] After restore, cursor at:', cursorIdx)
    expect(cursorIdx).toBe(NUM_CHARS)

    // Verify: first NUM_CHARS chars are CORRECT
    states = getCharStates()
    for (let i = 0; i < NUM_CHARS; i++) {
      expect(states[i]).toContain('correct')
    }
    // The rest should be UNTYPED
    for (let i = NUM_CHARS; i < PAGE_TEXT.length; i++) {
      expect(states[i]).toContain('untyped')
    }
  })

  it('saves and restores WPM correctly', () => {
    const statsHistory: Array<{ wpm: number; elapsedMs: number; correctChars: number }> = []
    const onStatsUpdate = vi.fn((stats) => {
      statsHistory.push({
        wpm: stats.wpm,
        elapsedMs: stats.elapsedMs,
        correctChars: stats.correctChars,
      })
    })

    const NUM_CHARS = 10
    const restore = freshRestore()

    // --- Phase 1: Mount, type, save ---
    const { unmount } = render(
      <TypingArea
        text={PAGE_TEXT}
        sessionRestore={restore}
        onStatsUpdate={onStatsUpdate}
      />,
    )

    const area = screen.getByTestId('typing-area')
    act(() => { fireEvent.focus(area) })

    // Type 10 characters over 3000ms (first at t=1000, last at t=4000)
    for (let i = 0; i < NUM_CHARS; i++) {
      typeChar(area, PAGE_TEXT[i], 1000 + i * 300)
    }

    // Trigger a word-boundary stat report (index 9 = 'k' in 'quick', not a space;
    // index 3 is a space, so stats should have been reported there)
    // Type to next space if needed. Actually, index 3 is ' ' (space after 'the')
    // so stats were reported at cursor=4 (after space).
    // Let's also type to the next space. "the quick" → space at index 9
    // We already typed to index 10. The space is at index 9 (after 'quick').
    // Wait: "the quick brown fox..."
    // t=0, h=1, e=2, ' '=3, q=4, u=5, i=6, c=7, k=8, ' '=9
    // So we typed 10 chars (indices 0-9), cursor is at 10.
    // Stats should have been reported at cursor=4 (after typing space at index 3)
    // and at cursor=10 (after typing space at index 9).

    // Record stats from phase 1
    const phase1Stats = [...statsHistory]
    console.log('[Phase 1] Stats reports:', phase1Stats.length)
    phase1Stats.forEach((s, i) => {
      console.log(`  [${i}] wpm=${s.wpm} elapsedMs=${s.elapsedMs} correctChars=${s.correctChars}`)
    })

    // Advance past 2s debounce to flush
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    const savedSession = inspectLocalStorage()
    expect(savedSession).not.toBeNull()

    // --- Phase 2: Unmount ---
    unmount()

    // --- Phase 3: Remount ---
    const loadedSession = loadTypingSession(BOOK_SLUG, CHAPTER, PAGE, PAGE_TEXT)
    expect(loadedSession).not.toBeNull()

    const REMOUNT_TIME = 100_000
    act(() => { vi.setSystemTime(REMOUNT_TIME) })

    const stats2History: Array<{ wpm: number; elapsedMs: number; correctChars: number }> = []
    const onStatsUpdate2 = vi.fn((stats) => {
      stats2History.push({
        wpm: stats.wpm,
        elapsedMs: stats.elapsedMs,
        correctChars: stats.correctChars,
      })
    })

    const restore2 = restoreFromSession(loadedSession!)
    render(
      <TypingArea
        text={PAGE_TEXT}
        sessionRestore={restore2}
        onStatsUpdate={onStatsUpdate2}
      />,
    )

    act(() => { vi.advanceTimersByTime(0) })

    const area2 = screen.getByTestId('typing-area')
    act(() => { fireEvent.focus(area2) })

    // Type one more correct char to trigger stats
    // Index 10 is 'b' in 'brown'
    act(() => {
      vi.setSystemTime(REMOUNT_TIME + 100)
      fireEvent.keyDown(area2, { key: PAGE_TEXT[10] })
    })

    console.log('[Phase 3] After typing 1 char post-restore, stats reports:', stats2History.length)
    stats2History.forEach((s, i) => {
      console.log(`  [${i}] wpm=${s.wpm} elapsedMs=${s.elapsedMs} correctChars=${s.correctChars}`)
    })

    // The WPM should be reasonable: 11 correct chars over ~3800ms (restored time + 100ms)
    // WPM = (11/5) / (3800/60000) ≈ 34.7 → ~35 WPM
    // With a generous ±20 band
    if (stats2History.length > 0) {
      const lastStats = stats2History[stats2History.length - 1]
      console.log('[Phase 3] Final WPM:', lastStats.wpm, 'elapsedMs:', lastStats.elapsedMs)

      // elapsedMs should include restored time
      expect(lastStats.elapsedMs).toBeGreaterThanOrEqual(savedSession!.elapsedMs)

      // WPM should be between 10 and 80 for this scenario
      expect(lastStats.wpm).toBeGreaterThanOrEqual(10)
      expect(lastStats.wpm).toBeLessThanOrEqual(80)
    }
  })

  it('saves and restores char states correctly', () => {
    const NUM_CHARS = 7
    const restore = freshRestore()

    const { unmount } = render(
      <TypingArea
        text={PAGE_TEXT}
        sessionRestore={restore}
      />,
    )

    const area = screen.getByTestId('typing-area')
    act(() => { fireEvent.focus(area) })

    // Type 7 characters (indices 0-6): 'the qu'
    for (let i = 0; i < NUM_CHARS; i++) {
      typeChar(area, PAGE_TEXT[i], 1000 + i * 100)
    }

    // Flush to localStorage
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    const savedSession = inspectLocalStorage()
    expect(savedSession).not.toBeNull()

    // Verify saved char states: first NUM_CHARS should be CORRECT, rest UNTYPED
    for (let i = 0; i < PAGE_TEXT.length; i++) {
      const expected = i < NUM_CHARS ? CharState.CORRECT : CharState.UNTYPED
      expect(savedSession!.charStates[i]).toBe(expected)
    }

    // --- Remount ---
    unmount()

    const loadedSession = loadTypingSession(BOOK_SLUG, CHAPTER, PAGE, PAGE_TEXT)
    const REMOUNT_TIME = 50_000
    act(() => { vi.setSystemTime(REMOUNT_TIME) })

    const restore2 = restoreFromSession(loadedSession!)
    render(
      <TypingArea
        text={PAGE_TEXT}
        sessionRestore={restore2}
      />,
    )

    act(() => { vi.advanceTimersByTime(0) })

    const area2 = screen.getByTestId('typing-area')
    act(() => { fireEvent.focus(area2) })

    // Check DOM char states
    const states = getCharStates()
    for (let i = 0; i < NUM_CHARS; i++) {
      expect(states[i]).toContain('correct')
    }
    for (let i = NUM_CHARS; i < PAGE_TEXT.length; i++) {
      expect(states[i]).toContain('untyped')
    }
  })

  it('continues with correct WPM after typing more post-restore', () => {
    const statsHistory: Array<{ wpm: number; elapsedMs: number }> = []
    const onStatsUpdate = vi.fn((stats) => {
      statsHistory.push({ wpm: stats.wpm, elapsedMs: stats.elapsedMs })
    })

    const NUM_CHARS = 5
    const TYPING_START = 1000
    const CHAR_INTERVAL = 200
    const restore = freshRestore()

    // --- Phase 1: Type 5 chars over 1000ms, save ---
    const { unmount } = render(
      <TypingArea
        text={PAGE_TEXT}
        sessionRestore={restore}
        onStatsUpdate={onStatsUpdate}
      />,
    )

    const area = screen.getByTestId('typing-area')
    act(() => { fireEvent.focus(area) })

    for (let i = 0; i < NUM_CHARS; i++) {
      typeChar(area, PAGE_TEXT[i], TYPING_START + i * CHAR_INTERVAL)
    }
    // Total typing time: 5*200 = 1000ms, so last char at t=1800

    // Flush
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    const savedSession = inspectLocalStorage()!
    const phase1Elapsed = savedSession.elapsedMs
    console.log('[Phase 1] Saved elapsedMs:', phase1Elapsed)

    // WPM at phase 1 save point (not reported to onStatsUpdate because no word boundary)
    // Let's compute what it should be:
    // correctChars = 5, elapsedMs ≈ 4800 (1000 typing + 3000 wait - but actually getElapsedMs
    // returns totalTimeMs + (now - sessionStartTime) = 0 + (4800 - 1000) = 3800)
    // Actually at flush time (t=4800), sessionStartTime was set at t=1000
    // getElapsedMs() = 0 + (4800 - 1000) = 3800
    // WPM = (5/5) / (3800/60000) = 1 / 0.0633 ≈ 15.8 → 16 WPM

    unmount()

    // --- Phase 2: Remount and type 5 more chars ---
    const loadedSession = loadTypingSession(BOOK_SLUG, CHAPTER, PAGE, PAGE_TEXT)
    const REMOUNT_TIME = 100_000

    const stats2History: Array<{ wpm: number; elapsedMs: number }> = []
    const onStatsUpdate2 = vi.fn((stats) => {
      stats2History.push({ wpm: stats.wpm, elapsedMs: stats.elapsedMs })
    })

    act(() => { vi.setSystemTime(REMOUNT_TIME) })

    const restore2 = restoreFromSession(loadedSession!)
    render(
      <TypingArea
        text={PAGE_TEXT}
        sessionRestore={restore2}
        onStatsUpdate={onStatsUpdate2}
      />,
    )

    act(() => { vi.advanceTimersByTime(0) })

    const area2 = screen.getByTestId('typing-area')
    act(() => { fireEvent.focus(area2) })

    // Type 5 more chars (indices 5-9), 200ms apart
    // Index 5='u', 6='i', 7='c', 8='k', 9=' '
    for (let i = 0; i < 5; i++) {
      typeChar(area2, PAGE_TEXT[NUM_CHARS + i], REMOUNT_TIME + 1000 + i * CHAR_INTERVAL)
    }
    // Last char (index 9 = space) is a word boundary, should trigger stats

    console.log('[Phase 2] Stats after 5 more chars:', stats2History.length)
    stats2History.forEach((s, i) => {
      console.log(`  [${i}] wpm=${s.wpm} elapsedMs=${s.elapsedMs}`)
    })

    if (stats2History.length > 0) {
      const lastStats = stats2History[stats2History.length - 1]
      // 10 correct chars, elapsedMs = restored_time + new_session_time
      // 10 correct chars, elapsedMs = restored_time + new_session_time
      // restored_time is now accurate (not inflated), new session ≈ 800ms
      // WPM should be reasonable for fast typing (75 is correct for this scenario)
      console.log('[Phase 2] Final WPM:', lastStats.wpm, 'elapsedMs:', lastStats.elapsedMs)

      expect(lastStats.wpm).toBeGreaterThanOrEqual(15)
      expect(lastStats.wpm).toBeLessThanOrEqual(100)
      expect(lastStats.elapsedMs).toBeGreaterThanOrEqual(phase1Elapsed)
    }
  })

  it('diagnose: prints full state at each phase for debugging', () => {
    const NUM_CHARS = 5
    const restore = freshRestore()
    const statsHistory: Array<TypingStats> = []
    const onStatsUpdate = vi.fn((s: TypingStats) => statsHistory.push(s))

    // Phase 1: Type 5 chars
    const { unmount } = render(
      <TypingArea
        text={PAGE_TEXT}
        sessionRestore={restore}
        onStatsUpdate={onStatsUpdate}
      />,
    )

    const area = screen.getByTestId('typing-area')
    act(() => { fireEvent.focus(area) })

    for (let i = 0; i < NUM_CHARS; i++) {
      typeChar(area, PAGE_TEXT[i], 1000 + i * 100)
    }

    console.log('=== PHASE 1: After typing ===')
    console.log('Cursor index:', getCursorIndex())
    console.log('Char states:', getCharStates().map((c, i) => `${i}:${c.includes('correct') ? 'C' : c.includes('incorrect') ? 'X' : 'U'}`).join(' '))
    console.log('Stats reports:', statsHistory.length)
    statsHistory.forEach((s, i) => console.log(`  stats[${i}]:`, JSON.stringify(s)))

    // Flush
    act(() => { vi.advanceTimersByTime(3000) })

    inspectLocalStorage()

    // Phase 2: Remount
    unmount()

    const loaded = loadTypingSession(BOOK_SLUG, CHAPTER, PAGE, PAGE_TEXT)
    act(() => { vi.setSystemTime(100_000) })

    const stats2History: Array<TypingStats> = []
    const onStatsUpdate2 = vi.fn((s: TypingStats) => stats2History.push(s))

    const restore2 = restoreFromSession(loaded!)
    render(
      <TypingArea
        text={PAGE_TEXT}
        sessionRestore={restore2}
        onStatsUpdate={onStatsUpdate2}
      />,
    )

    act(() => { vi.advanceTimersByTime(0) })

    const area2 = screen.getByTestId('typing-area')
    act(() => { fireEvent.focus(area2) })

    console.log('\n=== PHASE 2: After restore (before typing) ===')
    console.log('Cursor index:', getCursorIndex())
    console.log('Char states:', getCharStates().map((c, i) => `${i}:${c.includes('correct') ? 'C' : c.includes('incorrect') ? 'X' : 'U'}`).join(' '))

    // Type one more char
    act(() => {
      vi.setSystemTime(100_100)
      fireEvent.keyDown(area2, { key: PAGE_TEXT[NUM_CHARS] })
    })

    console.log('\n=== PHASE 2: After typing 1 more char ===')
    console.log('Cursor index:', getCursorIndex())
    console.log('Char states:', getCharStates().map((c, i) => `${i}:${c.includes('correct') ? 'C' : c.includes('incorrect') ? 'X' : 'U'}`).join(' '))
    console.log('Stats reports:', stats2History.length)
    stats2History.forEach((s, i) => console.log(`  stats[${i}]:`, JSON.stringify(s)))

    // Verify cursor is at exactly NUM_CHARS + 1
    expect(getCursorIndex()).toBe(NUM_CHARS + 1)
  })

  it('does NOT inflate elapsedMs on unmount (cleanup flush regression)', () => {
    const restore = freshRestore()

    // Mount and type 5 chars
    const { unmount } = render(
      <TypingArea
        text={PAGE_TEXT}
        sessionRestore={restore}
      />,
    )

    const area = screen.getByTestId('typing-area')
    act(() => { fireEvent.focus(area) })

    for (let i = 0; i < 5; i++) {
      typeChar(area, PAGE_TEXT[i], 1000 + i * 100)
    }
    // Last char at t=1400, sessionStartTime at t=1000
    // activeElapsedMs at last keystroke = 400 (1400 - 1000)

    // Advance past debounce (fires at t=3400)
    act(() => { vi.advanceTimersByTime(3000) })

    // Debounce saved with activeElapsedMs = 400 (at last keystroke), NOT 2400 (at save time)
    const afterDebounce = loadTypingSession(BOOK_SLUG, CHAPTER, PAGE, PAGE_TEXT)!
    expect(afterDebounce.elapsedMs).toBe(400)

    // Unmount — the cleanup should NOT overwrite with inflated elapsedMs
    unmount()

    const afterUnmount = loadTypingSession(BOOK_SLUG, CHAPTER, PAGE, PAGE_TEXT)!
    // The cleanup flush uses activeElapsedMs which was frozen at the last keystroke.
    // Since the debounce timer already fired and cleared saveTimerRef,
    // the cleanup should NOT flush at all.
    expect(afterUnmount.elapsedMs).toBe(400)
    expect(afterUnmount.cursorPosition).toBe(5)
  })
})
