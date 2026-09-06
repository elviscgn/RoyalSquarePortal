import type { PortalState, RequestCase, WorkflowStep } from '../types'

const bankingSteps: WorkflowStep[] = [
  { id: 'request', title: 'Request created', owner: 'system', state: 'complete' },
  { id: 'statement', title: 'Bank statement uploaded', owner: 'client', state: 'complete' },
  { id: 'verified', title: 'Statement verified', owner: 'system', state: 'complete' },
  { id: 'instruction', title: 'Instruction completed', owner: 'client', state: 'complete' },
  { id: 'signed', title: 'Signed', owner: 'client', state: 'in-progress' },
  { id: 'adviser', title: 'Waiting for Qiniso', owner: 'adviser', state: 'pending' },
  { id: 'provider', title: 'Submitted to provider', owner: 'provider', state: 'pending' },
  { id: 'accepted', title: 'Provider accepted', owner: 'provider', state: 'pending' },
  { id: 'complete', title: 'Complete', owner: 'system', state: 'pending' },
]

const accidentSteps: WorkflowStep[] = [
  { id: 'incident', title: 'Incident submitted', owner: 'client', state: 'pending' },
  { id: 'evidence', title: 'Evidence received', owner: 'system', state: 'pending' },
  { id: 'police', title: 'Police case number added', owner: 'client', state: 'pending' },
  { id: 'registered', title: 'Claim registered', owner: 'provider', state: 'pending' },
  { id: 'handler', title: 'Claims handler assigned', owner: 'provider', state: 'pending' },
  { id: 'assessment', title: 'Vehicle assessment', owner: 'provider', state: 'pending' },
  { id: 'repair', title: 'Repair quotes and authorisation', owner: 'provider', state: 'pending' },
  { id: 'closed', title: 'Transaction closed', owner: 'system', state: 'pending' },
]

export const seedRequests: RequestCase[] = [
  {
    id: 'BD-2048', title: 'Banking Details Update', type: 'bank_details_change', status: 'waiting-client',
    description: 'Your new bank details are ready for final signature.', updatedAt: 'Today, 14:22', priority: 'high', currentStep: 4, steps: bankingSteps,
    metadata: { provider: 'Sanlam Investment Management', product: 'Sanlam Unit Trust' },
  },
  {
    id: 'RSF-2841', title: 'Motor Accident Claim', type: 'motor_accident_claim', status: 'automatic',
    description: 'Save evidence safely, even without a connection.', updatedAt: 'Yesterday, 09:18', currentStep: 0, steps: accidentSteps,
    metadata: { vehicle: '2021 Toyota Corolla', insurer: 'Santam' },
  },
  {
    id: 'AFR-2026', title: 'Annual Financial Review 2026', type: 'annual_review', status: 'waiting-client',
    description: 'Qiniso is waiting for your circumstances confirmation.', updatedAt: '01 Sep 2026', priority: 'medium', currentStep: 1,
    steps: [{ id: 'review', title: 'Annual review information', owner: 'client', state: 'in-progress' }, { id: 'adviser', title: 'Adviser review', owner: 'adviser', state: 'pending' }],
  },
  {
    id: 'BEN-1932', title: 'Beneficiary Allocation Update', type: 'beneficiary_update', status: 'complete',
    description: 'Your signed nomination form was endorsed by Qiniso.', updatedAt: '28 Aug 2026', currentStep: 2,
    steps: [{ id: 'request', title: 'Request created', owner: 'system', state: 'complete' }, { id: 'signed', title: 'Signed', owner: 'client', state: 'complete' }, { id: 'complete', title: 'Complete', owner: 'system', state: 'complete' }],
  },
]

export const createSeedState = (): PortalState => ({
  client: {
    id: 'client-latoya-matai', name: 'Latoya Matai', type: 'Private Client', tier: 'Premier',
    idNumber: '920412 0184 087', email: 'latoya.matai@example.co.za', mobile: '+27 82 555 0184',
    address: '14 Rivonia Road, Sandton, Johannesburg, 2196', adviser: 'Qiniso Ntuli', business: 'Royal Square Financial', fspNumber: '29370',
  },
  requests: structuredClone(seedRequests),
  documents: [
    { id: 'doc-appointment', title: 'Notice of Appointment as a Financial Advisor', subtitle: 'Royal Square Financial · Official document', category: 'official', status: 'ready', date: '03 Sep 2026', fileName: '2025-01 03 BROKER APPOINTMENT (QINISO).docx', action: 'Open original' },
    { id: 'doc-consent', title: 'Client Consent to Obtain Information', subtitle: 'Signature required · FSP 29370', category: 'official', status: 'pending', date: '14 Jan 2025', fileName: '2025-01 04 CLIENT CONSENT (QINISO).docx', action: 'Complete online', requestId: 'FORM-CONSENT' },
    { id: 'doc-sla', title: 'Financial Services Provider Service Level Agreement', subtitle: 'Royal Square Financial · FSP 29370', category: 'official', status: 'ready', date: '14 Jan 2025', fileName: '2025-01 16 SERVICE AGREEMENT (NtuliQ).doc', action: 'Open original' },
    { id: 'doc-fais', title: 'FAIS Disclosure Record', subtitle: 'Regulatory disclosure · FSP 29370', category: 'official', status: 'ready', date: '14 Jan 2025', fileName: '2025-01 11 FAIS DISCLOSURE 1.4 (NtuliQ).doc', action: 'Open original' },
    { id: 'doc-confidentiality', title: 'Confidentiality Agreement', subtitle: 'Royal Square Financial', category: 'official', status: 'ready', date: '14 Jan 2025', fileName: '2025-01 00 CONFIDENTIALITY AGREEMENT.docx', action: 'Open original' },
    { id: 'doc-tax', title: '2026 Tax Certificate', subtitle: 'IT3b & IT3c ready', category: 'tax', status: 'ready', date: '01 Sep 2026', action: 'Download' },
  ],
  formSubmissions: [],
  tasks: [
    { id: 'task-sign-consent', title: 'Client Consent signature', description: 'Review and sign the information consent form.', owner: 'client', due: 'Today', status: 'open', requestId: 'FORM-CONSENT' },
    { id: 'task-bank-sign', title: 'Sign banking instruction', description: 'Finish your banking details update.', owner: 'client', due: 'Today', status: 'open', requestId: 'BD-2048' },
    { id: 'task-review', title: 'Annual review information', description: 'Confirm what has changed since your last review.', owner: 'client', due: '18 Sep 2026', status: 'open', requestId: 'AFR-2026' },
    { id: 'task-police', title: 'Police case number', description: 'Add this after reporting the accident where required.', owner: 'client', due: 'Within 48 hours', status: 'open', requestId: 'RSF-2841' },
    { id: 'task-valuation', title: 'Insurance valuation certificate', description: 'Renewed every two years with you and Qiniso. We remind you both automatically.', owner: 'adviser', due: '12 Oct 2026', status: 'open', recurring: 'Every 2 years' },
    { id: 'task-licence', title: 'Driving licence expiry', description: 'Your licence expires 30 Mar 2027. We will remind you 60 and 30 days before.', owner: 'client', due: '30 Mar 2027', status: 'open', recurring: 'Automatic reminder' },
    { id: 'task-annual-adviser', title: 'Annual financial review', description: 'Automatic reminder sent to Qiniso to schedule your yearly review.', owner: 'adviser', due: '01 Feb 2027', status: 'open', recurring: 'Yearly' },
    { id: 'task-retirement-fee', title: 'Retirement fee renewal', description: 'Automatic reminder sent to Qiniso to renew your retirement product fees.', owner: 'adviser', due: '15 Jan 2027', status: 'open', recurring: 'Yearly' },
    { id: 'task-doc-renewal', title: 'Document renewal check', description: 'We check yearly whether valuations, licences, or tax certificates need renewal.', owner: 'system', due: 'Ongoing', status: 'open', recurring: 'Yearly' },
    { id: 'task-birthday', title: 'Birthday communication', description: 'Automatic birthday message scheduled for you. No action needed.', owner: 'system', due: 'Automatic', status: 'open', recurring: 'Yearly' },
    { id: 'task-anniversary', title: 'Anniversary communication', description: 'Automatic anniversary message scheduled. No action needed.', owner: 'system', due: 'Automatic', status: 'open', recurring: 'Yearly' },
  ],
  goals: [
    { id: 'goal-home', title: 'Home Deposit', type: 'shared', targetAmount: 500000, currentAmount: 370000, targetDate: 'Dec 2027', status: 'on-track', sharedWith: 'Household goal', adviserNote: 'On track for your current savings rate.' },
    { id: 'goal-emergency', title: 'Emergency Fund', type: 'individual', targetAmount: 100000, currentAmount: 100000, targetDate: 'Complete', status: 'complete' },
    { id: 'goal-retirement', title: 'Retirement', type: 'individual', targetAmount: 2000000, currentAmount: 1360000, targetDate: 'Age 65', status: 'on-track', adviserNote: 'Review contribution rate annually.' },
  ],
  auditEvents: [
    { id: 'audit-seed', action: 'portal.ready', actor: 'system', description: 'Demo portal state loaded for Latoya Matai.', timestamp: new Date().toISOString() },
  ],
  simpleMode: false,
  locale: 'en-ZA',
  banking: { stage: 1, products: ['Sanlam Unit Trust (•••• 2719)'], details: { holder: 'Latoya Matai', bank: 'First National Bank (FNB)', account: '62849104812', branch: '250655', type: 'Cheque / Current Account' }, signed: false, submitted: false },
  accident: { online: false, step: 1, incidentTime: '05 Sep 2026, 10:30', location: 'Jan Smuts Avenue, Johannesburg', gpsCaptured: false, photos: [], clientDriving: true, useType: 'Personal', injuries: 'No injuries', otherDriver: { name: '', phone: '', plate: '', insurer: '' }, statement: '', transcript: '', policeReminder: false, savedOffline: false, synced: false },
  finances: { netWorth: 1250000, assets: 1850000, liabilities: 600000, investments: 850000, retirement: 600000, protection: 3500000 },
})
