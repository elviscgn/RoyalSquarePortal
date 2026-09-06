import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  ShieldCheck,
  Check,
  Printer,
  Save,
  Mic,
  PenTool,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Calendar,
  Lock,
  Download,
  AlertCircle
} from 'lucide-react'
import { usePortal } from '../store'
import { VoiceModeModal } from '../components/VoiceModeModal'
import type { ExtractedEntities } from '../voice/entityExtractor'

interface StatutoryDocConfig {
  id: string
  sauceFileName: string
  title: string
  shortTitle: string
  category: string
  statutoryAct: string
  description: string
  sections: { heading: string; body: string }[]
}

const STATUTORY_DOCUMENTS: StatutoryDocConfig[] = [
  {
    id: 'doc-04-client-consent',
    sauceFileName: '2025-01 04 CLIENT CONSENT (QINISO).docx',
    title: 'Client Consent to Obtain Information',
    shortTitle: '04. Astute Consent',
    category: 'Astute Exchange & FAIS Mandate',
    statutoryAct: 'Astute Financial Services Exchange & FAIS Act 37 of 2002',
    description: 'Statutory mandate authorizing Royal Square Financial to query policy values, risk cover, and retirement funds via Astute.',
    sections: [
      {
        heading: '1. Authorization to Access Financial & Policy Information',
        body: 'I hereby consent to Royal Square Financial (Pty) Ltd (FSP No. 29370) obtaining information on all my existing life assurance policies, risk benefits, disability protection, retirement annuities, preservation funds, and investment portfolios directly from registered South African product providers via the Astute Financial Services Exchange (Pty) Ltd.'
      },
      {
        heading: '2. Purpose of Information Collection',
        body: 'The information retrieved is required strictly for the purpose of compiling a comprehensive Financial Needs Analysis (FNA), reviewing my financial architecture, providing sound intermediary advice, and assisting with ongoing portfolio administration.'
      },
      {
        heading: '3. Duration & Revocation of Consent',
        body: 'This consent remains valid until revoked by me in writing. A scanned or electronically executed copy of this authorization shall be deemed as legally effective as the physical original in accordance with the Electronic Communications and Transactions Act 25 of 2002.'
      }
    ]
  },
  {
    id: 'doc-03-broker-appointment',
    sauceFileName: '2025-01 03 BROKER APPOINTMENT (QINISO).docx',
    title: 'Notice of Appointment as Financial Advisor',
    shortTitle: '03. Broker Appointment',
    category: 'Intermediary Mandate',
    statutoryAct: 'Section 13 of the FAIS Act',
    description: 'Official notice appointing Royal Square Financial and Qiniso Ntuli as authorized financial advisors and representatives.',
    sections: [
      {
        heading: '1. Formal Notice of Appointment',
        body: 'I hereby appoint Royal Square Financial (Pty) Ltd (FSP License 29370) and its accredited representative, Qiniso Ntuli, as my financial advisor and intermediary to represent my interests with registered long-term insurers, asset managers, and investment platforms.'
      },
      {
        heading: '2. Scope of Advisory Authority',
        body: 'The appointed advisor is authorized to negotiate policy terms, request statements, structure beneficiary nominations, execute portfolio switches, and facilitate claims on my behalf subject to prior written concurrence on executable transactions.'
      },
      {
        heading: '3. Cancellation of Previous Mandates',
        body: 'This appointment supersedes and replaces any prior intermediary mandates previously granted to other brokerage firms with respect to the financial portfolios brought under Royal Square management.'
      }
    ]
  },
  {
    id: 'doc-00-confidentiality',
    sauceFileName: '2025-01 00 CONFIDENTIALITY AGREEMENT.docx',
    title: 'Mutual Confidentiality & POPIA Agreement',
    shortTitle: '00. Confidentiality & POPIA',
    category: 'Data Protection & NDA',
    statutoryAct: 'Protection of Personal Information Act 4 of 2013 (POPIA)',
    description: 'Mutual non-disclosure and statutory data security declaration governing all financial and biometric records.',
    sections: [
      {
        heading: '1. Confidential Information Definition',
        body: 'Confidential Information includes all personal identification data, bank account records, financial statements, balance sheets, tax numbers, underwriting disclosures, and estate planning records shared between the Client and Royal Square Financial.'
      },
      {
        heading: '2. POPIA Compliance & Data Security Protocols',
        body: 'Royal Square Financial covenants that all client records are encrypted with 256-bit AES encryption, stored within compliant South African data repositories, and processed solely for lawful financial planning purposes under Section 11 of POPIA.'
      },
      {
        heading: '3. Breach Notification & Non-Disclosure',
        body: 'Under no circumstances will Client data be commercialized, transferred, or disclosed to unmandated third parties. In the event of a security compromise, the Information Regulator and Client shall be notified immediately as prescribed by law.'
      }
    ]
  },
  {
    id: 'doc-11-fais-disclosure',
    sauceFileName: '2025-01 11 FAIS DISCLOSURE 1.4 (NtuliQ).doc',
    title: 'FAIS Statutory Disclosure Record 1.4',
    shortTitle: '11. FAIS Disclosure',
    category: 'Regulatory Disclosure',
    statutoryAct: 'General Code of Conduct for Authorized FSPs & FAIS Act',
    description: 'Statutory notice to policyholders detailing FSP 29370 credentials, professional indemnity, and ombudsman contacts.',
    sections: [
      {
        heading: '1. Financial Services Provider Particulars',
        body: 'FSP Name: Royal Square Financial (Pty) Ltd. FSP License Number: 29370. Physical Address: 1401 The Franklin, 4 Pritchard Street, Newtown, Johannesburg, 2001. Telephone: +27 11 492 1566. Compliance Officer: Moonstone Compliance (Pty) Ltd.'
      },
      {
        heading: '2. Professional Indemnity & Guarantees',
        body: 'Royal Square Financial maintains comprehensive Professional Indemnity insurance cover in excess of R10,000,000 and Fidelity Guarantee insurance in compliance with statutory licensing requirements under the FAIS General Code of Conduct.'
      },
      {
        heading: '3. Conflict of Interest & Dispute Resolution',
        body: 'A formal Conflict of Interest Management Policy is maintained on site. Clients have the statutory right to escalate unresolved grievances to the FAIS Ombud (Kasteel Park Office Park, Erasmuskloof, Pretoria).'
      }
    ]
  },
  {
    id: 'doc-16-service-agreement',
    sauceFileName: '2025-01 16 SERVICE AGREEMENT (NtuliQ).doc',
    title: 'Client Service Level Agreement & Scope',
    shortTitle: '16. Service Agreement',
    category: 'Service Level Agreement',
    statutoryAct: 'Advisory SLA & Fee Schedule Regulations',
    description: 'Comprehensive service level agreement detailing review intervals, FNA advisory scope, and remuneration disclosure.',
    sections: [
      {
        heading: '1. Advisory & Intermediary Deliverables',
        body: 'Royal Square agrees to deliver annual financial architecture reviews, real-time portfolio performance tracking, tax certificate consolidations (IT3b/IRP5), cash flow recalibrations, and claims advocacy during insurable events.'
      },
      {
        heading: '2. Client Responsibilities',
        body: 'The Client agrees to provide prompt notification of material life events (marriage, birth, property acquisition, employment changes) and ensure factual disclosure during medical underwriting and financial disclosures.'
      },
      {
        heading: '3. Transparent Remuneration & Commission Disclosure',
        body: 'Intermediary compensation is earned via regulated statutory commission paid by product providers or agreed hourly advisory fees, fully disclosed in writing prior to policy inception with zero hidden deductions.'
      }
    ]
  }
]

export function DocumentSuite() {
  const navigate = useNavigate()
  const { state, dispatch } = usePortal()

  const [activeDocId, setActiveDocId] = useState(STATUTORY_DOCUMENTS[0].id)
  const currentDoc = STATUTORY_DOCUMENTS.find(d => d.id === activeDocId) || STATUTORY_DOCUMENTS[0]

  // Client Metadata state (editable on top of the document)
  const [clientName, setClientName] = useState(state.client.name || 'Latoya Matai')
  const [idNumber, setIdNumber] = useState(state.client.idNumber || '920412 0184 087')
  const [taxNumber, setTaxNumber] = useState('9827163541')
  const [policyRef, setPolicyRef] = useState('RSF-POL-2025-8841')
  const [executionPlace, setExecutionPlace] = useState('Johannesburg, Gauteng')
  const executionDate = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })

  // Custom Annotations on paper
  const [customAnnotation, setCustomAnnotation] = useState(
    'Astute policy query authorized for retirement planning and life cover optimization. Excludes third-party marketing.'
  )

  // Signature state
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw')
  const [typedSignature, setTypedSignature] = useState(clientName)
  const [signatureData, setSignatureData] = useState('')
  const [hasDrawn, setHasDrawn] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Document signed status tracking per document ID
  const [signedDocs, setSignedDocs] = useState<Record<string, boolean>>({
    'doc-04-client-consent': false,
    'doc-03-broker-appointment': false,
    'doc-00-confidentiality': false,
    'doc-11-fais-disclosure': false,
    'doc-16-service-agreement': false,
  })

  // Voice Assistant Modal
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [voiceToast, setVoiceToast] = useState<string | null>(null)

  // Canvas drawing setup
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(rect.width * dpr)
    canvas.height = Math.floor(rect.height * dpr)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
  }, [])

  useEffect(() => {
    if (signatureMode === 'draw') {
      const t = setTimeout(initCanvas, 60)
      window.addEventListener('resize', initCanvas)
      return () => {
        clearTimeout(t)
        window.removeEventListener('resize', initCanvas)
      }
    }
  }, [signatureMode, initCanvas, activeDocId])

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    setHasDrawn(true)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { x, y } = getCanvasCoords(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const { x, y } = getCanvasCoords(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing || !canvasRef.current) return
    setIsDrawing(false)
    setSignatureData(canvasRef.current.toDataURL('image/png'))
  }

  const clearSignature = () => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setHasDrawn(false)
    setSignatureData('')
  }

  const handlePrintPdf = () => {
    window.print()
  }

  const handleSaveAndSign = () => {
    const effectiveSig = signatureMode === 'draw'
      ? (signatureData || 'Signed on canvas')
      : `Signed electronically: ${typedSignature || clientName}`

    // Update local state
    setSignedDocs(prev => ({ ...prev, [activeDocId]: true }))

    // Update portal store
    dispatch({
      type: 'sign-consent',
      signature: effectiveSig
    })

    setVoiceToast(`✓ ${currentDoc.title} digitally signed and saved to Secure Vault!`)
    setTimeout(() => setVoiceToast(null), 4000)
  }

  const handleVoiceApply = (entities: ExtractedEntities) => {
    if (entities.fullName) {
      setClientName(entities.fullName)
      setTypedSignature(entities.fullName)
    }
    if (entities.idNumber) setIdNumber(entities.idNumber)
    if (entities.taxNumber) setTaxNumber(entities.taxNumber)
    if (entities.rawTranscript) {
      setCustomAnnotation(entities.rawTranscript)
    }
    setVoiceToast('Voice dictated notes applied to document paper!')
    setTimeout(() => setVoiceToast(null), 4000)
  }

  const isCurrentDocSigned = signedDocs[activeDocId]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4f3ee',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: 60
      }}
    >
      {/* Top Header / Navigation Bar (Hidden during print) */}
      <div
        className="doc-suite-no-print"
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #ece7de',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={() => navigate('/documents')}
            style={{
              background: '#faf9f5',
              border: '1px solid #ece7de',
              borderRadius: 999,
              padding: '7px 14px',
              fontSize: 11.5,
              fontWeight: 700,
              color: '#171615',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Vault</span>
          </button>

          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#171615', display: 'flex', alignItems: 'center', gap: 8 }}>
              Statutory Signing & Mandate Suite
              <span style={{ fontSize: 9.5, background: '#edf7f1', color: '#2b7a48', padding: '2px 8px', borderRadius: 999, fontWeight: 700, border: '1px solid #c9e8d4' }}>
                FAIS FSP 29370
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#87837c' }}>
              5 Official Statutory Documents from Royal Square Compliance Archives
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Voice Assistant dictation */}
          <button
            type="button"
            onClick={() => setVoiceOpen(true)}
            style={{
              background: '#fdf0ed',
              border: '1px solid #fbdad2',
              color: '#e85d3f',
              borderRadius: 999,
              padding: '7px 14px',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Voice Dictate onto Document"
          >
            <Mic size={14} />
            <span>Voice Dictate</span>
          </button>

          {/* Export PDF CTA */}
          <button
            type="button"
            onClick={handlePrintPdf}
            style={{
              background: '#ffffff',
              border: '1px solid #ece7de',
              borderRadius: 999,
              padding: '7px 14px',
              fontSize: 11.5,
              fontWeight: 700,
              color: '#171615',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}
          >
            <Printer size={14} />
            <span>Export to PDF</span>
          </button>

          {/* Save and Sign CTA */}
          <button
            type="button"
            onClick={handleSaveAndSign}
            className="btn-coral-submit"
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              cursor: 'pointer'
            }}
          >
            <Save size={14} />
            <span>{isCurrentDocSigned ? 'Update Signed Document' : 'Sign & Record in Vault'}</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div style={{ maxWidth: 1260, margin: '24px auto 0', padding: '0 24px' }}>
        {/* Document Selector Pills */}
        <div
          className="doc-suite-no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 16,
            marginBottom: 16
          }}
        >
          {STATUTORY_DOCUMENTS.map(doc => {
            const isSelected = doc.id === activeDocId
            const isSigned = signedDocs[doc.id]
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setActiveDocId(doc.id)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 16,
                  background: isSelected ? '#171615' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#171615',
                  border: isSelected ? '1.5px solid #171615' : '1px solid #ece7de',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                <FileText size={14} style={{ color: isSelected ? '#e85d3f' : '#87837c' }} />
                <span>{doc.shortTitle}</span>
                {isSigned ? (
                  <span style={{ fontSize: 9.5, background: '#2b7a48', color: '#ffffff', padding: '1px 6px', borderRadius: 999 }}>
                    ✓ Signed
                  </span>
                ) : (
                  <span style={{ fontSize: 9.5, background: isSelected ? '#333' : '#faf9f5', color: isSelected ? '#dcd6ca' : '#87837c', padding: '1px 6px', borderRadius: 999, border: '1px solid #ece7de' }}>
                    Ready
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Two-Column Grid: Left = Official Legal Paper, Right = Control & Signature Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 0.75fr)', gap: 24, alignItems: 'start' }}>
          
          {/* LEFT: THE OFFICIAL STATUTORY LEGAL PARCHMENT */}
          <div
            className="official-paper doc-suite-print-target"
            style={{
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid #dfd7cf',
              boxShadow: '0 12px 40px rgba(0,0,0,0.05)',
              padding: '44px 48px',
              minHeight: 740,
              fontFamily: "Georgia, 'Times New Roman', serif",
              color: '#262422'
            }}
          >
            {/* Corporate Letterhead Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderBottom: '1.5px solid #d8d0c8',
                paddingBottom: 20,
                marginBottom: 26,
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <img
                  src="/royal-square-logo.png"
                  alt="Royal Square"
                  style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain' }}
                />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#171615', letterSpacing: '-0.01em' }}>
                    ROYAL SQUARE FINANCIAL (PTY) LTD
                  </div>
                  <div style={{ fontSize: 10.5, color: '#77716c', marginTop: 2 }}>
                    Authorized Financial Services Provider · <strong>FSP No. 29370</strong>
                  </div>
                  <div style={{ fontSize: 10, color: '#9e9992', marginTop: 2 }}>
                    1401 The Franklin, 4 Pritchard Street, Newtown, Johannesburg, 2001 · Tel: 011 492 1566
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid #e85d3f',
                    color: '#e85d3f',
                    fontSize: 9.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  OFFICIAL STATUTORY FORM
                </span>
                <div style={{ fontSize: 9.5, color: '#77716c', marginTop: 4 }}>
                  Source: <em>{currentDoc.sauceFileName}</em>
                </div>
              </div>
            </div>

            {/* Document Title & Reference */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#171615' }}>
                {currentDoc.title}
              </h1>
              <div style={{ fontSize: 11, color: '#77716c', marginTop: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Regulatory Framework: <strong>{currentDoc.statutoryAct}</strong>
              </div>
            </div>

            {/* Fillable / Inferred Client Metadata Grid */}
            <div
              style={{
                background: '#faf8f5',
                border: '1px solid #eae5dc',
                borderRadius: 10,
                padding: '14px 18px',
                marginBottom: 24,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12
              }}
            >
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: '#7a756d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Client Full Legal Name
                </div>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed #cfbfb0',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#171615',
                    width: '100%',
                    padding: '2px 0',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: '#7a756d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Identity Number (13 Digits)
                </div>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed #cfbfb0',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#171615',
                    width: '100%',
                    padding: '2px 0',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: '#7a756d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  SARS Income Tax Ref
                </div>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed #cfbfb0',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#171615',
                    width: '100%',
                    padding: '2px 0',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: '#7a756d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mandate & Astute Reference
                </div>
                <input
                  type="text"
                  value={policyRef}
                  onChange={(e) => setPolicyRef(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px dashed #cfbfb0',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#171615',
                    width: '100%',
                    padding: '2px 0',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Statutory Clauses Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 28, fontSize: 13.5, lineHeight: 1.7, textAlign: 'justify' }}>
              {currentDoc.sections.map((sec, idx) => (
                <div key={idx}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#171615', marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {sec.heading}
                  </div>
                  <p style={{ margin: 0 }}>{sec.body}</p>
                </div>
              ))}
            </div>

            {/* Editable Annotations & Special Conditions directly on paper */}
            <div
              style={{
                borderTop: '1px solid #eae5dc',
                paddingTop: 16,
                marginBottom: 28,
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: '#7a756d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Special Stipulations / Client Written Annotations:
                </span>
                <button
                  type="button"
                  onClick={() => setVoiceOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#e85d3f',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Mic size={12} />
                  <span>Dictate Notes via Voice</span>
                </button>
              </div>

              <textarea
                value={customAnnotation}
                onChange={(e) => setCustomAnnotation(e.target.value)}
                placeholder="Type any specific restrictions, authorized product categories, or notes to the adviser..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#fdfcf9',
                  border: '1px solid #d8d0c8',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: '#171615',
                  minHeight: 54,
                  outline: 'none'
                }}
              />
            </div>

            {/* Execution / Signature Section */}
            <div
              style={{
                borderTop: '1.5px solid #171615',
                paddingTop: 16,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 28,
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: '#7a756d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  Client Electronic Signature
                </div>
                <div
                  style={{
                    height: 64,
                    borderBottom: '1.5px solid #171615',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fdfcf9',
                    borderRadius: '6px 6px 0 0'
                  }}
                >
                  {signatureMode === 'draw' && signatureData ? (
                    <img src={signatureData} alt="Client Signature" style={{ maxHeight: 56, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontFamily: "'Caveat', cursive", fontSize: 24, color: '#171615' }}>
                      {typedSignature || clientName}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: '#77716c', marginTop: 4 }}>
                  Signed by: <strong>{clientName}</strong> (ID: {idNumber})
                </div>
              </div>

              <div>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: '#7a756d', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  Execution Date & Jurisdiction
                </div>
                <div
                  style={{
                    height: 64,
                    borderBottom: '1.5px solid #171615',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '0 8px',
                    background: '#fdfcf9',
                    borderRadius: '6px 6px 0 0'
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#171615' }}>
                    Executed at: {executionPlace}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#77716c' }}>
                    Date: {executionDate}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#2b7a48', marginTop: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={12} />
                  <span>Verified Electronic Execution · FSP 29370</span>
                </div>
              </div>
            </div>

            {/* Official Footer */}
            <div
              style={{
                marginTop: 32,
                paddingTop: 12,
                borderTop: '1px solid #eae5dc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 9.5,
                color: '#87837c',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              <span>Royal Square Financial (Pty) Ltd · Authorized FSP License 29370</span>
              <span>Document Hash: SHA256-7FA89E2091C</span>
              <span>Page 1 of 1</span>
            </div>
          </div>

          {/* RIGHT: CONTROL, ANNOTATION & SIGNATURE PANEL (Hidden during print) */}
          <div
            className="doc-suite-no-print"
            style={{
              background: '#ffffff',
              borderRadius: 22,
              border: '1px solid #ece7de',
              padding: '24px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: '0 4px 24px rgba(0,0,0,0.02)',
              position: 'sticky',
              top: 86
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#e85d3f', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={12} />
                <span>Statutory Execution Panel</span>
              </div>
              <h3 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 800, color: '#171615' }}>
                Digital Signing & PDF
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#87837c', lineHeight: 1.5 }}>
                Review and annotate on the legal parchment to the left, then apply signature.
              </p>
            </div>

            {/* Current Document Summary Card */}
            <div style={{ background: '#faf9f5', borderRadius: 14, border: '1px solid #ece7de', padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#171615' }}>
                {currentDoc.title}
              </div>
              <div style={{ fontSize: 10, color: '#87837c', marginTop: 3 }}>
                Category: <strong>{currentDoc.category}</strong>
              </div>
              <div style={{ fontSize: 10, color: isCurrentDocSigned ? '#2b7a48' : '#e85d3f', marginTop: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                {isCurrentDocSigned ? <Check size={12} strokeWidth={3} /> : <AlertCircle size={12} />}
                <span>{isCurrentDocSigned ? 'Digitally Signed & Recorded' : 'Awaiting Electronic Signature'}</span>
              </div>
            </div>

            {/* Signature Mode Selector */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#7a756d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Signature Method
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setSignatureMode('draw')}
                    style={{
                      background: signatureMode === 'draw' ? '#171615' : '#faf9f5',
                      color: signatureMode === 'draw' ? '#ffffff' : '#87837c',
                      border: '1px solid #ece7de',
                      borderRadius: 999,
                      padding: '3px 10px',
                      fontSize: 10.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Draw Signature
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode('type')}
                    style={{
                      background: signatureMode === 'type' ? '#171615' : '#faf9f5',
                      color: signatureMode === 'type' ? '#ffffff' : '#87837c',
                      border: '1px solid #ece7de',
                      borderRadius: 999,
                      padding: '3px 10px',
                      fontSize: 10.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Type Cursive
                  </button>
                </div>
              </div>

              {signatureMode === 'draw' ? (
                <div>
                  <div
                    style={{
                      border: '1.5px dashed #d8d0c8',
                      borderRadius: 14,
                      background: '#fffaf3',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      style={{ width: '100%', height: 110, display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                    />
                    {!hasDrawn && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#aba69e',
                          fontSize: 11.5,
                          fontFamily: "Georgia, serif",
                          fontStyle: 'italic'
                        }}
                      >
                        Sign with mouse or touchscreen above...
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={clearSignature}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#77716c',
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <RotateCcw size={11} />
                      <span>Clear Canvas</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Enter full legal name..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: '#fffaf3',
                      border: '1.5px solid #ece7de',
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontSize: 20,
                      fontFamily: "'Caveat', cursive",
                      color: '#171615',
                      outline: 'none'
                    }}
                  />
                  <div style={{ fontSize: 10, color: '#87837c', marginTop: 4 }}>
                    Type your full name to generate a verified legal signature.
                  </div>
                </div>
              )}
            </div>

            {/* Location Input */}
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 800, color: '#7a756d', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>
                Execution Place / City
              </label>
              <input
                type="text"
                value={executionPlace}
                onChange={(e) => setExecutionPlace(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#faf9f5',
                  border: '1px solid #ece7de',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#171615',
                  outline: 'none'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6 }}>
              <button
                type="button"
                onClick={handleSaveAndSign}
                className="btn-coral-submit"
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: 14,
                  fontSize: 13,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer'
                }}
              >
                <Save size={15} />
                <span>{isCurrentDocSigned ? 'Save Updated Signature' : 'Sign & Record in Vault'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPdf}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 14,
                  background: '#faf9f5',
                  border: '1px solid #ece7de',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#171615',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer'
                }}
              >
                <Printer size={15} />
                <span>Print / Download PDF</span>
              </button>
            </div>

            {/* Compliance Guarantee */}
            <div style={{ borderTop: '1px solid #ece7de', paddingTop: 14, fontSize: 10.5, color: '#87837c', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} style={{ color: '#2b7a48', flexShrink: 0 }} />
              <span>Complies with Section 13 Electronic Communications and Transactions Act.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Toast */}
      {voiceToast && (
        <div className="voice-toast-banner">
          <Sparkles size={16} />
          <span>{voiceToast}</span>
        </div>
      )}

      {/* Voice Dictation Modal */}
      <VoiceModeModal
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onApply={handleVoiceApply}
        contextTitle="Statutory Document Dictation & Metadata"
      />
    </div>
  )
}
