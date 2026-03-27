'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/lib/types'

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

interface CampaignRow extends Campaign {
  sentToday: number
  weekTouchpoints: number
  weekReplies: number
  weekMeetings: number
  activeTargets: number
  weekPlan: {
    priorities: string | null
    target_segment: string | null
    experiment: string | null
    daily_new_contacts: number
    daily_followups: number
  } | null
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]
  const weekStart = getWeekStart()

  useEffect(() => {
    async function load() {
      const { data: camps } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (!camps?.length) { setLoading(false); return }

      const enriched = await Promise.all(
        camps.map(async (c: Campaign) => {
          const [
            { count: sentToday },
            { count: activeTargets },
            { data: weekTps },
            { data: plan },
          ] = await Promise.all([
            supabase.from('touchpoints').select('*', { count: 'exact', head: true })
              .eq('campaign_id', c.id).eq('date', today),
            supabase.from('companies').select('*', { count: 'exact', head: true })
              .eq('campaign_id', c.id).in('status', ['prospect', 'active']),
            supabase.from('touchpoints').select('status')
              .eq('campaign_id', c.id).gte('date', weekStart),
            supabase.from('weekly_plans').select('priorities, target_segment, experiment, daily_new_contacts, daily_followups')
              .eq('campaign_id', c.id).eq('week_start', weekStart).maybeSingle(),
          ])

          const tps = weekTps || []
          return {
            ...c,
            sentToday: sentToday || 0,
            activeTargets: activeTargets || 0,
            weekTouchpoints: tps.length,
            weekReplies: tps.filter((t: any) => t.status === 'replied').length,
            weekMeetings: tps.filter((t: any) => t.status === 'meeting').length,
            weekPlan: plan ?? null,
          }
        })
      )

      setCampaigns(enriched)
      setLoading(false)
    }
    load()
  }, [today, weekStart])

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-gray-400">{dateStr}</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Today&apos;s Focus</h1>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 mb-4">No active campaigns.</p>
          <Link
            href="/campaigns/new"
            className="inline-block bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {campaigns.map(c => <CampaignCard key={c.id} campaign={c} weekStart={weekStart} />)}
        </div>
      )}
    </div>
  )
}

function CampaignCard({ campaign: c, weekStart }: { campaign: CampaignRow; weekStart: string }) {
  const dailyTarget = c.weekPlan?.daily_new_contacts ?? c.daily_new_contacts
  const progress = dailyTarget > 0 ? Math.min((c.sentToday / dailyTarget) * 100, 100) : 0
  const done = c.sentToday >= dailyTarget
  const replyRate = c.weekTouchpoints > 0
    ? Math.round(((c.weekReplies + c.weekMeetings) / c.weekTouchpoints) * 100)
    : 0

  // Parse priorities into list items
  const priorities = c.weekPlan?.priorities
    ? c.weekPlan.priorities
        .split(/\n/)
        .map(l => l.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 3)
    : []

  const weekLabel = new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">{c.name}</h2>
          {c.goal && <p className="text-sm text-gray-400 mt-0.5">{c.goal}</p>}
        </div>
        <Link href={`/campaigns/${c.id}`} className="text-xs text-indigo-500 hover:text-indigo-700 shrink-0 ml-4">
          Open →
        </Link>
      </div>

      {/* Today's progress */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400">Today&apos;s outreach</span>
          <span className={`text-xs font-medium ${done ? 'text-green-600' : 'text-gray-500'}`}>
            {c.sentToday} / {dailyTarget} {done ? '✓' : ''}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${done ? 'bg-green-500' : 'bg-indigo-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* This week's stats */}
      <div className="grid grid-cols-4 gap-px bg-gray-100 border-t border-gray-100">
        {[
          { label: 'Touchpoints', value: c.weekTouchpoints, sub: `wk of ${weekLabel}` },
          { label: 'Replies', value: c.weekReplies },
          { label: 'Meetings', value: c.weekMeetings, accent: c.weekMeetings > 0 },
          { label: 'Reply rate', value: `${replyRate}%`, accent: replyRate >= 10 },
        ].map(s => (
          <div key={s.label} className="bg-white px-4 py-3">
            <div className={`text-lg font-bold ${s.accent ? 'text-green-600' : 'text-gray-900'}`}>{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
            {s.sub && <div className="text-xs text-gray-300">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* This week's priorities */}
      {c.weekPlan ? (
        <div className="px-5 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              This week&apos;s priorities
            </span>
            <Link
              href={`/campaigns/${c.id}/plan`}
              className="text-xs text-indigo-500 hover:text-indigo-700"
            >
              Edit plan →
            </Link>
          </div>
          {priorities.length > 0 ? (
            <ol className="space-y-1">
              {priorities.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-gray-300 shrink-0">{i + 1}.</span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-gray-400 italic">No priorities set.</p>
          )}
          {c.weekPlan.target_segment && (
            <p className="text-xs text-gray-400 mt-2">
              <span className="font-medium text-gray-500">Focus:</span> {c.weekPlan.target_segment}
            </p>
          )}
        </div>
      ) : (
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-400 italic">No Monday Plan set for this week.</p>
          <Link
            href={`/campaigns/${c.id}/plan`}
            className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
          >
            ✦ Generate plan
          </Link>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 px-5 pb-5 pt-1">
        <Link
          href={`/campaigns/${c.id}/execution`}
          className="text-center text-sm bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700"
        >
          Log Touchpoint
        </Link>
        <Link
          href={`/campaigns/${c.id}/targets`}
          className="text-center text-sm border border-gray-200 text-gray-600 px-3 py-2 rounded-md hover:bg-gray-50"
        >
          Add Targets
        </Link>
        <Link
          href={`/campaigns/${c.id}/plan`}
          className="text-center text-xs text-gray-400 hover:text-indigo-600 py-1"
        >
          ✦ Monday Plan
        </Link>
        <Link
          href={`/campaigns/${c.id}/review`}
          className="text-center text-xs text-gray-400 hover:text-indigo-600 py-1"
        >
          ✦ Friday Review
        </Link>
      </div>
    </div>
  )
}
