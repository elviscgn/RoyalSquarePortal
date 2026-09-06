export interface ExtractedEntities {
  fullName?: string
  idNumber?: string
  taxNumber?: string
  address?: string
  mobile?: string
  email?: string
  bank?: {
    id: string
    name: string
    shortName: string
    code: string
    logo: string
  }
  accountNumber?: string
  accountType?: 'Cheque' | 'Savings' | 'Transmission'
  monthlySalary?: number
  livingExpenses?: number
  debtPayments?: number
  assetsAmount?: number
  liabilitiesAmount?: number
  focus?: 'investments' | 'family_protection' | 'retirement' | 'holistic'
  reg28Compliant?: boolean
  consentGranted?: boolean
  beneficiary?: {
    name: string
    percentage: number
  }
  rawTranscript: string
}

const SA_BANKS_LOOKUP = [
  { id: 'fnb', name: 'First National Bank (FNB)', shortName: 'FNB', code: '250655', logo: '/banks/fnb.png', aliases: ['fnb', 'first national bank', 'first national'] },
  { id: 'standard', name: 'Standard Bank', shortName: 'Standard Bank', code: '051001', logo: '/banks/standard-bank.png', aliases: ['standard bank', 'standard', 'stanbic'] },
  { id: 'capitec', name: 'Capitec Bank', shortName: 'Capitec', code: '470010', logo: '/banks/capitec.png', aliases: ['capitec', 'capitec bank'] },
  { id: 'absa', name: 'Absa Bank', shortName: 'Absa', code: '632005', logo: '/banks/absa.png', aliases: ['absa', 'absa bank'] },
  { id: 'nedbank', name: 'Nedbank', shortName: 'Nedbank', code: '198765', logo: '/banks/nedbank.png', aliases: ['nedbank', 'ned bank'] },
  { id: 'investec', name: 'Investec Bank', shortName: 'Investec', code: '580105', logo: '/banks/investec.png', aliases: ['investec', 'investec bank'] },
  { id: 'discovery', name: 'Discovery Bank', shortName: 'Discovery', code: '679000', logo: '/banks/discovery.png', aliases: ['discovery', 'discovery bank'] },
]

function parseRandAmount(str: string): number | undefined {
  if (!str) return undefined
  const millionMatch = str.match(/([\d.,]+)\s*(?:million|mil|m\b)/i)
  if (millionMatch) {
    const num = parseFloat(millionMatch[1].replace(/,/g, ''))
    return Math.round(num * 1000000)
  }
  const kMatch = str.match(/([\d.,]+)\s*(?:thousand|k\b)/i)
  if (kMatch) {
    const num = parseFloat(kMatch[1].replace(/,/g, ''))
    return Math.round(num * 1000)
  }
  const clean = str.replace(/[^\d.]/g, '')
  const parsed = parseFloat(clean)
  return isNaN(parsed) ? undefined : Math.round(parsed)
}

function cleanExtractedName(raw: string): string {
  // Remove trailing stop words like 'and', 'with', 'my', 'is', 'for', etc.
  return raw.replace(/\s+(?:and|with|my|is|for|at|the|who|id|tax|salary|living|debt|phone|mobile).*/i, '').trim()
}

export function extractEntitiesFromSpeech(transcript: string): ExtractedEntities {
  const result: ExtractedEntities = {
    rawTranscript: transcript
  }

  const lower = transcript.toLowerCase()

  // 1. Bank extraction with logo
  for (const b of SA_BANKS_LOOKUP) {
    if (b.aliases.some(alias => new RegExp(`\\b${alias}\\b`, 'i').test(transcript))) {
      result.bank = {
        id: b.id,
        name: b.name,
        shortName: b.shortName,
        code: b.code,
        logo: b.logo
      }
      break
    }
  }

  // 2. Name extraction ("My name is [Name]" or "Name is [Name]" or "I am [Name]" or "Onboard [Name]")
  const nameMatch = transcript.match(/(?:my name is|name is|i am|onboard|client name is)\s+([A-Za-z]+(?:\s+[A-Za-z]+){1,3})/i)
  if (nameMatch) {
    result.fullName = cleanExtractedName(nameMatch[1])
  }

  // 3. SA ID number (13 digits, optionally formatted with spaces)
  const idMatch = transcript.match(/\b(\d{6}\s*\d{4}\s*\d{3}|\d{13})\b/)
  if (idMatch) {
    const rawDigits = idMatch[1].replace(/\s+/g, '')
    result.idNumber = `${rawDigits.slice(0, 6)} ${rawDigits.slice(6, 10)} ${rawDigits.slice(10, 13)}`
  }

  // 4. Tax number (10 digits)
  const taxMatch = transcript.match(/(?:tax\s*(?:number|no)?|sars)\s*(?:is|:)?\s*(\d{10})/i)
  if (taxMatch) {
    result.taxNumber = taxMatch[1]
  }

  // 5. Account number (8 to 12 digits)
  const accMatch = transcript.match(/(?:account\s*(?:number|no)?|acc\s*no)\s*(?:is|:)?\s*(\d{8,12})/i)
  if (accMatch) {
    result.accountNumber = accMatch[1]
  }

  // 6. Account type
  if (/cheque|current account/i.test(lower)) {
    result.accountType = 'Cheque'
  } else if (/savings account|savings/i.test(lower)) {
    result.accountType = 'Savings'
  } else if (/transmission/i.test(lower)) {
    result.accountType = 'Transmission'
  }

  // 7. Monthly Salary
  const salaryMatch = transcript.match(/(?:salary|earning|income|earn)\s*(?:of|is|:)?\s*(?:r|rand)?\s*([\d.,]+\s*(?:k|thousand|million|m)?|\d+)/i)
  if (salaryMatch) {
    result.monthlySalary = parseRandAmount(salaryMatch[1])
  }

  // 8. Living Expenses
  const expensesMatch = transcript.match(/(?:living\s*expenses|household\s*expenses|expenses|spend)\s*(?:of|is|:)?\s*(?:r|rand)?\s*([\d.,]+\s*(?:k|thousand|million|m)?|\d+)/i)
  if (expensesMatch) {
    result.livingExpenses = parseRandAmount(expensesMatch[1])
  }

  // 9. Debt Payments
  const debtMatch = transcript.match(/(?:debt\s*payments?|debt\s*obligations?|liabilities\s*payments?|car\s*and\s*bond|debt)\s*(?:of|is|:)?\s*(?:r|rand)?\s*([\d.,]+\s*(?:k|thousand|million|m)?|\d+)/i)
  if (debtMatch) {
    result.debtPayments = parseRandAmount(debtMatch[1])
  }

  // 10. Assets Amount (Balance Sheet)
  const assetsMatch = transcript.match(/(?:total\s*assets|net\s*assets|investments\s*total|assets)\s*(?:of|is|to|are|:)?\s*(?:r|rand)?\s*([\d.,]+\s*(?:k|thousand|million|m)?|\d+)/i)
  if (assetsMatch) {
    result.assetsAmount = parseRandAmount(assetsMatch[1])
  }

  // 11. Liabilities Amount (Balance Sheet)
  const liabilitiesMatch = transcript.match(/(?:total\s*liabilities|total\s*debt|mortgage\s*and\s*loans|liabilities)\s*(?:of|is|to|are|:)?\s*(?:r|rand)?\s*([\d.,]+\s*(?:k|thousand|million|m)?|\d+)/i)
  if (liabilitiesMatch) {
    result.liabilitiesAmount = parseRandAmount(liabilitiesMatch[1])
  }

  // 12. Financial Focus / Objective
  if (/retire|retirement|annuity|preservation/i.test(lower)) {
    result.focus = 'retirement'
  } else if (/family|life cover|disability|dread disease|severe illness/i.test(lower)) {
    result.focus = 'family_protection'
  } else if (/holistic|360|comprehensive|all-in-one/i.test(lower)) {
    result.focus = 'holistic'
  } else if (/invest|wealth|equity|shares|growth|unit trusts?/i.test(lower)) {
    result.focus = 'investments'
  }

  // 13. Regulation 28
  if (/reg(?:ulation)?\s*28/i.test(lower)) {
    result.reg28Compliant = true
  }

  // 14. Statutory Consent / Mandate
  if (/grant(?:ed)?\s+authorization|grant(?:ed)?\s+consent|authorize\s+astute|consent\s+to\s+astute|astute\s+exchange|fais\s+section\s+13/i.test(lower)) {
    result.consentGranted = true
  }

  // 15. Beneficiary & Allocation
  const beneMatch = transcript.match(/(?:beneficiary|add\s*beneficiary)\s*(?:is|to)?\s*([A-Za-z]+(?:\s+[A-Za-z]+){1,3})/i)
  const percentMatch = transcript.match(/(\d{1,3})\s*(?:%|percent)/i)
  if (beneMatch) {
    result.beneficiary = {
      name: cleanExtractedName(beneMatch[1]),
      percentage: percentMatch ? parseInt(percentMatch[1], 10) : 100
    }
  }

  // 16. Mobile number
  const mobileMatch = transcript.match(/(?:\+27|0)\s*\d{2}\s*\d{3}\s*\d{4}/)
  if (mobileMatch) {
    result.mobile = mobileMatch[0]
  }

  return result
}
