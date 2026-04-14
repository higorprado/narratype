import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styles from './ImportConfigModal.module.css'

interface ImportConfigModalProps {
  isOpen: boolean
  fileName: string
  defaultWordsPerChapter: number
  wordsPerPage: number
  onConfirm: (wordsPerChapter: number) => void
  onCancel: () => void
}

export default function ImportConfigModal({
  isOpen,
  fileName,
  defaultWordsPerChapter,
  wordsPerPage,
  onConfirm,
  onCancel,
}: ImportConfigModalProps) {
  const [localWordsPerChapter, setLocalWordsPerChapter] = useState(defaultWordsPerChapter)

  // Sync if the default changes while modal is open
  useEffect(() => {
    setLocalWordsPerChapter(defaultWordsPerChapter)
  }, [defaultWordsPerChapter])

  const estimatedPages = Math.max(1, Math.round(localWordsPerChapter / wordsPerPage))

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    },
    [onCancel],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const modal = (
    <div className={styles.overlay} onClick={onCancel} role="dialog" aria-modal="true" aria-label="Configure PDF Import">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Import PDF</h2>
          <button className={styles.closeButton} onClick={onCancel} aria-label="Cancel import">
            &times;
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.fileName}>{fileName}</p>

          <div className={styles.setting}>
            <label className={styles.label} htmlFor="words-per-chapter">
              Words per chapter
            </label>
            <div className={styles.sliderControl}>
              <input
                id="words-per-chapter"
                type="range"
                className={styles.slider}
                value={localWordsPerChapter}
                min={100}
                max={10000}
                step={100}
                onChange={(e) => setLocalWordsPerChapter(parseInt(e.target.value, 10))}
                aria-label="Words per chapter"
              />
              <span className={styles.sliderValue}>{localWordsPerChapter.toLocaleString()}</span>
            </div>
            <p className={styles.hint}>
              (~{estimatedPages} page{estimatedPages !== 1 ? 's' : ''} per chapter, based on {wordsPerPage} words per page)
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={styles.importButton}
            onClick={() => onConfirm(localWordsPerChapter)}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
