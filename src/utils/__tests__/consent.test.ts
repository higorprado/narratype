import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getConsent,
  getConsentLevel,
  setConsentLevel,
  setConsent,
  hasDecided,
} from '@/utils/consent'
import type { ConsentPreferences } from '@/utils/consent'

const CONSENT_KEY = 'narratype-consent'

const DEFAULT_CONSENT: ConsentPreferences = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
}

const ACCEPT_ALL: ConsentPreferences = {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
}

const NON_PERSONALIZED: ConsentPreferences = {
  ad_storage: 'granted',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
}

const REJECT_ALL: ConsentPreferences = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
}

describe('consent utils', () => {
  let getItemSpy: ReturnType<typeof vi.spyOn>
  let setItemSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    ;(window as any).gtag = vi.fn()
  })

  afterEach(() => {
    getItemSpy.mockRestore()
    setItemSpy.mockRestore()
    delete (window as any).gtag
  })

  // -- getConsent --

  describe('getConsent', () => {
    it('returns DEFAULT_CONSENT when no stored value', () => {
      getItemSpy.mockReturnValue(null)
      expect(getConsent()).toEqual(DEFAULT_CONSENT)
    })

    it('returns stored preferences when present', () => {
      getItemSpy.mockReturnValue(JSON.stringify(ACCEPT_ALL))
      expect(getConsent()).toEqual(ACCEPT_ALL)
    })

    it('merges partial stored prefs with defaults (only overridden fields change)', () => {
      const partial = { ad_storage: 'granted' } as Partial<ConsentPreferences>
      getItemSpy.mockReturnValue(JSON.stringify(partial))
      const result = getConsent()
      expect(result).toEqual({ ...DEFAULT_CONSENT, ...partial })
      expect(result.ad_user_data).toBe('denied')
      expect(result.ad_storage).toBe('granted')
    })

    it('returns DEFAULT_CONSENT when localStorage.getItem throws', () => {
      getItemSpy.mockImplementation(() => {
        throw new Error('storage unavailable')
      })
      expect(getConsent()).toEqual(DEFAULT_CONSENT)
    })

    it('returns DEFAULT_CONSENT when stored JSON is invalid', () => {
      getItemSpy.mockReturnValue('{bad json')
      expect(getConsent()).toEqual(DEFAULT_CONSENT)
    })
  })

  // -- getConsentLevel --

  describe('getConsentLevel', () => {
    it('returns "all" when ad_personalization is granted', () => {
      getItemSpy.mockReturnValue(JSON.stringify(ACCEPT_ALL))
      expect(getConsentLevel()).toBe('all')
    })

    it('returns "non-personalized" when ad_storage granted but personalization denied', () => {
      getItemSpy.mockReturnValue(JSON.stringify(NON_PERSONALIZED))
      expect(getConsentLevel()).toBe('non-personalized')
    })

    it('returns "rejected" when all denied', () => {
      getItemSpy.mockReturnValue(null)
      expect(getConsentLevel()).toBe('rejected')
    })
  })

  // -- setConsentLevel --

  describe('setConsentLevel', () => {
    it('stores and returns ACCEPT_ALL for "all"', () => {
      const result = setConsentLevel('all')
      expect(result).toEqual(ACCEPT_ALL)
      expect(setItemSpy).toHaveBeenCalledWith(
        CONSENT_KEY,
        JSON.stringify(ACCEPT_ALL),
      )
    })

    it('stores and returns NON_PERSONALIZED for "non-personalized"', () => {
      const result = setConsentLevel('non-personalized')
      expect(result).toEqual(NON_PERSONALIZED)
      expect(setItemSpy).toHaveBeenCalledWith(
        CONSENT_KEY,
        JSON.stringify(NON_PERSONALIZED),
      )
    })

    it('stores and returns REJECT_ALL for "rejected"', () => {
      const result = setConsentLevel('rejected')
      expect(result).toEqual(REJECT_ALL)
      expect(setItemSpy).toHaveBeenCalledWith(
        CONSENT_KEY,
        JSON.stringify(REJECT_ALL),
      )
    })

    it('calls window.gtag with consent update', () => {
      const gtagMock = (window as any).gtag
      setConsentLevel('all')
      expect(gtagMock).toHaveBeenCalledWith(
        'consent',
        'update',
        ACCEPT_ALL,
      )
    })

    it('does not throw when window.gtag is undefined', () => {
      delete (window as any).gtag
      expect(() => setConsentLevel('all')).not.toThrow()
    })

    it('does not throw when localStorage.setItem throws', () => {
      setItemSpy.mockImplementation(() => {
        throw new Error('quota exceeded')
      })
      expect(() => setConsentLevel('all')).not.toThrow()
    })
  })

  // -- setConsent --

  describe('setConsent', () => {
    it('merges partial prefs with current stored prefs', () => {
      getItemSpy.mockReturnValue(
        JSON.stringify({ ad_storage: 'granted' } as Partial<ConsentPreferences>),
      )
      const partial: Partial<ConsentPreferences> = {
        analytics_storage: 'granted',
      }
      const result = setConsent(partial)
      expect(result.ad_storage).toBe('granted')
      expect(result.analytics_storage).toBe('granted')
      expect(result.ad_user_data).toBe('denied')
      expect(result.ad_personalization).toBe('denied')
    })

    it('stores and returns the merged result', () => {
      getItemSpy.mockReturnValue(null)
      const partial: Partial<ConsentPreferences> = {
        ad_storage: 'granted',
      }
      const result = setConsent(partial)
      const expected = { ...DEFAULT_CONSENT, ...partial }
      expect(result).toEqual(expected)
      expect(setItemSpy).toHaveBeenCalledWith(
        CONSENT_KEY,
        JSON.stringify(expected),
      )
    })

    it('calls gtag with the merged consent', () => {
      getItemSpy.mockReturnValue(null)
      const gtagMock = (window as any).gtag
      const partial: Partial<ConsentPreferences> = {
        analytics_storage: 'granted',
      }
      const expected = { ...DEFAULT_CONSENT, ...partial }
      setConsent(partial)
      expect(gtagMock).toHaveBeenCalledWith(
        'consent',
        'update',
        expected,
      )
    })
  })

  // -- hasDecided --

  describe('hasDecided', () => {
    it('returns false when no stored value', () => {
      getItemSpy.mockReturnValue(null)
      expect(hasDecided()).toBe(false)
    })

    it('returns true after setConsentLevel is called', () => {
      // setConsentLevel writes to localStorage via setItemSpy
      setConsentLevel('rejected')
      // getItemSpy was set up to return null by default, but setConsentLevel
      // used setItemSpy. We need to simulate that the item is now present.
      getItemSpy.mockReturnValue(JSON.stringify(REJECT_ALL))
      expect(hasDecided()).toBe(true)
    })
  })
})
