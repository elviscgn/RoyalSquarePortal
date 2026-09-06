import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  User,
  Briefcase,
  Eye,
  EyeOff,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react'
import { usePortal } from '../store'
import { useTranslation, LANGUAGE_METADATA } from '../i18n/translations'
import type { Locale } from '../types'

export function Login() {
  const navigate = useNavigate()
  const { state, dispatch } = usePortal()
  const t = useTranslation(state.locale)
  const [langOpen, setLangOpen] = useState(false)

  // Luxury visual theme: 'silk' (Cashmere Silk) or 'obsidian' (Obsidian Reserve)
  const [themeMode, setThemeMode] = useState<'silk' | 'obsidian'>('silk')

  // Persona mode: 'client' or 'adviser'
  const [persona, setPersona] = useState<'client' | 'adviser'>('client')

  // Auth method: 'password' or 'otp'
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password')

  // Form fields
  const [identifier, setIdentifier] = useState(state.client.email || 'latoya.matai@example.co.za')
  const [password, setPassword] = useState('••••••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [otpCode, setOtpCode] = useState(['5', '2', '8', '4', '1', '9'])
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handlePersonaChange = (newPersona: 'client' | 'adviser') => {
    setPersona(newPersona)
    if (newPersona === 'client') {
      setIdentifier(state.client.email || 'latoya.matai@example.co.za')
    } else {
      setIdentifier('qiniso@royal-square.com')
    }
  }

  const handleOtpChange = (index: number, val: string) => {
    const char = val.slice(-1)
    const next = [...otpCode]
    next[index] = char
    setOtpCode(next)
    if (char && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      if (persona === 'adviser') {
        navigate('/adviser')
      } else {
        navigate('/')
      }
    }, 380)
  }

  const isDark = themeMode === 'obsidian'

  // Dynamic theme tokens for luxury refinement
  const theme = {
    rightBg: isDark
      ? 'radial-gradient(ellipse at 50% 15%, #181512 0%, #0c0b0a 100%)'
      : 'radial-gradient(ellipse at 50% 12%, #fcfaf6 0%, #f4eee2 100%)',
    rightBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(215, 202, 185, 0.45)',
    cardBg: isDark ? 'rgba(23, 20, 18, 0.94)' : '#ffffff',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(224, 215, 202, 0.85)',
    cardShadow: isDark
      ? '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.04)'
      : '0 20px 50px -15px rgba(45, 35, 25, 0.08), 0 2px 8px rgba(45, 35, 25, 0.03)',
    textPrimary: isDark ? '#ffffff' : '#171615',
    textSecondary: isDark ? '#a8a29e' : '#57524b',
    textMuted: isDark ? '#78716c' : '#78716c',
    pillBg: isDark ? 'rgba(255, 255, 255, 0.07)' : '#ece5d9',
    pillActiveBg: isDark ? 'rgba(255, 255, 255, 0.16)' : '#ffffff',
    inputBg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#faf8f5',
    inputBorder: isDark ? 'rgba(255, 255, 255, 0.14)' : '#ded7cc',
    inputText: isDark ? '#ffffff' : '#171615',
    divider: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ede7dc',
    gatewayBg: isDark ? 'rgba(22, 101, 52, 0.2)' : '#f0faf4',
    gatewayBorder: isDark ? 'rgba(74, 222, 128, 0.25)' : '#d1fae5',
    gatewayText: isDark ? '#86efac' : '#166534'
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0d0c0b',
        color: theme.textPrimary,
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: 0,
        margin: 0,
        overflowX: 'hidden'
      }}
    >
      {/* =========================================================================
          EXECUTIVE 2-COLUMN SPLIT:
          LEFT: Unobstructed Hero Photo & Institutional Statutory Identity
          RIGHT: Bespoke Private Wealth Authentication Terminal (Silk / Obsidian)
          ========================================================================= */}
      <div className="login-split-layout">
        {/* LEFT COLUMN: THE ROYAL SQUARE HERO & EDITORIAL ENVIRONMENT */}
        <div
          className="login-hero-column"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(13, 12, 11, 0.72) 0%, rgba(13, 12, 11, 0.2) 16%, rgba(13, 12, 11, 0) 30%), linear-gradient(0deg, rgba(13, 12, 11, 0.92) 0%, rgba(13, 12, 11, 0.75) 24%, rgba(13, 12, 11, 0.25) 45%, rgba(13, 12, 11, 0) 60%), url('/login-hero.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 32%',
            backgroundRepeat: 'no-repeat',
            color: '#ffffff',
            padding: '38px 44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            borderRight: `1px solid ${theme.rightBorder}`
          }}
        >
          {/* Top Brand & Institutional Regulatory Credential */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                src="/royal-square-logo.png"
                alt="Royal Square"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  objectFit: 'contain',
                  background: '#ffffff',
                  padding: 3,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.45)'
                }}
              />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  Royal Square Financial
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10.5, color: '#e6e2dc', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    FSCA Authorised FSP 29370
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>|</span>
                  {/* Institutional statutory credential — authentic private banking crest, zero AI-slop dot */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(20, 18, 16, 0.72)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                      padding: '3px 10px',
                      borderRadius: 999,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
                    }}
                  >
                    <div
                      style={{
                        width: 13,
                        height: 13,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #d4af37 0%, #aa8222 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ShieldCheck size={9} style={{ color: '#ffffff' }} />
                    </div>
                    <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.07em', color: '#f5eee0', textTransform: 'uppercase' }}>
                      FATF Grey-List Compliant Architecture
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Bottom: Landing Page Manifesto */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              marginTop: 'auto',
              maxWidth: 640,
              paddingTop: 36
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#ff7b5a',
                  background: 'rgba(232, 93, 63, 0.16)',
                  border: '1px solid rgba(232, 93, 63, 0.38)',
                  padding: '3px 10px',
                  borderRadius: 6,
                  backdropFilter: 'blur(8px)'
                }}
              >
                Private Client &amp; Adviser Portal
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(24px, 2.4vw, 34px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: '#ffffff',
                lineHeight: 1.18,
                margin: '0 0 12px 0',
                textShadow: '0 2px 14px rgba(0, 0, 0, 0.85), 0 1px 3px rgba(0, 0, 0, 0.9)'
              }}
            >
              Bespoke wealth architecture for South Africa’s discerning investors.
            </h1>

            <p
              style={{
                fontSize: 'clamp(12.5px, 1.05vw, 14px)',
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.6,
                margin: '0 0 18px 0',
                maxWidth: 540,
                fontWeight: 500,
                textShadow: '0 1px 8px rgba(0, 0, 0, 0.85)'
              }}
            >
              Access your real-time balance sheet, statutory FAIS mandates, ASTUTE insurance exchange queries, and claims tracking in one secure sovereign environment.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: 14 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: 'rgba(255, 255, 255, 0.7)',
                  textTransform: 'uppercase',
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)'
                }}
              >
                Sovereign Private Wealth Lounge · Sandton 2196
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH-PRECISION UNIFIED AUTHENTICATION TERMINAL */}
        <div
          style={{
            background: theme.rightBg,
            padding: '28px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            boxSizing: 'border-box',
            transition: 'background 0.3s ease'
          }}
        >
          <div style={{ width: '100%', maxWidth: 476 }}>
            {/* Top Gateway Status & Controls Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span
                style={{
                  fontSize: 10.5,
                  color: theme.gatewayText,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: theme.gatewayBg,
                  border: `1px solid ${theme.gatewayBorder}`,
                  padding: '3px 10px',
                  borderRadius: 999
                }}
              >
                <ShieldCheck size={12.5} />
                <span>Sovereign Gateway Secure</span>
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Luxury Theme Switcher (Cashmere Silk vs Obsidian Reserve) */}
                <button
                  type="button"
                  onClick={() => setThemeMode((m) => (m === 'silk' ? 'obsidian' : 'silk'))}
                  title={isDark ? 'Switch to Cashmere Silk' : 'Switch to Obsidian Reserve'}
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                    border: `1.5px solid ${theme.inputBorder}`,
                    borderRadius: 999,
                    padding: '3px 8px',
                    fontSize: 10.5,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    cursor: 'pointer',
                    color: theme.textPrimary,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  {isDark ? (
                    <>
                      <Sun size={11} style={{ color: '#fbbf24' }} />
                      <span>Silk</span>
                    </>
                  ) : (
                    <>
                      <Moon size={11} style={{ color: '#78716c' }} />
                      <span>Obsidian</span>
                    </>
                  )}
                </button>

                {/* Multilingual Selector */}
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setLangOpen((o) => !o)}
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                      border: `1.5px solid ${theme.inputBorder}`,
                      borderRadius: 999,
                      padding: '3px 9px',
                      fontSize: 10.5,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      color: theme.textPrimary,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <span>{LANGUAGE_METADATA[state.locale]?.label || 'EN'}</span>
                    <ChevronRight size={10} style={{ transform: langOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                  </button>

                  {langOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 26,
                        background: isDark ? '#1f1c19' : '#ffffff',
                        border: `1px solid ${theme.cardBorder}`,
                        borderRadius: 12,
                        padding: 6,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                        zIndex: 100,
                        minWidth: 150,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                      }}
                    >
                      {(Object.keys(LANGUAGE_METADATA) as Locale[]).map((loc) => {
                        const meta = LANGUAGE_METADATA[loc]
                        const isCurrent = state.locale === loc
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => {
                              dispatch({ type: 'set-locale', locale: loc })
                              setLangOpen(false)
                            }}
                            style={{
                              border: 'none',
                              background: isCurrent ? (isDark ? 'rgba(232,93,63,0.25)' : '#fdf0ed') : 'transparent',
                              color: isCurrent ? '#e85d3f' : theme.textPrimary,
                              padding: '6px 10px',
                              borderRadius: 8,
                              fontSize: 11.5,
                              fontWeight: isCurrent ? 700 : 500,
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span>{meta.nativeName}</span>
                            <span style={{ fontSize: 9.5, opacity: 0.6 }}>{meta.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Unified Master Authentication Card */}
            <div
              style={{
                background: theme.cardBg,
                borderRadius: 22,
                border: `1px solid ${theme.cardBorder}`,
                padding: '28px 32px 24px',
                boxShadow: theme.cardShadow,
                backdropFilter: isDark ? 'blur(20px)' : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Persona Switcher Tabs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  background: theme.pillBg,
                  padding: 3,
                  borderRadius: 12,
                  marginBottom: 18
                }}
              >
                <button
                  type="button"
                  onClick={() => handlePersonaChange('client')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 9,
                    border: 'none',
                    background: persona === 'client' ? theme.pillActiveBg : 'transparent',
                    color: persona === 'client' ? theme.textPrimary : theme.textMuted,
                    fontWeight: 800,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: persona === 'client' ? (isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.06)') : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <User size={13.5} style={{ color: persona === 'client' ? '#e85d3f' : theme.textMuted }} />
                  <span>{t.privateClient}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePersonaChange('adviser')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 9,
                    border: 'none',
                    background: persona === 'adviser' ? theme.pillActiveBg : 'transparent',
                    color: persona === 'adviser' ? theme.textPrimary : theme.textMuted,
                    fontWeight: 800,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: persona === 'adviser' ? (isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.06)') : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Briefcase size={13.5} style={{ color: persona === 'adviser' ? '#e85d3f' : theme.textMuted }} />
                  <span>{t.adviserWorkspace}</span>
                </button>
              </div>

              {/* Portal Header */}
              <div style={{ marginBottom: 18 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.025em', color: theme.textPrimary, lineHeight: 1.25 }}>
                  {persona === 'client' ? 'Sign in to your private portal' : 'Sign in to adviser workspace'}
                </h1>
                <p style={{ margin: '6px 0 0', fontSize: 12.5, color: theme.textSecondary, lineHeight: 1.5, fontWeight: 500 }}>
                  {persona === 'client'
                    ? 'Access your real-time balance sheet, statutory FAIS mandates, and ASTUTE insurance exchange queries.'
                    : 'Access sovereign adviser telemetry, client take-on dossiers, and compliance mandate engines.'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Identifier Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10.5, fontWeight: 800, color: theme.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {persona === 'client' ? t.emailOrMobile : t.adviserEmail}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }}>
                      <Mail size={15} />
                    </span>
                    <input
                      type="text"
                      className="login-input-field"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={persona === 'client' ? 'e.g. latoya.matai@example.co.za' : 'e.g. adviser@royal-square.co.za'}
                      required
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: theme.inputBg,
                        border: `1.5px solid ${theme.inputBorder}`,
                        borderRadius: 12,
                        padding: '10px 12px 10px 38px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: theme.inputText,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Password vs OTP */}
                {authMethod === 'password' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: 10.5, fontWeight: 800, color: theme.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t.password}
                      </label>
                      <button
                        type="button"
                        onClick={() => setAuthMethod('otp')}
                        style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, color: '#e85d3f', fontWeight: 800, cursor: 'pointer' }}
                      >
                        Sign in via SMS PIN &rarr;
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }}>
                        <Lock size={15} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="login-input-field"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          background: theme.inputBg,
                          border: `1.5px solid ${theme.inputBorder}`,
                          borderRadius: 12,
                          padding: '10px 38px 10px 38px',
                          fontSize: 13,
                          fontWeight: 600,
                          color: theme.inputText,
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, color: theme.textMuted, cursor: 'pointer' }}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: 10.5, fontWeight: 800, color: theme.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        6-Digit Security PIN
                      </label>
                      <button
                        type="button"
                        onClick={() => setAuthMethod('password')}
                        style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, color: '#e85d3f', fontWeight: 800, cursor: 'pointer' }}
                      >
                        Use password instead &rarr;
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                      {otpCode.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpInputsRef.current[i] = el }}
                          type="text"
                          className="login-input-field"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          style={{
                            height: 42,
                            textAlign: 'center',
                            background: theme.inputBg,
                            border: `1.5px solid ${theme.inputBorder}`,
                            borderRadius: 10,
                            fontSize: 16,
                            fontWeight: 800,
                            color: theme.inputText,
                            outline: 'none'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Remember Device Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, color: theme.textSecondary, fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: '#e85d3f', width: 15, height: 15 }}
                    />
                    <span>{t.rememberDevice}</span>
                  </label>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="login-submit-btn"
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: 14,
                    fontSize: 13.5,
                    fontWeight: 800,
                    marginTop: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: isLoading ? 'wait' : 'pointer',
                    background: 'linear-gradient(135deg, #e85d3f 0%, #cf4829 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 4px 16px rgba(232, 93, 63, 0.32)'
                  }}
                >
                  <span>
                    {isLoading
                      ? 'Authenticating...'
                      : persona === 'client'
                        ? t.enterClientPortal
                        : t.enterAdviserWorkspace}
                  </span>
                  <ArrowRight size={15} />
                </button>
              </form>

              {/* Security Footprint inside card */}
              <div
                style={{
                  borderTop: `1px solid ${theme.divider}`,
                  paddingTop: 12,
                  marginTop: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 10.5,
                  color: theme.textMuted,
                  fontWeight: 600
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <ShieldCheck size={13} style={{ color: '#15803d' }} />
                  <span>{t.popiaEncrypted}</span>
                </span>
                <span>{t.faisFsp}</span>
              </div>
            </div>

            {/* Bottom Link: Register New Portfolio (outside card) */}
            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: theme.textSecondary, fontWeight: 500 }}>
              Seeking sovereign private advisory?{' '}
              <button
                type="button"
                onClick={() => navigate('/onboarding')}
                style={{ background: 'none', border: 'none', color: '#e85d3f', fontWeight: 800, cursor: 'pointer', padding: 0, fontSize: 12 }}
              >
                Register a new portfolio &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
