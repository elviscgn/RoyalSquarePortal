export type Locale = 'en-ZA' | 'zu-ZA' | 'st-ZA' | 'af-ZA' | 'xh-ZA'
export type RequestStatus = 'waiting-client' | 'waiting-adviser' | 'waiting-provider' | 'automatic' | 'complete'
export type RequestType = 'bank_details_change' | 'motor_accident_claim' | 'motor_claim_registration' | 'annual_review' | 'beneficiary_update' | 'personal_details_update' | 'address_change' | 'policy_document' | 'border_letter' | 'irp5_request' | 'consultation' | 'info_collection' | 'balance_sheet' | 'income_statement' | 'onboarding'
export type DocumentStatus = 'ready' | 'pending' | 'signed' | 'expired'
export type TaskOwner = 'client' | 'adviser' | 'system'

export interface InferredCashFlow {
  monthlySalary: number
  rentalIncome: number
  livingExpenses: number
  debtPayments: number
  existingInsurers: string[]
  netSurplus: number
  estimatedAssets?: number
  estimatedLiabilities?: number
}

export interface OnboardingData {
  client: Partial<Client>
  taxNumber: string
  isPep: boolean
  pepDetails?: string
  bankDetails: {
    bank: string
    account: string
    branch: string
    type: string
    holder: string
  }
  cashFlow: InferredCashFlow
  focus: 'investments' | 'family_protection' | 'retirement' | 'holistic'
  riskProfile?: {
    term: string
    objective: string
    volatilityTolerance: string
    reg28Compliant: boolean
  }
  medicalUnderwriting?: {
    circulatory: boolean
    respiratory: boolean
    diabetes: boolean
    hivTested: boolean
    smoker: boolean
    height: number
    weight: number
  }
  signature: string
}

export interface Client {
  id: string
  name: string
  type: string
  tier: string
  idNumber: string
  email: string
  mobile: string
  address: string
  adviser: string
  business: string
  fspNumber: string
}

export interface WorkflowStep {
  id: string
  title: string
  owner: 'client' | 'adviser' | 'provider' | 'system'
  state: 'pending' | 'in-progress' | 'complete'
}

export interface RequestCase {
  id: string
  title: string
  type: RequestType
  status: RequestStatus
  description: string
  updatedAt: string
  priority?: 'high' | 'medium' | 'low'
  currentStep: number
  steps: WorkflowStep[]
  metadata?: Record<string, string | number | boolean>
}

export interface PortalDocument {
  id: string
  title: string
  subtitle: string
  category: 'official' | 'statement' | 'signed' | 'tax' | 'evidence'
  status: DocumentStatus
  date: string
  fileName?: string
  action?: string
  requestId?: string
}

export interface FormSubmission {
  id: string
  formType: string
  status: 'draft' | 'signed' | 'submitted'
  signedAt?: string
  signature?: string
}

export interface Task {
  id: string
  title: string
  description: string
  owner: TaskOwner
  due: string
  status: 'open' | 'complete'
  recurring?: string
  requestId?: string
}

export interface Goal {
  id: string
  title: string
  type: 'individual' | 'shared'
  targetAmount: number
  currentAmount: number
  targetDate: string
  status: 'on-track' | 'complete' | 'needs-attention'
  sharedWith?: string
  adviserNote?: string
}

export interface AuditEvent {
  id: string
  action: string
  actor: 'client' | 'adviser' | 'system' | 'provider'
  description: string
  timestamp: string
  requestId?: string
}

export interface BankingDraft {
  stage: number
  products: string[]
  statement?: { name: string; ageDays: number; valid: boolean }
  details: { holder: string; bank: string; account: string; branch: string; type: string }
  signed: boolean
  submitted: boolean
}

export interface AccidentDraft {
  online: boolean
  step: number
  incidentTime: string
  location: string
  gpsCaptured: boolean
  photos: string[]
  clientDriving: boolean
  useType: string
  injuries: string
  otherDriver: { name: string; phone: string; plate: string; insurer: string }
  statement: string
  transcript: string
  incidentTarget?: 'other_vehicle' | 'stationary_pole' | 'gov_property' | 'natural_disaster' | 'pedestrian' | 'dui_impairment'
  policeCaseNumber?: string
  policeReminder: boolean
  savedOffline: boolean
  synced: boolean
}

export interface FinancialOverview {
  netWorth: number
  assets: number
  liabilities: number
  investments: number
  retirement: number
  protection: number
}

export interface PortalState {
  client: Client
  requests: RequestCase[]
  documents: PortalDocument[]
  formSubmissions: FormSubmission[]
  tasks: Task[]
  goals: Goal[]
  auditEvents: AuditEvent[]
  simpleMode: boolean
  locale: Locale
  banking: BankingDraft
  accident: AccidentDraft
  finances: FinancialOverview
}
