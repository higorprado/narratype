import { useRef, useCallback } from 'react'
import type { ImportStatus } from '@/hooks/useImportedBooks'
import styles from './ImportButton.module.css'

interface ImportButtonProps {
  onImport: (file: File) => Promise<void>
  status: ImportStatus
  error: string | null
}

export default function ImportButton({ onImport, status, error }: ImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      await onImport(file)
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    },
    [onImport],
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div className={styles.container}>
      <input
        ref={inputRef}
        type="file"
        accept=".epub,.pdf"
        onChange={handleChange}
        className={styles.fileInput}
        aria-label="Select book file"
      />
      <button
        className={styles.button}
        onClick={handleClick}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Importing...' : 'Import Book'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
