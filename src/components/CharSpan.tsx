import { forwardRef } from 'react'
import { CharState } from '@/types'
import type { CharState as CharStateType } from '@/types'
import styles from './CharSpan.module.css'

interface CharSpanProps {
  char: string
  state: CharStateType
  isCursor: boolean
  showLiteralMistypes?: boolean
  typedChar?: string
  style?: React.CSSProperties
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
  function CharSpan({ char, state, isCursor, showLiteralMistypes, typedChar, style }, ref) {
    // When showLiteralMistypes is on and the char is incorrect, show what was actually typed
    const displayChar = (showLiteralMistypes && state === CharState.INCORRECT && typedChar)
      ? typedChar
      : char
    const { text, isSpecial } = getDisplay(displayChar)

    const classNames = [
      styles.char,
      stateClassMap[state],
      isCursor ? styles.cursorActive : '',
      isSpecial ? styles.special : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <span ref={ref} className={classNames} style={style} data-testid="char-span">
        {text}
      </span>
    )
  },
)

export default CharSpan
