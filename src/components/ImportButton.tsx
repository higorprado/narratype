import { useRef, useCallback, useState } from 'react'
import type { ImportStatus } from '@/hooks/useImportedBooks'
import { useSettings } from '@/context/SettingsContext'
import ImportConfigModal from './ImportConfigModal'
import styles from './ImportButton.module.css'

interface ImportButtonProps {
  onImport: (file: File, options?: { wordsPerChapter?: number }) => Promise<void>
  status: ImportStatus
  error: string | null
}

export default function ImportButton({ onImport, status, error }: ImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { settings } = useSettings()
  const [pendingPdf, setPendingPdf] = useState<File | null>(null)
  const [showConfig, setShowConfig] = useState(false)

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''

      const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : ''
      if (ext === 'pdf') {
        setPendingPdf(file)
        setShowConfig(true)
      } else {
        await onImport(file)
      }
    },
    [onImport],
  )

  const handleConfigConfirm = useCallback(
    async (wordsPerChapter: number) => {
      setShowConfig(false)
      if (pendingPdf) {
        await onImport(pendingPdf, { wordsPerChapter })
        setPendingPdf(null)
      }
    },
    [onImport, pendingPdf],
  )

  const handleConfigCancel = useCallback(() => {
    setShowConfig(false)
    setPendingPdf(null)
  }, [])

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
      <ImportConfigModal
        isOpen={showConfig}
        fileName={pendingPdf?.name ?? ''}
        defaultWordsPerChapter={settings.pdfWordsPerChapter}
        wordsPerPage={settings.wordsPerPage}
        onConfirm={handleConfigConfirm}
        onCancel={handleConfigCancel}
      />
    </div>
  )
}
