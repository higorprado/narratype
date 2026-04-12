import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getBookBySlug, getPage, getPageCount, getChapter } from '@/data'
import type { TypingStats } from '@/types'
import { useSettings } from '@/context/SettingsContext'
import StatsBar from '@/components/StatsBar'
import TypingArea from '@/components/TypingArea'
import SettingsModal from '@/components/SettingsModal'
import { useProgress } from '@/context/ProgressContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import styles from './TypingConsolePage.module.css'

export default function TypingConsolePage() {
  const { bookSlug, chapterIndex: chapterIdx, pageIndex: pageIdx } = useParams()
  const navigate = useNavigate()
  const [stats, setStats] = useState<TypingStats | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const { settings } = useSettings()
  const { markPageComplete, setLastPage } = useProgress()

  const chapterIndex = Number(chapterIdx)
  const pageIndex = Number(pageIdx)

  const book = bookSlug ? getBookBySlug(bookSlug) : undefined
  const chapter = bookSlug ? getChapter(bookSlug, chapterIndex) : undefined
  const page = bookSlug ? getPage(bookSlug, chapterIndex, pageIndex) : undefined
  const totalPages = bookSlug ? getPageCount(bookSlug, chapterIndex) : 0

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
      navigate(`/typing-console/${bookSlug}/${chapterIndex}/${newPageIdx}`)
    },
    [navigate, bookSlug, chapterIndex],
  )

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

  const isFirstPage = chapterIndex === 0 && pageIndex === 0
  const isLastPage = pageIndex >= totalPages - 1

  return (
    <div className={styles.page}>
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

      <StatsBar wpm={wpm} accuracy={accuracy} isStarted={isStarted} />

      <main className={styles.main}>
        <div className={`${styles.typingWrapper} ${isCompleted ? styles.completed : ''}`}>
          <TypingArea
            key={`${bookSlug}-${chapterIndex}-${pageIndex}`}
            text={page.text}
            options={{
              stopCursorAfterMistype: settings.stopCursorAfterMistype,
              ignoreCapitalization: settings.ignoreCapitalization,
              skipPunctuation: settings.skipPunctuation,
              internationalMode: settings.internationalMode,
            }}
            cursorStyle={settings.cursorStyle}
            autoScroll={settings.autoScroll}
            onStatsUpdate={handleStatsUpdate}
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

      <footer className={styles.footer}>
        <button
          className={styles.button}
          onClick={() => {
            setStats(null)
            setIsCompleted(false)
            navigate(`/typing-console/${bookSlug}/${chapterIndex}/${pageIndex}`)
          }}
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

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
