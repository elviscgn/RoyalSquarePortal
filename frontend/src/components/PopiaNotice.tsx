import { useState } from 'react'
import { Drawer } from './Shell'

export function PopiaInline() {
  return (
    <p className="fine-print popia-inline">
      Protected under POPIA. We only use your information to serve you, never sell it, and you may
      ask for access or correction at any time via Qiniso Ntuli (qiniso@royal-square.com).
    </p>
  )
}

export function PopiaDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer title="POPIA & privacy" open={open} onClose={onClose}>
      <div className="detail-content">
        <span className="eyebrow">Protection of Personal Information Act</span>
        <h3>Your information stays yours.</h3>
        <p>
          Royal Square Financial (FSP 29370) processes your personal information only to provide
          financial advice and administration, as consented in your Client Consent and
          Confidentiality Agreement.
        </p>
        <div className="detail-block">
          <span className="eyebrow">What we collect</span>
          <p>Identity, contact, financial, and claim details you provide or consent for us to obtain.</p>
        </div>
        <div className="detail-block">
          <span className="eyebrow">Why</span>
          <p>Advice, product administration, claims, reminders, and FICA/FAIS compliance. Nothing else.</p>
        </div>
        <div className="detail-block">
          <span className="eyebrow">Your rights</span>
          <p>Access, correction, deletion where lawful, and withdrawal of consent. Contact Qiniso Ntuli on 011 492 1566 or qiniso@royal-square.com.</p>
        </div>
        <p className="fine-print">Demo build: all data stays in your browser (localStorage) unless you submit to your adviser.</p>
      </div>
    </Drawer>
  )
}

export function PopiaBadge() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="popia-badge" onClick={() => setOpen(true)} aria-label="Open POPIA and privacy notice">
        POPIA
      </button>
      <PopiaDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
