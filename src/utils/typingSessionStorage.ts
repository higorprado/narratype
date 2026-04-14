import { CharState } from '@/types'

export interface SavedTypingSession {
  bookSlug: string
  chapterIndex: number
  pageIndex: number
  cursorPosition: number
  charStates: CharState[]
  startTime: number | null
  elapsedMs: number
  savedAt: number
  textPrefix: string // first 100 chars for validation
}

const KEY_PREFIX = 'narratype-session-'
const TEXT_PREFIX_LEN = 100

function storageKey(bookSlug: string, chapterIndex: number, pageIndex: number): string {
  return `${KEY_PREFIX}${bookSlug}-${chapterIndex}-${pageIndex}`
}

export function saveTypingSession(
  bookSlug: string,
  chapterIndex: number,
  pageIndex: number,
  cursorPosition: number,
  charStates: CharState[],
  startTime: number | null,
  elapsedMs: number,
  pageText: string,
): void {
  const session: SavedTypingSession = {
    bookSlug,
    chapterIndex,
    pageIndex,
    cursorPosition,
    charStates,
    startTime,
    elapsedMs,
    savedAt: Date.now(),
    textPrefix: pageText.slice(0, TEXT_PREFIX_LEN),
  }
  try {
    localStorage.setItem(storageKey(bookSlug, chapterIndex, pageIndex), JSON.stringify(session))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

export function loadTypingSession(
  bookSlug: string,
  chapterIndex: number,
  pageIndex: number,
  currentPageText: string,
): SavedTypingSession | null {
  try {
    const raw = localStorage.getItem(storageKey(bookSlug, chapterIndex, pageIndex))
    if (!raw) return null
    const session: SavedTypingSession = JSON.parse(raw)
    // Backward compat: sessions saved before the elapsedMs field may lack it
    if (session.elapsedMs == null) session.elapsedMs = 0
    // Validate: text must match
    if (session.textPrefix !== currentPageText.slice(0, TEXT_PREFIX_LEN)) {
      clearTypingSession(bookSlug, chapterIndex, pageIndex)
      return null
    }
    // Validate: charStates length must match text length
    if (session.charStates.length !== currentPageText.length) {
      clearTypingSession(bookSlug, chapterIndex, pageIndex)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function clearTypingSession(
  bookSlug: string,
  chapterIndex: number,
  pageIndex: number,
): void {
  try {
    localStorage.removeItem(storageKey(bookSlug, chapterIndex, pageIndex))
  } catch {
    // Ignore
  }
}


export function clearChapterSessions(
  bookSlug: string,
  chapterIndex: number,
  pageCount: number,
): void {
  for (let i = 0; i < pageCount; i++) {
    clearTypingSession(bookSlug, chapterIndex, i)
  }
}