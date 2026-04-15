import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.appName}>
        Narratype
      </Link>
      <nav className={styles.nav}>
        <Link to="/about" className={styles.navLink}>About</Link>
      </nav>
      <ThemeToggle />
    </header>
  )
}

export default Header
