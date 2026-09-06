import { ArrowUpRight, Landmark, PiggyBank, ShieldCheck, TrendingUp, Wallet, Mic, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Card, Drawer, PageIntro, formatMoney } from '../components/Shell'
import { usePortal } from '../store'
import { useTranslation } from '../i18n/translations'
import type { Goal } from '../types'
import { VoiceModeModal } from '../components/VoiceModeModal'
import type { ExtractedEntities } from '../voice/entityExtractor'

export function Finances() {
  const { state, dispatch } = usePortal()
  const t = useTranslation(state.locale)
  const [selected, setSelected] = useState<Goal | null>(null)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [voiceToast, setVoiceToast] = useState<string | null>(null)
  const [pulseActive, setPulseActive] = useState(false)

  const handleVoiceApply = (entities: ExtractedEntities) => {
    const patch: any = {}
    if (entities.assetsAmount !== undefined) patch.assets = entities.assetsAmount
    if (entities.liabilitiesAmount !== undefined) patch.liabilities = entities.liabilitiesAmount
    if (Object.keys(patch).length > 0) {
      dispatch({ type: 'update-finances', patch })
      setPulseActive(true)
      setTimeout(() => setPulseActive(false), 3500)
      setVoiceToast(`Voice calibrated: Net Worth updated to ${formatMoney((patch.assets ?? state.finances.assets) - (patch.liabilities ?? state.finances.liabilities))}`)
      setTimeout(() => setVoiceToast(null), 4500)
    }
  }

  return <>
    <PageIntro
      eyebrow={t.currentPosition}
      title={t.wealthHorizon}
      description={t.financesIntroDesc}
      action={
        <button
          type="button"
          onClick={() => setVoiceOpen(true)}
          style={{
            background: '#ffffff',
            border: '1.5px solid #e85d3f',
            color: '#e85d3f',
            borderRadius: 999,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(232, 93, 63, 0.12)'
          }}
        >
          <Mic size={14} />
          <span>{t.voiceRecalibrate}</span>
        </button>
      }
    />
    <section className="finance-grid">
      <Card className={`position-card ${pulseActive ? 'voice-pulse-field' : ''}`}>
        <div className="card-heading">
          <div>
            <span className="eyebrow">{t.currentPosition}</span>
            <h2>{t.netWorth}</h2>
          </div>
          <span className="soft-icon"><TrendingUp size={18} /></span>
        </div>
        <strong className="money-huge">{formatMoney(state.finances.netWorth)}</strong>
        <p>{t.netWorthDesc}</p>
        <div className="position-split">
          <span><small>{t.assets}</small><strong>{formatMoney(state.finances.assets)}</strong></span>
          <span><small>{t.liabilities}</small><strong>{formatMoney(state.finances.liabilities)}</strong></span>
        </div>
      </Card>
      <Card className="finance-breakdown">
        <span className="eyebrow">What makes it up</span>
        <h3>Your position at a glance</h3>
        <Breakdown icon={<TrendingUp size={16} />} label={t.investments} value={state.finances.investments} total={state.finances.assets} />
        <Breakdown icon={<PiggyBank size={16} />} label={t.retirement} value={state.finances.retirement} total={state.finances.assets} />
        <Breakdown icon={<ShieldCheck size={16} />} label={t.protection} value={state.finances.protection} total={state.finances.protection} />
      </Card>
    </section>
    <section className="document-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Adviser-loaded goals</span>
          <h2>{t.goalsTitle}</h2>
        </div>
        <button className="text-link">{t.addGoal} <ArrowUpRight size={14} /></button>
      </div>
      <div className="goals-grid">
        {state.goals.map((goal) => <GoalCard key={goal.id} goal={goal} onClick={() => setSelected(goal)} />)}
      </div>
    </section>
    <Card className="privacy-note">
      <ShieldCheck size={17} />
      <span>{t.sharedGoalsPrivate}</span>
    </Card>
    <Drawer title={selected?.title ?? 'Goal details'} open={Boolean(selected)} onClose={() => setSelected(null)}>
      {selected && (
        <div className="detail-content">
          <span className="goal-label">{selected.type === 'shared' ? 'Shared goal' : 'Individual goal'}</span>
          <h3>{selected.title}</h3>
          <div className="goal-detail-amount">
            <strong>{formatMoney(selected.currentAmount)}</strong>
            <span>of {formatMoney(selected.targetAmount)}</span>
          </div>
          <div className="progress-track large">
            <i style={{ width: `${Math.min(100, selected.currentAmount / selected.targetAmount * 100)}%` }} />
          </div>
          <div className="detail-row">
            <span>Target date</span>
            <strong>{selected.targetDate}</strong>
          </div>
          <div className="detail-row">
            <span>Status</span>
            <strong>{selected.status === 'complete' ? 'Complete' : 'On track'}</strong>
          </div>
          {selected.adviserNote && (
            <div className="detail-block">
              <span className="eyebrow">Qiniso’s note</span>
              <p>{selected.adviserNote}</p>
            </div>
          )}
        </div>
      )}
    </Drawer>

    {voiceToast && (
      <div className="voice-toast-banner">
        <Sparkles size={16} />
        <span>{voiceToast}</span>
      </div>
    )}

    <VoiceModeModal
      isOpen={voiceOpen}
      onClose={() => setVoiceOpen(false)}
      onApply={handleVoiceApply}
      contextTitle="Wealth Position & Balance Sheet Calibration"
    />
  </>
}

function Breakdown({ icon, label, value, total }: { icon: ReactNode; label: string; value: number; total: number }) { return <div className="breakdown-row"><span className="breakdown-icon">{icon}</span><span><strong>{label}</strong><small>{formatMoney(value)}</small></span><div className="progress-track"><i style={{ width: `${Math.min(100, value / total * 100)}%` }} /></div></div> }
function GoalCard({ goal, onClick }: { goal: Goal; onClick: () => void }) { const progress = Math.min(100, goal.currentAmount / goal.targetAmount * 100); return <Card className="goal-card" onClick={onClick}><div className="goal-card-top"><span className="goal-label">{goal.type === 'shared' ? 'Shared goal' : 'Individual goal'}</span><span className={goal.status === 'complete' ? 'success-text' : ''}>{goal.status === 'complete' ? 'Complete' : 'On track'}</span></div><h3>{goal.title}</h3><div className="goal-card-value"><strong>{formatMoney(goal.currentAmount)}</strong><span>of {formatMoney(goal.targetAmount)}</span></div><div className="progress-track large"><i style={{ width: `${progress}%` }} /></div><div className="goal-card-footer"><span>{Math.round(progress)}% · {goal.targetDate}</span><ArrowUpRight size={15} /></div></Card> }
