import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  Building2,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  SlidersHorizontal,
  TrendingUp,
  HeartPulse,
  Compass,
  Layers,
  RotateCcw,
  Calendar,
  Check,
  PenTool,
  Type,
  Plus,
  Minus,
  Coins,
  FileText,
  Lock,
  ExternalLink,
  Mic,
  Sparkles
} from 'lucide-react'
import { usePortal } from '../store'
import { VoiceModeModal } from '../components/VoiceModeModal'
import type { ExtractedEntities } from '../voice/entityExtractor'
import type { OnboardingData } from '../types'

const SA_BANKS = [
  { id: 'fnb', name: 'First National Bank (FNB)', shortName: 'FNB', code: '250655', logoSrc: '/banks/fnb.png' },
  { id: 'standard', name: 'Standard Bank', shortName: 'Standard Bank', code: '051001', logoSrc: '/banks/standard-bank.png' },
  { id: 'capitec', name: 'Capitec Bank', shortName: 'Capitec', code: '470010', logoSrc: '/banks/capitec.png' },
  { id: 'absa', name: 'Absa Bank', shortName: 'Absa', code: '632005', logoSrc: '/banks/absa.png' },
  { id: 'nedbank', name: 'Nedbank', shortName: 'Nedbank', code: '198765', logoSrc: '/banks/nedbank.png' },
  { id: 'investec', name: 'Investec Bank', shortName: 'Investec', code: '580105', logoSrc: '/banks/investec.png' },
  { id: 'discovery', name: 'Discovery Bank', shortName: 'Discovery', code: '679000', logoSrc: '/banks/discovery.png' },
]

export function Onboarding() {
  const navigate = useNavigate()
  const { state, dispatch } = usePortal()
  const [step, setStep] = useState<number>(1)

  // Step 1: Identity & FICA State
  const [idScanned, setIdScanned] = useState(true)
  const [fullName, setFullName] = useState(state.client.name || 'Latoya Matai')
  const [idNumber, setIdNumber] = useState(state.client.idNumber || '920412 0184 087')
  const [mobile, setMobile] = useState(state.client.mobile || '+27 82 555 0184')
  const [email, setEmail] = useState(state.client.email || 'latoya.matai@example.co.za')
  const [address, setAddress] = useState(state.client.address || '14 Rivonia Road, Sandton, Johannesburg, 2196')
  const [taxNumber, setTaxNumber] = useState('9827163541')
  const [isPep, setIsPep] = useState(false)
  const [pepDetails, setPepDetails] = useState('')

  // Step 2: Banking & Adjustable Balance Sheet State
  const [selectedBank, setSelectedBank] = useState('First National Bank (FNB)')
  const [branchCode, setBranchCode] = useState('250655')
  const [accountNumber, setAccountNumber] = useState('62849104812')
  const [accountType, setAccountType] = useState('Cheque / Current Account')
  const [monthlySalary, setMonthlySalary] = useState(48500)
  const [livingExpenses, setLivingExpenses] = useState(24300)
  const [debtPayments, setDebtPayments] = useState(8200)

  // Adjustable Net Worth (Assets & Liabilities)
  const [assetsAmount, setAssetsAmount] = useState(1850000)
  const [liabilitiesAmount, setLiabilitiesAmount] = useState(600000)
  const netWorth = assetsAmount - liabilitiesAmount

  // Step 3: Focus & Inferred Questionnaire
  const [focus, setFocus] = useState<'investments' | 'family_protection' | 'retirement' | 'holistic'>('investments')
  const [investTerm, setInvestTerm] = useState('In excess of 5 years')
  const [riskObjective, setRiskObjective] = useState('To achieve real returns (beat inflation)')
  const [volatilityTolerance, setVolatilityTolerance] = useState('10% to 20% - Moderate risk investor')
  const [reg28Compliant, setReg28Compliant] = useState(true)
  const [medCirculatory, setMedCirculatory] = useState(false)
  const [medRespiratory, setMedRespiratory] = useState(false)
  const [medDiabetes, setMedDiabetes] = useState(false)
  const [medHiv, setMedHiv] = useState(true)
  const [medSmoker, setMedSmoker] = useState(false)
  const [medHeight, setMedHeight] = useState(168)
  const [medWeight, setMedWeight] = useState(64)

  // Step 4: Regulatory Consent & Signature
  const [hasReviewedAppointment, setHasReviewedAppointment] = useState(true)
  const [hasReviewedConsent, setHasReviewedConsent] = useState(true)
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw')
  const [typedSignature, setTypedSignature] = useState(state.client.name || 'Latoya Matai')
  const [signatureData, setSignatureData] = useState('')
  const [hasDrawn, setHasDrawn] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Voice Mode Assistant State
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [voiceFilledToast, setVoiceFilledToast] = useState<string | null>(null)
  const [voicePulseActive, setVoicePulseActive] = useState(false)

  const handleApplyVoice = (entities: ExtractedEntities) => {
    let count = 0
    if (entities.fullName) {
      setFullName(entities.fullName)
      setTypedSignature(entities.fullName)
      dispatch({
        type: 'update-client',
        patch: {
          name: entities.fullName,
          ...(entities.email ? { email: entities.email } : {}),
          ...(entities.mobile ? { mobile: entities.mobile } : {}),
          ...(entities.idNumber ? { idNumber: entities.idNumber } : {})
        }
      })
      count++
    }
    if (entities.idNumber) { setIdNumber(entities.idNumber); count++ }
    if (entities.taxNumber) { setTaxNumber(entities.taxNumber); count++ }
    if (entities.mobile) { setMobile(entities.mobile); count++ }
    if (entities.bank) {
      setSelectedBank(entities.bank.name)
      setBranchCode(entities.bank.code)
      count++
    }
    if (entities.accountNumber) { setAccountNumber(entities.accountNumber); count++ }
    if (entities.accountType) {
      setAccountType(entities.accountType === 'Cheque' ? 'Cheque / Current Account' : entities.accountType === 'Savings' ? 'Savings Account' : 'Transmission Account')
      count++
    }
    if (entities.monthlySalary !== undefined) { setMonthlySalary(entities.monthlySalary); count++ }
    if (entities.livingExpenses !== undefined) { setLivingExpenses(entities.livingExpenses); count++ }
    if (entities.debtPayments !== undefined) { setDebtPayments(entities.debtPayments); count++ }
    if (entities.assetsAmount !== undefined) { setAssetsAmount(entities.assetsAmount); count++ }
    if (entities.liabilitiesAmount !== undefined) { setLiabilitiesAmount(entities.liabilitiesAmount); count++ }
    if (entities.focus) { setFocus(entities.focus); count++ }
    if (entities.reg28Compliant !== undefined) { setReg28Compliant(entities.reg28Compliant); count++ }
    if (entities.consentGranted) {
      setHasReviewedAppointment(true)
      setHasReviewedConsent(true)
      count++
    }

    setVoicePulseActive(true)
    setTimeout(() => setVoicePulseActive(false), 4000)
    setVoiceFilledToast(`Voice Assistant auto-populated ${count} onboarding fields!`)
    setTimeout(() => setVoiceFilledToast(null), 4500)
  }

  // Responsive canvas initialization with devicePixelRatio for crisp strokes
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
    if (step === 4 && signatureMode === 'draw') {
      const timer = setTimeout(initCanvas, 50)
      window.addEventListener('resize', initCanvas)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', initCanvas)
      }
    }
  }, [step, signatureMode, initCanvas])

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

  const simulateAutoloadId = () => {
    setIdScanned(true)
    setFullName('Latoya Matai')
    setIdNumber('920412 0184 087')
    setAddress('14 Rivonia Road, Sandton, Johannesburg, 2196')
    setMobile('+27 82 555 0184')
    setEmail('latoya.matai@example.co.za')
    setTaxNumber('9827163541')
  }

  const handleSelectBank = (bankName: string, bCode: string) => {
    setSelectedBank(bankName)
    setBranchCode(bCode)
  }

  const handleCompleteRegistration = () => {
    const finalSignature = signatureMode === 'draw'
      ? (signatureData || `Signed on screen: ${fullName}`)
      : `Signed digitally: ${typedSignature || fullName}`

    const onboardingPayload: OnboardingData = {
      client: {
        name: fullName,
        idNumber,
        mobile,
        email,
        address,
        tier: 'Premier',
        type: 'Private Client',
      },
      taxNumber,
      isPep,
      pepDetails: isPep ? pepDetails : undefined,
      bankDetails: {
        bank: selectedBank,
        account: accountNumber,
        branch: branchCode,
        type: accountType,
        holder: fullName,
      },
      cashFlow: {
        monthlySalary,
        rentalIncome: 0,
        livingExpenses,
        debtPayments,
        existingInsurers: ['Discovery Life', 'Sanlam Investments', 'Santam Vehicle'],
        netSurplus: monthlySalary - livingExpenses - debtPayments,
        estimatedAssets: assetsAmount,
        estimatedLiabilities: liabilitiesAmount,
      },
      focus,
      riskProfile: ['investments', 'retirement', 'holistic'].includes(focus) ? {
        term: investTerm,
        objective: riskObjective,
        volatilityTolerance,
        reg28Compliant,
      } : undefined,
      medicalUnderwriting: ['family_protection', 'holistic'].includes(focus) ? {
        circulatory: medCirculatory,
        respiratory: medRespiratory,
        diabetes: medDiabetes,
        hivTested: medHiv,
        smoker: medSmoker,
        height: medHeight,
        weight: medWeight,
      } : undefined,
      signature: finalSignature,
    }

    dispatch({ type: 'complete-onboarding', payload: onboardingPayload })
    setStep(5)
  }

  const handleExitToPortal = () => {
    if (fullName && fullName.trim() && fullName !== state.client.name) {
      dispatch({
        type: 'update-client',
        patch: {
          name: fullName.trim(),
          email,
          mobile,
          idNumber,
          address
        }
      })
    }
    navigate('/')
  }

  const activeBank = SA_BANKS.find(b => selectedBank.startsWith(b.shortName)) || SA_BANKS[0]

  return (
    <div className="onboarding-app">
      <div className="onboarding-viewport">
        {/* Top Header - Exact Royal Square Luxury Parity */}
        <header className="onboarding-topbar">
          <div className="onboarding-top-left">
            <button
              type="button"
              className="btn-exit-portal"
              onClick={handleExitToPortal}
              title="Return to client portal"
            >
              <ArrowLeft size={15} />
              <span>Exit to Portal</span>
            </button>
            <div className="brand-identity">
              <span className="brand-logo-mark">
                <img src="/royal-square-logo.png" alt="Royal Square" />
              </span>
              <div className="brand-titles">
                <span className="brand-title">Royal Square</span>
                <span className="brand-subtitle">Adviser Operations · FSP 29370</span>
              </div>
            </div>
          </div>

          <div className="compliance-status-pill">
            <span className="compliance-pulse-dot" />
            <span>FATF Grey-List Compliance Engine Active</span>
          </div>

          <div className="header-right">
            <button
              type="button"
              className="btn-voice-trigger"
              onClick={() => setVoiceModalOpen(true)}
              title="Activate Voice Assistant (Zero-Fail Engine)"
              style={{
                height: 40,
                padding: '0 14px',
                borderRadius: 9999,
                background: '#ffffff',
                border: '1.5px solid #e85d3f',
                color: '#e85d3f',
                fontSize: 11.5,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                boxShadow: '0 2px 8px rgba(232, 93, 63, 0.15)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Mic size={14} />
              <span>Voice Mode</span>
            </button>

            <button
              type="button"
              className={`mode-toggle-pill ${state.simpleMode ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'toggle-simple-mode' })}
              aria-pressed={state.simpleMode}
              title="Toggle Simple Mode"
            >
              <SlidersHorizontal size={13} className="mode-icon" />
              <span className="mode-label-text">{state.simpleMode ? 'Simple Mode: ON' : 'Simple Mode'}</span>
              <span className="toggle-switch-track">
                <span className="toggle-switch-thumb" />
              </span>
            </button>
            <div className="profile-pill-topright">
              <div className="client-avatar-wrapper">
                <img src="/latoya-matai.png" alt={fullName} className="client-avatar" />
                <span className="avatar-status-dot" />
              </div>
              <div className="client-meta">
                <div className="client-name">{fullName}</div>
                <div className="client-role">
                  <span>Private Client</span>
                  <span className="tier-badge">PREMIER</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Intro Row */}
        <div className="onboarding-intro-row">
          <div className="onboarding-intro-title">
            <span className="onboarding-eyebrow">
              <ShieldCheck size={14} /> FSP 29370 · AUTOMATED CLIENT REGISTRATION & FNA ENGINE
            </span>
            <h1 className="onboarding-headline">
              Client Ingestion &amp; <strong>Financial Architecture</strong>
            </h1>
            <p className="onboarding-sub">
              FATF grey-list compliance screening, automated bank statement OCR, Regulation 28 risk calibration, and live advisory dossier generation.
            </p>
          </div>

          <div className="adviser-badge-box">
            <div className="avatar">QN</div>
            <div>
              <strong>Qiniso Ntuli</strong>
              <span>Accredited Adviser · FSP 29370</span>
            </div>
          </div>
        </div>

        {/* Stepper Track Card */}
        <div className="stepper-nav-card">
          <div className="stepper-milestones">
            {[
              { num: 1, label: 'Identity & FICA', desc: 'DHA Biometric Check' },
              { num: 2, label: 'Bank & Net Worth', desc: 'Statement OCR & Cash Flow' },
              { num: 3, label: 'Advisory Focus', desc: 'Dynamic FNA Routing' },
              { num: 4, label: 'Legal Mandate', desc: 'FAIS & ASTUTE POPIA' },
              { num: 5, label: 'Live Activation', desc: 'Case Dossier Active' }
            ].map((m) => {
              const isActive = step === m.num
              const isCompleted = step > m.num
              return (
                <button
                  key={m.num}
                  type="button"
                  onClick={() => { if (isCompleted) setStep(m.num) }}
                  className={`stepper-milestone-btn ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  disabled={!isCompleted && !isActive}
                >
                  <div className="milestone-index">
                    {isCompleted ? <Check size={13} strokeWidth={3} /> : m.num}
                  </div>
                  <div className="milestone-text">
                    <strong>{m.label}</strong>
                    <span>{m.desc}</span>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="stepper-rail">
            <div className="stepper-rail-fill" style={{ width: `${(step / 5) * 100}%` }} />
          </div>
        </div>

        {/* Main Focused Workflow Card */}
        <main className="workflow-main-card">
          {/* STEP 1: IDENTITY & FICA */}
          {step === 1 && (
            <>
              <div className="stage-head-block">
                <div className="stage-head-left">
                  <h2>Verified Client Identification &amp; FICA</h2>
                  <p>FATF grey-list compliance mandates verified identity, proof of address, and Politically Exposed Person (PEP) screening.</p>
                </div>
                <div className="subcard-badge green">Home Affairs Verified ✓</div>
              </div>

              <div className="workflow-2col-grid">
                {/* Left Column: ID Capture & PEP */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="workflow-subcard">
                    <div className="subcard-header">
                      <div className="subcard-title-group">
                        <FileCheck size={18} />
                        <span>FICA Smart Verification</span>
                      </div>
                      <span className="subcard-badge green">DHA Extracted ✓</span>
                    </div>

                    <div className="ocr-dropzone" onClick={simulateAutoloadId} title="Click to reload verified ID">
                      <div className="ocr-disc">
                        <UploadCloud size={24} />
                      </div>
                      <div>
                        <strong style={{ fontSize: 13, color: '#171615', display: 'block' }}>
                          SA Smart ID Card / Passport Attached
                        </strong>
                        <span style={{ fontSize: 11.5, color: '#87837c', marginTop: 3, display: 'block' }}>
                          {fullName ? `${fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-smart-id.pdf` : 'client-smart-id.pdf'} (1.4 MB · Home Affairs match 100%)
                        </span>
                      </div>
                      <button
                        type="button"
                        style={{
                          background: '#171615',
                          color: '#ffffff',
                          padding: '7px 16px',
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 700,
                          marginTop: 4
                        }}
                      >
                        Re-scan or Autoload Sample ID
                      </button>
                    </div>

                    <div style={{ fontSize: 11, color: '#87837c', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lock size={12} style={{ color: '#2b7a48' }} />
                      <span>Biometrically verified with Department of Home Affairs NPR database.</span>
                    </div>
                  </div>

                  {/* PEP Screening */}
                  <div className="workflow-subcard" style={{ borderLeft: '4px solid #e85d3f' }}>
                    <div className="subcard-header">
                      <div className="subcard-title-group">
                        <ShieldCheck size={18} />
                        <span>FATF Grey-List Compliance · PEP Screening</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: '#87837c', lineHeight: 1.5, margin: 0 }}>
                      Do you, an immediate family member, or a close associate hold a prominent public office, diplomatic posting, or executive role in a State-Owned Enterprise (SOE)?
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '12px 14px',
                          borderRadius: 12,
                          background: !isPep ? '#ffffff' : '#faf9f5',
                          border: !isPep ? '2px solid #e85d3f' : '1px solid #ece7de',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: 12,
                          boxShadow: !isPep ? '0 4px 12px rgba(232,93,63,0.08)' : 'none'
                        }}
                      >
                        <input
                          type="radio"
                          name="pepOption"
                          checked={!isPep}
                          onChange={() => setIsPep(false)}
                          style={{ accentColor: '#e85d3f' }}
                        />
                        <span>Standard FICA (Clean)</span>
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '12px 14px',
                          borderRadius: 12,
                          background: isPep ? '#ffffff' : '#faf9f5',
                          border: isPep ? '2px solid #e85d3f' : '1px solid #ece7de',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: 12,
                          boxShadow: isPep ? '0 4px 12px rgba(232,93,63,0.08)' : 'none'
                        }}
                      >
                        <input
                          type="radio"
                          name="pepOption"
                          checked={isPep}
                          onChange={() => setIsPep(true)}
                          style={{ accentColor: '#e85d3f' }}
                        />
                        <span>PEP Declaration (EDD)</span>
                      </label>
                    </div>

                    {isPep && (
                      <div style={{ marginTop: 8 }}>
                        <label className="onboarding-label">PEP Position &amp; Official Capacity</label>
                        <input
                          type="text"
                          className="onboarding-input"
                          placeholder="e.g. Non-executive board member at Transnet"
                          value={pepDetails}
                          onChange={(e) => setPepDetails(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Inferred Client Record */}
                <div className="workflow-subcard">
                  <div className="subcard-header">
                    <div className="subcard-title-group">
                      <CheckCircle2 size={18} />
                      <span>Inferred Client Dossier</span>
                    </div>
                    <span className="subcard-badge green">Verified Identity</span>
                  </div>

                  <div className="onboarding-fields-grid">
                    <div className="onboarding-field" style={{ gridColumn: 'span 2' }}>
                      <label className="onboarding-label">Full Legal Name (as per ID document)</label>
                      <input
                        type="text"
                        className={`onboarding-input ${voicePulseActive ? 'voice-pulse-field' : ''}`}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <div className="onboarding-field">
                      <label className="onboarding-label">SA National ID Number</label>
                      <input
                        type="text"
                        className={`onboarding-input ${voicePulseActive ? 'voice-pulse-field' : ''}`}
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                      />
                    </div>

                    <div className="onboarding-field">
                      <label className="onboarding-label">SARS Income Tax Number</label>
                      <input
                        type="text"
                        className={`onboarding-input ${voicePulseActive ? 'voice-pulse-field' : ''}`}
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                      />
                    </div>

                    <div className="onboarding-field" style={{ gridColumn: 'span 2' }}>
                      <label className="onboarding-label">Verified Residential Address (FICA Proof)</label>
                      <input
                        type="text"
                        className={`onboarding-input ${voicePulseActive ? 'voice-pulse-field' : ''}`}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>

                    <div className="onboarding-field">
                      <label className="onboarding-label">Mobile Number</label>
                      <input
                        type="text"
                        className={`onboarding-input ${voicePulseActive ? 'voice-pulse-field' : ''}`}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                      />
                    </div>

                    <div className="onboarding-field">
                      <label className="onboarding-label">Email Address</label>
                      <input
                        type="email"
                        className={`onboarding-input ${voicePulseActive ? 'voice-pulse-field' : ''}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ background: '#ffffff', border: '1px solid #ece7de', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldCheck size={18} style={{ color: '#2b7a48', flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, color: '#87837c', lineHeight: 1.4 }}>
                      Verified via National Population Register and automated CIPC / PEP sanctions screening.
                    </span>
                  </div>
                </div>
              </div>

              <div className="workflow-actions-bar">
                <button
                  type="button"
                  onClick={() => setVoiceModalOpen(true)}
                  className="btn-ghost-back"
                  style={{ borderColor: 'rgba(232,93,63,0.35)', color: '#e85d3f' }}
                >
                  <Mic size={14} />
                  <span>Fill Fields via Voice Assistant</span>
                </button>
                <button
                  type="button"
                  className="btn-coral-submit"
                  onClick={() => setStep(2)}
                >
                  <span>Continue to Banking &amp; Net Worth</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* STEP 2: BANKING DATA & ADJUSTABLE BALANCE SHEET */}
          {step === 2 && (
            <>
              <div className="stage-head-block">
                <div className="stage-head-left">
                  <h2>Connect Your Bank &amp; Calibrate Financial Position</h2>
                  <p>Zero manual typing. We analyze your bank statement OCR to categorize cash flow and calculate starting net worth.</p>
                </div>
                <div className="subcard-badge green">Statement Verified ✓</div>
              </div>

              <div className="workflow-2col-grid">
                {/* Left Column: Bank Selection & Extracted Details */}
                <div className="workflow-subcard">
                  <div className="subcard-header">
                    <div className="subcard-title-group">
                      <Building2 size={18} />
                      <span>Primary Banking Institution</span>
                    </div>
                    <span className="subcard-badge coral">7 Major SA Banks</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#87837c', margin: 0 }}>
                    Select your transactional banking provider. Matched against verified bank statement OCR.
                  </p>

                  {/* 7 Bank Tiles with Official Logos */}
                  <div className="onboarding-bank-grid">
                    {SA_BANKS.map((bank) => {
                      const isSelected = selectedBank.startsWith(bank.shortName)
                      return (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => handleSelectBank(bank.name, bank.code)}
                          className={`bank-select-tile ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="bank-logo-box">
                            <img src={bank.logoSrc} alt={bank.name} />
                          </div>
                          <div className="bank-name-text">{bank.shortName}</div>
                          <div className="bank-code-text">Code {bank.code}</div>
                          {isSelected && (
                            <div className="bank-check-pip">
                              <Check size={11} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Extracted Fields */}
                  <div style={{ background: '#ffffff', border: '1px solid #ece7de', borderRadius: 14, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#87837c', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.6px' }}>
                      Extracted Banking Instruction Fields
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label className="onboarding-label">Account Number</label>
                        <input
                          type="text"
                          className="onboarding-input"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="onboarding-label">Branch Clearing Code</label>
                        <input
                          type="text"
                          className="onboarding-input"
                          value={branchCode}
                          onChange={(e) => setBranchCode(e.target.value)}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label className="onboarding-label">Account Type</label>
                        <select
                          className="onboarding-input"
                          value={accountType}
                          onChange={(e) => setAccountType(e.target.value)}
                          style={{ width: '100%', cursor: 'pointer' }}
                        >
                          <option value="Cheque / Current Account">Cheque / Current Account</option>
                          <option value="Savings Account">Savings Account</option>
                          <option value="Transmission Account">Transmission Account</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Statement Ingestion & Adjustable Balance Sheet */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Verified Statement Card */}
                  <div className="workflow-subcard">
                    <div className="subcard-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="subcard-badge green">Statement OCR Verified</span>
                        <span style={{ fontSize: 11, color: '#87837c', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} /> 19 Aug 2026 (17 days old ✓)
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #ece7de' }}>
                      <div>
                        <span className="onboarding-label" style={{ fontSize: 9.5 }}>Account Holder</span>
                        <strong style={{ fontSize: 12.5, color: '#171615', display: 'block' }}>{fullName} ✓</strong>
                      </div>
                      <div>
                        <span className="onboarding-label" style={{ fontSize: 9.5 }}>Institution</span>
                        <strong style={{ fontSize: 12.5, color: '#171615', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <img src={activeBank.logoSrc} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                          <span>{selectedBank}</span>
                        </strong>
                      </div>
                      <div>
                        <span className="onboarding-label" style={{ fontSize: 9.5 }}>Account Type</span>
                        <strong style={{ fontSize: 12.5, color: '#171615', display: 'block' }}>{accountType}</strong>
                      </div>
                      <div>
                        <span className="onboarding-label" style={{ fontSize: 9.5 }}>Account Number</span>
                        <strong style={{ fontSize: 12.5, color: '#171615', display: 'block' }}>•••• 4812</strong>
                      </div>
                    </div>

                    {/* Inferred Cash Flow Ribbon */}
                    <div style={{ background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #ece7de' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: '#87837c', textTransform: 'uppercase', marginBottom: 10 }}>
                        Inferred Monthly Cash Flow
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
                        <div style={{ background: '#faf9f5', padding: '8px 4px', borderRadius: 8 }}>
                          <span style={{ fontSize: 9.5, color: '#87837c', display: 'block' }}>Salary</span>
                          <strong style={{ fontSize: 12, color: '#171615' }}>R {monthlySalary.toLocaleString()}</strong>
                        </div>
                        <div style={{ background: '#faf9f5', padding: '8px 4px', borderRadius: 8 }}>
                          <span style={{ fontSize: 9.5, color: '#87837c', display: 'block' }}>Living</span>
                          <strong style={{ fontSize: 12, color: '#171615' }}>R {livingExpenses.toLocaleString()}</strong>
                        </div>
                        <div style={{ background: '#faf9f5', padding: '8px 4px', borderRadius: 8 }}>
                          <span style={{ fontSize: 9.5, color: '#87837c', display: 'block' }}>Debts</span>
                          <strong style={{ fontSize: 12, color: '#171615' }}>R {debtPayments.toLocaleString()}</strong>
                        </div>
                        <div style={{ background: '#edf7f1', padding: '8px 4px', borderRadius: 8 }}>
                          <span style={{ fontSize: 9.5, color: '#2b7a48', display: 'block', fontWeight: 700 }}>Surplus</span>
                          <strong style={{ fontSize: 12, color: '#2b7a48' }}>+R {(monthlySalary - livingExpenses - debtPayments).toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Adjustable Balance Sheet & Net Worth */}
                  <div className="workflow-subcard">
                    <div className="subcard-header">
                      <div className="subcard-title-group">
                        <Coins size={18} />
                        <span>Adjustable Balance Sheet &amp; Net Worth</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 9.5, textTransform: 'uppercase', fontWeight: 800, color: '#87837c', display: 'block' }}>Calculated Net Worth</span>
                        <strong style={{ fontSize: 17, fontWeight: 800, color: '#2b7a48' }}>
                          R {netWorth.toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {/* Assets Control */}
                      <div style={{ background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #ece7de' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#2b7a48', textTransform: 'uppercase' }}>Total Assets</span>
                          <strong style={{ fontSize: 13, color: '#171615' }}>R {assetsAmount.toLocaleString()}</strong>
                        </div>
                        <input
                          type="range"
                          min={500000}
                          max={10000000}
                          step={50000}
                          value={assetsAmount}
                          onChange={(e) => setAssetsAmount(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#2b7a48' }}
                        />
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <button
                            type="button"
                            onClick={() => setAssetsAmount(Math.max(0, assetsAmount - 50000))}
                            style={{ flex: 1, padding: '4px 0', borderRadius: 6, background: '#faf9f5', border: '1px solid #ece7de', fontSize: 10.5, fontWeight: 700 }}
                          >
                            -50k
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssetsAmount(assetsAmount + 50000)}
                            style={{ flex: 1, padding: '4px 0', borderRadius: 6, background: '#faf9f5', border: '1px solid #ece7de', fontSize: 10.5, fontWeight: 700 }}
                          >
                            +50k
                          </button>
                        </div>
                      </div>

                      {/* Liabilities Control */}
                      <div style={{ background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #ece7de' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#e85d3f', textTransform: 'uppercase' }}>Total Liabilities</span>
                          <strong style={{ fontSize: 13, color: '#171615' }}>R {liabilitiesAmount.toLocaleString()}</strong>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={5000000}
                          step={25000}
                          value={liabilitiesAmount}
                          onChange={(e) => setLiabilitiesAmount(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#e85d3f' }}
                        />
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <button
                            type="button"
                            onClick={() => setLiabilitiesAmount(Math.max(0, liabilitiesAmount - 25000))}
                            style={{ flex: 1, padding: '4px 0', borderRadius: 6, background: '#faf9f5', border: '1px solid #ece7de', fontSize: 10.5, fontWeight: 700 }}
                          >
                            -25k
                          </button>
                          <button
                            type="button"
                            onClick={() => setLiabilitiesAmount(liabilitiesAmount + 25000)}
                            style={{ flex: 1, padding: '4px 0', borderRadius: 6, background: '#faf9f5', border: '1px solid #ece7de', fontSize: 10.5, fontWeight: 700 }}
                          >
                            +25k
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Auto-discovered recurring policies */}
                    <div style={{ background: '#ffffff', borderRadius: 12, padding: 12, border: '1px solid #ece7de' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#87837c', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                        Auto-Discovered Recurring Commitments
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>• Discovery Life Policy #DL-88219</span>
                          <strong>R 1,450 / mo</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>• Sanlam Unit Trust #SN-0291</span>
                          <strong>R 3,000 / mo</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>• Santam Vehicle Comprehensive</span>
                          <strong>R 1,120 / mo</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="workflow-actions-bar">
                <button
                  type="button"
                  className="btn-ghost-back"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft size={15} />
                  <span>Back to Identity</span>
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setVoiceModalOpen(true)}
                    className="btn-ghost-back"
                    style={{ borderColor: 'rgba(232,93,63,0.35)', color: '#e85d3f' }}
                  >
                    <Mic size={14} />
                    <span>Recalibrate via Voice</span>
                  </button>
                  <button
                    type="button"
                    className="btn-coral-submit"
                    onClick={() => setStep(3)}
                  >
                    <span>Continue to Objectives &amp; FNA</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* STEP 3: OBJECTIVES & DYNAMIC FNA QUESTIONNAIRE */}
          {step === 3 && (
            <>
              <div className="stage-head-block">
                <div className="stage-head-left">
                  <h2>What Is Your Primary Financial Focus?</h2>
                  <p>The interface dynamically adapts its questions based on whether you seek wealth creation, family cover, or retirement.</p>
                </div>
                <span className="subcard-badge coral">Dynamic FNA Routing</span>
              </div>

              {/* 4 Objective Cards */}
              <div className="objective-grid-4">
                {[
                  {
                    id: 'investments',
                    title: 'Wealth & Investments',
                    desc: 'Unit trusts, capital growth, and inflation-beating equity portfolios.',
                    icon: TrendingUp
                  },
                  {
                    id: 'family_protection',
                    title: 'Family & Life Cover',
                    desc: 'Life insurance, disability, dread disease, and medical underwriting.',
                    icon: HeartPulse
                  },
                  {
                    id: 'retirement',
                    title: 'Retirement Readiness',
                    desc: 'Retirement annuities, preservation funds, and Regulation 28 asset allocation.',
                    icon: Compass
                  },
                  {
                    id: 'holistic',
                    title: 'Holistic 360° Advisory',
                    desc: 'Complete financial needs analysis, tax advisory, and estate planning.',
                    icon: Layers
                  }
                ].map((item) => {
                  const isSelected = focus === item.id
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFocus(item.id as typeof focus)}
                      className={`objective-card-btn ${isSelected ? 'selected' : ''}`}
                    >
                      <div>
                        <div className="objective-head">
                          <div className="objective-icon-box">
                            <Icon size={18} />
                          </div>
                          <div className="objective-check-dot">
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                        <div className="objective-title">{item.title}</div>
                        <div className="objective-desc">{item.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Dynamic Inferred Module */}
              <div className="workflow-subcard" style={{ marginTop: 10 }}>
                {['investments', 'retirement', 'holistic'].includes(focus) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="subcard-header">
                      <div className="subcard-title-group">
                        <TrendingUp size={18} />
                        <span>Inferred Module: Investor Risk Profile (FNA Sheet 2)</span>
                      </div>
                      <span className="subcard-badge green">Pension Funds Act Reg 28</span>
                    </div>

                    <div className="onboarding-fields-grid">
                      <div className="onboarding-field">
                        <label className="onboarding-label">Investment Term Horizon</label>
                        <select
                          className="onboarding-input"
                          value={investTerm}
                          onChange={(e) => setInvestTerm(e.target.value)}
                        >
                          <option value="In excess of 5 years">In excess of 5 years (Maximum capital growth)</option>
                          <option value="3 to 5 years">3 to 5 years (Balanced medium term)</option>
                          <option value="1 to 3 years">1 to 3 years (Capital preservation)</option>
                        </select>
                      </div>

                      <div className="onboarding-field">
                        <label className="onboarding-label">Market Volatility Response</label>
                        <select
                          className="onboarding-input"
                          value={volatilityTolerance}
                          onChange={(e) => setVolatilityTolerance(e.target.value)}
                        >
                          <option value="10% to 20% - Moderate risk investor">10% to 20% drop - Moderate, comfortable with short-term swings</option>
                          <option value="Over 20% - Aggressive growth seeker">Over 20% drop - Aggressive, buying opportunity</option>
                          <option value="Under 5% - Conservative risk-averse">Under 5% drop - Conservative, prefer guaranteed capital</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid #ece7de', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShieldCheck size={18} style={{ color: '#2b7a48' }} />
                        <span style={{ fontSize: 12, color: '#171615', fontWeight: 600 }}>
                          Regulation 28 limits max offshore exposure to 45% and equities to 75% for retirement transfers.
                        </span>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                        <input
                          type="checkbox"
                          checked={reg28Compliant}
                          onChange={(e) => setReg28Compliant(e.target.checked)}
                          style={{ accentColor: '#e85d3f' }}
                        />
                        <span>Acknowledge</span>
                      </label>
                    </div>
                  </div>
                )}

                {['family_protection', 'holistic'].includes(focus) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: focus === 'holistic' ? 20 : 0 }}>
                    <div className="subcard-header">
                      <div className="subcard-title-group">
                        <HeartPulse size={18} />
                        <span>Inferred Module: Medical &amp; Underwriting Declarations</span>
                      </div>
                      <span className="subcard-badge coral">Life &amp; Severe Illness</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                      {[
                        { label: 'Circulatory / Heart Conditions', val: medCirculatory, set: setMedCirculatory },
                        { label: 'Respiratory / Asthma', val: medRespiratory, set: setMedRespiratory },
                        { label: 'Diabetes / Endocrine', val: medDiabetes, set: setMedDiabetes },
                        { label: 'HIV Antibody Test Negative', val: medHiv, set: setMedHiv },
                        { label: 'Tobacco / Nicotine Smoker', val: medSmoker, set: setMedSmoker }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => item.set(!item.val)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 12,
                            background: item.val ? '#ffffff' : '#faf9f5',
                            border: item.val ? '1.5px solid #e85d3f' : '1px solid #ece7de',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: '#171615',
                            cursor: 'pointer'
                          }}
                        >
                          <span>{item.label}</span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            background: item.val ? '#fdf0ed' : '#ece7de',
                            color: item.val ? '#e85d3f' : '#87837c'
                          }}>
                            {item.val ? 'Yes' : 'No'}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, background: '#ffffff', padding: 14, borderRadius: 12, border: '1px solid #ece7de' }}>
                      <div>
                        <label className="onboarding-label">Height (cm)</label>
                        <input
                          type="number"
                          className="onboarding-input"
                          value={medHeight}
                          onChange={(e) => setMedHeight(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="onboarding-label">Weight (kg)</label>
                        <input
                          type="number"
                          className="onboarding-input"
                          value={medWeight}
                          onChange={(e) => setMedWeight(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="onboarding-label">Inferred BMI</label>
                        <div style={{ height: 42, display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: '#2b7a48' }}>
                          {(medWeight / ((medHeight / 100) ** 2)).toFixed(1)} (Normal Health Band ✓)
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="workflow-actions-bar">
                <button
                  type="button"
                  className="btn-ghost-back"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft size={15} />
                  <span>Back to Banking</span>
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setVoiceModalOpen(true)}
                    className="btn-ghost-back"
                    style={{ borderColor: 'rgba(232,93,63,0.35)', color: '#e85d3f' }}
                  >
                    <Mic size={14} />
                    <span>Voice Objectives</span>
                  </button>
                  <button
                    type="button"
                    className="btn-coral-submit"
                    onClick={() => setStep(4)}
                  >
                    <span>Continue to Statutory Mandates</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* STEP 4: STATUTORY MANDATES & DIGITAL SIGNATURE */}
          {step === 4 && (
            <>
              <div className="stage-head-block">
                <div className="stage-head-left">
                  <h2>Official Appointment &amp; ASTUTE Consent</h2>
                  <p>Authorize Qiniso Ntuli (FSP 29370) to represent you and query ASTUTE for your existing industry policies.</p>
                </div>
                <div className="subcard-badge green">FAIS &amp; POPIA Ready</div>
              </div>

              <div className="workflow-2col-grid">
                {/* Left Column: Official Mandate Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Mandate 1: Appointment of Adviser */}
                  <div className="workflow-subcard">
                    <div className="subcard-header">
                      <div className="subcard-title-group">
                        <FileText size={18} />
                        <span>Notice of Appointment as Financial Advisor</span>
                      </div>
                      <span className="subcard-badge coral">FAIS Section 13</span>
                    </div>

                    <div style={{ fontSize: 12, color: '#87837c', lineHeight: 1.55 }}>
                      Royal Square Financial · Accredited Financial Advisor: <strong>Qiniso Ntuli (FSP 29370)</strong>
                      <p style={{ marginTop: 8, color: '#171615' }}>
                        "I hereby appoint Royal Square Financial and Qiniso Ntuli as my accredited financial advisor to review, manage, and intermediate on my life assurance, collective investments, retirement funds, and risk policies."
                      </p>
                    </div>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: '#ffffff',
                        border: hasReviewedAppointment ? '2px solid #e85d3f' : '1px solid #ece7de',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 12
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={hasReviewedAppointment}
                        onChange={(e) => setHasReviewedAppointment(e.target.checked)}
                        style={{ accentColor: '#e85d3f' }}
                      />
                      <span>I confirm and endorse the statutory appointment of Qiniso Ntuli.</span>
                    </label>
                  </div>

                  {/* Mandate 2: ASTUTE Consent */}
                  <div className="workflow-subcard">
                    <div className="subcard-header">
                      <div className="subcard-title-group">
                        <ExternalLink size={18} />
                        <span>Client Consent to Obtain Information (ASTUTE)</span>
                      </div>
                      <span className="subcard-badge green">POPIA Compliant</span>
                    </div>

                    <div style={{ fontSize: 12, color: '#87837c', lineHeight: 1.55 }}>
                      ASTUTE Financial Services Exchange · Industry Data Interchange
                      <p style={{ marginTop: 8, color: '#171615' }}>
                        "Authorizes Royal Square to query ASTUTE to electronically pull live policy schedules from Sanlam, Old Mutual, Discovery, Momentum, Liberty, and Santam under POPIA provisions."
                      </p>
                    </div>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: '#ffffff',
                        border: hasReviewedConsent ? '2px solid #e85d3f' : '1px solid #ece7de',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 12
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={hasReviewedConsent}
                        onChange={(e) => setHasReviewedConsent(e.target.checked)}
                        style={{ accentColor: '#e85d3f' }}
                      />
                      <span>I consent to ASTUTE policy queries under POPIA.</span>
                    </label>
                  </div>
                </div>

                {/* Right Column: Signature Pad (Draw / Type) */}
                <div className="workflow-subcard">
                  <div className="subcard-header">
                    <div className="subcard-title-group">
                      <PenTool size={18} />
                      <span>Electronic Signature</span>
                    </div>

                    <div style={{ display: 'flex', background: '#ffffff', borderRadius: 999, padding: 3, border: '1px solid #ece7de' }}>
                      <button
                        type="button"
                        onClick={() => setSignatureMode('draw')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 999,
                          border: 'none',
                          background: signatureMode === 'draw' ? '#e85d3f' : 'transparent',
                          color: signatureMode === 'draw' ? '#ffffff' : '#87837c',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <PenTool size={12} />
                        <span>Draw</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignatureMode('type')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 999,
                          border: 'none',
                          background: signatureMode === 'type' ? '#e85d3f' : 'transparent',
                          color: signatureMode === 'type' ? '#ffffff' : '#87837c',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <Type size={12} />
                        <span>Type Name</span>
                      </button>
                    </div>
                  </div>

                  {signatureMode === 'draw' ? (
                    <div>
                      <div
                        style={{
                          position: 'relative',
                          background: '#ffffff',
                          border: '1.5px dashed #dcd6ca',
                          borderRadius: 14,
                          overflow: 'hidden',
                          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.02)'
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
                          style={{
                            width: '100%',
                            height: 160,
                            display: 'block',
                            cursor: 'crosshair',
                            touchAction: 'none'
                          }}
                        />
                        {!hasDrawn && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#aba69e',
                              pointerEvents: 'none',
                              fontSize: 13,
                              gap: 6
                            }}
                          >
                            <PenTool size={20} />
                            <span>Draw signature here with mouse or trackpad</span>
                          </div>
                        )}

                        <div
                          style={{
                            position: 'absolute',
                            bottom: 12,
                            left: 16,
                            right: 16,
                            borderTop: '1px dashed #dcd6ca',
                            paddingTop: 4,
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 9.5,
                            color: '#aba69e',
                            textTransform: 'uppercase',
                            letterSpacing: '0.6px',
                            pointerEvents: 'none'
                          }}
                        >
                          <span>Sign above line</span>
                          <span>FSP 29370 Seal</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={clearSignature}
                          style={{
                            background: 'transparent',
                            color: '#e85d3f',
                            border: 'none',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          <RotateCcw size={13} />
                          <span>Clear Signature</span>
                        </button>
                        <span style={{ fontSize: 11, color: '#2b7a48', fontWeight: 600 }}>
                          FAIS / POPIA Certified ✓
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ background: '#ffffff', border: '1px solid #ece7de', borderRadius: 14, padding: 20, textAlign: 'center' }}>
                        <label className="onboarding-label" style={{ marginBottom: 8, display: 'block' }}>Type Full Legal Name</label>
                        <input
                          type="text"
                          className="onboarding-input"
                          value={typedSignature}
                          onChange={(e) => setTypedSignature(e.target.value)}
                          placeholder={fullName || 'Full Legal Name'}
                          style={{ textAlign: 'center', fontSize: 14, fontWeight: 700 }}
                        />
                        <div
                          style={{
                            marginTop: 18,
                            padding: '16px 20px',
                            background: '#faf9f5',
                            borderRadius: 12,
                            border: '1px dashed #dcd6ca',
                            fontFamily: "'Caveat', cursive",
                            fontSize: 32,
                            color: '#1e293b'
                          }}
                        >
                          {typedSignature || fullName}
                        </div>
                        <span style={{ fontSize: 10, color: '#87837c', marginTop: 8, display: 'block' }}>
                          Cryptographically bound to IP &amp; timestamp: 2026-09-06 · SA Standard Time
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{ background: '#ffffff', border: '1px solid #ece7de', borderRadius: 12, padding: 12, marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldCheck size={18} style={{ color: '#2b7a48', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#87837c', lineHeight: 1.4 }}>
                      Your signature satisfies Section 13 of the FAIS Act and Chapter 3 of POPIA for electronic transactions.
                    </span>
                  </div>
                </div>
              </div>

              <div className="workflow-actions-bar">
                <button
                  type="button"
                  className="btn-ghost-back"
                  onClick={() => setStep(3)}
                >
                  <ArrowLeft size={15} />
                  <span>Back to Objectives</span>
                </button>
                <button
                  type="button"
                  className="btn-coral-submit"
                  disabled={!hasReviewedAppointment || !hasReviewedConsent}
                  onClick={handleCompleteRegistration}
                  style={{
                    opacity: (!hasReviewedAppointment || !hasReviewedConsent) ? 0.5 : 1,
                    cursor: (!hasReviewedAppointment || !hasReviewedConsent) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <span>Finalise Onboarding &amp; Launch Portal</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* STEP 5: ACTIVATION & SUCCESS DOSSIER */}
          {step === 5 && (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#edf7f1',
                  color: '#2b7a48',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 4px 14px rgba(43, 122, 72, 0.15)'
                }}
              >
                <Check size={32} strokeWidth={3} />
              </div>

              <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px 0', color: '#171615' }}>
                Onboarding Dossier Created &amp; Activated!
              </h2>
              <p style={{ fontSize: 14.5, color: '#87837c', margin: '0 auto 28px', maxWidth: 620, lineHeight: 1.55 }}>
                Welcome, <strong>{fullName}</strong>. Your FICA verification, ASTUTE consent, and bank data have been compiled into advisory case <strong>#ONB-1001</strong> for Qiniso Ntuli.
              </p>

              <div style={{ background: '#faf9f5', borderRadius: 20, padding: 24, maxWidth: 720, margin: '0 auto 30px', textAlign: 'left', border: '1px solid #ece7de' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#87837c', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.6px' }}>
                  Live Client Portal State Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
                  <div>
                    <span style={{ color: '#87837c', display: 'block', fontSize: 11 }}>Accredited Adviser:</span>
                    <strong>Qiniso Ntuli (FSP 29370)</strong>
                  </div>
                  <div>
                    <span style={{ color: '#87837c', display: 'block', fontSize: 11 }}>FICA Compliance:</span>
                    <strong style={{ color: '#2b7a48' }}>{isPep ? 'PEP Flagged (EDD)' : 'Verified (Clean ✓)'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#87837c', display: 'block', fontSize: 11 }}>Primary Banking Feed:</span>
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <img src={activeBank.logoSrc} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                      <span>{selectedBank}</span>
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#87837c', display: 'block', fontSize: 11 }}>Starting Net Worth:</span>
                    <strong style={{ color: '#2b7a48' }}>R {netWorth.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn-coral-submit"
                  style={{ height: 48, padding: '0 32px' }}
                >
                  <span>Go to Client Home</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/requests')}
                  className="btn-ghost-back"
                  style={{ height: 48, padding: '0 24px' }}
                >
                  <span>Track Case #ONB-1001</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {voiceFilledToast && (
        <div className="voice-toast-banner">
          <Sparkles size={16} />
          <span>{voiceFilledToast}</span>
        </div>
      )}

      <VoiceModeModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onApply={handleApplyVoice}
        contextTitle="Onboarding &amp; Financial Architecture"
      />
    </div>
  )
}
