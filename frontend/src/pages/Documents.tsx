import { Download, ExternalLink, FileCheck2, FileText, LockKeyhole, Plus, Upload, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Drawer, PageIntro, StatusPill } from '../components/Shell'
import { usePortal } from '../store'
import type { PortalDocument } from '../types'

const assetBase = '/demo-assets/documents/'

export function Documents() {
  const { state } = usePortal()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<PortalDocument | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  return <>
    <PageIntro eyebrow="Documents, forms & secure vault" title={<>Everything important, <strong>in one place.</strong></>} description="Official documents, verified evidence, and forms that are ready when you need them." action={<Button onClick={() => setUploadOpen(true)}><Upload size={15} />Upload document</Button>} />
    <div className="vault-banner"><div className="soft-icon"><LockKeyhole size={18} /></div><div><strong>Secure document vault</strong><span>Protected by Royal Square Financial · FSP 29370</span></div><span className="vault-encrypted">Encrypted on this device</span></div>
    <section className="document-section"><div className="section-heading"><div><span className="eyebrow">Official Royal Square documents</span><h2>Forms & agreements</h2></div><span>{state.documents.filter((document) => document.category === 'official').length} documents</span></div><div className="document-grid">{state.documents.filter((document) => document.category === 'official').map((document) => <DocumentCard key={document.id} document={document} onClick={() => document.id === 'doc-consent' ? navigate('/forms/client-consent') : setSelected(document)} />)}</div></section>
    <section className="document-section"><div className="section-heading"><div><span className="eyebrow">Your evidence & records</span><h2>Recent documents</h2></div><span>{state.documents.filter((document) => document.category !== 'official').length} documents</span></div><div className="document-grid">{state.documents.filter((document) => document.category !== 'official').map((document) => <DocumentCard key={document.id} document={document} onClick={() => setSelected(document)} />)}</div></section>
    <Drawer title={selected?.title ?? 'Document details'} open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <div className="detail-content"><div className="document-preview-icon"><FileCheck2 size={27} /></div><span className="eyebrow">{selected.category === 'official' ? 'Official document' : 'Secure record'}</span><h3>{selected.title}</h3><p>{selected.subtitle}</p><div className="detail-row"><span>Status</span><StatusPill status={selected.status} /></div><div className="detail-row"><span>Date</span><strong>{selected.date}</strong></div>{selected.fileName && <a className="button button-outline full-width" href={`${assetBase}${encodeURIComponent(selected.fileName)}`} download><Download size={15} />Download original file</a>}{selected.requestId === 'BD-2048' && <button className="text-link" onClick={() => navigate('/banking-details')}>Open banking request <ExternalLink size={14} /></button>}</div>}</Drawer>
    <Drawer title="Upload document" open={uploadOpen} onClose={() => setUploadOpen(false)}><div className="upload-panel"><div className="upload-dropzone"><Upload size={22} /><strong>Choose a document</strong><span>PDF, JPG, PNG or Office file · Max 15MB</span><input type="file" aria-label="Choose document" onChange={() => setUploadOpen(false)} /></div><p className="fine-print">This is a demo upload. The selected file remains on this device only.</p></div></Drawer>
  </>
}

function DocumentCard({ document, onClick }: { document: PortalDocument; onClick: () => void }) {
  return <Card className="document-card" onClick={onClick}><div className="document-card-top"><span className={`document-icon document-${document.category}`}><FileText size={18} /></span><StatusPill status={document.status} /></div><h3>{document.title}</h3><p>{document.subtitle}</p><div className="document-card-footer"><span>{document.date}</span><span>{document.action ?? 'Open'} <ExternalLink size={13} /></span></div></Card>
}
