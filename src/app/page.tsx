'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const SQL_TARGET = 6

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
  const [monthlySQLs, setMonthlySQLs] = useState(0)
  const [monthlyMeetings, setMonthlyMeetings] = useState(0)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [weekPlan, setWeekPlan] = useState<any>(null)
  const [lastReview, setLastReview] = useState<any>(null)

  const weekStart = getWeekStart()
  const monthStart = getMonthStart()

  useEffect(() => {
    async function load() {
      const { data: camp } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (camp) {
        setCampaignId(camp.id)

        const [planRes, reviewRes, reportsRes] = await Promise.all([
          supabase
            .from('weekly_plans')
            .select('priorities, target_segment, experiment')
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
        ])

        if (planRes.data) setWeekPlan(planRes.data)
        if (reviewRes.data) setLastReview(reviewRes.data)

        const reports = reportsRes.data || []
        setMonthlySQLs(reports.reduce((sum: number, r: any) => sum + (r.sqls || 0), 0))
        setMonthlyMeetings(reports.reduce((sum: number, r: any) => sum + (r.meetings || 0), 0))
      }

      setLoading(false)
    }
    load()
  }, [weekStart, monthStart])

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' })
  const sqlProgress = Math.min((monthlySQLs / SQL_TARGET) * 100, 100)
  const meetingToSQL = monthlyMeetings > 0
    ? Math.round((monthlySQLs / monthlyMeetings) * 100)
    : null

  const priorities = weekPlan?.priorities
    ? weekPlan.priorities
        .split('\n')
        .map((l: string) => l.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 3)
    : []

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-gray-400">{dateStr}</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">GrowthLab</h1>
      </div>

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
          {priorities.length > 0 ? (
            <ol className="space-y-2">
              {priorities.map((p: string, i: number) => (
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
    </div>
  )
}
