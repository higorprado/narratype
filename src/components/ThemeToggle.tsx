import { useSettings } from '@/context/SettingsContext'
import styles from './ThemeToggle.module.css'

export function ThemeToggle() {
  const { settings, updateSetting } = useSettings()
  const isDark = settings.theme === 'classic-dark'

  const toggle = () => {
    updateSetting('theme', isDark ? 'classic-light' : 'classic-dark')
  }

  return (
    <button
      className={styles.toggle}
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      type="button"
    >
      <span className={styles.icon}>{isDark ? '\u263E' : '\u2600'}</span>
      <span className={styles.label}>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  )
}

export default ThemeToggle
