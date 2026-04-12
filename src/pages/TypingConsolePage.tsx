import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getBookBySlug, getPage, getPageCount, getChapter } from '@/data'
import type { TypingStats } from '@/types'
import StatsBar from '@/components/StatsBar'
import TypingArea from '@/components/TypingArea'
import styles from './TypingConsolePage.module.css'

export default function TypingConsolePage() {
  const { bookSlug, chapterIndex: chapterIdx, pageIndex: pageIdx } = useParams()
  const navigate = useNavigate()
  const [stats, setStats] = useState<TypingStats | null>(null)

  const chapterIndex = Number(chapterIdx)
  const pageIndex = Number(pageIdx)

  const book = bookSlug ? getBookBySlug(bookSlug) : undefined
  const chapter = bookSlug ? getChapter(bookSlug, chapterIndex) : undefined
  const page = bookSlug ? getPage(bookSlug, chapterIndex, pageIndex) : undefined
  const totalPages = bookSlug ? getPageCount(bookSlug, chapterIndex) : 0

  const isStarted = stats !== null && stats.totalTypedChars > 0
  const wpm = stats?.wpm ?? 0
  const accuracy = stats?.accuracy ?? 0

  const handleStatsUpdate = useCallback((s: TypingStats) => {
    setStats(s)
  }, [])


  const goToPage = useCallback(
    (newPageIdx: number) => {
      if (!bookSlug) return
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
        {chapter.title && (
          <h2 className={styles.chapterTitle}>{chapter.title}</h2>
        )}
        <p className={styles.pageInfo}>Page {pageIndex + 1} / {totalPages}</p>
      </header>

      <StatsBar wpm={wpm} accuracy={accuracy} isStarted={isStarted} />

      <main className={styles.main}>
        <TypingArea
          key={`${bookSlug}-${chapterIndex}-${pageIndex}`}
          text={page.text}
          onStatsUpdate={handleStatsUpdate}
        />
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.button}
          onClick={() => {
            setStats(null)
            // Re-mount TypingArea via key is already handled; force with navigate
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
    </div>
  )
}
