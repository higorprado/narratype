/**
 * Dead key composition for international keyboard layouts.
 *
 * On ABNT2, US-International, and similar layouts, accented characters are typed
 * via dead keys: press the dead key (acute, tilde, circumflex, grave), then the
 * base letter. The browser fires keydown with e.key='Dead' for the first press,
 * and keydown with the raw base letter for the second. The composed character
 * never appears in e.key on a non-form element.
 *
 * This module resolves dead key + base letter → composed character using the
 * same composition tables the OS uses.
 */

// Key code → dead character (no shift)
const DEAD_KEY_NO_SHIFT: Record<string, string> = {
  Quote: "'",
  Backquote: '`',
  IntlBackslash: '`',
}

// Key code → dead character (with shift)
const DEAD_KEY_SHIFT: Record<string, string> = {
  Quote: '"',
  Digit2: '"',
  Digit6: '^',
  Backquote: '~',
  IntlBackslash: '~',
  Backslash: '~',
}

// Dead character + base letter → composed character
const COMPOSITION: Record<string, Record<string, string>> = {
  // Acute accent
  "'": {
    a: '\u00E1', e: '\u00E9', i: '\u00ED', o: '\u00F3', u: '\u00FA', y: '\u00FD',
    A: '\u00C1', E: '\u00C9', I: '\u00CD', O: '\u00D3', U: '\u00DA', Y: '\u00DD',
    c: '\u00E7', C: '\u00C7',
  },
  // Diaeresis (umlaut)
  '"': {
    a: '\u00E4', e: '\u00EB', i: '\u00EF', o: '\u00F6', u: '\u00FC', y: '\u00FF',
    A: '\u00C4', E: '\u00CB', I: '\u00CF', O: '\u00D6', U: '\u00DC', Y: '\u0178',
  },
  // Grave accent
  '`': {
    a: '\u00E0', e: '\u00E8', i: '\u00EC', o: '\u00F2', u: '\u00F9',
    A: '\u00C0', E: '\u00C8', I: '\u00CC', O: '\u00D2', U: '\u00D9',
  },
  // Tilde
  '~': {
    a: '\u00E3', n: '\u00F1', o: '\u00F5',
    A: '\u00C3', N: '\u00D1', O: '\u00D5',
  },
  // Circumflex
  '^': {
    a: '\u00E2', e: '\u00EA', i: '\u00EE', o: '\u00F4', u: '\u00FB',
    A: '\u00C2', E: '\u00CA', I: '\u00CE', O: '\u00D4', U: '\u00DB',
  },
}

/**
 * Resolve the dead character for a given key code and shift state.
 * Returns null if the key code is not a known dead key.
 */
export function resolveDeadChar(code: string, shiftKey: boolean): string | null {
  return shiftKey
    ? (DEAD_KEY_SHIFT[code] ?? null)
    : (DEAD_KEY_NO_SHIFT[code] ?? null)
}

/**
 * Look up the composed character for a dead key + base letter combination.
 * Returns null if the combination is not in the composition table.
 */
export function compose(deadChar: string, baseKey: string): string | null {
  return COMPOSITION[deadChar]?.[baseKey] ?? null
}
