import { useState, useEffect, useRef } from 'react'
import {
  Mic,
  MicOff,
  Sparkles,
  Check,
  X,
  Volume2,
  VolumeX,
  Building2,
  User,
  Coins,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  FileCheck,
  CreditCard
} from 'lucide-react'
import { extractEntitiesFromSpeech, type ExtractedEntities } from '../voice/entityExtractor'

interface VoiceModeModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (entities: ExtractedEntities) => void
  contextTitle?: string
}

// 4 Zero-Fail Demonstration Scenarios tailored to South African wealth management
const PRESET_SCENARIOS = [
  {
    label: 'Onboard Latoya Matai',
    badge: 'Executive',
    sub: 'FNB Cheque · R48.5k Salary · Retirement (Reg 28)',
    transcript: 'My name is Latoya Matai, ID 920412 0184 087, mobile 082 555 0184. I bank with First National Bank cheque account number 62819283741. My monthly salary is 48500, living expenses 24300, and debt 8200. Total assets are 1.85 million and liabilities 600k. I want to prioritize retirement readiness and regulation 28.'
  },
  {
    label: 'Onboard Sipho Khumalo',
    badge: 'Private Wealth',
    sub: 'Nedbank · R62k Salary · R2.5M Assets · Equities',
    transcript: 'My name is Sipho Khumalo, ID 880315 5123 088, phone 083 444 9912. My primary bank is Nedbank. My monthly salary is 62000, living expenses 26000, and debt 9000. Total assets are 2.5 million and liabilities 500k. My priority is wealth creation and equity capital growth.'
  },
  {
    label: 'Calibrate Balance Sheet & Budget',
    badge: 'Financial Review',
    sub: 'Standard Bank · R55k Salary · R3M Assets · Life Cover',
    transcript: 'Please update my finances: monthly salary 55000, living expenses 22000, and debt payments 7000. I bank with Standard Bank. Set my total assets to 3 million and liabilities to 750k. My primary focus is family and life cover protection.'
  },
  {
    label: 'Statutory Consent & Astute Mandate',
    badge: 'Compliance',
    sub: 'Astute Exchange · FAIS Section 13 · Tax 9827163541',
    transcript: 'I hereby grant Royal Square Financial Services authorization to access my policy and asset records via the Astute Exchange under FAIS Section 13. My tax number is 9827163541.'
  }
]

// Native Web Audio Chime Generator (Zero network dependencies, 100% offline & zero-fail)
function playTone(freq: number, type: OscillatorType, duration: number, delay = 0) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
    gain.gain.setValueAtTime(0.06, ctx.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + duration)
  } catch {
    // audio context may be suspended before user interaction
  }
}

function playStartChime() {
  playTone(440, 'sine', 0.12, 0)
  playTone(659.25, 'sine', 0.2, 0.07)
}

function playSuccessChime() {
  playTone(523.25, 'sine', 0.14, 0)
  playTone(659.25, 'sine', 0.14, 0.08)
  playTone(783.99, 'sine', 0.28, 0.16)
}

export function VoiceModeModal({ isOpen, onClose, onApply, contextTitle = 'Form Auto-Fill' }: VoiceModeModalProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [extracted, setExtracted] = useState<ExtractedEntities | null>(null)
  const [activeScenarioIdx, setActiveScenarioIdx] = useState<number | null>(null)
  const [micSupported, setMicSupported] = useState(false)
  const [usingRealMic, setUsingRealMic] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isSpeakingSummary, setIsSpeakingSummary] = useState(false)

  const recognitionRef = useRef<any>(null)
  const streamTimerRef = useRef<any>(null)

  useEffect(() => {
    // Check Web Speech API availability
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRec) {
      setMicSupported(true)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      handleStopListening()
      setTranscript('')
      setExtracted(null)
      setActiveScenarioIdx(null)
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      setIsSpeakingSummary(false)
    }
  }, [isOpen])

  // Extract entities whenever transcript changes
  useEffect(() => {
    if (transcript.trim().length > 10) {
      const entities = extractEntitiesFromSpeech(transcript)
      setExtracted(entities)
    }
  }, [transcript])

  // Simulated Voice Scenario Streaming (Zero-Fail Demo Mode)
  const playPresetScenario = (scenario: typeof PRESET_SCENARIOS[0], index: number) => {
    handleStopListening()
    setActiveScenarioIdx(index)
    setIsListening(true)
    setUsingRealMic(false)
    setTranscript('')
    setExtracted(null)

    if (soundEnabled) {
      playStartChime()
    }

    const words = scenario.transcript.split(' ')
    let currentWordIdx = 0

    streamTimerRef.current = setInterval(() => {
      if (currentWordIdx < words.length) {
        setTranscript(words.slice(0, currentWordIdx + 1).join(' '))
        currentWordIdx++
      } else {
        clearInterval(streamTimerRef.current)
        setIsListening(false)
        if (soundEnabled) {
          playSuccessChime()
        }
      }
    }, 45)
  }

  // Real Microphone Toggle
  const toggleRealMic = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRec) return

    if (isListening && usingRealMic) {
      handleStopListening()
      return
    }

    handleStopListening()
    setIsListening(true)
    setUsingRealMic(true)
    setActiveScenarioIdx(null)
    setTranscript('')
    setExtracted(null)

    if (soundEnabled) {
      playStartChime()
    }

    try {
      const recognition = new SpeechRec()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-ZA'

      recognition.onresult = (event: any) => {
        let currentTranscript = ''
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' '
        }
        setTranscript(currentTranscript.trim())
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        if (soundEnabled) {
          playSuccessChime()
        }
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch {
      setIsListening(false)
    }
  }

  const handleStopListening = () => {
    setIsListening(false)
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current)
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
  }

  const handleSpeakSummary = () => {
    if (!window.speechSynthesis || !extracted) return

    if (isSpeakingSummary) {
      window.speechSynthesis.cancel()
      setIsSpeakingSummary(false)
      return
    }

    const parts: string[] = ['Voice entities extracted.']
    if (extracted.fullName) parts.push(`Client: ${extracted.fullName}.`)
    if (extracted.bank) parts.push(`Bank: ${extracted.bank.shortName}.`)
    if (extracted.monthlySalary) parts.push(`Monthly salary: ${extracted.monthlySalary} rand.`)
    if (extracted.assetsAmount) parts.push(`Assets: ${extracted.assetsAmount} rand.`)
    if (extracted.focus) parts.push(`Focus: ${extracted.focus.replace('_', ' ')}.`)
    parts.push('Ready to apply to form.')

    const utterance = new SpeechSynthesisUtterance(parts.join(' '))
    utterance.rate = 1.05
    utterance.pitch = 1.0
    utterance.onend = () => setIsSpeakingSummary(false)
    utterance.onerror = () => setIsSpeakingSummary(false)

    setIsSpeakingSummary(true)
    window.speechSynthesis.speak(utterance)
  }

  const handleApplyAndClose = () => {
    if (extracted) {
      if (soundEnabled) {
        playSuccessChime()
      }
      onApply(extracted)
      onClose()
    }
  }

  const countDetectedEntities = (): number => {
    if (!extracted) return 0
    let count = 0
    if (extracted.fullName) count++
    if (extracted.idNumber) count++
    if (extracted.taxNumber) count++
    if (extracted.bank) count++
    if (extracted.accountNumber) count++
    if (extracted.accountType) count++
    if (extracted.monthlySalary !== undefined) count++
    if (extracted.livingExpenses !== undefined) count++
    if (extracted.debtPayments !== undefined) count++
    if (extracted.assetsAmount !== undefined) count++
    if (extracted.liabilitiesAmount !== undefined) count++
    if (extracted.focus) count++
    if (extracted.reg28Compliant !== undefined) count++
    if (extracted.consentGranted) count++
    if (extracted.beneficiary) count++
    if (extracted.mobile) count++
    return count
  }

  if (!isOpen) return null

  const waveBarHeights = [14, 26, 12, 34, 20, 16, 32, 28, 14, 36, 24, 18, 30, 16, 26, 12, 28, 20, 32, 14, 22, 16]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(23, 22, 21, 0.48)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          background: '#ffffff',
          borderRadius: 24,
          boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.06)',
          border: '1px solid #ece7de',
          padding: '26px 30px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: '#fdf0ed',
                color: '#e85d3f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Mic size={22} />
            </span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#171615', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                Royal Square Voice Intelligence
                <span style={{ fontSize: 9.5, background: '#edf7f1', color: '#2b7a48', padding: '2px 8px', borderRadius: 999, fontWeight: 700, border: '1px solid #c9e8d4' }}>
                  Zero-Fail Hybrid Mode
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#87837c' }}>
                Context: <strong>{contextTitle}</strong> · Real-Time Entity Extraction
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Audio chime toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute audio chimes' : 'Enable audio chimes'}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#faf9f5',
                border: '1px solid #ece7de',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: soundEnabled ? '#e85d3f' : '#b0aba2',
                cursor: 'pointer'
              }}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-circle"
              style={{ width: 34, height: 34, borderRadius: '50%', background: '#faf9f5', border: '1px solid #ece7de' }}
              aria-label="Close voice assistant"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Central Visualizer & Listening Orb */}
        <div
          style={{
            background: 'linear-gradient(180deg, #faf9f5 0%, #ffffff 100%)',
            borderRadius: 20,
            border: '1px solid #ece7de',
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            textAlign: 'center'
          }}
        >
          {/* Animated Glow Orb */}
          <div
            className={isListening ? 'voice-orb-pulsing' : ''}
            style={{
              position: 'relative',
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: isListening
                ? 'radial-gradient(circle, #f06a4b 0%, #d84f31 100%)'
                : '#171615',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: isListening
                ? '0 0 0 8px rgba(232, 93, 63, 0.2), 0 8px 24px rgba(232, 93, 63, 0.4)'
                : '0 4px 16px rgba(0,0,0,0.12)',
              transition: 'all 0.3s ease'
            }}
          >
            {isListening ? (
              <Volume2 size={32} style={{ animation: 'pulse 1.2s infinite ease-in-out' }} />
            ) : (
              <Mic size={32} />
            )}
          </div>

          {/* Audio Waveform Simulator Bars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3.5, height: 38 }}>
            {waveBarHeights.map((h, i) => (
              <span
                key={i}
                className={isListening ? 'voice-wave-active' : ''}
                style={{
                  width: 3.5,
                  height: isListening ? `${h}px` : '4px',
                  background: isListening ? '#e85d3f' : '#dcd6ca',
                  borderRadius: 999,
                  transition: 'height 0.15s ease',
                  animationDelay: `${-(i * 0.06)}s`,
                  animationDuration: `${0.65 + (i % 4) * 0.12}s`
                }}
              />
            ))}
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#171615' }}>
              {isListening
                ? (usingRealMic ? 'Listening to your microphone...' : 'Streaming voice simulation...')
                : 'Select an instant demo scenario below or speak into microphone'}
            </div>
            <div style={{ fontSize: 11, color: '#87837c', marginTop: 2 }}>
              Extracts South African names, ID, banking institutions, accounts, salary, assets & statutory consent.
            </div>
          </div>

          {/* Optional Real Microphone Button */}
          {micSupported && (
            <button
              type="button"
              onClick={toggleRealMic}
              style={{
                background: isListening && usingRealMic ? '#e85d3f' : '#ffffff',
                color: isListening && usingRealMic ? '#ffffff' : '#171615',
                border: '1px solid #ece7de',
                borderRadius: 999,
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
            >
              {isListening && usingRealMic ? <MicOff size={13} /> : <Mic size={13} />}
              <span>{isListening && usingRealMic ? 'Stop Real Mic' : 'Speak into Microphone'}</span>
            </button>
          )}
        </div>

        {/* 1-Tap Bulletproof Voice Scenarios */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#87837c', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={13} style={{ color: '#e85d3f' }} />
              <span>Instant Demo Voice Scenarios (Zero-Fail On-Stage)</span>
            </span>
            <span style={{ fontSize: 10, color: '#2b7a48', fontWeight: 700, background: '#edf7f1', padding: '1px 7px', borderRadius: 999 }}>
              1-Tap Play
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
            {PRESET_SCENARIOS.map((scenario, idx) => {
              const isCurrent = activeScenarioIdx === idx
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => playPresetScenario(scenario, idx)}
                  style={{
                    padding: '11px 13px',
                    borderRadius: 14,
                    background: isCurrent ? '#fdf0ed' : '#faf9f5',
                    border: isCurrent ? '1.5px solid #e85d3f' : '1px solid #ece7de',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#171615', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Volume2 size={13} style={{ color: isCurrent ? '#e85d3f' : '#87837c' }} />
                      <span>{scenario.label}</span>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: isCurrent ? '#e85d3f' : '#87837c', background: isCurrent ? '#ffffff' : '#ece7de', padding: '1px 6px', borderRadius: 6 }}>
                      {scenario.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#87837c', marginTop: 3 }}>
                    {scenario.sub}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Live Transcription Box */}
        {transcript && (
          <div style={{ background: '#faf9f5', borderRadius: 16, border: '1px solid #ece7de', padding: '14px 16px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#87837c', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
              Live Spoken Transcription:
            </div>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: '#171615', fontStyle: 'italic' }}>
              "{transcript}"
            </p>
          </div>
        )}

        {/* Extracted Entities Summary */}
        {extracted && (
          <div style={{ background: '#ffffff', borderRadius: 16, border: '1.5px solid #2b7a48', padding: '16px 18px', boxShadow: '0 4px 14px rgba(43,122,72,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#2b7a48', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={14} strokeWidth={3} />
                <span>Extracted Form Entities ({countDetectedEntities()} Fields Detected)</span>
              </div>

              {/* Optional Read Back with AI Voice */}
              {window.speechSynthesis && (
                <button
                  type="button"
                  onClick={handleSpeakSummary}
                  style={{
                    background: '#edf7f1',
                    border: '1px solid #c9e8d4',
                    borderRadius: 999,
                    padding: '3px 10px',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#2b7a48',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <Volume2 size={11} />
                  <span>{isSpeakingSummary ? 'Stop Audio' : 'Speak Summary'}</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {extracted.fullName && (
                <span style={{ fontSize: 11, background: '#faf9f5', border: '1px solid #ece7de', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <User size={12} style={{ color: '#e85d3f' }} />
                  <span>Client: <strong>{extracted.fullName}</strong></span>
                </span>
              )}

              {extracted.idNumber && (
                <span style={{ fontSize: 11, background: '#faf9f5', border: '1px solid #ece7de', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={12} style={{ color: '#2b7a48' }} />
                  <span>ID: <strong>{extracted.idNumber}</strong></span>
                </span>
              )}

              {extracted.bank && (
                <span style={{ fontSize: 11, background: '#faf9f5', border: '1px solid #ece7de', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <img src={extracted.bank.logo} alt={extracted.bank.name} style={{ width: 15, height: 15, objectFit: 'contain', borderRadius: 3 }} />
                  <span>Bank: <strong>{extracted.bank.shortName}</strong></span>
                </span>
              )}

              {extracted.accountNumber && (
                <span style={{ fontSize: 11, background: '#faf9f5', border: '1px solid #ece7de', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <CreditCard size={12} style={{ color: '#87837c' }} />
                  <span>Acc: <strong>{extracted.accountNumber}</strong></span>
                </span>
              )}

              {extracted.accountType && (
                <span style={{ fontSize: 11, background: '#faf9f5', border: '1px solid #ece7de', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>Type: <strong>{extracted.accountType}</strong></span>
                </span>
              )}

              {extracted.taxNumber && (
                <span style={{ fontSize: 11, background: '#faf9f5', border: '1px solid #ece7de', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>SARS Tax: <strong>{extracted.taxNumber}</strong></span>
                </span>
              )}

              {extracted.monthlySalary !== undefined && (
                <span style={{ fontSize: 11, background: '#faf9f5', border: '1px solid #ece7de', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Coins size={12} style={{ color: '#2b7a48' }} />
                  <span>Salary: <strong>R {extracted.monthlySalary.toLocaleString()}</strong></span>
                </span>
              )}

              {extracted.livingExpenses !== undefined && (
                <span style={{ fontSize: 11, background: '#faf9f5', border: '1px solid #ece7de', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>Expenses: <strong>R {extracted.livingExpenses.toLocaleString()}</strong></span>
                </span>
              )}

              {extracted.debtPayments !== undefined && (
                <span style={{ fontSize: 11, background: '#faf9f5', border: '1px solid #ece7de', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>Debt: <strong>R {extracted.debtPayments.toLocaleString()}</strong></span>
                </span>
              )}

              {extracted.assetsAmount !== undefined && (
                <span style={{ fontSize: 11, background: '#faf9f5', border: '1px solid #ece7de', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>Assets: <strong>R {extracted.assetsAmount.toLocaleString()}</strong></span>
                </span>
              )}

              {extracted.liabilitiesAmount !== undefined && (
                <span style={{ fontSize: 11, background: '#faf9f5', border: '1px solid #ece7de', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>Liabilities: <strong>R {extracted.liabilitiesAmount.toLocaleString()}</strong></span>
                </span>
              )}

              {extracted.focus && (
                <span style={{ fontSize: 11, background: '#faf9f5', border: '1px solid #ece7de', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={12} style={{ color: '#e85d3f' }} />
                  <span>Focus: <strong>{extracted.focus.replace('_', ' ')}</strong></span>
                </span>
              )}

              {extracted.reg28Compliant && (
                <span style={{ fontSize: 11, background: '#edf7f1', border: '1px solid #c9e8d4', color: '#2b7a48', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Check size={12} strokeWidth={3} />
                  <span>Regulation 28 Compliant</span>
                </span>
              )}

              {extracted.consentGranted && (
                <span style={{ fontSize: 11, background: '#edf7f1', border: '1px solid #c9e8d4', color: '#2b7a48', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <FileCheck size={12} />
                  <span>Astute Mandate Authorized</span>
                </span>
              )}

              {extracted.beneficiary && (
                <span style={{ fontSize: 11, background: '#faf9f5', border: '1px solid #ece7de', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>Beneficiary: <strong>{extracted.beneficiary.name} ({extracted.beneficiary.percentage}%)</strong></span>
                </span>
              )}

              {extracted.mobile && (
                <span style={{ fontSize: 11, background: '#faf9f5', border: '1px solid #ece7de', padding: '5px 11px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span>Mobile: <strong>{extracted.mobile}</strong></span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #ece7de', paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: '#87837c' }}>
            {extracted ? (
              <span style={{ color: '#2b7a48', fontWeight: 600 }}>
                ✓ {countDetectedEntities()} fields extracted & ready to apply
              </span>
            ) : (
              'Spoken data will be converted to structured fields'
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost-back"
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn-coral-submit"
              disabled={!extracted}
              onClick={handleApplyAndClose}
              style={{
                opacity: !extracted ? 0.4 : 1,
                cursor: !extracted ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>Apply {countDetectedEntities() > 0 ? `${countDetectedEntities()} Fields` : 'Entities'} to Form</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

