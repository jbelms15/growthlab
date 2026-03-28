'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/lib/types'

const TOTAL_STEPS = 3

const inputCls =
  'w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white'

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

function StepHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="pb-2">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-400 mt-0.5">{desc}</p>
    </div>
  )
}

// ─── Step 1: Campaign Setup ───────────────────────────────────────────────────

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
        desc="Name this campaign and set your daily execution targets."
      />
      <Field label="Campaign name">
        <input
          type="text"
          value={campaign.name || ''}
          onChange={e => onChange({ ...campaign, name: e.target.value })}
          className={inputCls}
          placeholder="e.g. Esports Teams Q2 — Head of Partnerships"
        />
      </Field>
      <Field label="Goal" hint="What does success look like in 60 days?">
        <input
          type="text"
          value={campaign.goal || ''}
          onChange={e => onChange({ ...campaign, goal: e.target.value })}
          className={inputCls}
          placeholder="e.g. 6 qualified meetings with esports teams"
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

// ─── Step 2: Targeting from Strategy ─────────────────────────────────────────

interface WsSegment { id: string; name: string; description: string; why_priority: string }
interface WsPersona { id: string; segment_id: string; title: string; seniority: string; goals: string }

function StepTargeting({
  targetSegment,
  targetPersona,
  onChange,
}: {
  targetSegment: string
  targetPersona: string
  onChange: (seg: string, persona: string) => void
}) {
  const [segments, setSegments] = useState<WsSegment[]>([])
  const [personas, setPersonas] = useState<WsPersona[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('client_workspaces')
      .select('data')
      .eq('client_name', 'Shikenso')
      .maybeSingle()
      .then(({ data }) => {
        const ws = data?.data
        setSegments(ws?.market_design?.segments || [])
        setPersonas(ws?.market_design?.personas || [])
        setLoading(false)
      })
  }, [])

  const selectedSeg = segments.find(s => s.name === targetSegment)
  const filteredPersonas = selectedSeg
    ? personas.filter(p => p.segment_id === selectedSeg.id)
    : personas

  if (loading) return <p className="text-sm text-gray-400">Loading strategy...</p>

  return (
    <div className="space-y-4">
      <StepHeader
        title="Targeting"
        desc="Which segment and persona from your Strategy Workspace are you going after?"
      />
      {segments.length === 0 ? (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          No segments found in Strategy.{' '}
          <Link href="/strategy" className="underline font-medium">
            Fill in Strategy first →
          </Link>
        </div>
      ) : (
        <>
          <Field label="Target segment">
            <select
              value={targetSegment}
              onChange={e => onChange(e.target.value, '')}
              className={inputCls}
            >
              <option value="">Select a segment...</option>
              {segments.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </Field>

          {selectedSeg && (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              {selectedSeg.why_priority}
            </p>
          )}

          <Field label="Primary persona" hint="Who is your main outreach contact in this segment?">
            <select
              value={targetPersona}
              onChange={e => onChange(targetSegment, e.target.value)}
              className={inputCls}
              disabled={!targetSegment}
            >
              <option value="">Select a persona...</option>
              {filteredPersonas.map(p => (
                <option key={p.id} value={p.title}>
                  {p.title}{p.seniority ? ` — ${p.seniority}` : ''}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}
    </div>
  )
}

// ─── Step 3: Review & Launch ──────────────────────────────────────────────────

function StepReview({
  campaign,
  targetSegment,
  targetPersona,
}: {
  campaign: Partial<Campaign>
  targetSegment: string
  targetPersona: string
}) {
  return (
    <div className="space-y-5">
      <StepHeader
        title="Review & Launch"
        desc="Everything looks right? Click Launch to start executing this campaign."
      />
      {[
        {
          title: 'Campaign',
          rows: [
            { label: 'Name', value: campaign.name },
            { label: 'Goal', value: campaign.goal },
            { label: 'Daily new', value: `${campaign.daily_new_contacts} contacts` },
            { label: 'Follow-ups', value: `${campaign.daily_followups}/day` },
          ],
        },
        {
          title: 'Targeting',
          rows: [
            { label: 'Segment', value: targetSegment || undefined },
            { label: 'Persona', value: targetPersona || undefined },
          ],
        },
      ].map(section => (
        <div key={section.title}>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            {section.title}
          </h3>
          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
            {section.rows.map(row => (
              <div key={row.label} className="flex px-4 py-2 text-sm">
                <span className="text-gray-400 w-28 shrink-0">{row.label}</span>
                <span className="text-gray-900">
                  {row.value || <span className="text-gray-300 italic">not set</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WizardPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [campaign, setCampaign] = useState<Partial<Campaign>>({
    daily_new_contacts: 5,
    daily_followups: 10,
  })
  const [targetSegment, setTargetSegment] = useState('')
  const [targetPersona, setTargetPersona] = useState('')

  useEffect(() => {
    supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return
        setCampaign(data)
        const wd = data.wizard_data || {}
        if (wd.target_segment) setTargetSegment(wd.target_segment)
        if (wd.target_persona) setTargetPersona(wd.target_persona)
      })
  }, [id])

  const save = useCallback(
    async (s: number) => {
      setSaving(true)
      try {
        if (s === 1) {
          await supabase
            .from('campaigns')
            .update({
              name: campaign.name,
              goal: campaign.goal,
              daily_new_contacts: campaign.daily_new_contacts,
              daily_followups: campaign.daily_followups,
            })
            .eq('id', id)
        }
        if (s === 2) {
          await supabase
            .from('campaigns')
            .update({
              wizard_data: {
                target_segment: targetSegment,
                target_persona: targetPersona,
              },
            })
            .eq('id', id)
        }
      } finally {
        setSaving(false)
      }
    },
    [id, campaign, targetSegment, targetPersona]
  )

  const next = async () => {
    await save(step)
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
          <h1 className="text-xl font-bold text-gray-900">Campaign Setup</h1>
          <span className="text-sm text-gray-400">{step} / {TOTAL_STEPS}</span>
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
        {step === 2 && (
          <StepTargeting
            targetSegment={targetSegment}
            targetPersona={targetPersona}
            onChange={(seg, persona) => { setTargetSegment(seg); setTargetPersona(persona) }}
          />
        )}
        {step === 3 && (
          <StepReview
            campaign={campaign}
            targetSegment={targetSegment}
            targetPersona={targetPersona}
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
