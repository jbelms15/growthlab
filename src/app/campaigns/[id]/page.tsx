'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/lib/types'
import { PLAYBOOK_SECTIONS, type PlaybookSection } from '@/lib/types'

export default function CampaignPage() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [stats, setStats] = useState({ companies: 0, active: 0, touchpoints: 0, meetings: 0 })
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)

  useEffect(() => {
    async function load() {
      const [campRes, totalRes, activeRes, tpRes, meetRes] = await Promise.all([
        supabase.from('campaigns').select('*').eq('id', id).single(),
        supabase.from('companies').select('*', { count: 'exact', head: true }).eq('campaign_id', id),
        supabase.from('companies').select('*', { count: 'exact', head: true }).eq('campaign_id', id).eq('status', 'active'),
        supabase.from('touchpoints').select('*', { count: 'exact', head: true }).eq('campaign_id', id),
        supabase.from('touchpoints').select('*', { count: 'exact', head: true }).eq('campaign_id', id).eq('status', 'meeting'),
      ])
      setCampaign(campRes.data)
      setStats({
        companies: totalRes.count || 0,
        active: activeRes.count || 0,
        touchpoints: tpRes.count || 0,
        meetings: meetRes.count || 0,
      })
    }
    load()
  }, [id])

  const exportToPlaybook = async () => {
    if (!campaign) return
    setExporting(true)
    const wd = campaign.wizard_data || {}
    const entries: { campaign_id: string; section: PlaybookSection; title: string; content: string | null }[] = []

    if (wd.signals?.trim()) {
      entries.push({
        campaign_id: id,
        section: 'Observation & Signals',
        title: `Buying signals — ${campaign.name}`,
        content: wd.signals,
      })
    }
    if (wd.observation_template?.trim()) {
      entries.push({
        campaign_id: id,
        section: 'Observation & Signals',
        title: `Observation template — ${campaign.name}`,
        content: wd.observation_template,
      })
    }
    if (wd.messaging) {
      const { hook, body, cta, channel } = wd.messaging
      entries.push({
        campaign_id: id,
        section: 'Messaging Frameworks',
        title: `Messaging framework — ${campaign.name}`,
        content: [
          hook && `Hook: ${hook}`,
          body && `Body: ${body}`,
          cta && `CTA: ${cta}`,
          channel && `Channel: ${channel}`,
        ].filter(Boolean).join('\n\n') || null,
      })
    }
    if (wd.sequence?.length) {
      entries.push({
        campaign_id: id,
        section: 'Sequences & Cadence',
        title: `Sequence — ${campaign.name}`,
        content: wd.sequence
          .map((s: any) => `Day ${s.day} (${s.channel}): ${s.action}`)
          .join('\n'),
      })
    }

    if (entries.length > 0) {
      await supabase.from('playbook_entries').insert(entries)
    }

    setExporting(false)
    setExported(true)
    setTimeout(() => setExported(false), 3000)
  }

  if (!campaign) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-8">
        <Link href="/campaigns" className="text-sm text-gray-400 hover:text-gray-600">
          ← Campaigns
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            {campaign.goal && <p className="text-gray-400 mt-1">{campaign.goal}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToPlaybook}
              disabled={exporting}
              className="text-sm border border-gray-200 px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {exporting ? 'Saving...' : exported ? '✓ Saved to Playbook' : '→ Save strategy to Playbook'}
            </button>
            <Link
              href={`/campaigns/${id}/wizard`}
              className="text-sm border border-gray-200 px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-50"
            >
              Edit Strategy
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total targets', value: stats.companies },
          { label: 'Active', value: stats.active },
          { label: 'Touchpoints', value: stats.touchpoints },
          { label: 'Meetings', value: stats.meetings },
        ].map(s => (
          <div key={s.label} className="border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-3">
        {[
          {
            href: `/campaigns/${id}/targets`,
            label: 'Target List',
            desc: 'Companies, signals, observations',
          },
          {
            href: `/campaigns/${id}/execution`,
            label: 'Execution',
            desc: 'Log and track touchpoints',
          },
          {
            href: `/campaigns/${id}/wizard`,
            label: 'Strategy',
            desc: 'ICP, personas, messaging, sequence',
          },
          {
            href: `/playbook?campaign=${id}`,
            label: 'Playbook',
            desc: 'Learnings for this campaign',
          },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
          >
            <div className="font-medium text-gray-900 group-hover:text-indigo-700">
              {link.label}
            </div>
            <div className="text-sm text-gray-400 mt-0.5">{link.desc}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          {
            href: `/campaigns/${id}/plan`,
            label: '✦ Monday Plan',
            desc: 'AI-assisted weekly plan with daily targets',
            accent: true,
          },
          {
            href: `/campaigns/${id}/review`,
            label: '✦ Friday Review',
            desc: 'AI review with data + playbook learnings',
            accent: true,
          },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-4 hover:bg-indigo-100 transition-colors group"
          >
            <div className="font-medium text-indigo-700">{link.label}</div>
            <div className="text-sm text-indigo-400 mt-0.5">{link.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
