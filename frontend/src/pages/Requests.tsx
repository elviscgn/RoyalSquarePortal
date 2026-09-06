import { useMemo, useState } from 'react'
import { ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Card, Drawer, PageIntro, ProgressTimeline, RequestCard, StatusPill } from '../components/Shell'
import { usePortal } from '../store'
import type { RequestCase } from '../types'

export function Requests() {
  const { state } = usePortal()
  const [params] = useSearchParams()
  const [filter, setFilter] = useState<'all' | 'needs-me' | 'in-progress' | 'completed'>('all')
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [selected, setSelected] = useState<RequestCase | null>(null)
  const visible = useMemo(() => state.requests.filter((request) => {
    const filterMatch = filter === 'all' || filter === 'needs-me' && request.status === 'waiting-client' || filter === 'in-progress' && request.status !== 'complete' && request.status !== 'waiting-client' || filter === 'completed' && request.status === 'complete'
    const term = search.toLowerCase()
    return filterMatch && (!term || `${request.title} ${request.id} ${request.description}`.toLowerCase().includes(term))
  }), [filter, search, state.requests])
  return <>
    <PageIntro eyebrow="Requests & case tracking" title={<>Everything you’re <strong>waiting on.</strong></>} description="Follow each request from submission to completion, with a clear view of who has the ball." action={<div className="case-summary"><strong>{state.requests.filter((request) => request.status !== 'complete').length}</strong><span>active requests</span></div>} />
    <div className="filter-bar"><div className="filter-pills">{(['all', 'needs-me', 'in-progress', 'completed'] as const).map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item === 'all' ? 'All requests' : item === 'needs-me' ? 'Needs your action' : item === 'in-progress' ? 'In progress' : 'Completed'}</button>)}</div><label className="search-field"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search requests..." /></label><button className="icon-button subtle" aria-label="Filter"><SlidersHorizontal size={16} /></button></div>
    {visible.length === 0 ? <Card className="empty-state"><span className="soft-icon"><Search size={18} /></span><h3>No requests found</h3><p>Try another search or reset the filter.</p><button className="text-link" onClick={() => { setSearch(''); setFilter('all') }}>Show all requests</button></Card> : <section className="requests-grid">{visible.map((request) => <RequestCard key={request.id} request={request} onClick={() => setSelected(request)} />)}</section>}
    <Drawer title={selected?.title ?? 'Request details'} open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <div className="detail-content"><div className="detail-meta"><span className="request-code">#{selected.id}</span><StatusPill status={selected.status} /></div><p>{selected.description}</p><div className="detail-block"><span className="eyebrow">Who has the ball?</span><h3>{selected.status === 'waiting-client' ? 'You' : selected.status === 'waiting-adviser' ? 'Qiniso' : selected.status === 'waiting-provider' ? 'Product provider' : selected.status === 'complete' ? 'Complete' : 'Royal Square system'}</h3><small>We will keep the activity history here as the request moves forward.</small></div><ProgressTimeline steps={selected.steps} />{selected.id === 'BD-2048' && <button className="text-link" onClick={() => window.location.assign('/banking-details')}>Continue banking details <ChevronIcon /></button>}{selected.id === 'RSF-2841' && <button className="text-link" onClick={() => window.location.assign('/accident')}>Open Accident Mode <ChevronIcon /></button>}<div className="audit-list"><span className="eyebrow">Recent activity</span>{state.auditEvents.filter((event) => event.requestId === selected.id).slice(-4).reverse().map((event) => <div key={event.id}><strong>{event.description}</strong><small>{new Date(event.timestamp).toLocaleString('en-ZA')}</small></div>)}</div></div>}</Drawer>
  </>
}

function ChevronIcon() { return <ArrowUpRight size={14} /> }
