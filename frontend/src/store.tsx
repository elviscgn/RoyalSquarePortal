import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import { createSeedState } from './data/seed'
import { audit } from './services/mockServices'
import type { AuditEvent, DocumentStatus, FinancialOverview, OnboardingData, PortalDocument, PortalState, RequestCase, RequestType } from './types'

const STORAGE_KEY = 'royal-square-client-portal-v1'
const SIMPLE_MODE_PREFERENCE_KEY = 'royal-square-simple-mode-preference'

export function resolveInitialSimpleMode(savedPreference: string | null, isMobile: boolean) {
  if (savedPreference === 'true') return true
  if (savedPreference === 'false') return false
  return isMobile
}

let serviceCounter = 0
const nextServiceId = (prefix: string) => {
  serviceCounter += 1
  return `${prefix}-${2049 + serviceCounter}`
}

const stepsForService = (kind: RequestType): RequestCase['steps'] => {
  switch (kind) {
    case 'motor_claim_registration':
    case 'motor_accident_claim':
      return [
        { id: 'incident', title: 'Incident submitted', owner: 'client', state: 'complete' },
        { id: 'evidence', title: 'Evidence received', owner: 'system', state: 'complete' },
        { id: 'registered', title: 'Claim registered', owner: 'provider', state: 'in-progress' },
        { id: 'handler', title: 'Claims handler assigned', owner: 'provider', state: 'pending' },
        { id: 'closed', title: 'Transaction closed', owner: 'system', state: 'pending' },
      ]
    case 'address_change':
      return [
        { id: 'request', title: 'Request created', owner: 'system', state: 'complete' },
        { id: 'review', title: 'Waiting for Qiniso', owner: 'adviser', state: 'in-progress' },
        { id: 'provider', title: 'Submitted to provider', owner: 'provider', state: 'pending' },
        { id: 'complete', title: 'Complete', owner: 'system', state: 'pending' },
      ]
    default:
      return [
        { id: 'request', title: 'Request created', owner: 'system', state: 'complete' },
        { id: 'adviser', title: 'Waiting for Qiniso', owner: 'adviser', state: 'in-progress' },
        { id: 'provider', title: 'Submitted to provider', owner: 'provider', state: 'pending' },
        { id: 'complete', title: 'Complete', owner: 'system', state: 'pending' },
      ]
  }
}

export type Action =
  | { type: 'toggle-simple-mode' }
  | { type: 'set-simple-mode'; value: boolean }
  | { type: 'set-locale'; locale: PortalState['locale'] }
  | { type: 'set-banking-stage'; stage: number }
  | { type: 'select-product'; product: string }
  | { type: 'upload-statement'; valid: boolean }
  | { type: 'set-banking-details'; details: PortalState['banking']['details'] }
  | { type: 'sign-banking' }
  | { type: 'submit-banking' }
  | { type: 'sign-consent'; signature: string }
  | { type: 'update-accident'; patch: Partial<PortalState['accident']> }
  | { type: 'sync-accident' }
  | { type: 'register-claim'; policeCaseNumber?: string }
  | { type: 'create-service-request'; kind: RequestType; title: string; detail: string; newAddress?: string }
  | { type: 'complete-onboarding'; payload: OnboardingData }
  | { type: 'complete-task'; id: string }
  | { type: 'update-request'; id: string; patch: Partial<RequestCase> }
  | { type: 'set-document-status'; id: string; status: DocumentStatus }
  | { type: 'add-audit'; event: AuditEvent }
  | { type: 'update-finances'; patch: Partial<FinancialOverview> }
  | { type: 'update-client'; patch: Partial<PortalState['client']> }
  | { type: 'reset' }

const withAudit = (state: PortalState, event: AuditEvent): PortalState => ({ ...state, auditEvents: [...state.auditEvents, event] })

export function reducer(state: PortalState, action: Action): PortalState {
  switch (action.type) {
    case 'update-client': {
      const updatedClient = { ...state.client, ...action.patch }
      return withAudit(
        { ...state, client: updatedClient },
        audit('client.profile_update', `Client profile updated: ${updatedClient.name}.`, 'client', 'PRF-UPDATE')
      )
    }
    case 'update-finances': {
      const current = state.finances
      const assets = action.patch.assets !== undefined ? action.patch.assets : current.assets
      const liabilities = action.patch.liabilities !== undefined ? action.patch.liabilities : current.liabilities
      const netWorth = assets - liabilities
      const updated: FinancialOverview = {
        ...current,
        ...action.patch,
        assets,
        liabilities,
        netWorth
      }
      return withAudit(
        { ...state, finances: updated },
        audit('client.voice_update', 'Financial position calibrated via Royal Square Voice Assistant.', 'client', 'FIN-VOICE')
      )
    }
    case 'toggle-simple-mode': return { ...state, simpleMode: !state.simpleMode }
    case 'set-simple-mode': return { ...state, simpleMode: action.value }
    case 'set-locale': return { ...state, locale: action.locale }
    case 'set-banking-stage': return { ...state, banking: { ...state.banking, stage: action.stage } }
    case 'select-product': return { ...state, banking: { ...state.banking, products: state.banking.products.includes(action.product) ? state.banking.products.filter((p) => p !== action.product) : [...state.banking.products, action.product] } }
    case 'upload-statement': {
      const statement = { name: action.valid ? 'bank-statement-aug-2026.pdf' : 'bank-statement-may-2026.pdf', ageDays: action.valid ? 17 : 116, valid: action.valid }
      return withAudit({ ...state, banking: { ...state.banking, statement } }, audit(action.valid ? 'bank_statement.validated' : 'bank_statement.invalid', action.valid ? 'Bank statement verified and is 17 days old.' : 'Bank statement is older than three months.', 'system', 'BD-2048'))
    }
    case 'set-banking-details': return { ...state, banking: { ...state.banking, details: action.details } }
    case 'sign-banking': return withAudit({ ...state, banking: { ...state.banking, signed: true, stage: 7 } }, audit('client.signed', 'Banking instruction signed by Latoya Matai.', 'client', 'BD-2048'))
    case 'submit-banking': {
      const requests = state.requests.map((request) => request.id === 'BD-2048' ? { ...request, status: 'waiting-adviser' as const, currentStep: 5, description: 'Your signed banking instruction is with Qiniso for review.', updatedAt: 'Just now', steps: request.steps.map((step, index) => ({ ...step, state: index < 5 ? 'complete' as const : index === 5 ? 'in-progress' as const : 'pending' as const })) } : request)
      const statementDoc: PortalDocument = { id: 'doc-bank-statement', title: 'Bank Statement · August 2026', subtitle: 'Verified evidence · 17 days old', category: 'statement', status: 'ready', date: '05 Sep 2026', fileName: 'bank-statement-aug-2026.pdf', action: 'View evidence', requestId: 'BD-2048' }
      const signedDoc: PortalDocument = { id: 'doc-bank-instruction', title: 'Signed Banking Instruction', subtitle: 'Waiting for Qiniso · #BD-2048', category: 'signed', status: 'signed', date: '05 Sep 2026', action: 'View instruction', requestId: 'BD-2048' }
      const documents = [...state.documents.filter((document) => !['doc-bank-statement', 'doc-bank-instruction'].includes(document.id)), statementDoc, signedDoc]
      const tasks = state.tasks.map((task) => task.id === 'task-bank-sign' ? { ...task, status: 'complete' as const } : task)
      return withAudit({ ...state, banking: { ...state.banking, submitted: true, stage: 8 }, requests, documents, tasks }, audit('provider.submitted', 'Banking details instruction submitted to Qiniso for review.', 'client', 'BD-2048'))
    }
    case 'sign-consent': {
      const documents = state.documents.map((document) => document.id === 'doc-consent' ? { ...document, status: 'signed' as const, subtitle: 'Signed and recorded · FSP 29370' } : document)
      const formSubmissions = [{ id: 'form-consent-001', formType: 'client-consent', status: 'signed' as const, signedAt: new Date().toISOString(), signature: action.signature }]
      const tasks = state.tasks.map((task) => task.id === 'task-sign-consent' ? { ...task, status: 'complete' as const } : task)
      return withAudit({ ...state, documents, formSubmissions, tasks }, audit('form.submitted', 'Client Consent was reviewed, signed, and recorded.', 'client', 'FORM-CONSENT'))
    }
    case 'update-accident': return { ...state, accident: { ...state.accident, ...action.patch } }
    case 'sync-accident': {
      const requests = state.requests.map((request) => request.id === 'RSF-2841' ? { ...request, status: 'waiting-adviser' as const, currentStep: 2, description: 'Evidence received. Qiniso will review the claim dossier.', updatedAt: 'Just now', steps: request.steps.map((step, index) => ({ ...step, state: index < 2 ? 'complete' as const : index === 2 ? 'in-progress' as const : 'pending' as const })) } : request)
      const tasks = state.tasks.map((task) => task.id === 'task-police' ? { ...task, description: 'Police case number can be added from Requests.', status: 'open' as const } : task)
      return withAudit({ ...state, accident: { ...state.accident, online: true, synced: true, savedOffline: false }, requests, tasks }, audit('accident.synced', 'Offline accident evidence synced and motor claim created.', 'system', 'RSF-2841'))
    }
    case 'register-claim': {
      const requests = state.requests.map((request) => request.id === 'RSF-2841'
        ? {
          ...request, status: 'waiting-provider' as const, currentStep: 3,
          description: action.policeCaseNumber ? `Claim registered with insurer. SAPS case ${action.policeCaseNumber}.` : 'Claim registered with insurer. Handler assignment pending.',
          updatedAt: 'Just now',
          metadata: { ...(request.metadata ?? {}), providerReference: 'RSF-MOCK-2841', ...(action.policeCaseNumber ? { policeCaseNumber: action.policeCaseNumber } : {}) },
          steps: request.steps.map((step, index) => ({ ...step, state: index < 3 ? 'complete' as const : index === 3 ? 'in-progress' as const : 'pending' as const })),
        }
        : request)
      const withPoliceTask = action.policeCaseNumber
        ? state.tasks.map((task) => task.id === 'task-police' ? { ...task, status: 'complete' as const } : task)
        : state.tasks
      let next = withAudit({ ...state, requests, tasks: withPoliceTask }, audit('claim.created', 'Motor claim registered with insurer (mock provider).', 'client', 'RSF-2841'))
      next = withAudit(next, audit('provider.accepted', 'Insurer accepted claim RSF-MOCK-2841 (mock response).', 'provider', 'RSF-2841'))
      return next
    }
    case 'create-service-request': {
      const prefixMap: Record<string, string> = { address_change: 'ADR', policy_document: 'POL', border_letter: 'BL', irp5_request: 'IRP5', consultation: 'CON', info_collection: 'INF', balance_sheet: 'BS', income_statement: 'IS', beneficiary_update: 'BEN', personal_details_update: 'PDU', motor_claim_registration: 'CLM' }
      const id = nextServiceId(prefixMap[action.kind] ?? 'SRV')
      const steps = stepsForService(action.kind)
      const newRequest: RequestCase = {
        id, title: action.title, type: action.kind, status: 'waiting-adviser',
        description: action.detail || 'With Qiniso for review. We will notify you when the provider responds.',
        updatedAt: 'Just now', currentStep: 1, steps,
        metadata: { providerReference: `RSF-MOCK-${id}` },
      }
      const client = action.kind === 'address_change' && action.newAddress ? { ...state.client, address: action.newAddress } : state.client
      const uploadKinds: RequestType[] = ['balance_sheet', 'income_statement', 'info_collection']
      let documents = state.documents
      if (uploadKinds.includes(action.kind)) {
        const doc: PortalDocument = {
          id: `doc-${id.toLowerCase()}`, title: action.title, subtitle: `Uploaded · ${id}`,
          category: 'statement', status: 'ready', date: '05 Sep 2026', action: 'View document', requestId: id,
        }
        documents = [...documents, doc]
      }
      const next = { ...state, client, requests: [newRequest, ...state.requests], documents }
      return withAudit(next, audit('request.created', `${action.title} (${id}) created and sent to Qiniso.`, 'client', id))
    }
    case 'complete-onboarding': {
      const { payload } = action
      const client = {
        ...state.client,
        name: payload.client.name || state.client.name,
        idNumber: payload.client.idNumber || state.client.idNumber,
        mobile: payload.client.mobile || state.client.mobile,
        email: payload.client.email || state.client.email,
        address: payload.client.address || state.client.address,
        tier: 'Premier',
        type: 'Private Client',
      }
      const banking = {
        ...state.banking,
        details: {
          holder: payload.bankDetails.holder || client.name,
          bank: payload.bankDetails.bank,
          account: payload.bankDetails.account,
          branch: payload.bankDetails.branch,
          type: payload.bankDetails.type,
        },
        statement: { name: `${payload.bankDetails.bank.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-statement-aug-2026.pdf`, ageDays: 14, valid: true },
        signed: true,
        submitted: true,
      }
      const estimatedAssets = payload.cashFlow.estimatedAssets ?? Math.max(1200000, Math.round(payload.cashFlow.monthlySalary * 24 + 350000))
      const estimatedLiabilities = payload.cashFlow.estimatedLiabilities ?? Math.max(250000, Math.round(payload.cashFlow.debtPayments * 36))
      const netWorth = estimatedAssets - estimatedLiabilities

      const finances = {
        ...state.finances,
        netWorth,
        assets: estimatedAssets,
        liabilities: estimatedLiabilities,
        investments: Math.round(payload.cashFlow.monthlySalary * 8),
        retirement: Math.round(payload.cashFlow.monthlySalary * 14),
        protection: 2500000,
      }

      const onboardingCase: RequestCase = {
        id: 'ONB-1001',
        title: 'Client Onboarding & Financial Plan Preparation',
        type: 'onboarding',
        status: 'waiting-adviser',
        description: 'Verified onboarding dossier submitted. Qiniso is preparing your bespoke Financial Needs Analysis (FNA).',
        updatedAt: 'Just now',
        priority: 'high',
        currentStep: 3,
        steps: [
          { id: 'ident', title: 'FICA Identity & PEP verified', owner: 'client', state: 'complete' },
          { id: 'bank', title: 'Banking & Cash Flow verified', owner: 'system', state: 'complete' },
          { id: 'mandate', title: 'Advisor Appointment signed', owner: 'client', state: 'complete' },
          { id: 'fna', title: 'FNA & Advice proposal drafting', owner: 'adviser', state: 'in-progress' },
          { id: 'presentation', title: 'Client consultation & sign-off', owner: 'client', state: 'pending' },
        ],
        metadata: {
          fspNumber: '29370',
          adviser: 'Qiniso Ntuli',
          isPep: payload.isPep ? 'Flagged (EDD Required)' : 'Clean (Standard FICA)',
          focus: payload.focus,
          taxNumber: payload.taxNumber || '9827163541',
        },
      }

      const newDocs: PortalDocument[] = [
        {
          id: 'doc-appointment-signed',
          title: 'Signed Notice of Appointment as Financial Advisor',
          subtitle: 'Official mandate · Qiniso Ntuli (FSP 29370)',
          category: 'signed',
          status: 'signed',
          date: '06 Sep 2026',
          fileName: 'signed-broker-appointment-qiniso.pdf',
          action: 'View mandate',
          requestId: 'ONB-1001',
        },
        {
          id: 'doc-consent-onboard',
          title: 'Client Consent to Obtain Information (ASTUTE & POPIA)',
          subtitle: 'Signed and recorded · FSP 29370',
          category: 'signed',
          status: 'signed',
          date: '06 Sep 2026',
          fileName: 'signed-client-consent-astute.pdf',
          action: 'View consent',
          requestId: 'ONB-1001',
        },
        {
          id: 'doc-fica-proof',
          title: 'FICA Identity & PEP Compliance Record',
          subtitle: payload.isPep ? 'PEP Flagged · Enhanced Due Diligence' : 'Verified standard compliance · Green-flagged',
          category: 'official',
          status: 'ready',
          date: '06 Sep 2026',
          action: 'View compliance record',
          requestId: 'ONB-1001',
        },
        {
          id: 'doc-bank-verified',
          title: `${payload.bankDetails.bank} Statement & Verification`,
          subtitle: 'Verified evidence · 14 days old',
          category: 'statement',
          status: 'ready',
          date: '06 Sep 2026',
          action: 'View statement',
          requestId: 'ONB-1001',
        },
      ]

      const existingDocIds = new Set(newDocs.map((d) => d.id))
      const documents = [...newDocs, ...state.documents.filter((d) => !existingDocIds.has(d.id))]

      const tasks = state.tasks.map((t) => {
        if (t.id === 'task-sign-consent') return { ...t, status: 'complete' as const }
        return t
      })

      let next = withAudit(
        {
          ...state,
          client,
          banking,
          finances,
          documents,
          requests: [onboardingCase, ...state.requests.filter((r) => r.id !== 'ONB-1001')],
          tasks,
        },
        audit('client.onboarded', `Client onboarding completed for ${client.name}. FICA verified, mandate executed.`, 'client', 'ONB-1001'),
      )

      next = withAudit(
        next,
        audit('fica.verified', `FICA and PEP screening completed. Status: ${payload.isPep ? 'PEP flagged' : 'Clean'}.`, 'system', 'ONB-1001'),
      )
      next = withAudit(
        next,
        audit('bank_statement.validated', `Bank account verified with ${payload.bankDetails.bank}.`, 'system', 'ONB-1001'),
      )
      return next
    }
    case 'complete-task': return withAudit({ ...state, tasks: state.tasks.map((task) => task.id === action.id ? { ...task, status: 'complete' as const } : task) }, audit('task.completed', `Task ${action.id} completed.`))
    case 'update-request': return { ...state, requests: state.requests.map((request) => request.id === action.id ? { ...request, ...action.patch } : request) }
    case 'set-document-status': return { ...state, documents: state.documents.map((document) => document.id === action.id ? { ...document, status: action.status } : document) }
    case 'add-audit': return withAudit(state, action.event)
    case 'reset': return createSeedState()
    default: return state
  }
}

const loadState = (): PortalState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const state = saved ? JSON.parse(saved) as PortalState : createSeedState()
    const isMobile = typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 760px)').matches
      : window.innerWidth <= 760
    return {
      ...state,
      simpleMode: resolveInitialSimpleMode(localStorage.getItem(SIMPLE_MODE_PREFERENCE_KEY), isMobile),
    }
  } catch { return createSeedState() }
}

const StoreContext = createContext<{ state: PortalState; dispatch: Dispatch<Action> } | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, baseDispatch] = useReducer(reducer, undefined, loadState)
  const dispatch = useCallback<Dispatch<Action>>((action) => {
    if (action.type === 'toggle-simple-mode') {
      localStorage.setItem(SIMPLE_MODE_PREFERENCE_KEY, String(!state.simpleMode))
    } else if (action.type === 'set-simple-mode') {
      localStorage.setItem(SIMPLE_MODE_PREFERENCE_KEY, String(action.value))
    }
    baseDispatch(action)
  }, [state.simpleMode])
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }, [state])
  useEffect(() => { if (new URLSearchParams(window.location.search).get('demo') === 'reset') { dispatch({ type: 'reset' }); window.history.replaceState({}, '', window.location.pathname) } }, [])
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const usePortal = () => {
  const value = useContext(StoreContext)
  if (!value) throw new Error('usePortal must be used within AppStoreProvider')
  return value
}
