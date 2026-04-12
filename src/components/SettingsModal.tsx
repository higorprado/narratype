import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSettings } from '@/context/SettingsContext'
import type { Settings, CursorStyle, StatsUpdateFrequency, ThemeName, FontName } from '@/types'
import styles from './SettingsModal.module.css'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabId = 'functionality' | 'themes' | 'fonts'

const CURSOR_STYLES: CursorStyle[] = ['BOX', 'LINE', 'UNDER', 'DOT', 'HIGH', 'E-BOX', 'H-UNDER', 'H-DOT', 'NONE']
const STATS_FREQUENCIES: StatsUpdateFrequency[] = ['word', 'line', 'page']
const THEMES: ThemeName[] = [
  'classic-dark', 'classic-light', 'timber', 'ocean', 'bubblegum', 'newsprint',
  'cinder', 'bumblebee', 'terracotta', 'canopy', 'lagoon', 'mellow',
  'surf', 'platoon', 'beachside', 'pulse',
]
const FONTS: FontName[] = ['literata', 'hyperlegible', 'open-dyslexic', 'fira-code', 'courier-prime', 'lora', 'bitter', 'comic-sans']

const FONT_SAMPLE = 'The quick brown fox jumps over the lazy dog.'

const BOOLEAN_KEYS: { key: keyof Settings; label: string }[] = [
  { key: 'smoothCursor', label: 'Smooth Cursor' },
  { key: 'readingMode', label: 'Reading Mode' },
  { key: 'internationalMode', label: 'International Mode' },
  { key: 'ignoreCapitalization', label: 'Ignore Capitalization' },
  { key: 'skipPunctuation', label: 'Skip Punctuation' },
  { key: 'stopCursorAfterMistype', label: 'Stop Cursor After Mistype' },
  { key: 'showLiteralMistypes', label: 'Show Literal Mistypes' },
  { key: 'hideUI', label: 'Hide UI' },
  { key: 'autoScroll', label: 'Auto-Scroll' },
  { key: 'virtualKeyboard', label: 'Virtual Keyboard' },
]

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSetting, resetSettings } = useSettings()
  const [activeTab, setActiveTab] = useState<TabId>('functionality')

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const tabs: { id: TabId; label: string }[] = [
    { id: 'functionality', label: 'Functionality' },
    { id: 'themes', label: 'Themes' },
    { id: 'fonts', label: 'Fonts' },
  ]

  function handleToggle(key: keyof Settings) {
    updateSetting(key, !settings[key])
  }

  function handleReset() {
    resetSettings()
  }

  function renderFunctionality() {
    return (
      <>
        {BOOLEAN_KEYS.map(({ key, label }) => (
          <div key={key} className={styles.row}>
            <span className={styles.rowLabel}>{label}</span>
            <input
              type="checkbox"
              className={styles.toggle}
              checked={settings[key] as boolean}
              onChange={() => handleToggle(key)}
              aria-label={label}
            />
          </div>
        ))}

        <div className={styles.row}>
          <span className={styles.rowLabel}>Cursor Style</span>
          <select
            className={styles.select}
            value={settings.cursorStyle}
            onChange={(e) => updateSetting('cursorStyle', e.target.value as CursorStyle)}
            aria-label="Cursor Style"
          >
            {CURSOR_STYLES.map((cs) => (
              <option key={cs} value={cs}>{cs}</option>
            ))}
          </select>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>Stats Update Frequency</span>
          <div className={styles.radioGroup}>
            {STATS_FREQUENCIES.map((freq) => (
              <label key={freq} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="statsUpdateFrequency"
                  value={freq}
                  checked={settings.statsUpdateFrequency === freq}
                  onChange={() => updateSetting('statsUpdateFrequency', freq)}
                />
                {freq}
              </label>
            ))}
          </div>
        </div>
      </>
    )
  }

  function renderThemes() {
    return (
      <div className={styles.themeGrid}>
        {THEMES.map((theme) => (
          <button
            key={theme}
            className={`${styles.themeSwatch} ${settings.theme === theme ? styles.themeSwatchActive : ''}`}
            onClick={() => updateSetting('theme', theme)}
          >
            {theme}
          </button>
        ))}
      </div>
    )
  }

  function renderFonts() {
    return (
      <div className={styles.fontList}>
        {FONTS.map((font) => (
          <button
            key={font}
            className={`${styles.fontItem} ${settings.font === font ? styles.fontItemActive : ''}`}
            onClick={() => updateSetting('font', font)}
          >
            <div className={styles.fontName}>{font}</div>
            <div className={styles.fontSample}>{FONT_SAMPLE}</div>
          </button>
        ))}
      </div>
    )
  }

  const tabContent = {
    functionality: renderFunctionality,
    themes: renderThemes,
    fonts: renderFonts,
  }

  const modal = (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Settings">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Settings</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close settings">
            &times;
          </button>
        </div>

        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.body}>
          {tabContent[activeTab]()}
        </div>

        <div className={styles.footer}>
          <button className={styles.resetButton} onClick={handleReset}>
            Reset Defaults
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
