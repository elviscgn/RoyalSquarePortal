// types/sa-speech-entities.ts

export interface ExtractedEntities {
  // Personal & Demographics
  fullName?: string
  idNumber?: string
  dateOfBirth?: string      // Auto-derived from SA ID (YYYY-MM-DD)
  age?: number              // Auto-derived from SA ID
  gender?: 'Male' | 'Female'// Auto-derived from SA ID
  isSaCitizen?: boolean     // Auto-derived from SA ID
  taxNumber?: string        // SARS 10-digit tax number
  
  // Contact & Location
  mobile?: string
  email?: string
  address?: string

  // Banking
  bank?: {
    id: string
    name: string
    shortName: string
    code: string
    logo: string
  }
  accountNumber?: string
  accountType?: 'Cheque' | 'Savings' | 'Transmission'

  // Cash Flow & Financials (ZAR)
  monthlySalary?: number
  livingExpenses?: number
  debtPayments?: number
  assetsAmount?: number
  liabilitiesAmount?: number

  // Legal, FICA & Health
  maritalStatus?: 'Single' | 'Married COP' | 'Married ANC with Accrual' | 'Married ANC without Accrual' | 'Divorced' | 'Widowed'
  smokerStatus?: 'Smoker' | 'Non-Smoker'
  hasWill?: boolean
  consentGranted?: boolean  // Astute / FAIS Section 13

  // Advisory Focus & Goals
  focus?: 'investments' | 'family_protection' | 'retirement' | 'holistic'
  retirementAge?: number
  riskTolerance?: 'Conservative' | 'Moderate' | 'Aggressive'
  reg28Compliant?: boolean
  existingProviders?: string[]
  beneficiary?: {
    name: string
    percentage: number
  }

  rawTranscript: string
}

// ============================================================================
// SOUTH AFRICAN BANKS (Includes phonetic STT mishearings)
// ============================================================================

export const SA_BANKS_LOOKUP = [
  { id: 'fnb', name: 'First National Bank (FNB)', shortName: 'FNB', code: '250655', logo: '/banks/fnb.png', aliases: ['fnb', 'first national bank', 'first national'] },
  { id: 'standard', name: 'Standard Bank', shortName: 'Standard Bank', code: '051001', logo: '/banks/standard-bank.png', aliases: ['standard bank', 'standard', 'stanbic'] },
  { id: 'capitec', name: 'Capitec Bank', shortName: 'Capitec', code: '470010', logo: '/banks/capitec.png', aliases: ['capitec', 'capitec bank', 'capitac'] },
  { id: 'absa', name: 'Absa Bank', shortName: 'Absa', code: '632005', logo: '/banks/absa.png', aliases: ['absa', 'absa bank'] },
  { id: 'nedbank', name: 'Nedbank', shortName: 'Nedbank', code: '198765', logo: '/banks/nedbank.png', aliases: ['nedbank', 'ned bank'] },
  { id: 'investec', name: 'Investec Bank', shortName: 'Investec', code: '580105', logo: '/banks/investec.png', aliases: ['investec', 'investec bank'] },
  { id: 'discovery', name: 'Discovery Bank', shortName: 'Discovery', code: '679000', logo: '/banks/discovery.png', aliases: ['discovery bank', 'discovery'] },
  { id: 'tymebank', name: 'TymeBank', shortName: 'TymeBank', code: '678910', logo: '/banks/tymebank.png', aliases: ['tyme bank', 'tymebank', 'tyme'] },
  { id: 'africanbank', name: 'African Bank', shortName: 'African Bank', code: '430000', logo: '/banks/african-bank.png', aliases: ['african bank'] }
]

const SA_PROVIDERS_LOOKUP = [
  'allan gray', 'old mutual', 'sanlam', 'sygnia', 'coronation',
  'ninety one', 'momentum', 'discovery', 'liberty', 'pps', 'stanlib'
]

// ============================================================================
// PARSING UTILITIES
// ============================================================================

/**
 * Parses amounts with messy STT artifacts:
 * "$50,000 Rands", "R50,000", "50k", "32 thousand", "1.5 million", "2 bar", "50 grand"
 */
function parseAnyCurrency(raw: string): number | undefined {
  if (!raw) return undefined

  // Millions / Bar
  const milMatch = raw.match(/([\d.,]+)\s*(?:million|mil|bar\b|m\b)/i)
  if (milMatch) {
    const num = parseFloat(milMatch[1].replace(/,/g, ''))
    return Math.round(num * 1_000_000)
  }

  // Thousands / Grand / K
  const kMatch = raw.match(/([\d.,]+)\s*(?:thousand|grand\b|k\b)/i)
  if (kMatch) {
    const num = parseFloat(kMatch[1].replace(/,/g, ''))
    return Math.round(num * 1_000)
  }

  // Clean out $, R, commas, spaces, ZAR
  const clean = raw.replace(/[^\d.]/g, '')
  const parsed = parseFloat(clean)
  return isNaN(parsed) ? undefined : Math.round(parsed)
}

/**
 * Extracts financial numbers matching given keyword triggers.
 * Immune to leading $, R, ZAR, commas, or trailing "rands".
 */
function extractAmountByKeywords(transcript: string, keywordPattern: string): number | undefined {
  // Matches: [keyword] + [optional is/was/of/:] + [optional $, R, ZAR, etc.] + [the digits and units]
  const regex = new RegExp(
    `(?:${keywordPattern})\\s*(?:is|was|of|:)?\\s*[$rR€£]?\\s*(?:zar\\s*)?([\\d.,]+(?:\\s*(?:k|grand|thousand|million|bar|m))?)`,
    'i'
  )
  const match = transcript.match(regex)
  if (match) {
    return parseAnyCurrency(match[1])
  }
  return undefined
}

/**
 * Decodes 13-digit SA ID into DOB, Age, Gender, and SA Citizenship
 */
function decodeSaId(cleanId: string) {
  if (cleanId.length !== 13) return null

  const yy = parseInt(cleanId.substring(0, 2), 10)
  const mm = parseInt(cleanId.substring(2, 4), 10)
  const dd = parseInt(cleanId.substring(4, 6), 10)
  const genderCode = parseInt(cleanId.substring(6, 10), 10)
  const citizenCode = parseInt(cleanId.charAt(10), 10)

  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null

  // Pivot century dynamically (supports current year)
  const current2DigitYear = new Date().getFullYear() % 100
  const fullYear = yy <= current2DigitYear ? 2000 + yy : 1900 + yy

  const birthDate = new Date(fullYear, mm - 1, dd)
  const diff = Date.now() - birthDate.getTime()
  const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))

  return {
    dateOfBirth: `${fullYear}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
    age,
    gender: genderCode >= 5000 ? ('Male' as const) : ('Female' as const),
    isSaCitizen: citizenCode === 0
  }
}

/**
 * Extracts 13-digit SA ID regardless of pauses, spaces, or dashes
 * ("0208150427085", "01 030755-47085", "880415 5028 083")
 */
function extractSaIdNumber(transcript: string): string | undefined {
  // Strategy 1: Anchored keyword
  const keywordMatch = transcript.match(/(?:id|identity|id\s*number|id\s*no)\s*(?:is|:)?\s*([0-9\s-]{13,26})/i)
  if (keywordMatch) {
    const clean = keywordMatch[1].replace(/\D/g, '')
    if (clean.length >= 13) {
      const id13 = clean.slice(0, 13)
      return `${id13.slice(0, 6)} ${id13.slice(6, 10)} ${id13.slice(10, 13)}`
    }
  }

  // Strategy 2: Raw 13-digit sequence anywhere
  const matches = transcript.match(/\b(?:\d[\s-]*){13}\b/g)
  if (matches) {
    for (const m of matches) {
      const clean = m.replace(/\D/g, '')
      if (clean.length === 13) {
        return `${clean.slice(0, 6)} ${clean.slice(6, 10)} ${clean.slice(10, 13)}`
      }
    }
  }
  return undefined
}

/**
 * Extracts SARS Tax Number (fixes "text number is 91 23456789")
 */
function extractTaxNumber(transcript: string): string | undefined {
  const match = transcript.match(/(?:tax|text|sars)\s*(?:number|no)?\s*(?:is|:)?\s*([0-9\s]{10,18})/i)
  if (match) {
    const clean = match[1].replace(/\D/g, '')
    if (clean.length >= 10) {
      return clean.slice(0, 10)
    }
  }
  return undefined
}

/**
 * Extracts South African Mobile Number
 */
function extractMobileNumber(transcript: string): string | undefined {
  const match = transcript.match(/(?:mobile|phone|cell|cellphone|whatsapp|contact)\s*(?:number|no|numbers)?\s*(?:is|:)?\s*([+0-9\s-]{10,20})/i)
  if (match) {
    const clean = match[1].replace(/\D/g, '')
    if (clean.length === 10 && clean.startsWith('0')) {
      return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 10)}`
    }
    if (clean.length === 11 && clean.startsWith('27')) {
      return `+27 ${clean.slice(2, 4)} ${clean.slice(4, 7)} ${clean.slice(7, 11)}`
    }
  }

  const generic = transcript.match(/(?:\+27|0)[\s-]*(?:[678]\d)[\s-]*\d{3}[\s-]*\d{4}/)
  if (generic) {
    const clean = generic[0].replace(/\D/g, '')
    if (clean.length === 10) {
      return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 10)}`
    }
  }
  return undefined
}

/**
 * Extracts Spoken Email ("john dot doe at gmail dot com")
 */
function extractEmail(transcript: string): string | undefined {
  const direct = transcript.match(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/i)
  if (direct) return direct[0].toLowerCase()

  const spoken = transcript.match(/([a-zA-Z0-9_\-.\s]+)\s+(?:at|@)\s+([a-zA-Z0-9_\-.\s]+)\s+(?:dot|\.)\s+([a-zA-Z]{2,})/i)
  if (spoken) {
    const user = spoken[1].replace(/\s+dot\s+/gi, '.').replace(/\s+/g, '')
    const domain = spoken[2].replace(/\s+/g, '')
    const tld = spoken[3].replace(/\s+/g, '')
    return `${user}@${domain}.${tld}`.toLowerCase()
  }
  return undefined
}

/**
 * Extracts Physical/Residential Address with cleanup for STT stutter
 */
function extractAddress(transcript: string): string | undefined {
  const match = transcript.match(
    /(?:residential address(?:es)?|address|live at|residing at)\s*(?:is|:)?\s*([0-9A-Za-z\s,-]+?)(?=\s+(?:i am|i banquet|i bank|i thank|my salary|my phone|my mobile|my id|$))/i
  )
  if (match) {
    let clean = match[1].trim()
    clean = clean.replace(/\b(?:on\s+my\s+address\s+is|my\s+address\s+is)\b/gi, '').trim()
    if (clean.length > 5) return clean
  }

  // Fallback: "I live in Johannesburg / Cape Town"
  const cityMatch = transcript.match(/(?:live in|reside in|based in)\s+([A-Za-z\s]+?)(?=\s+(?:i am|my|$))/i)
  if (cityMatch) {
    return cityMatch[1].trim()
  }

  return undefined
}

function cleanExtractedName(raw: string): string {
  return raw
    .replace(/\s+(?:and|with|my|is|for|at|the|who|id|text|tax|salary|expenses|living|debt|phone|mobile|bank).*/i, '')
    .trim()
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

export function extractEntitiesFromSpeech(transcript: string): ExtractedEntities {
  const result: ExtractedEntities = {
    rawTranscript: transcript
  }

  const lower = transcript.toLowerCase()

  // 1. Full Name
  const nameMatch = transcript.match(/(?:my name is|name is|i am|onboard|client name is)\s+([A-Za-z]+(?:\s+[A-Za-z]+){1,3})/i)
  if (nameMatch) {
    result.fullName = cleanExtractedName(nameMatch[1])
  }

  // 2. SA ID & Auto-Derived Demographics
  const saId = extractSaIdNumber(transcript)
  if (saId) {
    result.idNumber = saId
    const decoded = decodeSaId(saId.replace(/\s/g, ''))
    if (decoded) {
      result.dateOfBirth = decoded.dateOfBirth
      result.age = decoded.age
      result.gender = decoded.gender
      result.isSaCitizen = decoded.isSaCitizen
    }
  }

  // 3. SARS Tax Number
  const tax = extractTaxNumber(transcript)
  if (tax) result.taxNumber = tax

  // 4. Contact Details
  const mobile = extractMobileNumber(transcript)
  if (mobile) result.mobile = mobile

  const email = extractEmail(transcript)
  if (email) result.email = email

  // 5. Residential Address
  const address = extractAddress(transcript)
  if (address) result.address = address

  // 6. Bank Lookup (handles "I thank with Capitec", "I banquet FNB")
  for (const b of SA_BANKS_LOOKUP) {
    if (b.aliases.some(alias => new RegExp(`\\b${alias}\\b`, 'i').test(lower))) {
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

  // 7. Bank Account Number (8-13 digits)
  const accMatch = transcript.match(/(?:account\s*(?:number|no)?|acc\s*no)\s*(?:is|:)?\s*([0-9\s]{8,16})/i)
  if (accMatch) {
    const cleanAcc = accMatch[1].replace(/\D/g, '')
    if (cleanAcc.length >= 8 && cleanAcc.length <= 13) {
      result.accountNumber = cleanAcc
    }
  }

  // 8. Account Type
  if (/cheque|current account/i.test(lower)) {
    result.accountType = 'Cheque'
  } else if (/savings account|savings/i.test(lower)) {
    result.accountType = 'Savings'
  } else if (/transmission/i.test(lower)) {
    result.accountType = 'Transmission'
  }

  // 9. Cash Flow Amounts (Handles "$50,000", "50k", "50 000 Rands")
  result.monthlySalary = extractAmountByKeywords(transcript, 'salary|earning|income|earn')
  result.livingExpenses = extractAmountByKeywords(transcript, 'living\\s*expenses|household\\s*expenses|expenses|spend')
  result.debtPayments = extractAmountByKeywords(transcript, 'debt\\s*payments?|debt\\s*obligations?|liabilities\\s*payments?|car\\s*and\\s*bond|debt')
  result.assetsAmount = extractAmountByKeywords(transcript, 'total\\s*assets|net\\s*assets|investments\\s*total|assets')
  result.liabilitiesAmount = extractAmountByKeywords(transcript, 'total\\s*liabilities|total\\s*debt|mortgage\\s*and\\s*loans|liabilities')

  // 10. Smoker Status (Negation-aware: handles "not a chainsmoker")
  const negativeSmoker = /(?:not\s+a\s*(?:chain\s*)?smoker|never\s+smoked?|do\s*n['o]t\s+smoke|non[\s-]*smoker|not\s+a\s+smoker)/i.test(lower)
  const positiveSmoker = /(?:\bi\s+smoke\b|\bsmoker\b|\bchainsmoker\b|\bvape\b|\bvaping\b)/i.test(lower)

  if (negativeSmoker) {
    result.smokerStatus = 'Non-Smoker'
  } else if (positiveSmoker) {
    result.smokerStatus = 'Smoker'
  }

  // 11. Matrimonial Regime
  if (/community of property|\bcop\b/i.test(lower)) {
    result.maritalStatus = 'Married COP'
  } else if (/accrual/i.test(lower)) {
    result.maritalStatus = /without accrual|excludes? accrual/i.test(lower)
      ? 'Married ANC without Accrual'
      : 'Married ANC with Accrual'
  } else if (/antenuptial|\banc\b/i.test(lower)) {
    result.maritalStatus = 'Married ANC with Accrual'
  } else if (/\bsingle\b|unmarried/i.test(lower)) {
    result.maritalStatus = 'Single'
  } else if (/divorced/i.test(lower)) {
    result.maritalStatus = 'Divorced'
  } else if (/widowed|widow\b|widower\b/i.test(lower)) {
    result.maritalStatus = 'Widowed'
  }

  // 12. Valid Will
  if (/have a will|drafted a will|valid will/i.test(lower)) {
    result.hasWill = true
  } else if (/no will|need a will|haven't got a will|don't have a(?: valid)? will/i.test(lower)) {
    result.hasWill = false
  }

  // 13. Retirement Target Age
  const retireAgeMatch = transcript.match(/(?:retire\s*at|retirement\s*age(?: of)?)\s*(\d{2})/i)
  if (retireAgeMatch) {
    result.retirementAge = parseInt(retireAgeMatch[1], 10)
  }

  // 14. Risk Profile
  if (/conservative|low risk|cautious|preserve capital/i.test(lower)) {
    result.riskTolerance = 'Conservative'
  } else if (/moderate|balanced|medium risk/i.test(lower)) {
    result.riskTolerance = 'Moderate'
  } else if (/aggressive|high growth|maximum growth|equity heavy/i.test(lower)) {
    result.riskTolerance = 'Aggressive'
  }

  // 15. Financial Focus
  if (/retire|retirement|annuity|preservation/i.test(lower)) {
    result.focus = 'retirement'
  } else if (/family|life cover|disability|dread disease|severe illness/i.test(lower)) {
    result.focus = 'family_protection'
  } else if (/holistic|360|comprehensive|all-in-one/i.test(lower)) {
    result.focus = 'holistic'
  } else if (/invest|wealth|equity|shares|growth|unit trusts?/i.test(lower)) {
    result.focus = 'investments'
  }

  // 16. Regulation 28 Compliance
  if (/reg(?:ulation)?\s*28/i.test(lower)) {
    result.reg28Compliant = true
  }

  // 17. Statutory Mandate / Consent
  if (/grant(?:ed)?\s+(?:authorization|consent)|authorize\s+astute|consent\s+to\s+astute|astute\s+(?:exchange|consent)|fais\s+section\s+13/i.test(lower)) {
    result.consentGranted = true
  }

  // 18. Existing Providers Mentioned
  const detectedProviders = SA_PROVIDERS_LOOKUP.filter(p => new RegExp(`\\b${p}\\b`, 'i').test(lower))
  if (detectedProviders.length > 0) {
    result.existingProviders = detectedProviders.map(p => p.toUpperCase())
  }

  // 19. Beneficiary & Allocation
  const beneMatch = transcript.match(/(?:beneficiary|add\s*beneficiary)\s*(?:is|to)?\s*([A-Za-z]+(?:\s+[A-Za-z]+){1,3})/i)
  const percentMatch = transcript.match(/(\d{1,3})\s*(?:%|percent)/i)
  if (beneMatch) {
    result.beneficiary = {
      name: cleanExtractedName(beneMatch[1]),
      percentage: percentMatch ? parseInt(percentMatch[1], 10) : 100
    }
  }

  return result
}