import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getBookBySlug, getPage, getPageCount, getChapter } from '@/data'
import type { TypingStats } from '@/types'
import { useSettings } from '@/context/SettingsContext'
import StatsBar from '@/components/StatsBar'
import TypingArea from '@/components/TypingArea'
import SettingsModal from '@/components/SettingsModal'
import { useProgress } from '@/context/ProgressContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { loadTypingSession, clearChapterSessions } from '@/utils/typingSessionStorage'
import type { TypingEngineRestore } from '@/hooks/useTypingEngine'
import styles from './TypingConsolePage.module.css'
export default function TypingConsolePage() {
  const { bookSlug, chapterIndex: chapterIdx, pageIndex: pageIdx } = useParams()
  const navigate = useNavigate()
  const [stats, setStats] = useState<TypingStats | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [restartKey, setRestartKey] = useState(0)
  const mainRef = useRef<HTMLElement>(null)
  const [showRestartConfirm, setShowRestartConfirm] = useState(false)
  const { settings } = useSettings()
  const { markPageComplete, setLastPage, resetChapterProgress } = useProgress()

  const chapterIndex = Number(chapterIdx)
  const pageIndex = Number(pageIdx)

  const book = bookSlug ? getBookBySlug(bookSlug) : undefined
  const chapter = bookSlug ? getChapter(bookSlug, chapterIndex) : undefined
  const chapterWordCount = useMemo(() => chapter ? chapter.text.split(/\s+/).filter(Boolean).length : 0, [chapter])
  const effectiveWordsPerPage = settings.wordsPerPage >= 1200 && chapterWordCount > 0 ? chapterWordCount : settings.wordsPerPage
  const page = bookSlug ? getPage(bookSlug, chapterIndex, pageIndex, effectiveWordsPerPage) : undefined
  const totalPages = bookSlug ? getPageCount(bookSlug, chapterIndex, effectiveWordsPerPage) : 0
  // Load saved typing session (resets when page content changes, e.g. wordsPerPage)
  const [savedSession, setSavedSession] = useState(() => {
    if (!bookSlug || !page) return null
    return loadTypingSession(bookSlug, chapterIndex, pageIndex, page.text)
  })
  useEffect(() => {
    setSavedSession(
      page && bookSlug ? loadTypingSession(bookSlug, chapterIndex, pageIndex, page.text) : null,
    )
  }, [page?.text])

  const sessionRestore: TypingEngineRestore | undefined = useMemo(() => {
    if (!bookSlug) return undefined
    return {
      savedSession: savedSession ?? null,
      bookSlug,
      chapterIndex,
      pageIndex,
    }
  }, [bookSlug, chapterIndex, pageIndex, savedSession])

  const isStarted = stats !== null && stats.totalTypedChars > 0
  const wpm = stats?.wpm ?? 0
  const accuracy = stats?.accuracy ?? 0

  // Dynamic page title
  const pageTitle = book && chapter
    ? `${chapter.title} — Page ${pageIndex + 1}/${totalPages} | Narratype`
    : 'Narratype'
  useDocumentTitle(pageTitle)

  const handleStatsUpdate = useCallback((s: TypingStats) => {
    setStats(s)
  }, [])

  // Track last page on mount
  useEffect(() => {
    if (bookSlug) {
      setLastPage(bookSlug, chapterIndex, pageIndex)
    }
  }, [bookSlug, chapterIndex, pageIndex, setLastPage])

  // Escape: navigate back to chapters (only when settings modal is closed)
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !settingsOpen) {
        if (bookSlug) {
          navigate(`/chapters/${bookSlug}`)
        }
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [bookSlug, navigate, settingsOpen])

  const goToPage = useCallback(
    (newPageIdx: number) => {
      if (!bookSlug) return
      setIsCompleted(false)
      setSavedSession(null)
      navigate(`/typing-console/${bookSlug}/${chapterIndex}/${newPageIdx}`)
    },
    [navigate, bookSlug, chapterIndex],
  )

  const isFirstPage = chapterIndex === 0 && pageIndex === 0
  const isLastPage = pageIndex >= totalPages - 1

  // When wordsPerPage changes, page boundaries shift. If current pageIndex is
  // out of bounds, navigate to page 0. Only fires on setting change, not initial mount.
  const prevWordsPerPageRef = useRef(settings.wordsPerPage)
  useEffect(() => {
    if (prevWordsPerPageRef.current !== settings.wordsPerPage) {
      prevWordsPerPageRef.current = settings.wordsPerPage
      if (totalPages > 0 && pageIndex >= totalPages && bookSlug) {
        goToPage(0)
      }
    }
  }, [settings.wordsPerPage]) // eslint-disable-line react-hooks/exhaustive-deps
  // Reset scroll when page changes (useLayoutEffect to prevent flash)
  useLayoutEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [pageIndex, chapterIndex])

  // Auto-advance to next page on completion
  useEffect(() => {
    if (!isCompleted || !settings.autoAdvancePage || isLastPage) return
    const timer = setTimeout(() => {
      goToPage(pageIndex + 1)
    }, 1500)
    return () => clearTimeout(timer)
  }, [isCompleted, settings.autoAdvancePage, isLastPage, goToPage, pageIndex])

  // Error state: invalid params
  if (!book) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <h2>Book not found</h2>
          <p>The requested book could not be found.</p>
          <Link to="/" className={styles.link}>Return to home</Link>
        </div>
      </div>
    )
  }

  if (!chapter || !page) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <h2>Page not found</h2>
          <p>The requested chapter or page does not exist.</p>
          <Link to="/" className={styles.link}>Return to home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {!settings.hideUI && (
        <header className={styles.header}>
          <nav className={styles.breadcrumb}>
            <Link to="/" className={styles.link}>Books</Link>
            <span className={styles.separator}>&gt;</span>
            <Link to={`/chapters/${book.slug}`} className={styles.link}>{book.title}</Link>
            <span className={styles.separator}>&gt;</span>
            <span className={styles.current}>{chapter.title}</span>
          </nav>
          <div className={styles.headerActions}>
            {chapter.title && (
              <h2 className={styles.chapterTitle}>{chapter.title}</h2>
            )}
            <button
              className={styles.settingsButton}
              onClick={() => setSettingsOpen(true)}
            >
              Settings
            </button>
          </div>
          <p className={styles.pageInfo}>Page {pageIndex + 1} / {totalPages}</p>
        </header>
      )}

      {!settings.hideUI && (
        <StatsBar wpm={wpm} accuracy={accuracy} isStarted={isStarted} />
      )}

      <main ref={mainRef} className={styles.main}>
        <div className={`${styles.typingWrapper} ${isCompleted ? styles.completed : ''}`}>
          <TypingArea
            key={`${bookSlug}-${chapterIndex}-${pageIndex}-${page.text.length}-${restartKey}`}
            text={page.text}
            options={{
              stopCursorAfterMistype: settings.stopCursorAfterMistype,
              ignoreCapitalization: settings.ignoreCapitalization,
              skipPunctuation: settings.skipPunctuation,
              internationalMode: settings.internationalMode,
            }}
            cursorStyle={settings.cursorStyle}
            autoScroll={settings.autoScroll}
            smoothCursor={settings.smoothCursor}
            readingMode={settings.readingMode}
            showLiteralMistypes={settings.showLiteralMistypes}
            statsUpdateFrequency={settings.statsUpdateFrequency}
            onStatsUpdate={handleStatsUpdate}
            sessionRestore={sessionRestore}
            onComplete={() => {
              if (bookSlug) {
                markPageComplete(bookSlug, chapterIndex, pageIndex)
              }
              setIsCompleted(true)
            }}
          />
          {isCompleted && (
            <div className={styles.completionOverlay} aria-live="polite">
              <span className={styles.checkmark}>&#10003;</span>
              <span className={styles.completionText}>Page complete!</span>
            </div>
          )}
        </div>
      </main>

      {!settings.hideUI && (
        <footer className={styles.footer}>
          <button
            className={styles.button}
            onClick={() => setShowRestartConfirm(true)}
          >
            Restart
          </button>
          <div className={styles.navButtons}>
            <button
              className={styles.button}
              onClick={() => goToPage(pageIndex - 1)}
              disabled={isFirstPage}
            >
              Previous Page
            </button>
            <button
              className={styles.button}
              onClick={() => goToPage(pageIndex + 1)}
              disabled={isLastPage}
            >
              Next Page
            </button>
          </div>
        </footer>
      )}

      {settings.hideUI && (
        <div className={styles.floatingNav}>
          <button
            className={styles.floatingNavButton}
            onClick={() => goToPage(pageIndex - 1)}
            disabled={isFirstPage}
            aria-label="Previous page"
          >
            ←
          </button>
          <button
            className={styles.floatingNavButton}
            onClick={() => goToPage(pageIndex + 1)}
            disabled={isLastPage}
            aria-label="Next page"
          >
            →
          </button>
          <button
            className={styles.floatingNavButton}
            onClick={() => setShowRestartConfirm(true)}
            aria-label="Restart"
          >
            ↺
          </button>
          <button
            className={styles.floatingNavButton}
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      )}

      {showRestartConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowRestartConfirm(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <p>Restart this chapter from the beginning?</p>
            <p className={styles.confirmSubtext}>All progress for this chapter will be lost.</p>
            <div className={styles.confirmActions}>
              <button
                className={styles.button}
                onClick={() => setShowRestartConfirm(false)}
              >
                Cancel
              </button>
              <button
                className={styles.button}
                onClick={() => {
                  if (bookSlug) {
                    clearChapterSessions(bookSlug, chapterIndex, totalPages)
                    resetChapterProgress(bookSlug, chapterIndex)
                  }
                  setStats(null)
                  setIsCompleted(false)
                  setSavedSession(null)
                  setShowRestartConfirm(false)
                  setRestartKey((k) => k + 1)
                  goToPage(0)
                }}
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
