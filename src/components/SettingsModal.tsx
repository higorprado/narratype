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
const STATS_FREQUENCIES: StatsUpdateFrequency[] = ['word', 'page']
const THEMES: ThemeName[] = [
  'classic-dark', 'classic-light', 'timber', 'ocean', 'bubblegum', 'newsprint',
  'cinder', 'bumblebee', 'terracotta', 'canopy', 'lagoon', 'mellow',
  'surf', 'platoon', 'beachside', 'pulse',
]
const FONTS: FontName[] = ['literata', 'hyperlegible', 'open-dyslexic', 'fira-code', 'courier-prime', 'lora', 'bitter', 'comic-sans']

const THEME_COLORS: Record<ThemeName, { bg: string; accent: string; text: string }> = {
  'classic-dark': { bg: '#1a1a2e', accent: '#e94560', text: '#e0e0e0' },
  'classic-light': { bg: '#ffffff', accent: '#0066cc', text: '#333333' },
  'timber': { bg: '#2c1810', accent: '#d4a574', text: '#e8d5c0' },
  'ocean': { bg: '#0a192f', accent: '#64ffda', text: '#ccd6f6' },
  'bubblegum': { bg: '#2d1b37', accent: '#ff6b9d', text: '#f0e0f0' },
  'newsprint': { bg: '#f5f0e8', accent: '#8b0000', text: '#333333' },
  'cinder': { bg: '#1a1a1a', accent: '#ff6600', text: '#e0e0e0' },
  'bumblebee': { bg: '#1a1a2e', accent: '#ffd700', text: '#f0f0f0' },
  'terracotta': { bg: '#2c1810', accent: '#c75b39', text: '#e8d5c4' },
  'canopy': { bg: '#0d1f0d', accent: '#4caf50', text: '#d4e8d4' },
  'lagoon': { bg: '#0d2137', accent: '#00bcd4', text: '#d4e8f6' },
  'mellow': { bg: '#2d2a26', accent: '#c9a96e', text: '#e8e0d4' },
  'surf': { bg: '#0a2a3a', accent: '#20b2aa', text: '#d4f0f0' },
  'platoon': { bg: '#1a2614', accent: '#8b9a6b', text: '#d4dcc8' },
  'beachside': { bg: '#2b2520', accent: '#e8a87c', text: '#e8ddd0' },
  'pulse': { bg: '#1a0a2e', accent: '#9b59b6', text: '#e0d0f0' },
}


const FONT_SAMPLE = 'The quick brown fox jumps over the lazy dog.'

const FONT_FAMILIES: Record<FontName, string> = {
  literata: '"Literata", Georgia, serif',
  hyperlegible: '"Atkinson Hyperlegible", sans-serif',
  'open-dyslexic': '"OpenDyslexic", sans-serif',
  'fira-code': '"Fira Code", monospace',
  'courier-prime': '"Courier Prime", monospace',
  lora: '"Lora", Georgia, serif',
  bitter: '"Bitter", serif',
  'comic-sans': '"Comic Sans MS", cursive',
}

const BOOLEAN_KEYS: { key: keyof Settings; label: string }[] = [
  { key: 'smoothCursor', label: 'Smooth Cursor' },
  { key: 'readingMode', label: 'Reading Mode' },
  { key: 'internationalMode', label: 'International Mode' },
  { key: 'ignoreCapitalization', label: 'Ignore Capitalization' },
  { key: 'skipPunctuation', label: 'Skip Punctuation' },
  { key: 'stopCursorAfterMistype', label: 'Stop Cursor After Mistype' },
  { key: 'showLiteralMistypes', label: 'Show Literal Mistypes' },
  { key: 'hideUI', label: 'Hide UI' },
  { key: 'autoAdvancePage', label: 'Auto-Advance Page' },
  { key: 'autoScroll', label: 'Auto-Scroll' },
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

        <div className={styles.sliderRow}>
          <span className={styles.rowLabel}>Words per Page</span>
          <div className={styles.sliderControl}>
            <input
              type="range"
              className={styles.slider}
              value={settings.wordsPerPage}
              min={75}
              max={1200}
              step={25}
              onChange={(e) => updateSetting('wordsPerPage', parseInt(e.target.value, 10))}
              aria-label="Words per Page"
            />
            <span className={styles.sliderValue}>{settings.wordsPerPage}</span>
          </div>
        </div>
        {settings.wordsPerPage > 800 && (
          <div className={styles.warning}>High values may cause performance issues. Consider a lower number if the page feels sluggish.</div>
        )}
      </>
    )
  }

  function renderThemes() {
    return (
      <div className={styles.themeGrid}>
        {THEMES.map((theme) => {
          const colors = THEME_COLORS[theme]
          return (
            <button
              key={theme}
              className={`${styles.themeSwatch} ${settings.theme === theme ? styles.themeSwatchActive : ''}`}
              onClick={() => updateSetting('theme', theme)}
            >
              <div
                className={styles.themePreview}
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                <span style={{ color: colors.accent }}>Aa</span>
              </div>
              <span className={styles.themeLabel}>{theme}</span>
            </button>
          )
        })}
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
            <div className={styles.fontSample} style={{ fontFamily: FONT_FAMILIES[font] }}>{FONT_SAMPLE}</div>
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
