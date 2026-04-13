import styles from './StatsBar.module.css'

interface StatsBarProps {
  wpm: number
  accuracy: number
  isStarted: boolean
}

function formatOrDash(value: number, isStarted: boolean): string {
  if (!isStarted) return '---'
  return String(Math.round(value))
}

export default function StatsBar({ wpm, accuracy, isStarted }: StatsBarProps) {
  return (
    <div className={styles.bar} data-testid="stats-bar">
      <div className={styles.stat}>
        <span className={styles.label}>WPM</span>
        <span className={styles.value} data-testid="stats-wpm">
          {formatOrDash(wpm, isStarted)}
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
