import { describe, it, expect } from 'vitest'
import { extractEntitiesFromSpeech } from './entityExtractor'

describe('entityExtractor', () => {
  it('extracts SA banks correctly from speech', () => {
    const text1 = 'I want to link my First National Bank account'
    expect(extractEntitiesFromSpeech(text1).bank?.shortName).toBe('FNB')

    const text2 = 'Select standard bank as primary institution'
    expect(extractEntitiesFromSpeech(text2).bank?.shortName).toBe('Standard Bank')

    const text3 = 'My bank is Nedbank'
    expect(extractEntitiesFromSpeech(text3).bank?.shortName).toBe('Nedbank')

    const text4 = 'I use Capitec'
    expect(extractEntitiesFromSpeech(text4).bank?.shortName).toBe('Capitec')
  })

  it('extracts full name and SA ID', () => {
    const text = 'My name is Sipho Khumalo and my ID number is 880315 5123 088'
    const result = extractEntitiesFromSpeech(text)
    expect(result.fullName).toBe('Sipho Khumalo')
    expect(result.idNumber).toBe('880315 5123 088')
  })

  it('extracts financial cash flow and balance sheet numbers', () => {
    const text = 'My salary is 55000 with living expenses of 24k and debt payments of 8000. Total assets are 2.5 million and liabilities 600k.'
    const result = extractEntitiesFromSpeech(text)
    expect(result.monthlySalary).toBe(55000)
    expect(result.livingExpenses).toBe(24000)
    expect(result.debtPayments).toBe(8000)
    expect(result.assetsAmount).toBe(2500000)
    expect(result.liabilitiesAmount).toBe(600000)
  })

  it('extracts financial focus goals', () => {
    expect(extractEntitiesFromSpeech('I want to plan for my retirement and check regulation 28').focus).toBe('retirement')
    expect(extractEntitiesFromSpeech('I want to plan for my retirement and check regulation 28').reg28Compliant).toBe(true)
    expect(extractEntitiesFromSpeech('Looking for family and life cover protection').focus).toBe('family_protection')
    expect(extractEntitiesFromSpeech('I want capital growth and wealth creation through unit trusts').focus).toBe('investments')
    expect(extractEntitiesFromSpeech('I need a holistic 360 review').focus).toBe('holistic')
  })

  it('extracts beneficiary and allocation percentage', () => {
    const text = 'Please add beneficiary Thabo Khumalo with 100% allocation'
    const result = extractEntitiesFromSpeech(text)
    expect(result.beneficiary?.name).toBe('Thabo Khumalo')
    expect(result.beneficiary?.percentage).toBe(100)
  })

  it('extracts bank logo, account number, account type, and consent', () => {
    const text = 'I bank with First National Bank cheque account number 62819283741. I grant authorization under FAIS Section 13.'
    const result = extractEntitiesFromSpeech(text)
    expect(result.bank?.shortName).toBe('FNB')
    expect(result.bank?.logo).toBe('/banks/fnb.png')
    expect(result.accountNumber).toBe('62819283741')
    expect(result.accountType).toBe('Cheque')
    expect(result.consentGranted).toBe(true)
  })
})
