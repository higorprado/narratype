import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  saveTypingSession,
  loadTypingSession,
  clearTypingSession,
  clearChapterSessions,
} from '@/utils/typingSessionStorage'

// ---------------------------------------------------------------------------
// Fake localStorage backed by a Map — installed before each test, restored after
// ---------------------------------------------------------------------------
let store: Map<string, string>
let originalLocalStorage: Storage

function fakeLocalStorage(): Storage {
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
    removeItem: (key: string) => { store.delete(key) },
    clear: () => { store.clear() },
    get length() { return store.size },
    key: (_index: number) => null,
  } as Storage
}

beforeEach(() => {
  store = new Map()
  originalLocalStorage = globalThis.localStorage
  // Mock Date.now so savedAt is deterministic
  vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
  globalThis.localStorage = fakeLocalStorage()
})

afterEach(() => {
  globalThis.localStorage = originalLocalStorage
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const BOOK = 'alice'
const CHAPTER = 0
const PAGE = 0
const PAGE_TEXT = 'The quick brown fox jumps over the lazy dog.'
const CHAR_STATES = PAGE_TEXT.split('').map(() => 'UNTYPED' as const)
const KEY = `narratype-session-${BOOK}-${CHAPTER}-${PAGE}`

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('saveTypingSession', () => {
  it('stores data to localStorage', () => {
    saveTypingSession(BOOK, CHAPTER, PAGE, 5, CHAR_STATES, 1234, PAGE_TEXT)

    expect(store.has(KEY)).toBe(true)
    const parsed = JSON.parse(store.get(KEY)!)
    expect(parsed).toMatchObject({
      bookSlug: BOOK,
      chapterIndex: CHAPTER,
      pageIndex: PAGE,
      cursorPosition: 5,
      startTime: 1234,
      savedAt: 1_700_000_000_000,
      textPrefix: PAGE_TEXT.slice(0, 100),
    })
    expect(parsed.charStates).toHaveLength(PAGE_TEXT.length)
  })

  it('handles localStorage quota error gracefully', () => {
    // Replace setItem with one that always throws
    const throwingStorage = fakeLocalStorage()
    throwingStorage.setItem = () => { throw new DOMException('QuotaExceededError') }
    globalThis.localStorage = throwingStorage

    // Should not throw
    expect(() => {
      saveTypingSession(BOOK, CHAPTER, PAGE, 0, CHAR_STATES, null, PAGE_TEXT)
    }).not.toThrow()
  })
})

describe('loadTypingSession', () => {
  it('returns saved session when valid', () => {
    saveTypingSession(BOOK, CHAPTER, PAGE, 10, CHAR_STATES, 5678, PAGE_TEXT)

    const session = loadTypingSession(BOOK, CHAPTER, PAGE, PAGE_TEXT)

    expect(session).not.toBeNull()
    expect(session!.cursorPosition).toBe(10)
    expect(session!.startTime).toBe(5678)
    expect(session!.savedAt).toBe(1_700_000_000_000)
    expect(session!.bookSlug).toBe(BOOK)
    expect(session!.chapterIndex).toBe(CHAPTER)
    expect(session!.pageIndex).toBe(PAGE)
  })

  it('returns null when no session exists', () => {
    const session = loadTypingSession(BOOK, CHAPTER, PAGE, PAGE_TEXT)

    expect(session).toBeNull()
  })

  it('returns null and clears when text prefix does not match', () => {
    saveTypingSession(BOOK, CHAPTER, PAGE, 0, CHAR_STATES, null, PAGE_TEXT)

    const changedText = 'Something completely different.'
    const session = loadTypingSession(BOOK, CHAPTER, PAGE, changedText)

    expect(session).toBeNull()
    // Verify the stale session was cleared
    expect(store.has(KEY)).toBe(false)
  })

  it('returns null and clears when charStates length does not match text length', () => {
    // Save with one text length
    saveTypingSession(BOOK, CHAPTER, PAGE, 0, CHAR_STATES, null, PAGE_TEXT)

    // Load with a different length text (same prefix to pass first check)
    const longerText = PAGE_TEXT + ' extra'
    const session = loadTypingSession(BOOK, CHAPTER, PAGE, longerText)

    expect(session).toBeNull()
    // Stale session should be cleared
    expect(store.has(KEY)).toBe(false)
  })

  it('returns null on corrupted JSON', () => {
    store.set(KEY, '{not valid json')

    const session = loadTypingSession(BOOK, CHAPTER, PAGE, PAGE_TEXT)

    expect(session).toBeNull()
  })
})

describe('clearTypingSession', () => {
  it('removes the session', () => {
    saveTypingSession(BOOK, CHAPTER, PAGE, 0, CHAR_STATES, null, PAGE_TEXT)
    expect(store.has(KEY)).toBe(true)

    clearTypingSession(BOOK, CHAPTER, PAGE)

    expect(store.has(KEY)).toBe(false)
  })
})

describe('clearChapterSessions', () => {
  it('clears all pages for a chapter', () => {
    const PAGE_COUNT = 5
    // Save sessions for pages 0..4
    for (let i = 0; i < PAGE_COUNT; i++) {
      saveTypingSession(BOOK, CHAPTER, i, 0, CHAR_STATES, null, PAGE_TEXT)
    }
    // Save a session for a different chapter — should survive
    saveTypingSession(BOOK, 1, 0, 0, CHAR_STATES, null, PAGE_TEXT)

    clearChapterSessions(BOOK, CHAPTER, PAGE_COUNT)

    // All pages in chapter 0 should be cleared
    for (let i = 0; i < PAGE_COUNT; i++) {
      expect(store.has(`narratype-session-${BOOK}-${CHAPTER}-${i}`)).toBe(false)
    }
    // Different chapter should be untouched
    expect(store.has(`narratype-session-${BOOK}-1-0`)).toBe(true)
  })
})

describe('session data structure', () => {
  it('has correct shape with all expected fields', () => {
    saveTypingSession(BOOK, CHAPTER, PAGE, 3, CHAR_STATES, 9999, PAGE_TEXT)

    const raw = store.get(KEY)!
    const parsed = JSON.parse(raw)

    expect(Object.keys(parsed).sort()).toEqual(
      [
        'bookSlug',
        'chapterIndex',
        'pageIndex',
        'cursorPosition',
        'charStates',
        'startTime',
        'savedAt',
        'textPrefix',
      ].sort(),
    )
    expect(parsed.textPrefix).toBe(PAGE_TEXT)
    expect(parsed.savedAt).toBe(1_700_000_000_000)
  })
})
