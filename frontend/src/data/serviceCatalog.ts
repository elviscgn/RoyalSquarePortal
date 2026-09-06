import type { RequestType } from '../types'

export interface ServiceField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'date' | 'file'
  placeholder?: string
  required?: boolean
  options?: string[]
  help?: string
}

export interface ServiceDefinition {
  kind: RequestType
  title: string
  description: string
  cta: string
  success: string
  fields: ServiceField[]
  createsDocument?: boolean
}

export const serviceCatalog: ServiceDefinition[] = [
  {
    kind: 'motor_claim_registration',
    title: 'Send your motor claim',
    description: 'Your Accident Mode report is ready. Choose the insurer and send the saved evidence to Qiniso for submission.',
    cta: 'Send claim to insurer',
    success: 'Claim RSF-2841 sent to the insurer. Reference RSF-MOCK-2841.',
    fields: [
      { name: 'policeCaseNumber', label: 'Police case number (SAPS)', type: 'text', placeholder: 'e.g. CAS 123/09/2026 — or “I’ll add this later”', help: 'Report to police within 48 hours where required. You can add this later.' },
      { name: 'insurer', label: 'Insurer', type: 'select', options: ['Santam', 'Momentum', 'Sanlam', 'Other'], required: true },
      { name: 'note', label: 'Anything Qiniso should know?', type: 'textarea', placeholder: 'Optional note for your adviser' },
    ],
  },
  {
    kind: 'address_change',
    title: 'Change of address',
    description: 'Update the address we hold for you. Enter once — we reuse it everywhere.',
    cta: 'Submit address change',
    success: 'Address updated and sent to Qiniso for provider submission.',
    fields: [
      { name: 'newAddress', label: 'New residential address', type: 'textarea', placeholder: 'Street, suburb, city, postal code', required: true },
      { name: 'effectiveDate', label: 'Effective date', type: 'date', required: true },
      { name: 'proof', label: 'Proof of address (utility bill < 3 months)', type: 'file', help: 'Demo upload — stays on this device.' },
    ],
  },
  {
    kind: 'policy_document',
    title: 'Request a policy document',
    description: 'Ask Qiniso for a copy of any policy schedule or contract.',
    cta: 'Request document',
    success: 'Policy document requested. Qiniso will load it into your vault.',
    fields: [
      { name: 'policy', label: 'Which policy?', type: 'select', options: ['Santam Vehicle Policy', 'Sanlam Unit Trust', 'Momentum RA', 'Other'], required: true },
      { name: 'delivery', label: 'Delivery', type: 'select', options: ['Secure vault', 'Email me a copy'], required: true },
    ],
  },
  {
    kind: 'border_letter',
    title: 'Request a border letter',
    description: 'Authority letter for cross-border vehicle travel.',
    cta: 'Request border letter',
    success: 'Border letter requested. Valid for the travel dates you gave.',
    fields: [
      { name: 'vehicle', label: 'Vehicle', type: 'text', placeholder: '2021 Toyota Corolla · CA 482 JHB', required: true },
      { name: 'countries', label: 'Countries visiting', type: 'text', placeholder: 'e.g. Namibia, Botswana', required: true },
      { name: 'travelDate', label: 'Travel date', type: 'date', required: true },
    ],
  },
  {
    kind: 'irp5_request',
    title: 'Request an IRP5',
    description: 'Ask an investment company for your IRP5 / tax certificate.',
    cta: 'Request IRP5',
    success: 'IRP5 requested from the investment company via Qiniso.',
    fields: [
      { name: 'company', label: 'Investment company', type: 'select', options: ['Sanlam Investment Management', 'Momentum', 'Allan Gray', 'Other'], required: true },
      { name: 'taxYear', label: 'Tax year', type: 'select', options: ['2025/2026', '2024/2025', '2023/2024'], required: true },
    ],
  },
  {
    kind: 'consultation',
    title: 'Request a consultation',
    description: 'Book time with Qiniso — review, advice, or a general check-in.',
    cta: 'Request consultation',
    success: 'Consultation requested. Qiniso will confirm a time.',
    fields: [
      { name: 'topic', label: 'What is it about?', type: 'select', options: ['Annual review', 'Banking details', 'Claim follow-up', 'New investment', 'General advice'], required: true },
      { name: 'when', label: 'Preferred date', type: 'date', required: true },
      { name: 'channel', label: 'Channel', type: 'select', options: ['Video call', 'Phone call', 'In person (Newtown office)'] },
    ],
  },
  {
    kind: 'info_collection',
    title: 'Client information collection',
    description: 'Confirm your FNA details. Prefilled — only fix what changed.',
    cta: 'Submit information',
    success: 'Information collection submitted. Added to your vault.',
    createsDocument: true,
    fields: [
      { name: 'confirm', label: 'Confirm details are correct', type: 'select', options: ['Yes — everything is correct', 'No — I added notes below'], required: true },
      { name: 'notes', label: 'What changed?', type: 'textarea', placeholder: 'Income, dependants, objectives…' },
    ],
  },
  {
    kind: 'balance_sheet',
    title: 'Upload balance sheet',
    description: 'Provide your latest balance sheet for the annual review.',
    cta: 'Upload balance sheet',
    success: 'Balance sheet added to Documents and linked to your review.',
    createsDocument: true,
    fields: [
      { name: 'period', label: 'Financial period', type: 'text', placeholder: 'e.g. Year ended Feb 2026', required: true },
      { name: 'file', label: 'Balance sheet file', type: 'file', required: true },
    ],
  },
  {
    kind: 'income_statement',
    title: 'Upload income statement',
    description: 'Provide your latest income statement for the annual review.',
    cta: 'Upload income statement',
    success: 'Income statement added to Documents and linked to your review.',
    createsDocument: true,
    fields: [
      { name: 'period', label: 'Financial period', type: 'text', placeholder: 'e.g. Year ended Feb 2026', required: true },
      { name: 'file', label: 'Income statement file', type: 'file', required: true },
    ],
  },
  {
    kind: 'beneficiary_update',
    title: 'Update beneficiary',
    description: 'Start a beneficiary nomination change with Qiniso.',
    cta: 'Start update',
    success: 'Beneficiary update started. Qiniso will send the nomination form.',
    fields: [
      { name: 'policy', label: 'Which product?', type: 'select', options: ['Sanlam Unit Trust', 'Momentum RA', 'Santam Vehicle Policy'], required: true },
      { name: 'note', label: 'Note', type: 'textarea', placeholder: 'Optional context' },
    ],
  },
  {
    kind: 'personal_details_update',
    title: 'Update personal details',
    description: 'Change cell, email, or other contact details. Enter once.',
    cta: 'Submit update',
    success: 'Personal details update sent to Qiniso.',
    fields: [
      { name: 'field', label: 'What changed?', type: 'select', options: ['Cell number', 'Email address', 'Marital status', 'Employment', 'Other'], required: true },
      { name: 'value', label: 'New value', type: 'text', placeholder: 'New detail', required: true },
    ],
  },
]

export const serviceByKind = (kind: RequestType) => serviceCatalog.find((s) => s.kind === kind)
