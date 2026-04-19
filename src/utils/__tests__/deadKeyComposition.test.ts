import { describe, it, expect } from 'vitest'
import { resolveDeadChar, compose } from '@/utils/deadKeyComposition'

describe('resolveDeadChar', () => {
  describe('no shift', () => {
    it('returns acute for Quote', () => {
      expect(resolveDeadChar('Quote', false)).toBe("'")
    })

    it('returns grave for Backquote', () => {
      expect(resolveDeadChar('Backquote', false)).toBe('`')
    })

    it('returns grave for IntlBackslash', () => {
      expect(resolveDeadChar('IntlBackslash', false)).toBe('`')
    })

    it('returns null for unknown code', () => {
      expect(resolveDeadChar('KeyA', false)).toBeNull()
    })

    it('returns null for shift-only code without shift (Digit2)', () => {
      expect(resolveDeadChar('Digit2', false)).toBeNull()
    })

    it('returns null for shift-only code without shift (Digit6)', () => {
      expect(resolveDeadChar('Digit6', false)).toBeNull()
    })

    it('returns null for shift-only code without shift (Backslash)', () => {
      expect(resolveDeadChar('Backslash', false)).toBeNull()
    })
  })

  describe('with shift', () => {
    it('returns diaeresis for Quote', () => {
      expect(resolveDeadChar('Quote', true)).toBe('"')
    })

    it('returns tilde for Backquote', () => {
      expect(resolveDeadChar('Backquote', true)).toBe('~')
    })

    it('returns diaeresis for Digit2', () => {
      expect(resolveDeadChar('Digit2', true)).toBe('"')
    })

    it('returns circumflex for Digit6', () => {
      expect(resolveDeadChar('Digit6', true)).toBe('^')
    })

    it('returns tilde for IntlBackslash', () => {
      expect(resolveDeadChar('IntlBackslash', true)).toBe('~')
    })

    it('returns tilde for Backslash', () => {
      expect(resolveDeadChar('Backslash', true)).toBe('~')
    })

    it('returns null for unknown code with shift', () => {
      expect(resolveDeadChar('KeyA', true)).toBeNull()
    })
  })
})

describe('compose', () => {
  describe('acute accent', () => {
    it('composes acute + a into a-acute', () => {
      expect(compose("'", 'a')).toBe('\u00E1')
    })

    it('composes acute + c into c-cedilla', () => {
      expect(compose("'", 'c')).toBe('\u00E7')
    })

    it('composes acute + E into E-acute', () => {
      expect(compose("'", 'E')).toBe('\u00C9')
    })
  })

  describe('diaeresis', () => {
    it('composes diaeresis + o into o-umlaut', () => {
      expect(compose('"', 'o')).toBe('\u00F6')
    })
  })

  describe('grave accent', () => {
    it('composes grave + u into u-grave', () => {
      expect(compose('`', 'u')).toBe('\u00F9')
    })
  })

  describe('tilde', () => {
    it('composes tilde + a into a-tilde', () => {
      expect(compose('~', 'a')).toBe('\u00E3')
    })

    it('composes tilde + n into n-tilde', () => {
      expect(compose('~', 'n')).toBe('\u00F1')
    })
  })

  describe('circumflex', () => {
    it('composes circumflex + e into e-circumflex', () => {
      expect(compose('^', 'e')).toBe('\u00EA')
    })
  })

  describe('unknown inputs', () => {
    it('returns null for unknown dead char', () => {
      expect(compose('*', 'a')).toBeNull()
    })

    it('returns null for known dead char with unsupported base letter', () => {
      expect(compose("'", 'x')).toBeNull()
    })

    it('returns null for known dead char with digit', () => {
      expect(compose("'", '1')).toBeNull()
    })
  })
})
