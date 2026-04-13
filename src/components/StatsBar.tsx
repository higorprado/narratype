import styles from './StatsBar.module.css'

interface StatsBarProps {
  wpm: number
  accuracy: number
  isStarted: boolean
}

function formatOrDash(value: number, show: boolean): string {
  if (!show) return '---'
  return String(Math.round(value))
}

export default function StatsBar({ wpm, accuracy, isStarted }: StatsBarProps) {
  // WPM is 0 until enough time has elapsed (threshold in calculateWPM).
  // Show '---' until we have a meaningful reading.
  const showWPM = isStarted && wpm > 0

  return (
    <div className={styles.bar} data-testid="stats-bar">
      <div className={styles.stat}>
        <span className={styles.label}>WPM</span>
        <span className={styles.value} data-testid="stats-wpm">
          {formatOrDash(wpm, showWPM)}
        </span>
      </div>
      <div className={styles.stat}>
        <span className={styles.label}>ACC</span>
        <span className={styles.value} data-testid="stats-acc">
          {formatOrDash(accuracy, isStarted)}
        </span>
      </div>
    </div>
  )
}
