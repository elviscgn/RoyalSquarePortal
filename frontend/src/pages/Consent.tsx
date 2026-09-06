import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, Eraser, Printer, ShieldCheck, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '../components/Shell'
import { usePortal } from '../store'

export function Consent() {
  const { state, dispatch } = usePortal()
  const navigate = useNavigate()
  const [reviewed, setReviewed] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [signature, setSignature] = useState('')
  const [signed, setSigned] = useState(Boolean(state.formSubmissions.find((form) => form.formType === 'client-consent')))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')!
    context.lineWidth = 2
    context.lineCap = 'round'
    context.strokeStyle = '#201c19'
    const point = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top } }
    const start = (event: PointerEvent) => { drawing.current = true; const p = point(event); context.beginPath(); context.moveTo(p.x, p.y) }
    const move = (event: PointerEvent) => { if (!drawing.current) return; const p = point(event); context.lineTo(p.x, p.y); context.stroke(); setSignature('drawn') }
    const stop = () => { drawing.current = false }
    canvas.addEventListener('pointerdown', start); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointerleave', stop)
    return () => { canvas.removeEventListener('pointerdown', start); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', stop); canvas.removeEventListener('pointerleave', stop) }
  }, [])

  const clearSignature = () => { const canvas = canvasRef.current; canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height); setSignature('') }
  const submit = () => { if (!reviewed || !confirmed || !signature) return; dispatch({ type: 'sign-consent', signature }); setSigned(true) }
  return <div className="focused-flow"><div className="focused-topbar"><button className="back-link" onClick={() => navigate('/documents')}><ArrowLeft size={15} />Back to Documents</button><span className="focused-form-name">Client Consent to Obtain Information</span><span className="focused-security"><ShieldCheck size={14} />Saved on this device</span></div>{signed ? <Card className="success-screen"><span className="success-check"><Check size={28} /></span><span className="eyebrow">Signed and recorded</span><h1>Consent successfully signed.</h1><p>Your signed consent is now available in Documents. No provider has been contacted by this demo.</p><div className="success-actions"><Button onClick={() => navigate('/documents')}>Back to Documents</Button><Button variant="outline" onClick={() => window.print()}><Printer size={15} />Print / Save as PDF</Button></div></Card> : <div className="consent-layout"><article className="official-paper" id="official-consent"><div className="paper-header"><div><strong>ROYAL SQUARE FINANCIAL</strong><span>1401 The Franklin · 4 Pritchard Street · Newtown – 2001</span><span>011 492 1566 · qiniso@royal-square.com</span></div><span className="paper-stamp">FSP 29370</span></div><h1>CLIENT CONSENT TO OBTAIN INFORMATION</h1><p>I, <mark>{state.client.name}</mark> with the following Identity Number <mark>{state.client.idNumber}</mark>, in my personal capacity acknowledge the following:</p><ol><li>Sound and proper financial advice can only be provided with full disclosure of relevant personal information to determine and advise on my financial situation, product experience, and objectives.</li><li>My interests shall be best served if that information is made available to Royal Square Financial with a legitimate interest in receiving it for those purposes.</li><li>I grant permission for a minimum ongoing period of 12 months from the date of signature to Qiniso Ntuli of Royal Square Financial (Pty) Ltd to obtain relevant information through appropriate provider channels.</li><li>I consent to relevant financial institutions releasing information to Royal Square Financial for the purposes stated above.</li><li>This consent remains effective until cancelled by me in writing.</li></ol><div className="paper-signature"><div><span>Client signature</span>{signature && <strong className="signature-display">{signature === 'drawn' ? 'Signed electronically' : signature}</strong>}</div><div><span>Date</span><strong>{new Date().toLocaleDateString('en-ZA')}</strong></div></div><div className="paper-footer">Royal Square Financial (Pty) Ltd · FSP No. 29370 · Informational consent only</div></article><aside className="guided-panel"><span className="eyebrow">Step 1 of 3 · Guided completion</span><h2>Review, confirm, and sign.</h2><p>Your verified details are already here. Check the official wording before signing.</p><label className="check-row"><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} /><span><strong>I have reviewed the official consent</strong><small>I understand what information may be requested and why.</small></span></label><label className="check-row"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span><strong>I confirm my details are correct</strong><small>{state.client.name} · {state.client.idNumber}</small></span></label><div className="signature-heading"><span><strong>Your signature</strong><small>Draw below or use your name as a fallback.</small></span><button className="text-link" onClick={clearSignature}><Eraser size={13} />Clear</button></div><canvas className="signature-canvas" ref={canvasRef} width={560} height={150} aria-label="Draw your signature" /><input className="clean-input" placeholder="Or type your full name" onChange={(event) => setSignature(event.target.value)} value={signature === 'drawn' ? '' : signature} /><Button onClick={submit} disabled={!reviewed || !confirmed || !signature}>Finalise consent <Check size={15} /></Button><p className="fine-print">This demo records your confirmation locally. It does not represent unsupported legal enforceability.</p></aside></div>}</div>
}
