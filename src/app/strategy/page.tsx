'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  type WorkspaceData, type FoundationData, type MarketDesignData, type ICPData,
  type SignalsData, type SignalType, type MessagingData, type MessagingRow,
  type SequencesData, type SequenceStep, type LaunchPlanData, type WeeklyTarget,
  type SegmentItem, type Persona, type Pain,
  defaultWorkspaceData,
} from '@/lib/workspace-types'

const CLIENT_NAME = 'Shikenso'
const defaultData = defaultWorkspaceData

// ─── Phase config ─────────────────────────────────────────────────────────────

const PHASES = [
  { id: 'foundation'    as const, label: 'Foundation',    sub: 'Weeks 1–2' },
  { id: 'market_design' as const, label: 'Market Design', sub: 'Weeks 2–3' },
  { id: 'signals'       as const, label: 'Signals',       sub: 'Week 3'    },
  { id: 'messaging'     as const, label: 'Messaging',     sub: 'Weeks 3–4' },
  { id: 'sequences'     as const, label: 'Sequences',     sub: 'Week 4'    },
  { id: 'launch_plan'   as const, label: 'Launch Plan',   sub: 'Weeks 5–6' },
]

type PhaseId = typeof PHASES[number]['id']

function isStarted(data: WorkspaceData, id: PhaseId): boolean {
  switch (id) {
    case 'foundation':    return Object.values(data.foundation).some(v => v.trim().length > 0)
    case 'market_design': return Object.values(data.market_design.icp).some(v => (v ?? '').trim().length > 0)
                            || data.market_design.segments.length > 0
                            || data.market_design.personas.length > 0
    case 'signals':       return data.signals.signal_types.length > 0 || data.signals.qualification_criteria.trim().length > 0
    case 'messaging':     return data.messaging.matrix.length > 0
    case 'sequences':     return data.sequences.steps.length > 0
    case 'launch_plan':   return data.launch_plan.weekly_targets.length > 0 || data.launch_plan.success_metrics.trim().length > 0
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StrategyPage() {
  const [data, setData] = useState<WorkspaceData>(defaultData)
  const [activePhase, setActivePhase] = useState<PhaseId>('foundation')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    supabase
      .from('client_workspaces')
      .select('data')
      .eq('client_name', CLIENT_NAME)
      .single()
      .then(({ data: row }) => {
        if (row?.data) setData({ ...defaultData, ...(row.data as WorkspaceData) })
        setLoaded(true)
      })
  }, [])

  const scheduleSave = useCallback((next: WorkspaceData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      await supabase
        .from('client_workspaces')
        .upsert({ client_name: CLIENT_NAME, data: next }, { onConflict: 'client_name' })
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(s => s === 'saved' ? 'idle' : s), 2000)
    }, 1500)
  }, [])

  const updatePhase = useCallback(<K extends keyof WorkspaceData>(phase: K, phaseData: WorkspaceData[K]) => {
    setData(prev => {
      const next = { ...prev, [phase]: phaseData }
      scheduleSave(next)
      return next
    })
  }, [scheduleSave])

  if (!loaded) return <p className="text-sm text-gray-400">Loading...</p>

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Strategy Workspace</h1>
          <p className="text-sm text-gray-400 mt-0.5">{CLIENT_NAME} — outbound system design</p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-400">
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : ''}
          </span>
          <Link href="/strategy/brief" className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
            View Brief →
          </Link>
        </div>
      </div>

      {/* Phase tabs */}
      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-1">
        {PHASES.map((phase, i) => {
          const started = isStarted(data, phase.id)
          const active = activePhase === phase.id
          return (
            <button
              key={phase.id}
              onClick={() => setActivePhase(phase.id)}
              className={`flex items-center gap-2 text-sm px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
                active
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold shrink-0 ${
                active ? 'bg-white/20 text-white' : started ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
              }`}>{i + 1}</span>
              <span>{phase.label}</span>
              <span className={`text-xs ${active ? 'text-white/50' : 'text-gray-300'}`}>{phase.sub}</span>
            </button>
          )
        })}
      </div>

      {/* Phase content */}
      {activePhase === 'foundation'    && <FoundationPhase    data={data.foundation}    onChange={d => updatePhase('foundation',    d)} />}
      {activePhase === 'market_design' && <MarketDesignPhase  data={data.market_design} onChange={d => updatePhase('market_design', d)} />}
      {activePhase === 'signals'       && <SignalsPhase       data={data.signals}       onChange={d => updatePhase('signals',       d)} />}
      {activePhase === 'messaging'     && <MessagingPhase     data={data.messaging}     onChange={d => updatePhase('messaging',     d)} />}
      {activePhase === 'sequences'     && <SequencesPhase     data={data.sequences}     onChange={d => updatePhase('sequences',     d)} />}
      {activePhase === 'launch_plan'   && <LaunchPlanPhase    data={data.launch_plan}   onChange={d => updatePhase('launch_plan',   d)} />}
    </div>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Field({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-0.5">{label}</label>
      {desc && <p className="text-xs text-gray-400 mb-2">{desc}</p>}
      {children}
    </div>
  )
}

const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white'
const textareaCls = inputCls + ' resize-none'
const innerInputCls = 'w-full text-sm border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-200 bg-gray-50'

// ─── Foundation ───────────────────────────────────────────────────────────────

const FOUNDATION_SECTIONS: { key: keyof FoundationData; label: string; desc: string }[] = [
  { key: 'product_knowledge', label: 'Product Knowledge',   desc: 'What Shikenso does, problems it solves, proof points and differentiators.' },
  { key: 'inbound_analysis',  label: 'Inbound Analysis',    desc: 'Who\'s already buying. Why they chose Shikenso. What they say on calls.' },
  { key: 'buyer_language',    label: 'Buyer Language',      desc: 'Exact words prospects use. This becomes your messaging raw material.' },
  { key: 'case_studies',      label: 'Case Studies & Wins', desc: 'Happiest customers. What made them succeed. Numbers where possible.' },
]

function FoundationPhase({ data, onChange }: { data: FoundationData; onChange: (d: FoundationData) => void }) {
  return (
    <div>
      <p className="text-sm text-gray-400 mb-6">Know the product before you sell it. These notes become the raw input for everything that follows.</p>
      <div className="space-y-6">
        {FOUNDATION_SECTIONS.map(sec => (
          <Field key={sec.key} label={sec.label} desc={sec.desc}>
            <textarea
              value={data[sec.key]}
              onChange={e => onChange({ ...data, [sec.key]: e.target.value })}
              rows={5}
              className={textareaCls}
              placeholder={`Start writing your ${sec.label.toLowerCase()}...`}
            />
          </Field>
        ))}
      </div>
    </div>
  )
}

// ─── Market Design ────────────────────────────────────────────────────────────

function MarketDesignPhase({ data, onChange }: { data: MarketDesignData; onChange: (d: MarketDesignData) => void }) {
  const [section, setSection] = useState<'icp' | 'segments' | 'personas'>('icp')

  return (
    <div>
      <p className="text-sm text-gray-400 mb-5">Define exactly who you&apos;re going after and why. Start with one segment, not three.</p>

      <div className="flex gap-1 mb-6 border-b border-gray-100 pb-3">
        {(['icp', 'segments', 'personas'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
              section === s ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'icp' ? 'ICP' : s === 'segments' ? 'Segments' : 'Personas & Pains'}
          </button>
        ))}
      </div>

      {section === 'icp'      && <ICPSection      data={data.icp}      onChange={icp      => onChange({ ...data, icp })} />}
      {section === 'segments' && <SegmentsSection data={data.segments} onChange={segments => onChange({ ...data, segments })} />}
      {section === 'personas' && <PersonasSection data={data.personas} segments={data.segments} onChange={personas => onChange({ ...data, personas })} />}
    </div>
  )
}

function ICPSection({ data, onChange }: { data: ICPData; onChange: (d: ICPData) => void }) {
  const inp = (key: keyof ICPData, label: string, placeholder: string) => (
    <Field key={key} label={label}>
      <input
        type="text"
        value={data[key] ?? ''}
        onChange={e => onChange({ ...data, [key]: e.target.value })}
        placeholder={placeholder}
        className={inputCls}
      />
    </Field>
  )
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {inp('industry',     'Industry / Vertical', 'e.g. Esports, Sports Media, Gaming')}
        {inp('company_size', 'Company Size',         'e.g. 10–200 employees')}
        {inp('geography',    'Geography',            'e.g. Europe, DACH, UK')}
        {inp('stage',        'Stage / Type',         'e.g. Funded startup, mid-market, agency')}
        {inp('revenue_range','Revenue Range',        'e.g. €1M–€20M ARR')}
      </div>
      <Field label="Anti-ICP" desc="Who is NOT a fit — saves you wasted effort.">
        <textarea value={data.anti_icp ?? ''} onChange={e => onChange({ ...data, anti_icp: e.target.value })} rows={2} className={textareaCls} placeholder="e.g. Solo creators, B2C brands, agencies without media budgets" />
      </Field>
      <Field label="Notes" desc="Anything else that defines strong fit or intent.">
        <textarea value={data.notes ?? ''} onChange={e => onChange({ ...data, notes: e.target.value })} rows={2} className={textareaCls} placeholder="Additional criteria, edge cases, context..." />
      </Field>
    </div>
  )
}

function SegmentsSection({ data, onChange }: { data: SegmentItem[]; onChange: (d: SegmentItem[]) => void }) {
  const add = () => onChange([...data, { id: crypto.randomUUID(), name: '', description: '', why_priority: '', priority_rank: data.length + 1 }])
  const upd = (id: string, updates: Partial<SegmentItem>) => onChange(data.map(s => s.id === id ? { ...s, ...updates } : s))
  const del = (id: string) => onChange(data.filter(s => s.id !== id))

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">Within the ICP, which sub-groups exist? Rank them. Start with one — the lowest hanging fruit.</p>
      <div className="space-y-3 mb-4">
        {data.map((seg, i) => (
          <div key={seg.id} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-gray-100 text-gray-500 rounded-full w-5 h-5 flex items-center justify-center font-semibold shrink-0">{i + 1}</span>
              <input
                type="text"
                value={seg.name}
                onChange={e => upd(seg.id, { name: e.target.value })}
                placeholder="Segment name (e.g. Esports tournament organizers)"
                className="flex-1 text-sm font-medium border-0 focus:outline-none bg-transparent placeholder-gray-300"
              />
              <button onClick={() => del(seg.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
            </div>
            <div className="space-y-2 pl-7">
              <input type="text" value={seg.description}   onChange={e => upd(seg.id, { description:   e.target.value })} placeholder="What defines this sub-group?" className={innerInputCls} />
              <input type="text" value={seg.why_priority}  onChange={e => upd(seg.id, { why_priority:  e.target.value })} placeholder="Why is this a priority? (fastest to close, clearest pain...)" className={innerInputCls} />
            </div>
          </div>
        ))}
      </div>
      {data.length === 0 && <p className="text-sm text-gray-300 border border-dashed border-gray-200 rounded-xl px-4 py-8 text-center mb-4">No segments yet.</p>}
      <button onClick={add} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Add segment</button>
    </div>
  )
}

function PersonasSection({ data, segments, onChange }: { data: Persona[]; segments: SegmentItem[]; onChange: (d: Persona[]) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const add = () => {
    const p: Persona = { id: crypto.randomUUID(), segment_id: segments[0]?.id ?? '', title: '', seniority: '', goals: '', frustrations: '', triggers: '', pains: [] }
    onChange([...data, p])
    setExpandedId(p.id)
  }
  const upd = (id: string, updates: Partial<Persona>) => onChange(data.map(p => p.id === id ? { ...p, ...updates } : p))
  const del = (id: string) => onChange(data.filter(p => p.id !== id))

  const addPain = (pid: string) => {
    const persona = data.find(p => p.id === pid)
    if (!persona) return
    const pain: Pain = { id: crypto.randomUUID(), pain: '', business_impact: '', consequence: '', workaround: '' }
    upd(pid, { pains: [...persona.pains, pain] })
  }
  const updPain = (pid: string, painId: string, updates: Partial<Pain>) => {
    const persona = data.find(p => p.id === pid)
    if (!persona) return
    upd(pid, { pains: persona.pains.map(p => p.id === painId ? { ...p, ...updates } : p) })
  }
  const delPain = (pid: string, painId: string) => {
    const persona = data.find(p => p.id === pid)
    if (!persona) return
    upd(pid, { pains: persona.pains.filter(p => p.id !== painId) })
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">Per segment — who are the decision makers, influencers, users? Goals, frustrations, what triggers them to look for a solution.</p>
      <div className="space-y-2 mb-4">
        {data.map(persona => {
          const segment = segments.find(s => s.id === persona.segment_id)
          const expanded = expandedId === persona.id
          return (
            <div key={persona.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => setExpandedId(expanded ? null : persona.id)} className="flex-1 flex items-center gap-3 text-left">
                  <span className="text-gray-300 text-xs">{expanded ? '▾' : '▸'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{persona.title || <span className="text-gray-300 font-normal">Untitled persona</span>}</p>
                    {segment?.name && <p className="text-xs text-gray-400">{segment.name}</p>}
                  </div>
                  <span className="text-xs text-gray-300 shrink-0">{persona.pains.length} pain{persona.pains.length !== 1 ? 's' : ''}</span>
                </button>
                <button onClick={() => del(persona.id)} className="text-gray-300 hover:text-red-400 text-xs shrink-0">✕</button>
              </div>

              {expanded && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={persona.title}     onChange={e => upd(persona.id, { title:     e.target.value })} placeholder="Title (e.g. Head of Partnerships)" className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none" />
                    <input type="text" value={persona.seniority} onChange={e => upd(persona.id, { seniority: e.target.value })} placeholder="Seniority (Director, VP, C-suite)" className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none" />
                    {segments.length > 0 && (
                      <select value={persona.segment_id} onChange={e => upd(persona.id, { segment_id: e.target.value })} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none col-span-2">
                        <option value="">No segment</option>
                        {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    )}
                    <textarea value={persona.goals}        onChange={e => upd(persona.id, { goals:        e.target.value })} rows={2} placeholder="Goals & KPIs — what are they measured on?" className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none resize-none col-span-2" />
                    <textarea value={persona.frustrations} onChange={e => upd(persona.id, { frustrations: e.target.value })} rows={2} placeholder="Frustrations — what keeps them up at night?"  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none resize-none" />
                    <textarea value={persona.triggers}     onChange={e => upd(persona.id, { triggers:     e.target.value })} rows={2} placeholder="Triggers — what prompts them to look for a solution?" className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none resize-none" />
                  </div>

                  {/* Pain Map */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Pain Map</p>
                    <div className="space-y-2">
                      {persona.pains.map((pain, pi) => (
                        <div key={pain.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-400 font-medium">Pain {pi + 1}</span>
                            <button onClick={() => delPain(persona.id, pain.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                          </div>
                          <div className="space-y-2">
                            <input type="text" value={pain.pain}            onChange={e => updPain(persona.id, pain.id, { pain:            e.target.value })} placeholder="Core pain (e.g. Can't prove ROI to sponsors)"  className={innerInputCls} />
                            <input type="text" value={pain.business_impact} onChange={e => updPain(persona.id, pain.id, { business_impact: e.target.value })} placeholder="Business impact"                              className={innerInputCls} />
                            <input type="text" value={pain.consequence}     onChange={e => updPain(persona.id, pain.id, { consequence:     e.target.value })} placeholder="Consequence of not solving it"                className={innerInputCls} />
                            <input type="text" value={pain.workaround}      onChange={e => updPain(persona.id, pain.id, { workaround:      e.target.value })} placeholder="Current workaround"                          className={innerInputCls} />
                          </div>
                        </div>
                      ))}
                      <button onClick={() => addPain(persona.id)} className="text-xs text-indigo-600 hover:text-indigo-800">+ Add pain</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {data.length === 0 && <p className="text-sm text-gray-300 border border-dashed border-gray-200 rounded-xl px-4 py-8 text-center mb-4">No personas yet. Add segments first, then build your personas.</p>}
      <button onClick={add} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Add persona</button>
    </div>
  )
}

// ─── Signals ──────────────────────────────────────────────────────────────────

function SignalsPhase({ data, onChange }: { data: SignalsData; onChange: (d: SignalsData) => void }) {
  const add = () => onChange({ ...data, signal_types: [...data.signal_types, { id: crypto.randomUUID(), name: '', description: '', where_to_find: '', what_it_means: '' }] })
  const upd = (id: string, u: Partial<SignalType>) => onChange({ ...data, signal_types: data.signal_types.map(s => s.id === id ? { ...s, ...u } : s) })
  const del = (id: string) => onChange({ ...data, signal_types: data.signal_types.filter(s => s.id !== id) })

  return (
    <div>
      <p className="text-sm text-gray-400 mb-6">Know what &ldquo;ready to buy&rdquo; looks like before you reach out.</p>

      <div className="space-y-3 mb-4">
        {data.signal_types.map(sig => (
          <div key={sig.id} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <input type="text" value={sig.name} onChange={e => upd(sig.id, { name: e.target.value })} placeholder="Signal name (e.g. Series A funding)" className="flex-1 text-sm font-medium border-0 focus:outline-none bg-transparent placeholder-gray-300" />
              <button onClick={() => del(sig.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="text" value={sig.description}   onChange={e => upd(sig.id, { description:   e.target.value })} placeholder="What the signal is"                      className={innerInputCls} />
              <input type="text" value={sig.where_to_find} onChange={e => upd(sig.id, { where_to_find: e.target.value })} placeholder="Where to find it (Sales Nav, LinkedIn...)" className={innerInputCls} />
              <input type="text" value={sig.what_it_means} onChange={e => upd(sig.id, { what_it_means: e.target.value })} placeholder="What it means / why it matters"            className={innerInputCls} />
            </div>
          </div>
        ))}
      </div>
      {data.signal_types.length === 0 && <p className="text-sm text-gray-300 border border-dashed border-gray-200 rounded-xl px-4 py-8 text-center mb-4">No signals defined yet.</p>}
      <button onClick={add} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-8">+ Add signal</button>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Qualification Criteria" desc="What does a qualified account look like?">
          <textarea value={data.qualification_criteria}    onChange={e => onChange({ ...data, qualification_criteria:    e.target.value })} rows={4} className={textareaCls} placeholder="Must have: X employees, Y signals, Z characteristics..." />
        </Field>
        <Field label="Disqualification Criteria" desc="What takes an account off the list?">
          <textarea value={data.disqualification_criteria} onChange={e => onChange({ ...data, disqualification_criteria: e.target.value })} rows={4} className={textareaCls} placeholder="Disqualify if: wrong stage, previous churn risk, no budget signal..." />
        </Field>
      </div>
    </div>
  )
}

// ─── Messaging ────────────────────────────────────────────────────────────────

function MessagingPhase({ data, onChange }: { data: MessagingData; onChange: (d: MessagingData) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const add = () => {
    const row: MessagingRow = { id: crypto.randomUUID(), segment: '', persona: '', pain: '', hook: '', channel: '', social_proof: '', cta_soft: '', cta_hard: '' }
    onChange({ matrix: [...data.matrix, row] })
    setExpandedId(row.id)
  }
  const upd = (id: string, u: Partial<MessagingRow>) => onChange({ matrix: data.matrix.map(r => r.id === id ? { ...r, ...u } : r) })
  const del = (id: string) => onChange({ matrix: data.matrix.filter(r => r.id !== id) })

  return (
    <div>
      <p className="text-sm text-gray-400 mb-6">One hook per persona/pain combination. Not one template — a library tied to context.</p>

      <div className="space-y-2 mb-4">
        {data.matrix.map(row => {
          const expanded = expandedId === row.id
          const hasContent = row.hook || row.segment
          return (
            <div key={row.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => setExpandedId(expanded ? null : row.id)} className="flex-1 flex items-start gap-3 text-left">
                  <span className="text-gray-300 text-xs mt-0.5">{expanded ? '▾' : '▸'}</span>
                  <div className="flex-1 min-w-0">
                    {hasContent ? (
                      <>
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {row.segment && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{row.segment}</span>}
                          {row.persona && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{row.persona}</span>}
                          {row.channel && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{row.channel}</span>}
                        </div>
                        {row.hook && <p className="text-sm text-gray-600 truncate">{row.hook}</p>}
                      </>
                    ) : (
                      <p className="text-sm text-gray-300">New message variant</p>
                    )}
                  </div>
                </button>
                <button onClick={() => del(row.id)} className="text-gray-300 hover:text-red-400 text-xs shrink-0">✕</button>
              </div>

              {expanded && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <input value={row.segment} onChange={e => upd(row.id, { segment: e.target.value })} placeholder="Segment"                   className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none" />
                    <input value={row.persona} onChange={e => upd(row.id, { persona: e.target.value })} placeholder="Persona"                   className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none" />
                    <input value={row.channel} onChange={e => upd(row.id, { channel: e.target.value })} placeholder="Channel (LinkedIn, Email)" className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none" />
                  </div>
                  <textarea value={row.pain}         onChange={e => upd(row.id, { pain:         e.target.value })} rows={2} placeholder="Pain being addressed"                                                                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none resize-none" />
                  <textarea value={row.hook}         onChange={e => upd(row.id, { hook:         e.target.value })} rows={2} placeholder='Hook — the opening line that earns attention (e.g. "How [Similar Co] increased retention by X%")' className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none resize-none" />
                  <input    value={row.social_proof} onChange={e => upd(row.id, { social_proof: e.target.value })}           placeholder="Social proof (similar company + result)"                                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <textarea value={row.cta_soft} onChange={e => upd(row.id, { cta_soft: e.target.value })} rows={2} placeholder="Soft CTA (first touch — low friction)" className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none resize-none" />
                    <textarea value={row.cta_hard} onChange={e => upd(row.id, { cta_hard: e.target.value })} rows={2} placeholder="Hard CTA (later in sequence — direct ask)" className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none resize-none" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {data.matrix.length === 0 && <p className="text-sm text-gray-300 border border-dashed border-gray-200 rounded-xl px-4 py-8 text-center mb-4">No message variants yet.</p>}
      <button onClick={add} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Add message variant</button>
    </div>
  )
}

// ─── Sequences ────────────────────────────────────────────────────────────────

const CHANNEL_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-700',
  email:    'bg-green-100 text-green-700',
  phone:    'bg-orange-100 text-orange-700',
  other:    'bg-gray-100 text-gray-600',
}

function SequencesPhase({ data, onChange }: { data: SequencesData; onChange: (d: SequencesData) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const addStep = () => {
    const maxDay = data.steps.reduce((m, s) => Math.max(m, s.day), 0)
    const step: SequenceStep = { id: crypto.randomUUID(), day: maxDay + 3, channel: 'linkedin', action: '', content: '' }
    const sorted = [...data.steps, step].sort((a, b) => a.day - b.day)
    onChange({ ...data, steps: sorted })
    setExpandedId(step.id)
  }
  const upd = (id: string, u: Partial<SequenceStep>) => {
    const updated = data.steps.map(s => s.id === id ? { ...s, ...u } : s)
    onChange({ ...data, steps: u.day !== undefined ? updated.sort((a, b) => a.day - b.day) : updated })
  }
  const del = (id: string) => onChange({ ...data, steps: data.steps.filter(s => s.id !== id) })

  return (
    <div>
      <p className="text-sm text-gray-400 mb-6">Design the cadence — what you send, when, and on which channel. 6–8 steps over 21–30 days. Design here, build in HubSpot.</p>

      <div className="space-y-2 mb-4">
        {data.steps.map(step => {
          const expanded = expandedId === step.id
          const color = CHANNEL_COLORS[step.channel] ?? CHANNEL_COLORS.other
          return (
            <div key={step.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => setExpandedId(expanded ? null : step.id)} className="flex-1 flex items-center gap-3 text-left">
                  <span className="text-xs font-mono font-bold text-gray-400 w-8 shrink-0">D{step.day}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${color}`}>{step.channel}</span>
                  <span className="text-sm text-gray-700 truncate">{step.action || <span className="text-gray-300">No action defined</span>}</span>
                </button>
                <button onClick={() => del(step.id)} className="text-gray-300 hover:text-red-400 text-xs shrink-0">✕</button>
              </div>

              {expanded && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Day</label>
                      <input type="number" value={step.day} onChange={e => upd(step.id, { day: parseInt(e.target.value) || 1 })} className="w-16 text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none text-center" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Channel</label>
                      <select value={step.channel} onChange={e => upd(step.id, { channel: e.target.value })} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none">
                        {['linkedin', 'email', 'phone', 'other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <input    value={step.action}  onChange={e => upd(step.id, { action:  e.target.value })}        placeholder="Action (e.g. LinkedIn connection request, Follow-up email — different angle)" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none" />
                  <textarea value={step.content} onChange={e => upd(step.id, { content: e.target.value })} rows={3} placeholder="Content / script / notes for this step..."                                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none resize-none" />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {data.steps.length === 0 && <p className="text-sm text-gray-300 border border-dashed border-gray-200 rounded-xl px-4 py-8 text-center mb-4">No steps yet. Add your first touchpoint.</p>}
      <button onClick={addStep} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-6">+ Add step</button>

      <Field label="Sequence Notes" desc="Overall strategy, decision rationale, what to test.">
        <textarea value={data.notes} onChange={e => onChange({ ...data, notes: e.target.value })} rows={3} className={textareaCls} placeholder="Notes on the overall sequence design..." />
      </Field>
    </div>
  )
}

// ─── Launch Plan ──────────────────────────────────────────────────────────────

function LaunchPlanPhase({ data, onChange }: { data: LaunchPlanData; onChange: (d: LaunchPlanData) => void }) {
  const addWeek = () => onChange({ ...data, weekly_targets: [...data.weekly_targets, { id: crypto.randomUUID(), week: '', new_contacts: 10, follow_ups: 10, meetings_target: 1, focus: '' }] })
  const upd = (id: string, u: Partial<WeeklyTarget>) => onChange({ ...data, weekly_targets: data.weekly_targets.map(w => w.id === id ? { ...w, ...u } : w) })
  const del = (id: string) => onChange({ ...data, weekly_targets: data.weekly_targets.filter(w => w.id !== id) })

  return (
    <div>
      <p className="text-sm text-gray-400 mb-6">First 50–100 qualified accounts. Work backwards from 6 meetings/month: 6 meetings ÷ 40% reply-to-meeting = 15 replies ÷ 7% reply rate = ~200 touchpoints/month.</p>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Weekly Ramp Plan</h3>
        {data.weekly_targets.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 font-medium">
                  <th className="px-3 py-2 text-left">Week</th>
                  <th className="px-3 py-2 text-center">New/day</th>
                  <th className="px-3 py-2 text-center">Follow-ups/day</th>
                  <th className="px-3 py-2 text-center">Mtg target</th>
                  <th className="px-3 py-2 text-left">Focus</th>
                  <th className="px-3 py-2 w-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.weekly_targets.map(w => (
                  <tr key={w.id}>
                    <td className="px-3 py-2"><input value={w.week}            onChange={e => upd(w.id, { week:            e.target.value })}                       placeholder="e.g. May wk 2" className="w-full text-sm focus:outline-none bg-transparent" /></td>
                    <td className="px-3 py-2 text-center"><input type="number" value={w.new_contacts}     onChange={e => upd(w.id, { new_contacts:     parseInt(e.target.value) || 0 })} className="w-14 text-sm text-center border border-gray-100 rounded px-1 py-0.5 focus:outline-none bg-gray-50" /></td>
                    <td className="px-3 py-2 text-center"><input type="number" value={w.follow_ups}       onChange={e => upd(w.id, { follow_ups:       parseInt(e.target.value) || 0 })} className="w-14 text-sm text-center border border-gray-100 rounded px-1 py-0.5 focus:outline-none bg-gray-50" /></td>
                    <td className="px-3 py-2 text-center"><input type="number" value={w.meetings_target}  onChange={e => upd(w.id, { meetings_target:  parseInt(e.target.value) || 0 })} className="w-14 text-sm text-center border border-gray-100 rounded px-1 py-0.5 focus:outline-none bg-gray-50" /></td>
                    <td className="px-3 py-2"><input value={w.focus} onChange={e => upd(w.id, { focus: e.target.value })} placeholder="Focus area" className="w-full text-sm focus:outline-none bg-transparent" /></td>
                    <td className="px-3 py-2"><button onClick={() => del(w.id)} className="text-gray-300 hover:text-red-400 text-xs">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button onClick={addWeek} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Add week</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Success Metrics" desc="How you'll know it's working">
          <textarea value={data.success_metrics} onChange={e => onChange({ ...data, success_metrics: e.target.value })} rows={5} className={textareaCls} placeholder="Reply rate target, meetings booked per week, pipeline created per month..." />
        </Field>
        <Field label="Ramp Notes" desc="How you'll scale up over time">
          <textarea value={data.ramp_notes} onChange={e => onChange({ ...data, ramp_notes: e.target.value })} rows={5} className={textareaCls} placeholder="Week 1: test messaging, Week 2–3: ramp volume, Week 4: full cadence..." />
        </Field>
      </div>
    </div>
  )
}
