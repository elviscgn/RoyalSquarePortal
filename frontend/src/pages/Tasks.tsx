import { BellRing, CalendarClock, Check, CircleCheck, Clock3, FileCheck2, Flag, Repeat2 } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, Drawer, PageIntro, StatusPill } from '../components/Shell'
import { usePortal } from '../store'
import { useTranslation } from '../i18n/translations'
import type { Task } from '../types'

export function Tasks() {
  const { state, dispatch } = usePortal()
  const t = useTranslation(state.locale)
  const [selected, setSelected] = useState<Task | null>(null)
  const open = state.tasks.filter((task) => task.status === 'open')
  const reminders = open.filter((task) => task.owner !== 'client')
  return <>
    <PageIntro eyebrow={t.tasks} title={t.tasksTitle} description={t.tasksDesc} action={<div className="case-summary"><strong>{state.tasks.filter((task) => task.status === 'open' && task.owner === 'client').length}</strong><span>your actions</span></div>} />
    <div className="task-sections"><section><div className="section-heading"><div><span className="eyebrow">{t.tasks}</span><h2>{t.thingsToComplete}</h2></div><span>{open.filter((task) => task.owner === 'client').length} open</span></div><div className="task-list">{state.tasks.filter((task) => task.owner === 'client').map((task) => <TaskCard key={task.id} task={task} onOpen={() => setSelected(task)} onComplete={() => dispatch({ type: 'complete-task', id: task.id })} />)}</div></section><section><div className="section-heading"><div><span className="eyebrow">Reminders</span><h2>{t.activeReminders}</h2></div><span>{reminders.length} active</span></div><div className="reminder-grid">{reminders.map((task) => <Card key={task.id} className="reminder-card"><span className="soft-icon"><BellRing size={17} /></span><span className="eyebrow">{task.owner === 'adviser' ? 'Adviser reminder' : 'Automatic reminder'}</span><h3>{task.title}</h3><p>{task.description}</p><div className="reminder-meta"><span><Repeat2 size={13} />{task.recurring ?? 'Scheduled'}</span><span><CalendarClock size={13} />{task.due}</span></div></Card>)}</div></section></div>
    <Drawer title={selected?.title ?? 'Task details'} open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <div className="detail-content"><StatusPill status={selected.status} /><h3>{selected.title}</h3><p>{selected.description}</p><div className="detail-row"><span>Owner</span><strong>{selected.owner === 'client' ? 'You' : selected.owner === 'adviser' ? 'Qiniso' : 'Royal Square system'}</strong></div><div className="detail-row"><span>Due</span><strong>{selected.due}</strong></div>{selected.status === 'open' && selected.owner === 'client' && <Button onClick={() => { dispatch({ type: 'complete-task', id: selected.id }); setSelected(null) }}><Check size={15} />{t.markComplete}</Button>}</div>}</Drawer>
  </>
}

function TaskCard({ task, onOpen, onComplete }: { task: Task; onOpen: () => void; onComplete: () => void }) { return <Card className={`task-card ${task.status === 'complete' ? 'task-complete' : ''}`}><button className="task-card-main" onClick={onOpen}><span className="task-icon">{task.status === 'complete' ? <CircleCheck size={18} /> : task.id.includes('police') ? <Flag size={18} /> : task.id.includes('consent') ? <FileCheck2 size={18} /> : <Clock3 size={18} />}</span><span><strong>{task.title}</strong><p>{task.description}</p><small>{task.due}</small></span><StatusPill status={task.status} /></button>{task.status === 'open' && <button className="task-complete-button" onClick={onComplete} aria-label={`Complete ${task.title}`}><Check size={15} /></button>}</Card> }
