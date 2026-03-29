'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const SQL_TARGET = 6

const PHASES = [
  { id: 'foundation',    label: 'Foundation',    timeline: 'Weeks 1–2' },
  { id: 'market_design', label: 'Market Design', timeline: 'Weeks 2–3' },
  { id: 'signals',       label: 'Signals',       timeline: 'Week 3'    },
  { id: 'messaging',     label: 'Messaging',     timeline: 'Weeks 3–4' },
  { id: 'competitive',   label: 'Competitive',   timeline: 'Ongoing'   },
  { id: 'objections',    label: 'Objections',    timeline: 'Ongoing'   },
  { id: 'sequences',     label: 'Sequences',     timeline: 'Week 4'    },
  { id: 'launch_plan',   label: 'Launch Plan',   timeline: 'Weeks 5–6' },
]

// Returns { done: boolean, detail: string } — done = any content, detail = depth summary
function getSectionStatus(data: any, id: string): { done: boolean; detail: string } {
  switch (id) {
    case 'foundation': {
      const filled = Object.values(data.foundation || {}).filter((v: any) => (v ?? '').trim?.().length > 0).length
      return { done: filled > 0, detail: filled > 0 ? `${filled}/4 fields` : '' }
    }
    case 'market_design': {
      const segs = data.market_design?.segments?.length ?? 0
      const personas = data.market_design?.personas?.length ?? 0
      const hasIcp = Object.values(data.market_design?.icp || {}).some((v: any) => (v ?? '').trim?.().length > 0)
      const done = hasIcp || segs > 0 || personas > 0
      const parts = [hasIcp && 'ICP', segs > 0 && `${segs} segments`, personas > 0 && `${personas} personas`].filter(Boolean)
      return { done, detail: parts.join(', ') }
    }
    case 'signals': {
      const count = data.signals?.signal_types?.length ?? 0
      const hasCriteria = !!(data.signals?.qualification_criteria?.trim())
      return { done: count > 0 || hasCriteria, detail: count > 0 ? `${count} signals` : hasCriteria ? 'criteria set' : '' }
    }
    case 'messaging': {
      const matrix = data.messaging?.matrix?.length ?? 0
      const sls = data.messaging?.subject_lines?.length ?? 0
      return { done: matrix > 0 || sls > 0, detail: [matrix > 0 && `${matrix} messages`, sls > 0 && `${sls} subject lines`].filter(Boolean).join(', ') }
    }
    case 'competitive': {
      const count = data.competitive?.competitors?.length ?? 0
      return { done: count > 0 || !!(data.competitive?.positioning_notes?.trim()), detail: count > 0 ? `${count} competitors` : '' }
    }
    case 'objections': {
      const count = data.objections?.objections?.length ?? 0
      return { done: count > 0, detail: count > 0 ? `${count} objections` : '' }
    }
    case 'sequences': {
      const count = data.sequences?.steps?.length ?? 0
      return { done: count > 0, detail: count > 0 ? `${count} steps` : '' }
    }
    case 'launch_plan': {
      const weeks = data.launch_plan?.weekly_targets?.length ?? 0
      const hasMetrics = !!(data.launch_plan?.success_metrics?.trim())
      return { done: weeks > 0 || hasMetrics, detail: [weeks > 0 && `${weeks} weeks planned`, hasMetrics && 'metrics set'].filter(Boolean).join(', ') }
    }
    default: return { done: false, detail: '' }
  }
}

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getMonthStart() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  // Campaign
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [phase, setPhase] = useState<'building' | 'executing'>('building')
  const [phaseToggling, setPhaseToggling] = useState(false)
  // Executing mode
  const [monthlySQLs, setMonthlySQLs] = useState(0)
  const [monthlyMeetings, setMonthlyMeetings] = useState(0)
  const [weekPlan, setWeekPlan] = useState<any>(null)
  const [lastReview, setLastReview] = useState<any>(null)
  // Building mode
  const [sectionStatus, setSectionStatus] = useState<{ id: string; label: string; timeline: string; done: boolean; detail: string }[]>([])

  const weekStart = getWeekStart()
  const monthStart = getMonthStart()

  useEffect(() => {
    async function load() {
      const { data: camp } = await supabase
        .from('campaigns')
        .select('id, name, wizard_data')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (camp) {
        setCampaignId(camp.id)
        const campPhase = camp.wizard_data?.phase || 'building'
        setPhase(campPhase)

        const [planRes, reviewRes, reportsRes, wsRes] = await Promise.all([
          supabase
            .from('weekly_plans')
            .select('priorities, target_segment, experiment, expected_outcomes')
            .eq('campaign_id', camp.id)
            .eq('week_start', weekStart)
            .maybeSingle(),
          supabase
            .from('weekly_reports')
            .select('recommendations, week_start')
            .eq('campaign_id', camp.id)
            .order('week_start', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('weekly_reports')
            .select('sqls, meetings')
            .eq('campaign_id', camp.id)
            .gte('week_start', monthStart),
          supabase
            .from('client_workspaces')
            .select('data')
            .eq('client_name', 'Shikenso')
            .maybeSingle(),
        ])

        if (planRes.data) setWeekPlan(planRes.data)
        if (reviewRes.data) setLastReview(reviewRes.data)

        const reports = reportsRes.data || []
        setMonthlySQLs(reports.reduce((sum: number, r: any) => sum + (r.sqls || 0), 0))
        setMonthlyMeetings(reports.reduce((sum: number, r: any) => sum + (r.meetings || 0), 0))

        const ws = wsRes.data?.data || {}
        setSectionStatus(PHASES.map(p => ({ ...p, ...getSectionStatus(ws, p.id) })))
      }

      setLoading(false)
    }
    load()
  }, [weekStart, monthStart])

  const togglePhase = async () => {
    if (!campaignId) return
    const newPhase = phase === 'building' ? 'executing' : 'building'
    setPhaseToggling(true)
    const { data: camp } = await supabase
      .from('campaigns')
      .select('wizard_data')
      .eq('id', campaignId)
      .single()
    await supabase
      .from('campaigns')
      .update({ wizard_data: { ...(camp?.wizard_data || {}), phase: newPhase } })
      .eq('id', campaignId)
    setPhase(newPhase)
    setPhaseToggling(false)
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' })
  const sqlProgress = Math.min((monthlySQLs / SQL_TARGET) * 100, 100)
  const meetingToSQL = monthlyMeetings > 0
    ? Math.round((monthlySQLs / monthlyMeetings) * 100)
    : null

  const completedCount = sectionStatus.filter(s => s.done).length
  const allComplete = completedCount === PHASES.length

  // Week counter + pace (building mode)
  // campaign created_at not loaded here — derive from weekStart of first weekly_report or just use a fixed launch target of 6 weeks
  const LAUNCH_TARGET_WEEKS = 6
  // Estimate current build week from section completion: roughly how far along
  const estimatedWeek = Math.max(1, Math.round((completedCount / PHASES.length) * LAUNCH_TARGET_WEEKS) + (completedCount === 0 ? 1 : 0))
  const sectionsPerWeekNeeded = (PHASES.length - completedCount) / Math.max(1, LAUNCH_TARGET_WEEKS - estimatedWeek + 1)
  const onPace = sectionsPerWeekNeeded <= 1.5

  // Building mode plan fields (repurposed)
  const buildingFocusAreas = weekPlan?.priorities || null
  const buildingDeliverables = weekPlan?.expected_outcomes || null

  // Executing mode priorities
  const execPriorities = weekPlan?.priorities
    ? weekPlan.priorities
        .split('\n')
        .map((l: string) => l.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 3)
    : []

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div className="space-y-5">
      {/* Header + phase toggle */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{dateStr}</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">GrowthLab</h1>
        </div>
        {campaignId && (
          <button
            onClick={togglePhase}
            disabled={phaseToggling}
            className="flex items-center gap-1 text-xs border border-gray-200 rounded-full px-1 py-1 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <span className={`px-2.5 py-1 rounded-full transition-colors ${
              phase === 'building' ? 'bg-indigo-600 text-white' : 'text-gray-400'
            }`}>
              Building
            </span>
            <span className={`px-2.5 py-1 rounded-full transition-colors ${
              phase === 'executing' ? 'bg-indigo-600 text-white' : 'text-gray-400'
            }`}>
              Executing
            </span>
          </button>
        )}
      </div>

      {/* ── BUILDING MODE ── */}
      {phase === 'building' && (
        <>
          {/* System Build Progress */}
          <div className="border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  System Build Progress
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {completedCount}
                  <span className="text-xl font-normal text-gray-400"> / {PHASES.length} sections</span>
                </p>
                {!allComplete && (
                  <p className={`text-xs mt-1 font-medium ${onPace ? 'text-green-600' : 'text-amber-600'}`}>
                    ~Week {estimatedWeek} of {LAUNCH_TARGET_WEEKS} · {onPace ? 'on pace' : 'behind pace'} for launch
                  </p>
                )}
              </div>
              {allComplete ? (
                <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium mt-1">
                  Ready to launch ✓
                </span>
              ) : (
                <Link
                  href="/strategy"
                  className="text-xs text-indigo-500 hover:text-indigo-700 mt-1"
                >
                  Open Strategy →
                </Link>
              )}
            </div>

            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
              <div
                className={`h-full rounded-full transition-all ${
                  allComplete ? 'bg-green-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${(completedCount / PHASES.length) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {sectionStatus.map(s => (
                <div key={s.id} className="flex items-start gap-2 text-sm">
                  {s.done ? (
                    <span className="text-green-500 shrink-0 mt-px">✓</span>
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 shrink-0 inline-block mt-1" />
                  )}
                  <div className="min-w-0">
                    <span className={s.done ? 'text-gray-700' : 'text-gray-400'}>{s.label}</span>
                    {s.done && s.detail ? (
                      <p className="text-xs text-gray-400">{s.detail}</p>
                    ) : !s.done ? (
                      <p className="text-xs text-gray-300">{s.timeline}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {allComplete && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-green-700 font-medium">
                  System complete — ready to start outreach.
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Switch to <button onClick={togglePhase} className="text-indigo-500 hover:underline">Executing mode</button> to track results.
                </p>
              </div>
            )}
          </div>

          {/* This week's building plan */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">This week</p>
              {campaignId && (
                <Link
                  href={`/campaigns/${campaignId}/plan`}
                  className="text-xs text-indigo-500 hover:text-indigo-700"
                >
                  {weekPlan ? 'Edit plan →' : 'Set plan →'}
                </Link>
              )}
            </div>
            <div className="px-5 py-4">
              {buildingFocusAreas ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">Focus Areas</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{buildingFocusAreas}</p>
                  </div>
                  {buildingDeliverables && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-1">Deliverables by Friday</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{buildingDeliverables}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No plan set — what will you build this week?</p>
              )}
            </div>
          </div>

          {/* Plan / Review links */}
          {campaignId ? (
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/campaigns/${campaignId}/plan`}
                className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-4 hover:bg-indigo-100 transition-colors"
              >
                <div className="font-medium text-indigo-700">✦ Monday Plan</div>
                <div className="text-sm text-indigo-400 mt-0.5">Set this week&apos;s build focus</div>
              </Link>
              <Link
                href={`/campaigns/${campaignId}/review`}
                className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-4 hover:bg-indigo-100 transition-colors"
              >
                <div className="font-medium text-indigo-700">✦ Friday Review</div>
                <div className="text-sm text-indigo-400 mt-0.5">Log deliverables + AI review</div>
              </Link>
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm mb-3">No active campaign yet.</p>
              <Link
                href="/campaigns/new"
                className="inline-block bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Create campaign
              </Link>
            </div>
          )}
        </>
      )}

      {/* ── EXECUTING MODE ── */}
      {phase === 'executing' && (
        <>
          {/* North Star */}
          <div className="border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                North Star — {monthName}
              </p>
              {monthlySQLs >= SQL_TARGET && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Target hit ✓
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-4">
              {monthlySQLs}
              <span className="text-xl font-normal text-gray-400"> / {SQL_TARGET} SQLs</span>
            </p>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all ${
                  monthlySQLs >= SQL_TARGET ? 'bg-green-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${sqlProgress}%` }}
              />
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-semibold text-gray-900">{monthlyMeetings}</span>
                <span className="text-gray-400 ml-1">meetings</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">{monthlySQLs}</span>
                <span className="text-gray-400 ml-1">SQLs</span>
              </div>
              {meetingToSQL !== null && (
                <div>
                  <span className="font-semibold text-gray-900">{meetingToSQL}%</span>
                  <span className="text-gray-400 ml-1">meeting → SQL</span>
                </div>
              )}
            </div>
          </div>

          {/* This week's plan */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">This week</p>
              {campaignId && (
                <Link
                  href={`/campaigns/${campaignId}/plan`}
                  className="text-xs text-indigo-500 hover:text-indigo-700"
                >
                  {weekPlan ? 'Edit plan →' : 'Set plan →'}
                </Link>
              )}
            </div>
            <div className="px-5 py-4">
              {execPriorities.length > 0 ? (
                <ol className="space-y-2">
                  {execPriorities.map((p: string, i: number) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                      <span className="text-gray-300 shrink-0">{i + 1}.</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-gray-400 italic">No Monday Plan set for this week.</p>
              )}
              {weekPlan?.target_segment && (
                <p className="text-xs text-gray-400 mt-3">
                  <span className="font-medium text-gray-500">Focus:</span> {weekPlan.target_segment}
                </p>
              )}
            </div>
          </div>

          {/* Last Friday's recommendation */}
          {lastReview?.recommendations && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">
                From last Friday&apos;s review
              </p>
              <p className="text-sm text-amber-800 leading-relaxed">{lastReview.recommendations}</p>
            </div>
          )}

          {/* Plan / Review */}
          {campaignId ? (
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/campaigns/${campaignId}/plan`}
                className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-4 hover:bg-indigo-100 transition-colors"
              >
                <div className="font-medium text-indigo-700">✦ Monday Plan</div>
                <div className="text-sm text-indigo-400 mt-0.5">Set this week&apos;s focus</div>
              </Link>
              <Link
                href={`/campaigns/${campaignId}/review`}
                className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-4 hover:bg-indigo-100 transition-colors"
              >
                <div className="font-medium text-indigo-700">✦ Friday Review</div>
                <div className="text-sm text-indigo-400 mt-0.5">Log results + AI analysis</div>
              </Link>
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm mb-3">No active campaign yet.</p>
              <Link
                href="/campaigns/new"
                className="inline-block bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Create campaign
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
