'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/lib/types'

interface CampaignStats extends Campaign {
  sentToday: number
  activeTargets: number
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

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
          const [{ count: sentToday }, { count: activeTargets }] = await Promise.all([
            supabase.from('touchpoints').select('*', { count: 'exact', head: true })
              .eq('campaign_id', c.id).eq('date', today),
            supabase.from('companies').select('*', { count: 'exact', head: true })
              .eq('campaign_id', c.id).in('status', ['prospect', 'active']),
          ])
          return { ...c, sentToday: sentToday || 0, activeTargets: activeTargets || 0 }
        })
      )

      setCampaigns(enriched)
      setLoading(false)
    }
    load()
  }, [today])

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-gray-400">{dateStr}</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Today's Focus</h1>
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
        <div className="space-y-4">
          {campaigns.map(c => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function CampaignCard({ campaign }: { campaign: CampaignStats }) {
  const sentToday = campaign.sentToday
  const target = campaign.daily_new_contacts
  const done = sentToday >= target

  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">{campaign.name}</h2>
          {campaign.goal && (
            <p className="text-sm text-gray-400 mt-0.5">{campaign.goal}</p>
          )}
        </div>
        <Link
          href={`/campaigns/${campaign.id}`}
          className="text-xs text-indigo-500 hover:text-indigo-700"
        >
          Open →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat
          label="Touched today"
          value={`${sentToday} / ${target}`}
          accent={done}
        />
        <Stat label="Active targets" value={campaign.activeTargets} />
        <Stat label="Daily follow-ups" value={campaign.daily_followups} />
      </div>

      <div className="flex gap-2">
        <Link
          href={`/campaigns/${campaign.id}/execution`}
          className="flex-1 text-center text-sm bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700"
        >
          Log Touchpoint
        </Link>
        <Link
          href={`/campaigns/${campaign.id}/targets`}
          className="flex-1 text-center text-sm border border-gray-200 text-gray-600 px-3 py-2 rounded-md hover:bg-gray-50"
        >
          Add Targets
        </Link>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-xl font-bold ${accent ? 'text-green-600' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  )
}
