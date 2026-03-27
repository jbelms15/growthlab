'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface PlanFields {
  priorities: string
  target_segment: string
  experiment: string
  daily_new_contacts: number
  daily_followups: number
  channel_focus: string
  messaging_angle: string
  expected_outcomes: string
}

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function parsePlan(text: string, defaultNew = 5, defaultFollowup = 10): PlanFields {
  const get = (header: string) => {
    const regex = new RegExp(`##\\s*${header}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|$)`, 'i')
    const match = text.match(regex)
    return match ? match[1].trim() : ''
  }
  const targets = get('Daily Targets')
  const newMatch = targets.match(/new contacts[^\d]*(\d+)/i)
  const followMatch = targets.match(/follow.?ups[^\d]*(\d+)/i)
  const channelMatch = targets.match(/channel[:\s]+([^\n]+)/i)
  return {
    priorities: get('Top 3 Priorities'),
    target_segment: get('Target Segment'),
    experiment: get('Experiment'),
    daily_new_contacts: newMatch ? parseInt(newMatch[1]) : defaultNew,
    daily_followups: followMatch ? parseInt(followMatch[1]) : defaultFollowup,
    channel_focus: channelMatch ? channelMatch[1].trim() : targets,
    messaging_angle: get('Messaging Angle'),
    expected_outcomes: get('Expected Outcomes'),
  }
}

const ta = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none bg-white'
const inp = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-0.5">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

export default function MondayPlanPage() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<any>(null)
  const [lastReview, setLastReview] = useState<any>(null)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [plan, setPlan] = useState<PlanFields>({
    priorities: '',
    target_segment: '',
    experiment: '',
    daily_new_contacts: 5,
    daily_followups: 10,
    channel_focus: '',
    messaging_angle: '',
    expected_outcomes: '',
  })
  const [streamText, setStreamText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pastPlans, setPastPlans] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const weekStart = getWeekStart()

  useEffect(() => {
    async function load() {
      const [campRes, planRes, reviewRes] = await Promise.all([
        supabase.from('campaigns').select('name, goal, daily_new_contacts, daily_followups').eq('id', id).single(),
        supabase.from('weekly_plans').select('*').eq('campaign_id', id).eq('week_start', weekStart).maybeSingle(),
        supabase.from('weekly_reports').select('recommendations, key_insights, week_start').eq('campaign_id', id).order('week_start', { ascending: false }).limit(1).maybeSingle(),
      ])
      const pastRes = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('campaign_id', id)
        .neq('week_start', weekStart)
        .order('week_start', { ascending: false })
      setPastPlans(pastRes.data || [])

      if (campRes.data) setCampaign(campRes.data)
      if (reviewRes.data) setLastReview(reviewRes.data)
      if (planRes.data) {
        setExistingId(planRes.data.id)
        setPlan({
          priorities: planRes.data.priorities || '',
          target_segment: planRes.data.target_segment || '',
          experiment: planRes.data.experiment || '',
          daily_new_contacts: planRes.data.daily_new_contacts || 5,
          daily_followups: planRes.data.daily_followups || 10,
          channel_focus: planRes.data.channel_focus || '',
          messaging_angle: planRes.data.messaging_angle || '',
          expected_outcomes: planRes.data.expected_outcomes || '',
        })
      }
    }
    load()
  }, [id, weekStart])

  const generate = async () => {
    setGenerating(true)
    setStreamText('')
    try {
      const response = await fetch('/api/generate/monday-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: id }),
      })
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value)
        setStreamText(full)
      }
      setPlan(parsePlan(full, campaign?.daily_new_contacts, campaign?.daily_followups))
      setStreamText('')
    } finally {
      setGenerating(false)
    }
  }

  const save = async () => {
    setSaving(true)
    const payload = { campaign_id: id, week_start: weekStart, ...plan }
    if (existingId) {
      await supabase.from('weekly_plans').update(plan).eq('id', existingId)
    } else {
      const { data } = await supabase.from('weekly_plans').insert(payload).select().single()
      if (data) setExistingId(data.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const weekLabel = new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div>
      <div className="mb-6">
        <Link href={`/campaigns/${id}`} className="text-sm text-gray-400 hover:text-gray-600">
          ← Campaign
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monday Plan</h1>
            <p className="text-sm text-gray-400 mt-0.5">{weekLabel}</p>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
          >
            {generating ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                Generating...
              </>
            ) : (
              '✦ Generate with AI'
            )}
          </button>
        </div>
      </div>

      {/* Last week's context banner */}
      {lastReview?.recommendations && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
            From last Friday's review
          </p>
          <p className="text-sm text-amber-800">{lastReview.recommendations}</p>
        </div>
      )}

      {/* Streaming preview */}
      {streamText && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-sm text-gray-500 font-mono whitespace-pre-wrap max-h-52 overflow-y-auto">
          {streamText}
          <span className="inline-block w-0.5 h-4 bg-indigo-400 animate-pulse ml-0.5 align-middle" />
        </div>
      )}

      {!generating && (
        <div className="space-y-5">
          <Field label="Top 3 Priorities" hint="What must happen this week for it to be a success?">
            <textarea
              value={plan.priorities}
              onChange={e => setPlan(p => ({ ...p, priorities: e.target.value }))}
              className={ta}
              rows={4}
              placeholder={'1. ...\n2. ...\n3. ...'}
            />
          </Field>

          <Field label="Target Segment" hint="Which segment are you focusing on this week and why?">
            <textarea
              value={plan.target_segment}
              onChange={e => setPlan(p => ({ ...p, target_segment: e.target.value }))}
              className={ta}
              rows={2}
            />
          </Field>

          <Field label="Experiment" hint="One clear, testable hypothesis. What are you testing and what do you expect to learn?">
            <textarea
              value={plan.experiment}
              onChange={e => setPlan(p => ({ ...p, experiment: e.target.value }))}
              className={ta}
              rows={2}
            />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="New contacts / day">
              <input
                type="number"
                min={1}
                value={plan.daily_new_contacts}
                onChange={e => setPlan(p => ({ ...p, daily_new_contacts: Number(e.target.value) }))}
                className={inp}
              />
            </Field>
            <Field label="Follow-ups / day">
              <input
                type="number"
                min={1}
                value={plan.daily_followups}
                onChange={e => setPlan(p => ({ ...p, daily_followups: Number(e.target.value) }))}
                className={inp}
              />
            </Field>
            <Field label="Channel focus">
              <input
                type="text"
                value={plan.channel_focus}
                onChange={e => setPlan(p => ({ ...p, channel_focus: e.target.value }))}
                className={inp}
                placeholder="e.g. LinkedIn primary"
              />
            </Field>
          </div>

          <Field
            label="Messaging Angle"
            hint="Specific angle tied to this week's segment and pain — not generic."
          >
            <textarea
              value={plan.messaging_angle}
              onChange={e => setPlan(p => ({ ...p, messaging_angle: e.target.value }))}
              className={ta}
              rows={3}
            />
          </Field>

          <Field label="Expected Outcomes" hint="What does success look like by Friday? Be specific with numbers.">
            <textarea
              value={plan.expected_outcomes}
              onChange={e => setPlan(p => ({ ...p, expected_outcomes: e.target.value }))}
              className={ta}
              rows={2}
            />
          </Field>

          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <button
              onClick={save}
              disabled={saving}
              className="bg-gray-900 text-white text-sm px-5 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Plan'}
            </button>
            <Link
              href={`/campaigns/${id}/execution`}
              className="text-sm text-indigo-600 hover:underline"
            >
              → Start executing
            </Link>
            <Link
              href={`/campaigns/${id}/review`}
              className="text-sm text-gray-400 hover:text-gray-600 ml-auto"
            >
              Friday Review →
            </Link>
          </div>
        </div>
      )}

      {/* Past plans */}
      {pastPlans.length > 0 && (
        <div className="mt-10 border-t border-gray-100 pt-6">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-4"
          >
            {showHistory ? '▾' : '▸'} Past plans ({pastPlans.length})
          </button>
          {showHistory && (
            <div className="space-y-3">
              {pastPlans.map(p => (
                <PastPlanCard key={p.id} plan={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PastPlanCard({ plan }: { plan: any }) {
  const [expanded, setExpanded] = useState(false)
  const label = new Date(plan.week_start + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  const priorities = plan.priorities
    ? plan.priorities.split('\n').map((l: string) => l.replace(/^\d+\.\s*/, '').trim()).filter(Boolean).slice(0, 3)
    : []

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
      >
        <span className="text-sm font-medium text-gray-700">Week of {label}</span>
        <span className="text-gray-300 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3 text-sm">
          {priorities.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Priorities</p>
              <ol className="space-y-0.5">
                {priorities.map((p: string, i: number) => (
                  <li key={i} className="flex gap-2 text-gray-700">
                    <span className="text-gray-300">{i + 1}.</span> {p}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {plan.target_segment && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Focus segment</p>
              <p className="text-gray-700">{plan.target_segment}</p>
            </div>
          )}
          {plan.experiment && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Experiment</p>
              <p className="text-gray-700">{plan.experiment}</p>
            </div>
          )}
          {plan.expected_outcomes && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Expected outcomes</p>
              <p className="text-gray-700">{plan.expected_outcomes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
