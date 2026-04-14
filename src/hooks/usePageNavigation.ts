import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

interface UsePageNavigationOptions {
  bookSlug: string | undefined
  chapterIndex: number
  pageIndex: number
  totalPages: number
  wordsPerPage: number
  isCompleted: boolean
  autoAdvance: boolean
  onNavigate: () => void
}

export function usePageNavigation({
  bookSlug,
  chapterIndex,
  pageIndex,
  totalPages,
  wordsPerPage,
  isCompleted,
  autoAdvance,
  onNavigate,
}: UsePageNavigationOptions) {
  const navigate = useNavigate()
  const mainRef = useRef<HTMLElement>(null)

  const goToPage = useCallback(
    (newPageIdx: number) => {
      if (!bookSlug) return
      onNavigate()
      navigate(`/typing-console/${bookSlug}/${chapterIndex}/${newPageIdx}`)
    },
    [navigate, bookSlug, chapterIndex, onNavigate],
  )

  const isFirstPage = chapterIndex === 0 && pageIndex === 0
  const isLastPage = pageIndex >= totalPages - 1

  // When wordsPerPage changes, page boundaries shift. If current pageIndex is
  // out of bounds, navigate to page 0. Only fires on setting change, not initial mount.
  const prevWordsPerPageRef = useRef(wordsPerPage)
  useEffect(() => {
    if (prevWordsPerPageRef.current !== wordsPerPage) {
      prevWordsPerPageRef.current = wordsPerPage
      if (totalPages > 0 && pageIndex >= totalPages && bookSlug) {
        goToPage(0)
      }
    }
  }, [wordsPerPage]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset scroll when page changes (useLayoutEffect to prevent flash)
  useLayoutEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [pageIndex, chapterIndex])

  // Auto-advance to next page on completion
  useEffect(() => {
    if (!isCompleted || !autoAdvance || isLastPage) return
    const timer = setTimeout(() => {
      goToPage(pageIndex + 1)
    }, 1500)
    return () => clearTimeout(timer)
  }, [isCompleted, autoAdvance, isLastPage, goToPage, pageIndex])

  return {
    goToPage,
    isFirstPage,
    isLastPage,
    mainRef,
  }
}
