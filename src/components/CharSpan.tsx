import { forwardRef } from 'react'
import { CharState } from '@/types'
import type { CharState as CharStateType } from '@/types'
import styles from './CharSpan.module.css'

interface CharSpanProps {
  char: string
  state: CharStateType
  isCursor: boolean
  cursorStyle?: string
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
  function CharSpan({ char, state, isCursor, cursorStyle }, ref) {
    const { text, isSpecial } = getDisplay(char)

    const classNames = [
      styles.char,
      stateClassMap[state],
      isCursor ? styles.cursor : '',
      isCursor && cursorStyle ? styles[`cursor-${cursorStyle.toLowerCase()}`] ?? '' : '',
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
