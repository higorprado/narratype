import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.appName}>
        Narratype
      </Link>
      <ThemeToggle />
    </header>
  )
}

export default Header
