import { useTheme } from '@/hooks/useTheme'
import { useFont } from '@/hooks/useFont'

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Settings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

type SettingsAction =
  | { type: 'UPDATE_SETTING'; key: keyof Settings; value: Settings[keyof Settings] }
  | { type: 'RESET_SETTINGS' }

interface SettingsContextValue {
  settings: Settings
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  resetSettings: () => void
}

const STORAGE_KEY = 'narratype-settings'

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    // Corrupted storage — fall back to defaults
  }
  // No stored settings — detect system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return { ...DEFAULT_SETTINGS, theme: prefersDark ? 'classic-dark' : 'classic-light' }
}

function settingsReducer(state: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case 'UPDATE_SETTING':
      return { ...state, [action.key]: action.value }
    case 'RESET_SETTINGS':
      return { ...DEFAULT_SETTINGS }
    default:
      return state
  }
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(settingsReducer, null, loadSettings)

  useTheme(settings.theme)
  useFont(settings.font)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Storage full or unavailable — settings remain in memory
    }
  }, [settings])

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      dispatch({ type: 'UPDATE_SETTING', key, value })
    },
    [],
  )

  const resetSettings = useCallback(() => {
    dispatch({ type: 'RESET_SETTINGS' })
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
