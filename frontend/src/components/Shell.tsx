import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, CalendarPlus, Car, Check, Plus, ChevronDown, ChevronRight, FilePenLine, Files, IdCard, Inbox, LayoutDashboard, Menu, MessagesSquare, Search, SlidersHorizontal, UserCheck, UserPlus, Wallet, X, Mic } from 'lucide-react'
import { usePortal } from '../store'
import { VoiceModeModal } from './VoiceModeModal'
import { useTranslation, LANGUAGE_METADATA } from '../i18n/translations'
import type { RequestCase, RequestStatus, WorkflowStep, Locale } from '../types'

export const formatMoney = (value: number) => `R ${value.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`

export function StatusPill({ status, label }: { status: RequestStatus | 'ready' | 'pending' | 'signed' | 'expired' | 'open' | 'complete'; label?: string }) {
  const labels: Record<string, string> = { 'waiting-client': 'Waiting for you', 'waiting-adviser': 'Waiting for Qiniso', 'waiting-provider': 'Waiting for provider', automatic: 'Processing automatically', complete: 'Complete', ready: 'Ready', pending: 'Pending', signed: 'Signed', expired: 'Expired', open: 'Open' }
  return <span className={`status-pill status-${status}`}>{label ?? labels[status] ?? status}</span>
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return <section className={`card ${className}`} onClick={onClick}>{children}</section>
}

export function Button({ children, variant = 'primary', onClick, type = 'button', disabled = false, className = '' }: { children: ReactNode; variant?: 'primary' | 'quiet' | 'dark' | 'outline'; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; className?: string }) {
  return <button type={type} className={`button button-${variant} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>
}

export function Drawer({ title, children, open, onClose, side = 'right', className = '', header }: { title: string; children: ReactNode; open: boolean; onClose: () => void; side?: 'left' | 'right'; className?: string; header?: ReactNode }) {
  const drawerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    const handle = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', handle)
    document.body.classList.add('drawer-locked')
    drawerRef.current?.focus()
    return () => { document.removeEventListener('keydown', handle); document.body.classList.remove('drawer-locked') }
  }, [open, onClose])
  if (!open) return null
  return <><div className={`drawer-backdrop ${className}-backdrop`} onClick={onClose} /><aside className={`drawer drawer-${side} ${className}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={drawerRef}>{header ?? <div className="drawer-heading"><div><span className="eyebrow">Royal Square</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label={`Close ${title}`}><X size={18} /></button></div>}{children}</aside></>
}

export function Modal({ title, children, open, onClose }: { title: string; children: ReactNode; open: boolean; onClose: () => void }) {
  return <Drawer title={title} open={open} onClose={onClose}>{children}</Drawer>
}

export function ProgressTimeline({ steps }: { steps: WorkflowStep[] }) {
  return <div className="timeline">{steps.map((step) => <div className={`timeline-row timeline-${step.state}`} key={step.id}><span className="timeline-dot">{step.state === 'complete' ? <Check size={12} /> : step.state === 'in-progress' ? <span /> : null}</span><div><strong>{step.title}</strong><small>{step.owner === 'adviser' ? 'Qiniso Ntuli' : step.owner === 'provider' ? 'Product provider' : step.owner === 'client' ? 'You' : 'Royal Square system'}</small></div></div>)}</div>
}

export function MenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = usePortal()
  const t = useTranslation(state.locale)
  const location = useLocation()
  const links = [
    { to: '/', label: t.home, icon: LayoutDashboard },
    { to: '/onboarding', label: t.onboarding, icon: UserCheck },
    { to: '/requests', label: t.requests, icon: Inbox, badge: '2' },
    { to: '/documents', label: t.documents, icon: Files },
    { to: '/documents/suite', label: t.statutorySigningSuite, icon: FilePenLine },
    { to: '/finances', label: t.finances, icon: Wallet },
  ]
  const navigate = useNavigate()
  const header = <div className="drawer-header"><div className="brand-cluster"><Link to="/" className="brand-logo-mark" aria-label="Royal Square home"><img src="/royal-square-logo.png" alt="Royal Square" /></Link><Link to="/" className="brand-titles"><span className="brand-title">Royal Square</span><span className="brand-subtitle">Client Portal</span></Link></div><button className="btn-circle" onClick={onClose} aria-label="Close navigation"><X size={15} /></button></div>
  return <Drawer title="Client Navigation Drawer" open={open} onClose={onClose} side="left" className="nav-drawer-react" header={header}><div className="drawer-nav-section"><span className="drawer-section-label">Navigation</span><nav className="drawer-menu">{links.map(({ to, label, icon: Icon, badge }) => <NavLink key={to} to={to} className={({ isActive }) => `drawer-link ${isActive ? 'active' : ''}`} onClick={onClose}>{({ isActive }) => <><Icon className="drawer-icon" size={17} /><span>{label}</span>{badge && isActive && <><span className="drawer-badge">{badge}</span><span className="drawer-active-pip" /></>}</>}</NavLink>)}</nav></div><div className="drawer-nav-section"><span className="drawer-section-label">Quick Actions</span><div className="drawer-actions-list"><button className="drawer-action-btn" onClick={() => { onClose(); navigate('/onboarding') }}><span className="action-icon-pill"><UserCheck size={14} /></span><span>Client onboarding & FICA</span></button><button className="drawer-action-btn" onClick={() => { onClose(); navigate('/documents/suite') }}><span className="action-icon-pill"><FilePenLine size={14} /></span><span>{t.statutorySigningSuite}</span></button><button className="drawer-action-btn" onClick={() => { onClose(); navigate(location.pathname + '?service=beneficiary_update') }}><span className="action-icon-pill"><UserPlus size={14} /></span><span>Update beneficiary</span></button><button className="drawer-action-btn" onClick={() => { onClose(); navigate(location.pathname + '?service=personal_details_update') }}><span className="action-icon-pill"><IdCard size={14} /></span><span>Update personal details</span></button><button className="drawer-action-btn" onClick={() => { onClose(); navigate('/banking-details') }}><span className="action-icon-pill"><Wallet size={14} /></span><span>Change bank details</span></button><button className="drawer-action-btn" onClick={() => { onClose(); navigate(location.pathname + '?service=address_change') }}><span className="action-icon-pill"><FilePenLine size={14} /></span><span>Change of address</span></button><button className="drawer-action-btn" onClick={() => { onClose(); navigate(location.pathname + '?service=consultation') }}><span className="action-icon-pill"><CalendarPlus size={14} /></span><span>Book a review</span></button><button className="drawer-action-btn" onClick={() => { onClose(); navigate(location.pathname + '?service=consultation') }}><span className="action-icon-pill"><MessagesSquare size={14} /></span><span>Ask my adviser</span></button><button className="drawer-action-btn" onClick={() => { onClose(); navigate(location.pathname + '?service=policy_document') }}><span className="action-icon-pill"><FilePenLine size={14} /></span><span>Request policy document</span></button><button className="drawer-action-btn" onClick={() => { onClose(); navigate(location.pathname + '?service=border_letter') }}><span className="action-icon-pill"><FilePenLine size={14} /></span><span>Request border letter</span></button><button className="drawer-action-btn" onClick={() => { onClose(); navigate(location.pathname + '?service=irp5_request') }}><span className="action-icon-pill"><FilePenLine size={14} /></span><span>Request IRP5</span></button><button className="drawer-action-btn" onClick={() => { onClose(); navigate(location.pathname + '?service=motor_claim_registration') }}><span className="action-icon-pill"><Car size={14} /></span><span>Send accident claim</span></button><button className="drawer-action-btn" onClick={() => { onClose(); navigate(location.pathname + '?service=catalog') }}><span className="action-icon-pill"><Plus size={14} /></span><span>More requests…</span></button></div></div><div className="drawer-footer"><div className="drawer-profile-box"><div className="client-avatar-wrapper"><img src="/latoya-matai.png" alt={state.client.name} className="client-avatar" /><span className="avatar-status-dot" /></div><div className="client-meta"><div className="client-name">{state.client.name}</div><div className="client-role"><span>Private Client</span><span className="tier-badge">PREMIER</span></div></div></div></div></Drawer>
}

export function ClientShell({ children }: { children: ReactNode }) {
  const { state, dispatch } = usePortal()
  const t = useTranslation(state.locale)
  const [menuOpen, setMenuOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [langToast, setLangToast] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const pendingTasks = state.tasks.filter((task) => task.status === 'open' && task.owner === 'client').length
  const currentLang = LANGUAGE_METADATA[state.locale] || LANGUAGE_METADATA['en-ZA']

  useEffect(() => { setMenuOpen(false); setLanguageOpen(false) }, [location.pathname])

  return <div className={`portal-app ${state.simpleMode ? 'simple-mode' : ''}`}>
    <header className="top-header">
      <div className="brand-cluster">
        <button className="btn-circle menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={16} /></button>
        <Link to="/" className="brand-identity" aria-label="Royal Square home"><span className="brand-logo-mark"><img src="/royal-square-logo.png" alt="" /></span><span className="brand-titles"><span className="brand-title">Royal Square</span><span className="brand-subtitle">Client Portal</span></span></Link>
      </div>
      <div className="header-center-search">
        <input aria-label="Search portal" placeholder="Search requests, documents, advice..." onKeyDown={(event) => { if (event.key === 'Enter') navigate(`/requests?q=${encodeURIComponent(event.currentTarget.value)}`) }} />
        <Search className="search-icon" size={15} />
      </div>
      <div className="header-right">
        <button className="btn-circle voice-header-btn" onClick={() => setVoiceOpen(true)} title="Voice Assistant (Zero-Fail)"><Mic size={15} style={{ color: '#e85d3f' }} /></button>
        <button className={`mode-toggle-pill ${state.simpleMode ? 'active' : ''}`} onClick={() => dispatch({ type: 'toggle-simple-mode' })} aria-pressed={state.simpleMode} title="Toggle Simple Mode"><SlidersHorizontal size={13} className="mode-icon" /><span className="mode-label-text">{state.simpleMode ? t.simpleModeOn : t.simpleModeOff}</span><span className="toggle-switch-track"><span className="toggle-switch-thumb" /></span></button>
        <button className="btn-circle notif-btn" aria-label="Notifications" onClick={() => navigate('/tasks')}><Bell size={15} /><span className="notif-dot" /></button>
        <div className="language-control">
          <button className="btn-lang" onClick={() => setLanguageOpen((open) => !open)} aria-expanded={languageOpen} title="Select Language">
            <span>{currentLang.label}</span>
            <ChevronDown size={10} />
          </button>
          {languageOpen && (
            <div className="language-menu">
              {(Object.keys(LANGUAGE_METADATA) as Locale[]).map((loc) => {
                const meta = LANGUAGE_METADATA[loc]
                const isActive = state.locale === loc
                return (
                  <button
                    key={loc}
                    className={`language-menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      dispatch({ type: 'set-locale', locale: loc })
                      setLanguageOpen(false)
                      const nextT = useTranslation(loc)
                      setLangToast(`${nextT.languageSwitched} (${meta.nativeName})`)
                      setTimeout(() => setLangToast(null), 3000)
                    }}
                  >
                    <span className="lang-item-left">
                      <span className="lang-code-pill">{meta.label}</span>
                      <span className="lang-native-text">{meta.nativeName}</span>
                    </span>
                    {isActive && <Check size={12} style={{ color: '#e85d3f' }} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="profile-pill-topright"><div className="client-avatar-wrapper"><img src="/latoya-matai.png" alt={state.client.name} className="client-avatar" /><span className="avatar-status-dot" /></div><div className="client-meta"><div className="client-name">{state.client.name}</div><div className="client-role"><span>{t.privateClient}</span><span className="tier-badge">PREMIER</span></div></div></div>
      </div>
    </header>
    {langToast && (
      <div className="lang-toast-banner" role="status">
        <span className="lang-toast-dot" />
        <span>{langToast}</span>
      </div>
    )}
    <VoiceModeModal isOpen={voiceOpen} onClose={() => setVoiceOpen(false)} onApply={(entities) => { if (entities.monthlySalary || entities.bank || entities.fullName) navigate('/onboarding') }} contextTitle="Royal Square Client Portal" />
    <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    <main className="page-frame">{children}</main>
    <div className="portal-footer"><span>Royal Square Financial · FSP 29370</span><span><span className="online-dot" />{state.accident.online ? 'Saved on this device' : 'Offline · Saved locally'}</span>{pendingTasks > 0 && <button onClick={() => navigate('/tasks')}>{pendingTasks} tasks need you <ChevronRight size={13} /></button>}</div>
  </div>
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: ReactNode; description?: string; action?: ReactNode }) {
  return <div className="page-intro"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-intro-action">{action}</div>}</div>
}

export function RequestCard({ request, onClick }: { request: RequestCase; onClick: () => void }) {
  return <Card className={`request-card request-${request.status}`} onClick={onClick}><div className="request-card-top"><span className="request-code">#{request.id}</span><StatusPill status={request.status} /></div><h3>{request.title}</h3><p>{request.description}</p><div className="request-card-footer"><span>{request.updatedAt}</span><ChevronRight size={16} /></div></Card>
}
