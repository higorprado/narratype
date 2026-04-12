import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { getPageCount } from '@/data'

export interface PageProgress {
  bookSlug: string
  chapterIndex: number
  pageIndex: number
}

export interface BookProgress {
  chapters: Record<number, number[]>
  lastPage: PageProgress
  lastAccessed: number
}

export type ProgressMap = Record<string, BookProgress>

interface ProgressContextValue {
  getProgress: (bookSlug: string) => BookProgress | null
  markPageComplete: (bookSlug: string, chapterIndex: number, pageIndex: number) => void
  getLastPage: (bookSlug: string) => PageProgress | null
  setLastPage: (bookSlug: string, chapterIndex: number, pageIndex: number) => void
  getBookCompletionPercent: (bookSlug: string) => number
  isPageComplete: (bookSlug: string, chapterIndex: number, pageIndex: number) => boolean
  getRecentBooks: () => Array<{ bookSlug: string; lastAccessed: number }>
}

type ProgressAction =
  | { type: 'MARK_PAGE_COMPLETE'; bookSlug: string; chapterIndex: number; pageIndex: number }
  | { type: 'SET_LAST_PAGE'; bookSlug: string; chapterIndex: number; pageIndex: number }

const STORAGE_KEY = 'narratype-progress'

function loadProgress(): ProgressMap {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveProgress(progress: ProgressMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Storage full or unavailable
  }
}

function progressReducer(state: ProgressMap, action: ProgressAction): ProgressMap {
  switch (action.type) {
    case 'MARK_PAGE_COMPLETE': {
      const { bookSlug, chapterIndex, pageIndex } = action
      const bookProg = state[bookSlug] ?? {
        chapters: {},
        lastPage: { bookSlug, chapterIndex, pageIndex },
        lastAccessed: Date.now(),
      }
      const chapPages = bookProg.chapters[chapterIndex] ?? []
      if (chapPages.includes(pageIndex)) return state
      const next = {
        ...state,
        [bookSlug]: {
          ...bookProg,
          chapters: { ...bookProg.chapters, [chapterIndex]: [...chapPages, pageIndex] },
          lastPage: { bookSlug, chapterIndex, pageIndex },
          lastAccessed: Date.now(),
        },
      }
      return next
    }
    case 'SET_LAST_PAGE': {
      const { bookSlug, chapterIndex, pageIndex } = action
      const existing = state[bookSlug]
      const next = {
        ...state,
        [bookSlug]: {
          chapters: existing?.chapters ?? {},
          lastPage: { bookSlug, chapterIndex, pageIndex },
          lastAccessed: Date.now(),
        },
      }
      return next
    }
    default:
      return state
  }
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, dispatch] = useReducer(progressReducer, null, loadProgress)

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  const getProgress = useCallback(
    (bookSlug: string) => progress[bookSlug] ?? null,
    [progress],
  )

  const markPageComplete = useCallback(
    (bookSlug: string, chapterIndex: number, pageIndex: number) => {
      dispatch({ type: 'MARK_PAGE_COMPLETE', bookSlug, chapterIndex, pageIndex })
    },
    [],
  )

  const getLastPage = useCallback(
    (bookSlug: string) => progress[bookSlug]?.lastPage ?? null,
    [progress],
  )

  const setLastPage = useCallback(
    (bookSlug: string, chapterIndex: number, pageIndex: number) => {
      dispatch({ type: 'SET_LAST_PAGE', bookSlug, chapterIndex, pageIndex })
    },
    [],
  )

  const getBookCompletionPercent = useCallback(
    (bookSlug: string) => {
      const bookProg = progress[bookSlug]
      if (!bookProg) return 0
      let completedPages = 0
      let totalPages = 0
      for (const [chapIdx, pages] of Object.entries(bookProg.chapters)) {
        const count = getPageCount(bookSlug, Number(chapIdx))
        totalPages += count
        completedPages += pages.length
      }
      // Also count chapters with no progress yet
      // We need the book to know total chapters, but we only have slug.
      // Use getPageCount to check - if totalPages is 0 and we have progress,
      // the book might have chapters we haven't tracked. Return 0 safely.
      if (totalPages === 0) return 0
      return Math.round((completedPages / totalPages) * 100)
    },
    [progress],
  )

  const isPageComplete = useCallback(
    (bookSlug: string, chapterIndex: number, pageIndex: number) => {
      return progress[bookSlug]?.chapters[chapterIndex]?.includes(pageIndex) ?? false
    },
    [progress],
  )

  const getRecentBooks = useCallback(() => {
    return Object.entries(progress)
      .map(([bookSlug, prog]) => ({ bookSlug, lastAccessed: prog.lastAccessed }))
      .sort((a, b) => b.lastAccessed - a.lastAccessed)
  }, [progress])

  return (
    <ProgressContext.Provider
      value={{
        getProgress,
        markPageComplete,
        getLastPage,
        setLastPage,
        getBookCompletionPercent,
        isPageComplete,
        getRecentBooks,
      }}
    >
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider')
  return ctx
}
