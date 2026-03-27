'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Campaign, ICP, Segment, Persona, Pain } from '@/lib/types'

const TOTAL_STEPS = 8

// ─── Shared UI ────────────────────────────────────────────────────────────────

const inputCls =
  'w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white'
const textareaCls =
  'w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none bg-white'

function Field({
  label,
  children,
  hint,
  sm,
}: {
  label: string
  children: React.ReactNode
  hint?: string
  sm?: boolean
}) {
  return (
    <div>
      <label className={`block font-medium text-gray-700 mb-1 ${sm ? 'text-xs' : 'text-sm'}`}>
        {label}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

// ─── Step Components ──────────────────────────────────────────────────────────

function StepCampaign({
  campaign,
  onChange,
}: {
  campaign: Partial<Campaign>
  onChange: (c: Partial<Campaign>) => void
}) {
  return (
    <div className="space-y-4">
      <StepHeader
        title="Campaign Setup"
        desc="Name this outbound campaign and set your daily execution targets."
      />
      <Field label="Campaign name">
        <input
          type="text"
          value={campaign.name || ''}
          onChange={e => onChange({ ...campaign, name: e.target.value })}
          className={inputCls}
          placeholder="e.g. Gaming Publishers Q2 — Head of Insights"
        />
      </Field>
      <Field label="Goal" hint="What does success look like in 60 days?">
        <input
          type="text"
          value={campaign.goal || ''}
          onChange={e => onChange({ ...campaign, goal: e.target.value })}
          className={inputCls}
          placeholder="e.g. 6 qualified SQLs from gaming publishers"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="New contacts per day">
          <input
            type="number"
            min={1}
            max={50}
            value={campaign.daily_new_contacts ?? 5}
            onChange={e => onChange({ ...campaign, daily_new_contacts: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>
        <Field label="Follow-ups per day">
          <input
            type="number"
            min={1}
            max={50}
            value={campaign.daily_followups ?? 10}
            onChange={e => onChange({ ...campaign, daily_followups: Number(e.target.value) })}
            className={inputCls}
          />
        </Field>
      </div>
    </div>
  )
}

function StepICP({ icp, onChange }: { icp: Partial<ICP>; onChange: (i: Partial<ICP>) => void }) {
  return (
    <div className="space-y-4">
      <StepHeader title="Ideal Customer Profile" desc="Who are you targeting? Be specific." />
      <Field label="Industry / vertical">
        <input
          type="text"
          value={icp.industry || ''}
          onChange={e => onChange({ ...icp, industry: e.target.value })}
          className={inputCls}
          placeholder="e.g. Mobile gaming, esports, casual gaming"
        />
      </Field>
      <Field label="Company size">
        <input
          type="text"
          value={icp.company_size || ''}
          onChange={e => onChange({ ...icp, company_size: e.target.value })}
          className={inputCls}
          placeholder="e.g. 50–500 employees"
        />
      </Field>
      <Field label="Geography">
        <input
          type="text"
          value={icp.geography || ''}
          onChange={e => onChange({ ...icp, geography: e.target.value })}
          className={inputCls}
          placeholder="e.g. DACH, UK, Nordics"
        />
      </Field>
      <Field label="Revenue / stage">
        <input
          type="text"
          value={icp.revenue_range || ''}
          onChange={e => onChange({ ...icp, revenue_range: e.target.value })}
          className={inputCls}
          placeholder="e.g. Series A+, €5M+ ARR"
        />
      </Field>
      <Field label="Other qualifiers">
        <textarea
          value={icp.notes || ''}
          onChange={e => onChange({ ...icp, notes: e.target.value })}
          className={textareaCls}
          rows={3}
          placeholder="e.g. Runs influencer campaigns, active on Twitch, attended GDC"
        />
      </Field>
    </div>
  )
}

type PartialSegment = Partial<Segment> & { id?: string }

function StepSegments({
  segments,
  onChange,
}: {
  segments: PartialSegment[]
  onChange: (s: PartialSegment[]) => void
}) {
  const add = () => onChange([...segments, { name: '', why: '' }])
  const remove = (i: number) => onChange(segments.filter((_, idx) => idx !== i))
  const update = (i: number, field: string, value: string) =>
    onChange(segments.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))

  return (
    <div className="space-y-4">
      <StepHeader
        title="Segments"
        desc="Define 2–3 sub-groups within your ICP. Each can have its own persona and angle."
      />
      {segments.map((seg, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Segment {i + 1}
            </span>
            {segments.length > 1 && (
              <button
                onClick={() => remove(i)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            )}
          </div>
          <Field label="Name" sm>
            <input
              type="text"
              value={seg.name || ''}
              onChange={e => update(i, 'name', e.target.value)}
              className={inputCls}
              placeholder="e.g. Mobile gaming publishers"
            />
          </Field>
          <Field label="Why this segment?" sm>
            <input
              type="text"
              value={seg.why || ''}
              onChange={e => update(i, 'why', e.target.value)}
              className={inputCls}
              placeholder="e.g. High influencer spend, poor measurement"
            />
          </Field>
        </div>
      ))}
      {segments.length < 4 && (
        <button
          onClick={add}
          className="w-full text-sm text-indigo-600 border border-dashed border-indigo-300 rounded-xl py-2.5 hover:bg-indigo-50"
        >
          + Add Segment
        </button>
      )}
    </div>
  )
}

type PainEntry = { pain: string; consequence: string; workaround: string }
const blankPain = (): PainEntry => ({ pain: '', consequence: '', workaround: '' })
type PersonaWithPains = Partial<Persona> & { _pains: PainEntry[] }

function StepPersonas({
  personas,
  onChange,
  segments,
}: {
  personas: PersonaWithPains[]
  onChange: (p: PersonaWithPains[]) => void
  segments: PartialSegment[]
}) {
  const add = () =>
    onChange([
      ...personas,
      {
        title: '',
        seniority: '',
        goals: '',
        frustrations: '',
        segment_id: segments[0]?.id || '',
        _pains: [blankPain(), blankPain(), blankPain()],
      },
    ])
  const remove = (i: number) => onChange(personas.filter((_, idx) => idx !== i))
  const update = (i: number, field: string, value: string) =>
    onChange(personas.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)))
  const updatePain = (pi: number, painIdx: number, field: keyof PainEntry, value: string) =>
    onChange(
      personas.map((p, idx) => {
        if (idx !== pi) return p
        const pains = [...p._pains]
        pains[painIdx] = { ...pains[painIdx], [field]: value }
        return { ...p, _pains: pains }
      })
    )

  return (
    <div className="space-y-4">
      <StepHeader
        title="Personas & Pain Points"
        desc="Who exactly are you talking to? What keeps them up at night?"
      />
      {personas.map((persona, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Persona {i + 1}
            </span>
            {personas.length > 1 && (
              <button
                onClick={() => remove(i)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            )}
          </div>
          {segments.length > 0 && (
            <Field label="Segment" sm>
              <select
                value={persona.segment_id || ''}
                onChange={e => update(i, 'segment_id', e.target.value)}
                className={inputCls}
              >
                <option value="">No segment</option>
                {segments.map((s, si) => (
                  <option key={s.id || si} value={s.id}>
                    {s.name || `Segment ${si + 1}`}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Job title" sm>
              <input
                type="text"
                value={persona.title || ''}
                onChange={e => update(i, 'title', e.target.value)}
                className={inputCls}
                placeholder="e.g. Head of Marketing"
              />
            </Field>
            <Field label="Seniority" sm>
              <input
                type="text"
                value={persona.seniority || ''}
                onChange={e => update(i, 'seniority', e.target.value)}
                className={inputCls}
                placeholder="e.g. Senior, VP, Director"
              />
            </Field>
          </div>
          <Field label="Goals (what do they want to achieve?)" sm>
            <textarea
              value={persona.goals || ''}
              onChange={e => update(i, 'goals', e.target.value)}
              className={textareaCls}
              rows={2}
              placeholder="e.g. Prove ROI of influencer spend, scale campaigns efficiently"
            />
          </Field>
          <Field label="Frustrations (what makes their job harder?)" sm>
            <textarea
              value={persona.frustrations || ''}
              onChange={e => update(i, 'frustrations', e.target.value)}
              className={textareaCls}
              rows={2}
              placeholder="e.g. Can't attribute installs to specific creators, data is a mess"
            />
          </Field>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Top 3 pains</label>
            <div className="space-y-3">
              {persona._pains.map((p, pi) => (
                <div key={pi} className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <input
                    type="text"
                    value={p.pain}
                    onChange={e => updatePain(i, pi, 'pain', e.target.value)}
                    className={inputCls}
                    placeholder={`Pain ${pi + 1} — core problem`}
                  />
                  <input
                    type="text"
                    value={p.consequence}
                    onChange={e => updatePain(i, pi, 'consequence', e.target.value)}
                    className={inputCls}
                    placeholder="Consequence if not solved"
                  />
                  <input
                    type="text"
                    value={p.workaround}
                    onChange={e => updatePain(i, pi, 'workaround', e.target.value)}
                    className={inputCls}
                    placeholder="Current workaround — how they deal with it today"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full text-sm text-indigo-600 border border-dashed border-indigo-300 rounded-xl py-2.5 hover:bg-indigo-50"
      >
        + Add Persona
      </button>
    </div>
  )
}

function StepSignals({
  signals,
  obsTemplate,
  onSignals,
  onObs,
}: {
  signals: string
  obsTemplate: string
  onSignals: (s: string) => void
  onObs: (s: string) => void
}) {
  return (
    <div className="space-y-4">
      <StepHeader
        title="Signals & Observations"
        desc="What should trigger you to prioritize a company? What to check before reaching out?"
      />
      <Field
        label="Buying signals to look for"
        hint="These become your filters when building and prioritising the list."
      >
        <textarea
          value={signals}
          onChange={e => onSignals(e.target.value)}
          className={textareaCls}
          rows={5}
          placeholder={`e.g.\n- Hiring for influencer/creator marketing role\n- Recent funding round\n- Active influencer campaigns visible on Instagram/TikTok\n- Attending GDC or gaming conferences\n- New CMO or VP Marketing in last 6 months`}
        />
      </Field>
      <Field
        label="Pre-contact checklist"
        hint="What do you look at before sending the first message?"
      >
        <textarea
          value={obsTemplate}
          onChange={e => onObs(e.target.value)}
          className={textareaCls}
          rows={5}
          placeholder={`e.g.\n- Find the right contact on LinkedIn (Head of Marketing / Brand)\n- Check their recent LinkedIn posts\n- Find 1 recent campaign they ran\n- Note any shared connections\n- Identify a specific angle for the hook`}
        />
      </Field>
    </div>
  )
}

type Messaging = { hook: string; body: string; cta: string; channel: string }

function StepMessaging({
  messaging,
  onChange,
}: {
  messaging: Messaging
  onChange: (m: Messaging) => void
}) {
  const u = (field: keyof Messaging, value: string) => onChange({ ...messaging, [field]: value })
  return (
    <div className="space-y-4">
      <StepHeader
        title="Messaging Framework"
        desc="Write your base outreach template. You'll personalise it per company."
      />
      <Field label="Primary channel">
        <select
          value={messaging.channel}
          onChange={e => u('channel', e.target.value)}
          className={inputCls}
        >
          <option value="linkedin">LinkedIn</option>
          <option value="email">Email</option>
        </select>
      </Field>
      <Field
        label="Hook (opening line)"
        hint="Reference something specific to them. This is the most important line."
      >
        <textarea
          value={messaging.hook}
          onChange={e => u('hook', e.target.value)}
          className={textareaCls}
          rows={2}
          placeholder="e.g. Saw you recently worked with [creator] on the launch campaign — curious how you measured the impact beyond views."
        />
      </Field>
      <Field label="Body (value + relevance)">
        <textarea
          value={messaging.body}
          onChange={e => u('body', e.target.value)}
          className={textareaCls}
          rows={4}
          placeholder="e.g. We help gaming companies like [X] measure which influencers and content actually drive installs — not just reach. Most teams we talk to are still stitching this together manually in spreadsheets."
        />
      </Field>
      <Field label="CTA (one clear ask)">
        <input
          type="text"
          value={messaging.cta}
          onChange={e => u('cta', e.target.value)}
          className={inputCls}
          placeholder="e.g. Worth a 20-min call to see if it's relevant for you?"
        />
      </Field>
    </div>
  )
}

type SeqStep = { day: number; channel: string; action: string }

function StepSequence({
  sequence,
  onChange,
}: {
  sequence: SeqStep[]
  onChange: (s: SeqStep[]) => void
}) {
  const update = (i: number, field: keyof SeqStep, value: string | number) =>
    onChange(sequence.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  const add = () =>
    onChange([
      ...sequence,
      { day: (sequence[sequence.length - 1]?.day || 0) + 5, channel: 'Email', action: '' },
    ])
  const remove = (i: number) => onChange(sequence.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-4">
      <StepHeader
        title="Sequence Design"
        desc="Define your touchpoint sequence — channel, timing, and what to say at each step."
      />
      <div className="space-y-2">
        {sequence.map((step, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
            <span className="text-xs text-gray-400 w-5 shrink-0 text-center">#{i + 1}</span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-gray-400">Day</span>
              <input
                type="number"
                value={step.day}
                onChange={e => update(i, 'day', Number(e.target.value))}
                className="w-12 text-xs border border-gray-200 rounded px-1.5 py-1 text-center bg-white"
                min={0}
              />
            </div>
            <select
              value={step.channel}
              onChange={e => update(i, 'channel', e.target.value)}
              className="text-xs border border-gray-200 rounded px-2 py-1 shrink-0 bg-white"
            >
              <option>LinkedIn</option>
              <option>Email</option>
              <option>Phone</option>
            </select>
            <input
              type="text"
              value={step.action}
              onChange={e => update(i, 'action', e.target.value)}
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 bg-white"
              placeholder="e.g. Connection request + personalised note"
            />
            {sequence.length > 1 && (
              <button
                onClick={() => remove(i)}
                className="text-gray-300 hover:text-red-400 text-base shrink-0 leading-none"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="w-full text-xs text-indigo-600 border border-dashed border-indigo-300 rounded-lg py-2 hover:bg-indigo-50"
      >
        + Add step
      </button>
    </div>
  )
}

function StepReview({
  campaign,
  icp,
  segments,
  personas,
}: {
  campaign: Partial<Campaign>
  icp: Partial<ICP>
  segments: PartialSegment[]
  personas: PersonaWithPains[]
}) {
  return (
    <div className="space-y-5">
      <StepHeader
        title="Review & Launch"
        desc="Everything looks good? Click Launch to start executing this campaign."
      />
      <ReviewSection title="Campaign">
        <ReviewRow label="Name" value={campaign.name} />
        <ReviewRow label="Goal" value={campaign.goal} />
        <ReviewRow label="Daily new" value={`${campaign.daily_new_contacts} contacts`} />
        <ReviewRow label="Follow-ups" value={String(campaign.daily_followups)} />
      </ReviewSection>
      <ReviewSection title="ICP">
        <ReviewRow label="Industry" value={icp.industry} />
        <ReviewRow label="Size" value={icp.company_size} />
        <ReviewRow label="Geography" value={icp.geography} />
      </ReviewSection>
      <ReviewSection title={`Segments (${segments.length})`}>
        {segments.map((s, i) => (
          <ReviewRow key={i} label={`#${i + 1}`} value={s.name} />
        ))}
      </ReviewSection>
      <ReviewSection title={`Personas (${personas.length})`}>
        {personas.map((p, i) => (
          <ReviewRow
            key={i}
            label={`#${i + 1}`}
            value={`${p.title} · ${p._pains.filter(p => p.pain.trim()).length} pains`}
          />
        ))}
      </ReviewSection>
    </div>
  )
}

// ─── Shared review helpers ────────────────────────────────────────────────────

function StepHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="pb-2">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-400 mt-0.5">{desc}</p>
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        {title}
      </h3>
      <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">{children}</div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex px-4 py-2 text-sm">
      <span className="text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-gray-900">
        {value || <span className="text-gray-300 italic">not set</span>}
      </span>
    </div>
  )
}

// ─── Main Wizard Page ─────────────────────────────────────────────────────────

export default function WizardPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [campaign, setCampaign] = useState<Partial<Campaign>>({
    daily_new_contacts: 5,
    daily_followups: 10,
  })
  const [icp, setIcp] = useState<Partial<ICP>>({})
  const [segments, setSegments] = useState<PartialSegment[]>([{ name: '', why: '' }])
  const [personas, setPersonas] = useState<PersonaWithPains[]>([
    { title: '', seniority: '', goals: '', frustrations: '', segment_id: '', _pains: [blankPain(), blankPain(), blankPain()] },
  ])
  const [signals, setSignals] = useState('')
  const [obsTemplate, setObsTemplate] = useState('')
  const [messaging, setMessaging] = useState<Messaging>({
    hook: '',
    body: '',
    cta: '',
    channel: 'linkedin',
  })
  const [sequence, setSequence] = useState<SeqStep[]>([
    { day: 0, channel: 'LinkedIn', action: '' },
    { day: 3, channel: 'Email', action: '' },
    { day: 7, channel: 'LinkedIn', action: '' },
    { day: 14, channel: 'Email', action: '' },
  ])

  useEffect(() => {
    async function load() {
      const [campRes, icpRes, segsRes, personasRes] = await Promise.all([
        supabase.from('campaigns').select('*').eq('id', id).single(),
        supabase.from('icp').select('*').eq('campaign_id', id).maybeSingle(),
        supabase.from('segments').select('*').eq('campaign_id', id).order('sort_order'),
        supabase
          .from('personas')
          .select('*, pains(*)')
          .eq('campaign_id', id),
      ])

      if (campRes.data) {
        setCampaign(campRes.data)
        const wd = campRes.data.wizard_data || {}
        if (wd.signals) setSignals(wd.signals)
        if (wd.observation_template) setObsTemplate(wd.observation_template)
        if (wd.messaging) setMessaging(wd.messaging)
        if (wd.sequence?.length) setSequence(wd.sequence)
      }
      if (icpRes.data) setIcp(icpRes.data)
      if (segsRes.data?.length) setSegments(segsRes.data)
      if (personasRes.data?.length) {
        setPersonas(
          personasRes.data.map((p: Persona & { pains: Pain[] }) => ({
            ...p,
            _pains: p.pains?.length
              ? p.pains.map((x: Pain) => ({ pain: x.pain, consequence: (x as any).consequence || '', workaround: (x as any).workaround || '' }))
              : [blankPain(), blankPain(), blankPain()],
          }))
        )
      }
    }
    load()
  }, [id])

  const saveStep = useCallback(
    async (s: number) => {
      setSaving(true)
      try {
        if (s === 1) {
          await supabase.from('campaigns').update({
            name: campaign.name,
            goal: campaign.goal,
            daily_new_contacts: campaign.daily_new_contacts,
            daily_followups: campaign.daily_followups,
          }).eq('id', id)
        }

        if (s === 2) {
          const existing = await supabase
            .from('icp')
            .select('id')
            .eq('campaign_id', id)
            .maybeSingle()
          if (existing.data) {
            await supabase.from('icp').update({ ...icp }).eq('campaign_id', id)
          } else {
            await supabase.from('icp').insert({ ...icp, campaign_id: id })
          }
        }

        if (s === 3) {
          for (let i = 0; i < segments.length; i++) {
            const seg = segments[i]
            if (seg.id) {
              await supabase
                .from('segments')
                .update({ name: seg.name, why: seg.why, sort_order: i })
                .eq('id', seg.id)
            } else {
              const { data } = await supabase
                .from('segments')
                .insert({ campaign_id: id, name: seg.name, why: seg.why, sort_order: i })
                .select()
                .single()
              if (data) {
                setSegments(prev =>
                  prev.map((x, idx) => (idx === i ? { ...x, id: data.id } : x))
                )
              }
            }
          }
        }

        if (s === 4) {
          for (const persona of personas) {
            let personaId = persona.id
            if (personaId) {
              await supabase.from('personas').update({
                title: persona.title,
                seniority: persona.seniority,
                goals: persona.goals,
                frustrations: persona.frustrations,
                segment_id: persona.segment_id || null,
              }).eq('id', personaId)
              await supabase.from('pains').delete().eq('persona_id', personaId)
            } else {
              const { data } = await supabase
                .from('personas')
                .insert({
                  campaign_id: id,
                  segment_id: persona.segment_id || null,
                  title: persona.title,
                  seniority: persona.seniority,
                  goals: persona.goals,
                  frustrations: persona.frustrations,
                })
                .select()
                .single()
              personaId = data?.id
            }
            if (personaId && persona._pains.some(p => p.pain.trim())) {
              await supabase.from('pains').insert(
                persona._pains
                  .filter(p => p.pain.trim())
                  .map(p => ({ persona_id: personaId, pain: p.pain, consequence: p.consequence, workaround: p.workaround }))
              )
            }
          }
        }

        if (s >= 5) {
          await supabase.from('campaigns').update({
            wizard_data: {
              signals,
              observation_template: obsTemplate,
              messaging,
              sequence,
            },
          }).eq('id', id)
        }
      } finally {
        setSaving(false)
      }
    },
    [id, campaign, icp, segments, personas, signals, obsTemplate, messaging, sequence]
  )

  const next = async () => {
    await saveStep(step)
    if (step === TOTAL_STEPS) {
      router.push(`/campaigns/${id}`)
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href={`/campaigns/${id}`} className="text-sm text-gray-400 hover:text-gray-600">
          ← {campaign.name || 'Campaign'}
        </Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-xl font-bold text-gray-900">Strategy Wizard</h1>
          <span className="text-sm text-gray-400">
            {step} / {TOTAL_STEPS}
          </span>
        </div>
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex gap-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i + 1)}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i + 1 <= step ? 'bg-indigo-500' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl p-6 mb-6">
        {step === 1 && <StepCampaign campaign={campaign} onChange={setCampaign} />}
        {step === 2 && <StepICP icp={icp} onChange={setIcp} />}
        {step === 3 && <StepSegments segments={segments} onChange={setSegments} />}
        {step === 4 && (
          <StepPersonas personas={personas} onChange={setPersonas} segments={segments} />
        )}
        {step === 5 && (
          <StepSignals
            signals={signals}
            obsTemplate={obsTemplate}
            onSignals={setSignals}
            onObs={setObsTemplate}
          />
        )}
        {step === 6 && <StepMessaging messaging={messaging} onChange={setMessaging} />}
        {step === 7 && <StepSequence sequence={sequence} onChange={setSequence} />}
        {step === 8 && (
          <StepReview
            campaign={campaign}
            icp={icp}
            segments={segments}
            personas={personas}
          />
        )}
      </div>

      <div className="flex justify-between">
        {step > 1 ? (
          <button
            onClick={() => setStep(s => s - 1)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={next}
          disabled={saving}
          className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : step === TOTAL_STEPS ? 'Launch Campaign →' : 'Save & Continue →'}
        </button>
      </div>
    </div>
  )
}
