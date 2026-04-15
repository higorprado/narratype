import { useState } from 'react'
import { hasDecided, setConsentLevel } from '@/utils/consent'
import styles from './CookieConsentBanner.module.css'

export default function CookieConsentBanner() {
  const [decided, setDecided] = useState(hasDecided)

  if (decided) return null

  function handleAccept() {
    setConsentLevel('all')
    setDecided(true)
  }

  function handleNonPersonalized() {
    setConsentLevel('non-personalized')
    setDecided(true)
  }

  function handleReject() {
    setConsentLevel('rejected')
    setDecided(true)
  }

  return (
    <div className={styles.banner} role="dialog" aria-label="Cookie consent">
      <p className={styles.text}>
        We use cookies for advertising. Your typing data stays local and is never sent to any server.
      </p>
      <div className={styles.actions}>
        <button className={styles.rejectButton} onClick={handleReject}>
          Reject All
        </button>
        <button className={styles.npButton} onClick={handleNonPersonalized}>
          Non-Personalized Only
        </button>
        <button className={styles.acceptButton} onClick={handleAccept}>
          Accept All
        </button>
      </div>
    </div>
  )
}
