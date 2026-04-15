import { useEffect, useRef } from 'react'
import styles from './AdSlot.module.css'

interface AdSlotProps {
  slot: string
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle'
  style?: React.CSSProperties
  className?: string
}

const ADSENSE_PUBLISHER_ID = 'ca-pub-XXXXXXX'

export default function AdSlot({ slot, format = 'auto', style, className }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null)
  const isDev = import.meta.env.DEV

  useEffect(() => {
    if (isDev) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
    } catch {
      // AdSense script not loaded — graceful no-op
    }
  }, [isDev])

  if (isDev) {
    return (
      <div className={`${styles.devPlaceholder} ${className ?? ''}`} style={style}>
        <span className={styles.adLabel}>Ad Slot (dev)</span>
        <span className={styles.slotId}>{slot}</span>
      </div>
    )
  }

  return (
    <div className={`${styles.adContainer} ${className ?? ''}`} style={style}>
      <span className={styles.adLabel}>Advertisement</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
