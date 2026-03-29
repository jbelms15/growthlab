'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PLAYBOOK_SECTIONS, type PlaybookEntry, type PlaybookSection, type PlaybookStatus } from '@/lib/types'

const sectionColors: Record<string, string> = {
  'Strategic Decisions': 'bg-amber-100 text-amber-700',
  'What Worked': 'bg-green-100 text-green-700',
  'Hook Variations': 'bg-blue-100 text-blue-700',
  'Segment Insights': 'bg-purple-100 text-purple-700',
  'Reply Patterns': 'bg-yellow-100 text-yellow-700',
  'Meeting Notes': 'bg-teal-100 text-teal-700',
  'Performance Benchmarks': 'bg-indigo-100 text-indigo-700',
}

const STATUS_CONFIG: Record<PlaybookStatus, { label: string; color: string; next: PlaybookStatus; hint: string }> = {
  hypothesis: {
    label: 'Hypothesis',
    color: 'bg-gray-100 text-gray-500 border border-gray-200',
    next: 'in_testing',
    hint: 'Unproven — click to mark as In Testing',
  },
  in_testing: {
    label: 'In Testing',
    color: 'bg-amber-100 text-amber-700 border border-amber-200',
    next: 'locked',
    hint: 'Being tested — click to mark as Locked',
  },
  locked: {
    label: '✓ Locked',
    color: 'bg-green-100 text-green-700 border border-green-200',
    next: 'hypothesis',
    hint: 'Validated — click to reset to Hypothesis',
  },
}

const STATUS_FILTERS: (PlaybookStatus | 'all')[] = ['all', 'hypothesis', 'in_testing', 'locked']

const blankForm = { section: PLAYBOOK_SECTIONS[0] as PlaybookSection, title: '', content: '' }

interface Campaign { id: string; name: string }

export default function PlaybookPage() {
  return (
    <Suspense fallback={<p className="text-gray-400 text-sm">Loading...</p>}>
      <PlaybookContent />
    </Suspense>
  )
}

function PlaybookContent() {
  const searchParams = useSearchParams()
  const [entries, setEntries] = useState<PlaybookEntry[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignFilter, setCampaignFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<PlaybookSection | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<PlaybookStatus | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{ section: PlaybookSection; title: string; content: string }>(blankForm)
  const [saving, setSaving] = useState(false)

  // Pre-select campaign from URL param
  useEffect(() => {
    const cid = searchParams.get('campaign')
    if (cid) setCampaignFilter(cid)
  }, [searchParams])

  useEffect(() => {
    Promise.all([
      supabase.from('playbook_entries').select('*').order('created_at', { ascending: false }),
      supabase.from('campaigns').select('id, name').order('created_at', { ascending: false }),
    ]).then(([entriesRes, campsRes]) => {
      setEntries((entriesRes.data || []).map((e: any) => ({ ...e, status: e.status || 'hypothesis' })))
      setCampaigns(campsRes.data || [])
    })
  }, [])

  const openForm = (section?: PlaybookSection) => {
    setForm({ ...blankForm, section: section || (activeTab !== 'all' ? activeTab : PLAYBOOK_SECTIONS[0]) })
    setShowForm(true)
  }

  const add = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const campaignId = campaignFilter !== 'all' ? campaignFilter : null
    const { data } = await supabase
      .from('playbook_entries')
      .insert({ section: form.section, title: form.title, content: form.content || null, campaign_id: campaignId, status: 'hypothesis' })
      .select()
      .single()
    setSaving(false)
    if (data) {
      setEntries(prev => [{ ...data, status: data.status || 'hypothesis' }, ...prev])
      setForm(blankForm)
      setShowForm(false)
    }
  }

  const remove = async (id: string) => {
    await supabase.from('playbook_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const cycleStatus = async (entry: PlaybookEntry) => {
    const next = STATUS_CONFIG[entry.status || 'hypothesis'].next
    await supabase.from('playbook_entries').update({ status: next }).eq('id', entry.id)
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: next } : e))
  }

  const tabs: (PlaybookSection | 'all')[] = ['all', ...PLAYBOOK_SECTIONS]

  // Apply filters
  const byCampaign = campaignFilter === 'all'
    ? entries
    : entries.filter(e => e.campaign_id === campaignFilter || e.campaign_id === null)

  const filtered = statusFilter === 'all'
    ? byCampaign
    : byCampaign.filter(e => (e.status || 'hypothesis') === statusFilter)

  const visibleEntries = activeTab === 'all' ? filtered : filtered.filter(e => e.section === activeTab)

  const groupedBySection = PLAYBOOK_SECTIONS.reduce((acc, sec) => {
    acc[sec] = filtered.filter(e => e.section === sec)
    return acc
  }, {} as Record<PlaybookSection, PlaybookEntry[]>)

  const unsectioned = filtered.filter(e => !e.section)

  const campaignName = (id: string) => campaigns.find(c => c.id === id)?.name

  // Status counts (across all section/campaign filters, just by status)
  const statusCounts = STATUS_FILTERS.slice(1).reduce((acc, s) => {
    acc[s as PlaybookStatus] = byCampaign.filter(e => (e.status || 'hypothesis') === s).length
    return acc
  }, {} as Record<PlaybookStatus, number>)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Playbook</h1>
        <button
          onClick={() => openForm()}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          + Add Entry
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-5">
        What&apos;s working in execution. Each entry moves from Hypothesis → In Testing → Locked as it gets validated.
      </p>

      {/* Status summary pills */}
      <div className="flex items-center gap-2 mb-5">
        {(Object.entries(statusCounts) as [PlaybookStatus, number][]).map(([s, count]) => (
          <div key={s} className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CONFIG[s].color}`}>
            {STATUS_CONFIG[s].label}: {count}
          </div>
        ))}
      </div>

      {/* Campaign filter */}
      {campaigns.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-400 shrink-0">Campaign:</span>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setCampaignFilter('all')}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                campaignFilter === 'all'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              All campaigns
            </button>
            {campaigns.map(c => (
              <button
                key={c.id}
                onClick={() => setCampaignFilter(c.id)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  campaignFilter === c.id
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs text-gray-400 shrink-0">Status:</span>
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                statusFilter === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Section tab bar */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => {
          const count = tab === 'all' ? filtered.length : (groupedBySection[tab as PlaybookSection]?.length ?? 0)
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors shrink-0 ${
                activeTab === tab
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {tab === 'all' ? `All (${count})` : `${tab}${count > 0 ? ` (${count})` : ''}`}
            </button>
          )
        })}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select
              value={form.section}
              onChange={e => setForm(f => ({ ...f, section: e.target.value as PlaybookSection }))}
              className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white col-span-2"
            >
              {PLAYBOOK_SECTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Title *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white col-span-2"
              onKeyDown={e => e.key === 'Enter' && add()}
            />
          </div>
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white resize-none mb-3"
            placeholder="Details, context, or example..."
          />
          <p className="text-xs text-gray-400 mb-3">New entries start as <span className="font-medium text-gray-500">Hypothesis</span>. Advance the status as you validate.</p>
          <div className="flex gap-2">
            <button
              onClick={add}
              disabled={saving}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 px-4 py-2 border border-gray-200 rounded-md bg-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'all' ? (
        <div className="space-y-8">
          {PLAYBOOK_SECTIONS.map(section => {
            const sectionEntries = groupedBySection[section]
            return (
              <div key={section}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sectionColors[section]}`}>
                      {section}
                    </span>
                    <span className="text-xs text-gray-400">{sectionEntries.length} entries</span>
                  </div>
                  <button
                    onClick={() => openForm(section)}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    + Add
                  </button>
                </div>
                {sectionEntries.length === 0 ? (
                  <div className="text-sm text-gray-300 border border-dashed border-gray-200 rounded-lg px-4 py-3">
                    No entries yet for this section.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sectionEntries.map(entry => (
                      <EntryCard key={entry.id} entry={entry} campaignName={entry.campaign_id ? campaignName(entry.campaign_id) : undefined} onDelete={remove} onCycleStatus={cycleStatus} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {unsectioned.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Uncategorized</p>
              <div className="space-y-2">
                {unsectioned.map(entry => (
                  <EntryCard key={entry.id} entry={entry} campaignName={entry.campaign_id ? campaignName(entry.campaign_id) : undefined} onDelete={remove} onCycleStatus={cycleStatus} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sectionColors[activeTab]}`}>
              {activeTab}
            </span>
            <button
              onClick={() => openForm(activeTab)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              + Add to this section
            </button>
          </div>
          {visibleEntries.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
              No entries yet. Start capturing what works in this area.
            </div>
          ) : (
            <div className="space-y-2">
              {visibleEntries.map(entry => (
                <EntryCard key={entry.id} entry={entry} campaignName={entry.campaign_id ? campaignName(entry.campaign_id) : undefined} onDelete={remove} onCycleStatus={cycleStatus} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EntryCard({
  entry,
  campaignName,
  onDelete,
  onCycleStatus,
}: {
  entry: PlaybookEntry
  campaignName?: string
  onDelete: (id: string) => void
  onCycleStatus: (entry: PlaybookEntry) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const status = entry.status || 'hypothesis'
  const cfg = STATUS_CONFIG[status]

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <button onClick={() => setExpanded(v => !v)} className="text-left flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{entry.title}</p>
            </button>
            <button
              onClick={() => onCycleStatus(entry)}
              title={cfg.hint}
              className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 transition-opacity hover:opacity-70 ${cfg.color}`}
            >
              {cfg.label}
            </button>
          </div>
          {campaignName && (
            <p className="text-xs text-gray-400 mt-0.5">{campaignName}</p>
          )}
          {expanded && entry.content && (
            <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">{entry.content}</p>
          )}
          {!expanded && entry.content && (
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-gray-400 hover:text-gray-600 mt-1"
            >
              Show more
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          <span className="text-xs text-gray-300">{entry.created_at.split('T')[0]}</span>
          <button
            onClick={() => onDelete(entry.id)}
            className="text-xs text-gray-300 hover:text-red-400 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
