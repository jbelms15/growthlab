'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type ReviewStep = 'data' | 'input' | 'review'

interface WeekData {
  newCompanies: number
  totalTouchpoints: number
  replies: number
  meetings: number
  noReplies: number
}

interface Qualitative {
  what_worked: string
  what_didnt: string
  surprises: string
  other: string
}

interface ReviewFields {
  summary: string
  performance_analysis: string
  key_insights: string
  risks: string
  recommendations: string
  playbook_learnings: string
}

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getWeekEnd() {
  const d = new Date()
  const day = d.getDay()
  const daysToSunday = day === 0 ? 0 : 7 - day
  d.setDate(d.getDate() + daysToSunday)
  return d.toISOString().split('T')[0]
}

function parseReview(text: string): ReviewFields {
  const get = (header: string) => {
    const regex = new RegExp(`##\\s*${header}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n##|$)`, 'i')
    const match = text.match(regex)
    return match ? match[1].trim() : ''
  }
  return {
    summary: get('Weekly Summary'),
    performance_analysis: get('Performance Analysis'),
    key_insights: get('Key Insights'),
    risks: get('Risks'),
    recommendations: get('Recommendations'),
    playbook_learnings: get('Playbook Learnings'),
  }
}

const blankQual: Qualitative = { what_worked: '', what_didnt: '', surprises: '', other: '' }
const blankReview: ReviewFields = {
  summary: '', performance_analysis: '', key_insights: '',
  risks: '', recommendations: '', playbook_learnings: '',
}

const ta = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none bg-white'

export default function FridayReviewPage() {
  const { id } = useParams<{ id: string }>()
  const [step, setStep] = useState<ReviewStep>('data')
  const [weekData, setWeekData] = useState<WeekData | null>(null)
  const [weekPlan, setWeekPlan] = useState<any>(null)
  const [qualitative, setQualitative] = useState<Qualitative>(blankQual)
  const [review, setReview] = useState<ReviewFields>(blankReview)
  const [streamText, setStreamText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)

  const weekStart = getWeekStart()

  useEffect(() => {
    async function load() {
      const weekEnd = getWeekEnd()

      const [planRes, reportRes, tpsRes, newCompRes] = await Promise.all([
        supabase.from('weekly_plans').select('*').eq('campaign_id', id).eq('week_start', weekStart).maybeSingle(),
        supabase.from('weekly_reports').select('*').eq('campaign_id', id).eq('week_start', weekStart).maybeSingle(),
        supabase.from('touchpoints').select('status').eq('campaign_id', id).gte('date', weekStart).lte('date', weekEnd),
        supabase.from('companies').select('*', { count: 'exact', head: true }).eq('campaign_id', id).gte('added_at', weekStart + 'T00:00:00'),
      ])

      if (planRes.data) setWeekPlan(planRes.data)

      const tps = tpsRes.data || []
      setWeekData({
        newCompanies: newCompRes.count || 0,
        totalTouchpoints: tps.length,
        replies: tps.filter((t: any) => t.status === 'replied').length,
        meetings: tps.filter((t: any) => t.status === 'meeting').length,
        noReplies: tps.filter((t: any) => t.status === 'no_reply').length,
      })

      if (reportRes.data) {
        setExistingId(reportRes.data.id)
        const qi = reportRes.data.qualitative_input || {}
        if (qi.what_worked !== undefined) setQualitative(qi as Qualitative)
        setReview({
          summary: reportRes.data.what_worked || '',
          performance_analysis: reportRes.data.performance_analysis || '',
          key_insights: reportRes.data.key_insights || '',
          risks: reportRes.data.risks || '',
          recommendations: reportRes.data.recommendations || '',
          playbook_learnings: reportRes.data.playbook_learnings || '',
        })
        if (reportRes.data.performance_analysis) setStep('review')
      }
    }
    load()
  }, [id, weekStart])

  const generate = async () => {
    setGenerating(true)
    setStreamText('')
    try {
      const response = await fetch('/api/generate/friday-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: id,
          week_data: weekData,
          week_plan: weekPlan,
          qualitative,
        }),
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
      setReview(parseReview(full))
      setStreamText('')
      setStep('review')
    } finally {
      setGenerating(false)
    }
  }

  const save = async () => {
    setSaving(true)
    const payload = {
      campaign_id: id,
      week_start: weekStart,
      companies_contacted: weekData?.totalTouchpoints || 0,
      replies: weekData?.replies || 0,
      meetings: weekData?.meetings || 0,
      what_worked: qualitative.what_worked,
      what_to_change: qualitative.what_didnt,
      performance_analysis: review.performance_analysis,
      key_insights: review.key_insights,
      risks: review.risks,
      recommendations: review.recommendations,
      playbook_learnings: review.playbook_learnings,
      qualitative_input: qualitative,
    }
    if (existingId) {
      await supabase.from('weekly_reports').update(payload).eq('id', existingId)
    } else {
      const { data } = await supabase.from('weekly_reports').insert(payload).select().single()
      if (data) setExistingId(data.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const replyRate =
    weekData && weekData.totalTouchpoints > 0
      ? Math.round(((weekData.replies + weekData.meetings) / weekData.totalTouchpoints) * 100)
      : 0

  const weekLabel = new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric',
  })

  const steps: ReviewStep[] = ['data', 'input', 'review']
  const stepLabels = ['Week Data', 'Your Input', 'AI Review']

  return (
    <div>
      <div className="mb-6">
        <Link href={`/campaigns/${id}`} className="text-sm text-gray-400 hover:text-gray-600">
          ← Campaign
        </Link>
        <div className="mt-2">
          <h1 className="text-2xl font-bold text-gray-900">Friday Review</h1>
          <p className="text-sm text-gray-400 mt-0.5">Week of {weekLabel}</p>
        </div>
      </div>

      {/* Step tabs */}
      <div className="flex gap-0 mb-8 border-b border-gray-100">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`text-sm px-4 py-2.5 border-b-2 -mb-px transition-colors ${
              step === s
                ? 'border-indigo-500 text-indigo-600 font-medium'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {i + 1}. {stepLabels[i]}
          </button>
        ))}
      </div>

      {/* ── Step 1: Week Data ── */}
      {step === 'data' && weekData && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-3">
            <DataCard label="Touchpoints" value={weekData.totalTouchpoints}
              sub={weekPlan ? `target: ${(weekPlan.daily_new_contacts + weekPlan.daily_followups) * 5}` : undefined} />
            <DataCard label="Replies" value={weekData.replies} />
            <DataCard label="Meetings" value={weekData.meetings} accent={weekData.meetings > 0} />
            <DataCard label="Reply rate" value={`${replyRate}%`} accent={replyRate >= 10} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DataCard label="New companies added" value={weekData.newCompanies} />
            <DataCard label="No replies" value={weekData.noReplies} />
          </div>

          {weekPlan ? (
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                vs. Monday Plan
              </p>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Target segment', value: weekPlan.target_segment },
                  { label: 'Experiment', value: weekPlan.experiment },
                  { label: 'Expected outcomes', value: weekPlan.expected_outcomes },
                ].map(row => row.value && (
                  <div key={row.label} className="flex gap-3">
                    <span className="text-gray-400 w-32 shrink-0">{row.label}</span>
                    <span className="text-gray-700">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No Monday Plan was set for this week.</p>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setStep('input')}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Next: Add your input →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Qualitative input ── */}
      {step === 'input' && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500">
            Answer these quickly — the AI uses your input alongside the week&apos;s data to generate the review.
          </p>

          {[
            {
              key: 'what_worked' as const,
              label: 'What worked this week?',
              hint: 'Messaging angle, channel, specific companies, timing, conversations...',
            },
            {
              key: 'what_didnt' as const,
              label: "What didn't work?",
              hint: 'No replies, wrong segment, weak hook, low volume, bad timing...',
            },
            {
              key: 'surprises' as const,
              label: 'Any surprises or unexpected results?',
              hint: 'Positive or negative — anything that stood out or changed your thinking.',
            },
            {
              key: 'other' as const,
              label: 'Anything else to capture?',
              hint: 'Blockers, conversations worth noting, context for next week.',
            },
          ].map(q => (
            <div key={q.key}>
              <label className="block text-sm font-medium text-gray-800 mb-0.5">{q.label}</label>
              <p className="text-xs text-gray-400 mb-1.5">{q.hint}</p>
              <textarea
                value={qualitative[q.key]}
                onChange={e => setQualitative(prev => ({ ...prev, [q.key]: e.target.value }))}
                rows={2}
                className={ta}
              />
            </div>
          ))}

          {streamText && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500 font-mono whitespace-pre-wrap max-h-52 overflow-y-auto">
              {streamText}
              <span className="inline-block w-0.5 h-4 bg-indigo-400 animate-pulse ml-0.5 align-middle" />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setStep('data')}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              ← Back
            </button>
            <button
              onClick={generate}
              disabled={generating}
              className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-5 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-60"
            >
              {generating ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  Generating review...
                </>
              ) : (
                '✦ Generate Review with AI'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: AI Review (editable) ── */}
      {step === 'review' && (
        <div className="space-y-5">
          {[
            { key: 'summary' as const, label: 'Weekly Summary', rows: 3 },
            { key: 'performance_analysis' as const, label: 'Performance Analysis', rows: 5 },
            { key: 'key_insights' as const, label: 'Key Insights', rows: 4 },
            { key: 'risks' as const, label: 'Risks & Issues', rows: 3 },
            { key: 'recommendations' as const, label: 'Recommendations for Next Week', rows: 4 },
            { key: 'playbook_learnings' as const, label: 'Playbook Learnings', rows: 5, highlight: true },
          ].map(f => (
            <div key={f.key}>
              <div className="flex items-center gap-2 mb-1">
                <label className={`text-sm font-medium ${f.highlight ? 'text-indigo-700' : 'text-gray-800'}`}>
                  {f.label}
                </label>
                {f.highlight && (
                  <span className="text-xs text-indigo-400">→ goes to playbook</span>
                )}
              </div>
              <textarea
                value={review[f.key]}
                onChange={e => setReview(prev => ({ ...prev, [f.key]: e.target.value }))}
                rows={f.rows}
                className={`w-full text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 resize-none ${
                  f.highlight
                    ? 'border-indigo-200 focus:ring-indigo-200 bg-indigo-50/40'
                    : 'border-gray-200 focus:ring-indigo-200 bg-white'
                }`}
              />
            </div>
          ))}

          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <button
              onClick={save}
              disabled={saving}
              className="bg-gray-900 text-white text-sm px-5 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Review'}
            </button>
            <button
              onClick={() => { setStep('input'); setStreamText('') }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              ↺ Regenerate
            </button>
            <Link
              href={`/campaigns/${id}/plan`}
              className="text-sm text-indigo-600 hover:underline ml-auto"
            >
              → Monday Plan
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function DataCard({
  label, value, sub, accent,
}: {
  label: string; value: string | number; sub?: string; accent?: boolean
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className={`text-2xl font-bold ${accent ? 'text-green-600' : 'text-gray-900'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-300 mt-0.5">{sub}</div>}
    </div>
  )
}
