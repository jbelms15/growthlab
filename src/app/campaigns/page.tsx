'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/lib/types'

const statusBadge: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  done: 'bg-gray-100 text-gray-500',
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setCampaigns(data || []); setLoading(false) })
  }, [])

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <Link
          href="/campaigns/new"
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          + New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl text-gray-400">
          No campaigns yet.{' '}
          <Link href="/campaigns/new" className="text-indigo-600 hover:underline">
            Create one
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div
              key={c.id}
              className="border border-gray-200 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-medium text-gray-900">{c.name}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[c.status]}`}>
                    {c.status}
                  </span>
                </div>
                {c.goal && <p className="text-sm text-gray-400 mt-0.5">{c.goal}</p>}
                <p className="text-xs text-gray-300 mt-1">
                  {c.daily_new_contacts} new/day · {c.daily_followups} follow-ups/day
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/campaigns/${c.id}/wizard`}
                  className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50"
                >
                  Edit Details
                </Link>
                <Link
                  href={`/campaigns/${c.id}`}
                  className="text-sm text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-md hover:bg-indigo-50"
                >
                  Open →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
