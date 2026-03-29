'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PLAYBOOK_SECTIONS, type PlaybookSection } from '@/lib/types'

type ReviewStep = 'data' | 'input' | 'review'
type BuildingStep = 'input' | 'review'

interface WeekData {
  newCompanies: number
  totalTouchpoints: number
  replies: number
  meetings: number
  sqls: number
  noReplies: number
}

interface Qualitative {
  what_worked: string
  what_didnt: string
  surprises: string
  other: string
}

interface BuildingQualitative {
  completed: string
  unclear: string
  decisions: string
  inputs_needed: string
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
    summary: get('Weekly Summary') || get('What You Completed'),
    performance_analysis: get('Performance Analysis') || get('Key Decisions Made'),
    key_insights: get('Key Insights') || get('Open Questions'),
    risks: get('Risks') || get('System Readiness'),
    recommendations: get('Recommendations') || get('Next Week Priorities'),
    playbook_learnings: get('Playbook Learnings'),
  }
}

const blankQual: Qualitative = { what_worked: '', what_didnt: '', surprises: '', other: '' }
const blankBuildingQual: BuildingQualitative = { completed: '', unclear: '', decisions: '', inputs_needed: '' }
const blankReview: ReviewFields = {
  summary: '', performance_analysis: '', key_insights: '',
  risks: '', recommendations: '', playbook_learnings: '',
}

const ta = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none bg-white'

export default function FridayReviewPage() {
  const { id } = useParams<{ id: string }>()
  const [phase, setPhase] = useState<'building' | 'executing'>('building')

  // Executing state
  const [step, setStep] = useState<ReviewStep>('data')
  const [weekData, setWeekData] = useState<WeekData | null>(null)
  const [weekPlan, setWeekPlan] = useState<any>(null)
  const [qualitative, setQualitative] = useState<Qualitative>(blankQual)

  // Building state
  const [buildingStep, setBuildingStep] = useState<BuildingStep>('input')
  const [buildingQual, setBuildingQual] = useState<BuildingQualitative>(blankBuildingQual)

  // Shared
  const [review, setReview] = useState<ReviewFields>(blankReview)
  const [streamText, setStreamText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [pushing, setPushing] = useState(false)
  const [pushed, setPushed] = useState(false)
  const [pastReviews, setPastReviews] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const weekStart = getWeekStart()

  useEffect(() => {
    async function load() {
      const weekEnd = getWeekEnd()

      const [campRes, planRes, reportRes, tpsRes, newCompRes] = await Promise.all([
        supabase.from('campaigns').select('wizard_data').eq('id', id).single(),
        supabase.from('weekly_plans').select('*').eq('campaign_id', id).eq('week_start', weekStart).maybeSingle(),
        supabase.from('weekly_reports').select('*').eq('campaign_id', id).eq('week_start', weekStart).maybeSingle(),
        supabase.from('touchpoints').select('status').eq('campaign_id', id).gte('date', weekStart).lte('date', weekEnd),
        supabase.from('companies').select('*', { count: 'exact', head: true }).eq('campaign_id', id).gte('added_at', weekStart + 'T00:00:00'),
      ])

      const pastRes = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('campaign_id', id)
        .neq('week_start', weekStart)
        .order('week_start', { ascending: false })
      setPastReviews(pastRes.data || [])

      if (campRes.data) setPhase(campRes.data.wizard_data?.phase || 'building')
      if (planRes.data) setWeekPlan(planRes.data)

      const tps = tpsRes.data || []
      setWeekData({
        newCompanies: newCompRes.count || 0,
        totalTouchpoints: tps.length,
        replies: tps.filter((t: any) => t.status === 'replied').length,
        meetings: tps.filter((t: any) => t.status === 'meeting').length,
        sqls: 0,
        noReplies: tps.filter((t: any) => t.status === 'no_reply').length,
      })

      if (reportRes.data) {
        setExistingId(reportRes.data.id)
        const qi = reportRes.data.qualitative_input || {}
        if (qi.what_worked !== undefined) setQualitative(qi as Qualitative)
        if (qi.completed !== undefined) setBuildingQual(qi as BuildingQualitative)
        setReview({
          summary: reportRes.data.what_worked || '',
          performance_analysis: reportRes.data.performance_analysis || '',
          key_insights: reportRes.data.key_insights || '',
          risks: reportRes.data.risks || '',
          recommendations: reportRes.data.recommendations || '',
          playbook_learnings: reportRes.data.playbook_learnings || '',
        })
        if (reportRes.data.performance_analysis) {
          setStep('review')
          setBuildingStep('review')
        }
      }
    }
    load()
  }, [id, weekStart])

  const generate = async () => {
    setGenerating(true)
    setStreamText('')
    try {
      let endpoint: string
      let body: object

      if (phase === 'building') {
        endpoint = '/api/generate/building-review'
        body = { campaign_id: id, qualitative: buildingQual, week_plan: weekPlan }
      } else {
        endpoint = '/api/generate/friday-review'
        body = { campaign_id: id, week_data: weekData, week_plan: weekPlan, qualitative, sql_target: 6 }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      setBuildingStep('review')
    } finally {
      setGenerating(false)
    }
  }

  const save = async () => {
    setSaving(true)
    const qualInput = phase === 'building' ? buildingQual : qualitative
    const payload = {
      campaign_id: id,
      week_start: weekStart,
      companies_contacted: weekData?.totalTouchpoints || 0,
      replies: weekData?.replies || 0,
      meetings: weekData?.meetings || 0,
      sqls: weekData?.sqls || 0,
      what_worked: phase === 'building' ? buildingQual.completed : qualitative.what_worked,
      what_to_change: phase === 'building' ? buildingQual.unclear : qualitative.what_didnt,
      performance_analysis: review.performance_analysis,
      key_insights: review.key_insights,
      risks: review.risks,
      recommendations: review.recommendations,
      playbook_learnings: review.playbook_learnings,
      qualitative_input: qualInput,
    }
    if (existingId) {
      await supabase.from('weekly_reports').update(payload).eq('id', existingId)
    } else {
      const { data } = await supabase.from('weekly_reports').insert(payload).select().single()
      if (data) setExistingId(data.id)
    }

    // Auto-push strategic decisions from building reviews to Playbook
    if (phase === 'building' && review.performance_analysis.trim()) {
      const title = `Week of ${weekStart}: Key Decisions`
      const content = [
        review.performance_analysis,
        buildingQual.decisions ? `\nDecisions made:\n${buildingQual.decisions}` : '',
      ].filter(Boolean).join('')
      await supabase.from('playbook_entries').upsert(
        { campaign_id: id, section: 'Strategic Decisions', title, content, status: 'hypothesis' },
        { onConflict: 'campaign_id,title' }
      )
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const pushToPlaybook = async () => {
    if (!review.playbook_learnings.trim()) return
    setPushing(true)

    const blocks = review.playbook_learnings
      .split(/\*\*Learning:\*\*/i)
      .map(b => b.trim())
      .filter(Boolean)

    const entries = blocks.map(block => {
      const learningMatch = block.match(/^([\s\S]*?)(?:\*\*Section:\*\*|$)/i)
      const sectionMatch = block.match(/\*\*Section:\*\*\s*([^\n*]+)/i)
      const statusMatch = block.match(/\*\*Status:\*\*\s*([^\n*]+)/i)
      const actionMatch = block.match(/\*\*Action:\*\*\s*([\s\S]*?)$/i)

      const learning = learningMatch ? learningMatch[1].trim() : block.trim()
      const sectionRaw = sectionMatch ? sectionMatch[1].trim() : ''
      const statusRaw = statusMatch ? statusMatch[1].trim().toLowerCase() : ''
      const action = actionMatch ? actionMatch[1].trim() : ''

      const section: PlaybookSection =
        (PLAYBOOK_SECTIONS.find(s =>
          s.toLowerCase() === sectionRaw.toLowerCase() ||
          sectionRaw.toLowerCase().includes(s.toLowerCase().split(' ')[0].toLowerCase())
        ) as PlaybookSection) || 'Performance Benchmarks'

      const status: 'hypothesis' | 'in_testing' | 'locked' =
        statusRaw.includes('locked') ? 'locked'
        : statusRaw.includes('testing') ? 'in_testing'
        : 'hypothesis'

      return {
        campaign_id: id,
        section,
        title: learning.split('\n')[0].replace(/^[-•]\s*/, '').slice(0, 200) || 'Learning',
        content: [learning, action ? `Action: ${action}` : ''].filter(Boolean).join('\n\n') || null,
        status,
      }
    })

    if (entries.length > 0) {
      await supabase.from('playbook_entries').insert(entries)
    }

    setPushing(false)
    setPushed(true)
    setTimeout(() => setPushed(false), 3000)
  }

  const weekLabel = new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric',
  })

  // ── Review fields config (shared) ────────────────────────────────────────────
  const reviewFields = phase === 'building'
    ? [
        { key: 'summary' as const, label: 'What You Completed', rows: 3 },
        { key: 'performance_analysis' as const, label: 'Key Decisions Made', rows: 4 },
        { key: 'key_insights' as const, label: 'Open Questions', rows: 3 },
        { key: 'risks' as const, label: 'System Readiness', rows: 4 },
        { key: 'recommendations' as const, label: 'Next Week Priorities', rows: 4 },
      ]
    : [
        { key: 'summary' as const, label: 'Weekly Summary', rows: 3 },
        { key: 'performance_analysis' as const, label: 'Performance Analysis', rows: 5 },
        { key: 'key_insights' as const, label: 'Key Insights', rows: 4 },
        { key: 'risks' as const, label: 'Risks & Issues', rows: 3 },
        { key: 'recommendations' as const, label: 'Recommendations for Next Week', rows: 4 },
        { key: 'playbook_learnings' as const, label: 'Playbook Learnings', rows: 5, highlight: true },
      ]

  return (
    <div>
      <div className="mb-6">
        <Link href={`/campaigns/${id}`} className="text-sm text-gray-400 hover:text-gray-600">
          ← Campaign
        </Link>
        <div className="mt-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900">Friday Review</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              phase === 'building'
                ? 'bg-violet-100 text-violet-700'
                : 'bg-indigo-100 text-indigo-700'
            }`}>
              {phase === 'building' ? 'Building' : 'Executing'}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">Week of {weekLabel}</p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          BUILDING MODE
      ════════════════════════════════════════════════════════ */}
      {phase === 'building' && (
        <>
          {/* Step tabs */}
          <div className="flex gap-0 mb-8 border-b border-gray-100">
            {(['input', 'review'] as BuildingStep[]).map((s, i) => (
              <button
                key={s}
                onClick={() => setBuildingStep(s)}
                className={`text-sm px-4 py-2.5 border-b-2 -mb-px transition-colors ${
                  buildingStep === s
                    ? 'border-indigo-500 text-indigo-600 font-medium'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {i + 1}. {s === 'input' ? 'What You Did' : 'AI Review'}
              </button>
            ))}
          </div>

          {/* Step 1: What you did this week */}
          {buildingStep === 'input' && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500">
                Capture what you worked on this week. The AI will review your system build progress and set you up for next week.
              </p>

              {[
                {
                  key: 'completed' as const,
                  label: 'What did you complete?',
                  hint: 'Which sections did you finish or meaningfully advance in the Strategy Workspace?',
                },
                {
                  key: 'unclear' as const,
                  label: "What's still unclear?",
                  hint: 'Questions you couldn\'t answer, sections that need more input, things that feel shaky.',
                },
                {
                  key: 'decisions' as const,
                  label: 'Key decisions made',
                  hint: 'Strategic calls you locked in — segment priorities, ICP boundaries, messaging angles.',
                },
                {
                  key: 'inputs_needed' as const,
                  label: 'Inputs still needed',
                  hint: 'What do you need from the Shikenso team, their tools, or research to move forward?',
                },
              ].map(q => (
                <div key={q.key}>
                  <label className="block text-sm font-medium text-gray-800 mb-0.5">{q.label}</label>
                  <p className="text-xs text-gray-400 mb-1.5">{q.hint}</p>
                  <textarea
                    value={buildingQual[q.key]}
                    onChange={e => setBuildingQual(prev => ({ ...prev, [q.key]: e.target.value }))}
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

              {weekPlan && (
                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Monday&apos;s plan</p>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    {weekPlan.priorities && <p><span className="text-gray-400">Focus:</span> {weekPlan.priorities}</p>}
                    {weekPlan.expected_outcomes && <p><span className="text-gray-400">Planned deliverables:</span> {weekPlan.expected_outcomes}</p>}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
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
                    '✦ Generate Building Review with AI'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: AI Review (building) */}
          {buildingStep === 'review' && (
            <div className="space-y-5">
              {reviewFields.map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-800 mb-0.5">{f.label}</label>
                  <textarea
                    value={review[f.key]}
                    onChange={e => setReview(prev => ({ ...prev, [f.key]: e.target.value }))}
                    rows={f.rows}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none bg-white"
                  />
                </div>
              ))}

              <div className="flex items-center gap-3 pt-2 border-t border-gray-100 flex-wrap">
                <button
                  onClick={save}
                  disabled={saving}
                  className="bg-gray-900 text-white text-sm px-5 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Review'}
                </button>
                <ShareButton campaignId={id} type="review" />
                <button
                  onClick={() => { setBuildingStep('input'); setStreamText('') }}
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
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          EXECUTING MODE
      ════════════════════════════════════════════════════════ */}
      {phase === 'executing' && (
        <>
          {/* Step tabs */}
          <div className="flex gap-0 mb-8 border-b border-gray-100">
            {(['data', 'input', 'review'] as ReviewStep[]).map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`text-sm px-4 py-2.5 border-b-2 -mb-px transition-colors ${
                  step === s
                    ? 'border-indigo-500 text-indigo-600 font-medium'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {i + 1}. {['Week Data', 'Your Input', 'AI Review'][i]}
              </button>
            ))}
          </div>

          {/* Step 1: Week Data */}
          {step === 'data' && weekData && (
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Enter your numbers for the week.</p>
                <details className="group">
                  <summary className="text-xs text-indigo-500 hover:text-indigo-700 cursor-pointer list-none">
                    Where to find these in HubSpot ▸
                  </summary>
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 space-y-1">
                    <p><span className="font-medium text-gray-600">Touchpoints sent</span> — Activities → filter by this week, count Emails + LinkedIn tasks</p>
                    <p><span className="font-medium text-gray-600">Replies</span> — Conversations → Inbox, filter by date; or Emails → Replies</p>
                    <p><span className="font-medium text-gray-600">Meetings booked</span> — Contacts or Deals → filter by Meeting booked this week</p>
                    <p><span className="font-medium text-gray-600">SQLs</span> — Deals → filter by stage "SQL" / "Qualified", moved this week</p>
                    <p><span className="font-medium text-gray-600">New companies</span> — Companies → filter by Created date this week</p>
                  </div>
                </details>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'totalTouchpoints', label: 'Touchpoints sent' },
                  { key: 'replies', label: 'Replies' },
                  { key: 'meetings', label: 'Meetings booked' },
                  { key: 'sqls', label: 'SQLs (qualified meetings)', accent: true },
                  { key: 'newCompanies', label: 'New companies prospected' },
                  { key: 'noReplies', label: 'No replies' },
                ].map(field => (
                  <div key={field.key}>
                    <label className={`block text-xs font-medium mb-1.5 ${
                      (field as any).accent ? 'text-indigo-700' : 'text-gray-500'
                    }`}>
                      {field.label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={weekData[field.key as keyof WeekData]}
                      onChange={e => setWeekData(prev => prev
                        ? { ...prev, [field.key]: Number(e.target.value) }
                        : prev
                      )}
                      className={`w-full text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                        (field as any).accent
                          ? 'border-indigo-200 bg-indigo-50/40'
                          : 'border-gray-200 bg-white'
                      }`}
                    />
                  </div>
                ))}
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

          {/* Step 2: Qualitative input */}
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

          {/* Step 3: AI Review */}
          {step === 'review' && (
            <div className="space-y-5">
              {reviewFields.map(f => (
                <div key={f.key}>
                  <div className="flex items-center gap-2 mb-1">
                    <label className={`text-sm font-medium ${(f as any).highlight ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {f.label}
                    </label>
                    {(f as any).highlight && (
                      <span className="text-xs text-indigo-400">→ goes to playbook</span>
                    )}
                  </div>
                  <textarea
                    value={review[f.key]}
                    onChange={e => setReview(prev => ({ ...prev, [f.key]: e.target.value }))}
                    rows={f.rows}
                    className={`w-full text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 resize-none ${
                      (f as any).highlight
                        ? 'border-indigo-200 focus:ring-indigo-200 bg-indigo-50/40'
                        : 'border-gray-200 focus:ring-indigo-200 bg-white'
                    }`}
                  />
                </div>
              ))}

              <div className="flex items-center gap-3 pt-2 border-t border-gray-100 flex-wrap">
                <button
                  onClick={save}
                  disabled={saving}
                  className="bg-gray-900 text-white text-sm px-5 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Review'}
                </button>
                <button
                  onClick={pushToPlaybook}
                  disabled={pushing || !review.playbook_learnings.trim()}
                  className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-40"
                >
                  {pushing ? 'Pushing...' : pushed ? '✓ Added to Playbook' : '→ Push to Playbook'}
                </button>
                <ShareButton campaignId={id} type="review" />
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
        </>
      )}

      {/* Past reviews */}
      {pastReviews.length > 0 && (
        <div className="mt-10 border-t border-gray-100 pt-6">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-4"
          >
            {showHistory ? '▾' : '▸'} Past reviews ({pastReviews.length})
          </button>
          {showHistory && (
            <div className="space-y-3">
              {pastReviews.map(r => (
                <PastReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ShareButton({ campaignId, type }: { campaignId: string; type: 'plan' | 'review' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    const url = `${window.location.origin}/share/${type}/${campaignId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="text-sm text-gray-400 hover:text-gray-600">
      {copied ? '✓ Link copied' : '↗ Share'}
    </button>
  )
}

function PastReviewCard({ review }: { review: any }) {
  const [expanded, setExpanded] = useState(false)
  const label = new Date(review.week_start + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Week of {label}</span>
          <span className="text-xs text-gray-400">
            {review.companies_contacted > 0
              ? `${review.companies_contacted} touches · ${review.replies} replies · ${review.meetings} meetings · ${review.sqls || 0} SQLs`
              : review.what_worked ? review.what_worked.slice(0, 60) + '…' : 'Design week'
            }
          </span>
        </div>
        <span className="text-gray-300 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3 text-sm">
          {review.performance_analysis && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Analysis</p>
              <p className="text-gray-700 whitespace-pre-wrap">{review.performance_analysis}</p>
            </div>
          )}
          {review.key_insights && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Key insights / Open questions</p>
              <p className="text-gray-700 whitespace-pre-wrap">{review.key_insights}</p>
            </div>
          )}
          {review.recommendations && (
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Recommendations / Next week</p>
              <p className="text-gray-700 whitespace-pre-wrap">{review.recommendations}</p>
            </div>
          )}
          {review.playbook_learnings && (
            <div>
              <p className="text-xs text-indigo-500 mb-0.5">Playbook learnings</p>
              <p className="text-gray-700 whitespace-pre-wrap">{review.playbook_learnings}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
