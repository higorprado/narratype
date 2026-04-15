const ADSENSE_SCRIPT_ID = 'adsbygoogle-script'
const ADSENSE_PUBLISHER_ID = 'ca-pub-XXXXXXX'

/**
 * Loads the Google AdSense script once per page load.
 * Only runs in production. Consent Mode v2 controls what Google does
 * — the script always loads, but Google serves limited ads when consent is denied.
 */
export function useAdSense() {
  if (import.meta.env.DEV) return

  // Prevent double-load in React StrictMode
  if (document.getElementById(ADSENSE_SCRIPT_ID)) return

  const script = document.createElement('script')
  script.id = ADSENSE_SCRIPT_ID
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`
  document.head.appendChild(script)
}
