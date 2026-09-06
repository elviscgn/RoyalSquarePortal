import { describe, expect, it } from 'vitest'
import { TRANSLATIONS, LANGUAGE_METADATA, useTranslation } from './translations'
import type { Locale } from '../types'

describe('South African Languages (i18n)', () => {
  const locales: Locale[] = ['en-ZA', 'zu-ZA', 'st-ZA', 'af-ZA', 'xh-ZA']

  it('defines metadata for all 5 official languages', () => {
    locales.forEach((locale) => {
      const meta = LANGUAGE_METADATA[locale]
      expect(meta).toBeDefined()
      expect(meta.label).toBeTruthy()
      expect(meta.nativeName).toBeTruthy()
      expect(meta.fullName).toBeTruthy()
    })
  })

  it('provides complete translation dictionaries without empty strings', () => {
    const keys = Object.keys(TRANSLATIONS['en-ZA']) as (keyof typeof TRANSLATIONS['en-ZA'])[]
    expect(keys.length).toBeGreaterThan(25)

    locales.forEach((locale) => {
      const dict = TRANSLATIONS[locale]
      expect(dict).toBeDefined()
      keys.forEach((key) => {
        expect(dict[key]).toBeDefined()
        expect(typeof dict[key]).toBe('string')
        expect(dict[key].trim().length).toBeGreaterThan(0)
      })
    })
  })

  it('returns appropriate dictionary via useTranslation', () => {
    expect(useTranslation('zu-ZA').netWorth).toBe('Inani Lilonke Lempahla')
    expect(useTranslation('st-ZA').netWorth).toBe('Boleng Bohle ba Leruo')
    expect(useTranslation('af-ZA').netWorth).toBe('Netto Waarde')
    expect(useTranslation('xh-ZA').netWorth).toBe('Ixabiso Lilonke Lempahla')
    expect(useTranslation('en-ZA').netWorth).toBe('Net worth')
  })
})
