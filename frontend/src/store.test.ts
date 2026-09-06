import { describe, expect, it } from 'vitest'
import { createSeedState } from './data/seed'
import { reducer, resolveInitialSimpleMode } from './store'

describe('Royal Square portal workflows', () => {
  it('defaults mobile users to Simple Mode without overriding their preference', () => {
    expect(resolveInitialSimpleMode(null, true)).toBe(true)
    expect(resolveInitialSimpleMode(null, false)).toBe(false)
    expect(resolveInitialSimpleMode('false', true)).toBe(false)
    expect(resolveInitialSimpleMode('true', false)).toBe(true)
  })

  it('rejects an old bank statement and accepts a valid one', () => {
    const initial = createSeedState()
    const expired = reducer(initial, { type: 'upload-statement', valid: false })
    expect(expired.banking.statement?.valid).toBe(false)
    expect(expired.banking.statement?.ageDays).toBeGreaterThan(90)
    const valid = reducer(initial, { type: 'upload-statement', valid: true })
    expect(valid.banking.statement?.valid).toBe(true)
    expect(valid.auditEvents[valid.auditEvents.length - 1]?.action).toBe('bank_statement.validated')
  })

  it('keeps a submitted banking request, documents, and tasks in sync', () => {
    let state = createSeedState()
    state = reducer(state, { type: 'upload-statement', valid: true })
    state = reducer(state, { type: 'sign-banking' })
    state = reducer(state, { type: 'submit-banking' })
    expect(state.requests.find((request) => request.id === 'BD-2048')?.status).toBe('waiting-adviser')
    expect(state.documents.some((document) => document.id === 'doc-bank-statement')).toBe(true)
    expect(state.documents.some((document) => document.id === 'doc-bank-instruction' && document.status === 'signed')).toBe(true)
    expect(state.tasks.find((task) => task.id === 'task-bank-sign')?.status).toBe('complete')
  })

  it('records consent signing and clears its client task', () => {
    const state = reducer(createSeedState(), { type: 'sign-consent', signature: 'Latoya Matai' })
    expect(state.formSubmissions[0].status).toBe('signed')
    expect(state.documents.find((document) => document.id === 'doc-consent')?.status).toBe('signed')
    expect(state.tasks.find((task) => task.id === 'task-sign-consent')?.status).toBe('complete')
  })

  it('syncs an offline accident into the canonical claim', () => {
    let state = createSeedState()
    state = reducer(state, { type: 'update-accident', patch: { savedOffline: true, online: false } })
    state = reducer(state, { type: 'sync-accident' })
    expect(state.accident.synced).toBe(true)
    expect(state.requests.find((request) => request.id === 'RSF-2841')?.status).toBe('waiting-adviser')
    expect(state.auditEvents[state.auditEvents.length - 1]?.action).toBe('accident.synced')
  })

  it('executes client onboarding with FICA, bank inference, and statutory mandates', () => {
    let state = createSeedState()
    state = reducer(state, {
      type: 'complete-onboarding',
      payload: {
        client: {
          name: 'Latoya Matai',
          idNumber: '920412 0184 087',
          mobile: '+27 82 555 0184',
          email: 'latoya.matai@example.co.za',
          address: '14 Rivonia Road, Sandton, Johannesburg, 2196',
        },
        taxNumber: '9827163541',
        isPep: false,
        bankDetails: {
          bank: 'First National Bank (FNB)',
          account: '62849104812',
          branch: '250655',
          type: 'Cheque / Current Account',
          holder: 'Latoya Matai',
        },
        cashFlow: {
          monthlySalary: 48500,
          rentalIncome: 0,
          livingExpenses: 24300,
          debtPayments: 8200,
          existingInsurers: ['Discovery Life', 'Sanlam Investments'],
          netSurplus: 16000,
        },
        focus: 'investments',
        riskProfile: {
          term: 'In excess of 5 years',
          objective: 'To achieve real returns (beat inflation)',
          volatilityTolerance: '10% to 20% - Moderate risk investor',
          reg28Compliant: true,
        },
        signature: 'Latoya Matai',
      },
    })

    expect(state.requests.some((r) => r.id === 'ONB-1001')).toBe(true)
    const onbCase = state.requests.find((r) => r.id === 'ONB-1001')
    expect(onbCase?.status).toBe('waiting-adviser')
    expect(onbCase?.type).toBe('onboarding')
    expect(state.documents.some((d) => d.id === 'doc-appointment-signed')).toBe(true)
    expect(state.documents.some((d) => d.id === 'doc-consent-onboard')).toBe(true)
    expect(state.banking.details.bank).toBe('First National Bank (FNB)')
    expect(state.finances.netWorth).toBeGreaterThan(0)
    expect(state.auditEvents.some((a) => a.action === 'client.onboarded')).toBe(true)
  })

  it('resets all demo state', () => {
    let state = reducer(createSeedState(), { type: 'toggle-simple-mode' })
    state = reducer(state, { type: 'reset' })
    expect(state.simpleMode).toBe(false)
    expect(state.client.name).toBe('Latoya Matai')
    expect(state.requests).toHaveLength(4)
  })

  it('updates finances via voice assistant calibration', () => {
    let state = createSeedState()
    state = reducer(state, {
      type: 'update-finances',
      patch: {
        assets: 3000000,
        liabilities: 750000,
      }
    })
    expect(state.finances.assets).toBe(3000000)
    expect(state.finances.liabilities).toBe(750000)
    expect(state.finances.netWorth).toBe(2250000)
    expect(state.auditEvents.some((a) => a.action === 'client.voice_update')).toBe(true)
  })

  it('updates client profile dynamically via update-client action', () => {
    let state = createSeedState()
    state = reducer(state, {
      type: 'update-client',
      patch: {
        name: 'Sipho Khumalo',
        email: 'sipho.khumalo@example.co.za',
        mobile: '+27 83 444 9912'
      }
    })
    expect(state.client.name).toBe('Sipho Khumalo')
    expect(state.client.email).toBe('sipho.khumalo@example.co.za')
    expect(state.client.mobile).toBe('+27 83 444 9912')
    expect(state.auditEvents.some((a) => a.action === 'client.profile_update')).toBe(true)
  })
})
