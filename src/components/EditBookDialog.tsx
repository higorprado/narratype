import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './EditBookDialog.module.css'

interface EditBookDialogProps {
  isOpen: boolean
  title: string
  author: string
  onSave: (updates: { title: string; author: string }) => void
  onCancel: () => void
}

export default function EditBookDialog({
  isOpen,
  title: initialTitle,
  author: initialAuthor,
  onSave,
  onCancel,
}: EditBookDialogProps) {
  const [title, setTitle] = useState(initialTitle)
  const [author, setAuthor] = useState(initialAuthor)
  const titleRef = useRef<HTMLInputElement>(null)

  // Sync when props change (dialog reopened with different book)
  useEffect(() => {
    setTitle(initialTitle)
    setAuthor(initialAuthor)
  }, [initialTitle, initialAuthor])

  // Focus title input when opened
  useEffect(() => {
    if (isOpen) titleRef.current?.focus()
  }, [isOpen])

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

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!title.trim() || !author.trim()) return
      onSave({ title: title.trim(), author: author.trim() })
    },
    [title, author, onSave],
  )

  if (!isOpen) return null

  const canSave = title.trim().length > 0 && author.trim().length > 0

  const modal = (
    <div className={styles.overlay} onClick={onCancel} role="dialog" aria-modal="true" aria-label="Edit Book">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Edit Book</h2>
          <button className={styles.closeButton} onClick={onCancel} aria-label="Cancel">
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.field}>
              <label htmlFor="edit-title">Title</label>
              <input
                ref={titleRef}
                id="edit-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="edit-author">Author</label>
              <input
                id="edit-author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.cancelButton} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={!canSave}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
