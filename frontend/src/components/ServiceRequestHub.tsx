import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowUpRight, Car, Check, FileText, Home, IdCard, Landmark,
  MailWarning, MessagesSquare, PiggyBank, ScrollText, Send, UserPlus,
} from 'lucide-react'
import { Button, Drawer } from './Shell'
import { PopiaInline, PopiaDrawer } from './PopiaNotice'
import { serviceCatalog, serviceByKind } from '../data/serviceCatalog'
import { usePortal } from '../store'
import type { RequestType } from '../types'

const serviceIcons: Record<string, typeof Car> = {
  motor_claim_registration: Car,
  address_change: Home,
  policy_document: ScrollText,
  border_letter: MailWarning,
  irp5_request: Landmark,
  consultation: MessagesSquare,
  info_collection: IdCard,
  balance_sheet: PiggyBank,
  income_statement: FileText,
  beneficiary_update: UserPlus,
  personal_details_update: IdCard,
}

export function ServiceRequestHub() {
  const { state, dispatch } = usePortal()
  const [params, setParams] = useSearchParams()
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [activeKind, setActiveKind] = useState<RequestType | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [done, setDone] = useState<string | null>(null)
  const [popiaOpen, setPopiaOpen] = useState(false)

  const requested = params.get('service') as string | null
  useEffect(() => {
    if (requested === 'catalog') {
      setCatalogOpen(true)
      setActiveKind(null)
      setDone(null)
      return
    }
    if (requested && serviceByKind(requested as RequestType)) {
      setActiveKind(requested as RequestType)
      setCatalogOpen(false)
      setDone(null)
      setValues({})
    }
  }, [requested])

  const closeAll = () => {
    setCatalogOpen(false)
    setActiveKind(null)
    setDone(null)
    setValues({})
    if (params.get('service')) {
      const next = new URLSearchParams(params)
      next.delete('service')
      setParams(next, { replace: true })
    }
  }

  const active = activeKind ? serviceByKind(activeKind) : null
  const claim = useMemo(() => state.requests.find((r) => r.id === 'RSF-2841'), [state.requests])
  const requiredComplete = active?.fields.filter((field) => field.required).every((field) => (values[field.name] ?? '').trim().length > 0) ?? false
  const claimDestination = values.insurer && values.insurer !== 'Other' ? values.insurer : 'the insurer'

  const set = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }))

  const submit = () => {
    if (!active) return
    const requiredOk = active.fields.filter((f) => f.required).every((f) => (values[f.name] ?? '').trim().length > 0)
    if (!requiredOk) return
    if (active.kind === 'motor_claim_registration') {
      dispatch({ type: 'register-claim', policeCaseNumber: values.policeCaseNumber || undefined })
      setDone(`Claim RSF-2841 sent to ${claimDestination}. Reference RSF-MOCK-2841.`)
      return
    }
    const detailParts = active.fields.map((f) => values[f.name] ? `${f.label}: ${values[f.name]}` : '').filter(Boolean)
    dispatch({
      type: 'create-service-request',
      kind: active.kind,
      title: active.title,
      detail: detailParts.join(' · ') || active.description,
      newAddress: active.kind === 'address_change' ? values.newAddress : undefined,
    })
    setDone(active.success)
  }

  return (
    <>
      <Drawer title="Start a request" open={catalogOpen} onClose={closeAll}>
        <div className="detail-content">
          <p>Lightweight mock starters. Each one creates a tracked request, notifies Qiniso, and writes an audit event.</p>
          {claim && (
            <div className="detail-block claim-ready-card">
              <span className="claim-ready-icon"><Car size={19} /></span>
              <span className="eyebrow">Accident report #{claim.id}</span>
              <h3>Your accident report is ready to send</h3>
              <small>Review the saved evidence, choose the insurer, and send it to Qiniso for submission.</small>
              <Button onClick={() => { setCatalogOpen(false); setActiveKind('motor_claim_registration'); setValues({}) }}>
                Review &amp; send claim <ArrowUpRight size={14} />
              </Button>
            </div>
          )}
          <div className="service-grid">
            {serviceCatalog.filter((s) => s.kind !== 'motor_claim_registration').map((s) => {
              const Icon = serviceIcons[s.kind] ?? FileText
              return (
                <button key={s.kind} className="service-choice" onClick={() => { setCatalogOpen(false); setActiveKind(s.kind); setValues({}); setDone(null) }}>
                  <span className="service-icon"><Icon size={16} /></span>
                  <span className="service-text"><strong>{s.title}</strong><small>{s.description}</small></span>
                  <ArrowUpRight size={15} className="service-go" />
                </button>
              )
            })}
          </div>
          <PopiaInline />
        </div>
      </Drawer>

      <Drawer title={active?.title ?? 'Request'} open={Boolean(active)} onClose={closeAll}>
        {active && !done && (
          <div className="detail-content">
            <button className="back-link" onClick={() => { setActiveKind(null); setCatalogOpen(true) }}>
              <ArrowLeft size={14} /> All requests
            </button>
            <p>{active.description}</p>
            {active.kind === 'motor_claim_registration' && claim && (
              <div className="detail-block">
                <span className="eyebrow">Linked case</span>
                <h3>#RSF-2841 · {claim.title}</h3>
                <small>{claim.description}</small>
              </div>
            )}
            {active.fields.map((field) => (
              <label className="form-field" key={field.name}>
                <span>{field.label}{field.required ? ' *' : ''}</span>
                {field.type === 'textarea' ? (
                  <textarea className="clean-input" placeholder={field.placeholder} value={values[field.name] ?? ''} onChange={(e) => set(field.name, e.target.value)} />
                ) : field.type === 'select' ? (
                  <select className="clean-input" value={values[field.name] ?? ''} onChange={(e) => set(field.name, e.target.value)}>
                    <option value="">Select…</option>
                    {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : field.type === 'file' ? (
                  <input className="clean-input" type="file" onChange={(e) => set(field.name, e.target.files?.[0]?.name ?? 'uploaded-file')} />
                ) : (
                  <input className="clean-input" type={field.type} placeholder={field.placeholder} value={values[field.name] ?? ''} onChange={(e) => set(field.name, e.target.value)} />
                )}
                {field.help && <small className="field-help">{field.help}</small>}
              </label>
            ))}
            {active.kind === 'address_change' && (
              <div className="detail-block">
                <span className="eyebrow">Current address on file</span>
                <p>{state.client.address}</p>
              </div>
            )}
            {active.kind === 'motor_claim_registration' && (
              <div className={`claim-action-summary ${requiredComplete ? 'ready' : ''}`}>
                <span className="claim-action-icon"><Send size={16} /></span>
                <span>
                  <strong>{requiredComplete ? `Ready to send to ${claimDestination}` : 'Choose an insurer to continue'}</strong>
                  <small>Your Accident Mode evidence will be attached automatically, and Qiniso will be notified.</small>
                </span>
              </div>
            )}
            <Button onClick={submit} disabled={!requiredComplete}>
              {active.kind === 'motor_claim_registration'
                ? requiredComplete ? `Send claim to ${claimDestination}` : 'Select an insurer first'
                : active.cta}
              {active.kind === 'motor_claim_registration' && requiredComplete && <ArrowUpRight size={14} />}
            </Button>
            <PopiaInline />
            <button className="text-link" onClick={() => setPopiaOpen(true)}>Read our POPIA notice</button>
          </div>
        )}
        {active && done && (
          <div className="detail-content">
            <span className="success-check"><Check size={26} /></span>
            <span className="eyebrow">{active.kind === 'motor_claim_registration' ? 'Claim sent' : 'Sent to Qiniso'}</span>
            <h3>{done}</h3>
            <p>Track it under Requests. The provider reference is mocked as RSF-MOCK for this demo.</p>
            <Button onClick={closeAll}>Done</Button>
          </div>
        )}
      </Drawer>
      <PopiaDrawer open={popiaOpen} onClose={() => setPopiaOpen(false)} />
    </>
  )
}
