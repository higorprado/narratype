export const CharState = {
  UNTYPED: 'UNTYPED',
  CORRECT: 'CORRECT',
  INCORRECT: 'INCORRECT',
} as const

export type CharState = (typeof CharState)[keyof typeof CharState]

export interface TypingChar {
  char: string
  state: CharState
  typedChar?: string
}

export interface TypingPage {
  chars: TypingChar[]
  cursorPosition: number
  isComplete: boolean
  startTime: number | null
  endTime: number | null
}

export interface TypingStats {
  wpm: number
  accuracy: number
  correctChars: number
  totalTypedChars: number
  elapsedMs: number
}
