const CONSENT_KEY = 'narratype-consent'

export interface ConsentPreferences {
  ad_storage: 'granted' | 'denied'
  ad_user_data: 'granted' | 'denied'
  ad_personalization: 'granted' | 'denied'
  analytics_storage: 'granted' | 'denied'
}

const DEFAULT_CONSENT: ConsentPreferences = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
}

const ACCEPT_ALL: ConsentPreferences = {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
}

/** Non-personalized: cookies allowed for ad serving, but no personalization or user data */
const NON_PERSONALIZED: ConsentPreferences = {
  ad_storage: 'granted',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
}

const REJECT_ALL: ConsentPreferences = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
}

export type ConsentLevel = 'all' | 'non-personalized' | 'rejected'

const LEVEL_MAP: Record<ConsentLevel, ConsentPreferences> = {
  'all': ACCEPT_ALL,
  'non-personalized': NON_PERSONALIZED,
  'rejected': REJECT_ALL,
}

export function getConsent(): ConsentPreferences {
  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (stored) return { ...DEFAULT_CONSENT, ...JSON.parse(stored) }
  } catch {
    // Corrupted or unavailable — fall through
  }
  return { ...DEFAULT_CONSENT }
}

export function getConsentLevel(): ConsentLevel {
  const prefs = getConsent()
  if (prefs.ad_personalization === 'granted') return 'all'
  if (prefs.ad_storage === 'granted') return 'non-personalized'
  return 'rejected'
}

export function setConsentLevel(level: ConsentLevel): ConsentPreferences {
  const updated = { ...LEVEL_MAP[level] }
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(updated))
  } catch {
    // Storage full or unavailable — settings remain in memory
  }

  // Push to Google Consent Mode (safe no-op if gtag not loaded)
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (window as any).gtag
    if (typeof gtag === 'function') {
      gtag('consent', 'update', updated)
    }
  }

  return updated
}

export function setConsent(preferences: Partial<ConsentPreferences>): ConsentPreferences {
  const current = getConsent()
  const updated = { ...current, ...preferences }
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(updated))
  } catch {
    // Storage full or unavailable — settings remain in memory
  }

  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (window as any).gtag
    if (typeof gtag === 'function') {
      gtag('consent', 'update', updated)
    }
  }

  return updated
}

export function hasDecided(): boolean {
  return localStorage.getItem(CONSENT_KEY) !== null
}
