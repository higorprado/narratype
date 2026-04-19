export type CursorStyle =
  | 'BOX'
  | 'LINE'
  | 'UNDER'
  | 'DOT'
  | 'HIGH'
  | 'E-BOX'
  | 'H-UNDER'
  | 'H-DOT'
  | 'NONE'

export type ThemeName =
  | 'classic-dark'
  | 'classic-light'
  | 'timber'
  | 'ocean'
  | 'bubblegum'
  | 'newsprint'
  | 'cinder'
  | 'bumblebee'
  | 'terracotta'
  | 'canopy'
  | 'lagoon'
  | 'mellow'
  | 'surf'
  | 'platoon'
  | 'beachside'
  | 'pulse'
  | 'catppuccin-latte'
  | 'catppuccin-frappe'
  | 'catppuccin-macchiato'
  | 'catppuccin-mocha'

export type FontName =
  | 'literata'
  | 'hyperlegible'
  | 'open-dyslexic'
  | 'fira-code'
  | 'courier-prime'
  | 'lora'
  | 'bitter'
  | 'comic-sans'

export type StatsUpdateFrequency = 'word' | 'page'

export interface Settings {
  theme: ThemeName
  font: FontName
  cursorStyle: CursorStyle
  smoothCursor: boolean
  readingMode: boolean
  ignoreCapitalization: boolean
  skipPunctuation: boolean
  stopCursorAfterMistype: boolean
  showLiteralMistypes: boolean
  hideUI: boolean
  autoAdvancePage: boolean
  autoScroll: boolean
  virtualKeyboard: boolean
  statsUpdateFrequency: StatsUpdateFrequency
  wordsPerPage: number
  pdfWordsPerChapter: number
  inactivityTimeout: number
  disableAds: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'catppuccin-mocha',
  font: 'literata',
  cursorStyle: 'BOX',
  smoothCursor: true,
  readingMode: false,
  ignoreCapitalization: false,
  skipPunctuation: false,
  stopCursorAfterMistype: false,
  showLiteralMistypes: false,
  hideUI: false,
  autoAdvancePage: true,
  autoScroll: true,
  virtualKeyboard: false,
  statsUpdateFrequency: 'word',
  wordsPerPage: 350,
  pdfWordsPerChapter: 1750,
  inactivityTimeout: 5,
  disableAds: true,
}
