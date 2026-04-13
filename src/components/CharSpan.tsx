import { forwardRef } from 'react'
import { CharState } from '@/types'
import type { CharState as CharStateType } from '@/types'
import styles from './CharSpan.module.css'

interface CharSpanProps {
  char: string
  state: CharStateType
  isCursor: boolean
  cursorStyle?: string
  smoothCursor?: boolean
  showLiteralMistypes?: boolean
  typedChar?: string
}

const stateClassMap: Record<CharStateType, string> = {
  [CharState.UNTYPED]: styles.untyped,
  [CharState.CORRECT]: styles.correct,
  [CharState.INCORRECT]: styles.incorrect,
}

function getDisplay(char: string): { text: string; isSpecial: boolean } {
  if (char === '\n') return { text: '↵', isSpecial: true }
  return { text: char, isSpecial: false }
}

const CharSpan = forwardRef<HTMLSpanElement, CharSpanProps>(
  function CharSpan({ char, state, isCursor, cursorStyle, smoothCursor, showLiteralMistypes, typedChar }, ref) {
    // When showLiteralMistypes is on and the char is incorrect, show what was actually typed
    const displayChar = (showLiteralMistypes && state === CharState.INCORRECT && typedChar)
      ? typedChar
      : char
    const { text, isSpecial } = getDisplay(displayChar)

    // Map cursor style to CSS class. BOX maps to cursor-box; others map to cursor-{lowercase}.
    let cursorClass = ''
    if (isCursor) {
      const styleKey = cursorStyle ? cursorStyle.toLowerCase() : 'box'
      cursorClass = styles[`cursor-${styleKey}`] ?? styles['cursor-box'] ?? ''
    }

    const classNames = [
      styles.char,
      stateClassMap[state],
      cursorClass,
      smoothCursor ? styles.smoothCursor : '',
      isSpecial ? styles.special : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <span ref={ref} className={classNames} data-testid="char-span">
        {text}
      </span>
    )
  },
)

export default CharSpan
