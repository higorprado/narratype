import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import styles from './AboutPage.module.css'

export default function AboutPage() {
  useDocumentTitle('About — Narratype')

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backLink}>&larr; Back to books</Link>

      <h1 className={styles.heading}>About Narratype</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What is Narratype</h2>
        <p>
          Narratype is a typing practice tool that uses classic literature and imported books.
          Instead of typing generic texts, you practice with excerpts from real works — improving your speed
          and accuracy while reading great authors.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <ul>
          <li>Import EPUB or PDF books, or use the built-in ones</li>
          <li>Type the text page by page, tracking your progress</li>
          <li>Monitor your speed (WPM) and accuracy in real time</li>
          <li>Configure words per page, cursor style, and more in settings</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Imported books</h2>
        <p>
          Imported books are stored locally in your browser using IndexedDB. This means:
        </p>
        <ul>
          <li>Your books are available offline</li>
          <li>No data is sent to external servers</li>
          <li>Clearing your browser cache or data will remove imported books</li>
        </ul>
        <p>
          In a future version, we plan to add login and cloud sync.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Privacy</h2>
        <p>
          Narratype does not collect personal data. All typing progress and imported books are stored
          exclusively in your browser. No data is sent to external servers.
        </p>
        <p>
          We display ads through Google AdSense. When you first visit, you choose your cookie preferences:
          personalized ads, non-personalized ads only, or no ad cookies at all. You can also disable ads
          entirely in Settings. Regardless of your choice, your typing data never leaves your browser.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Settings and shortcuts</h2>
        <p>
          Use the settings button to customize your experience: words per page, cursor style,
          reading mode, and more. Keyboard shortcuts are available while typing — press{' '}
          <kbd>Esc</kbd> to go back to the chapter list.
        </p>
      </section>
    </div>
  )
}
