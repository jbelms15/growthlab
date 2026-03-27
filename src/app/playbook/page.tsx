'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PLAYBOOK_SECTIONS, type PlaybookEntry, type PlaybookSection } from '@/lib/types'

const sectionColors: Record<string, string> = {
  'ICP & Segmentation': 'bg-blue-100 text-blue-700',
  'Personas': 'bg-purple-100 text-purple-700',
  'Pain Mapping': 'bg-red-100 text-red-700',
  'List Building': 'bg-orange-100 text-orange-700',
  'Observation & Signals': 'bg-yellow-100 text-yellow-700',
  'Messaging Frameworks': 'bg-green-100 text-green-700',
  'Sequences & Cadence': 'bg-teal-100 text-teal-700',
  'Performance Benchmarks': 'bg-indigo-100 text-indigo-700',
}

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
      setEntries(entriesRes.data || [])
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
      .insert({ section: form.section, title: form.title, content: form.content || null, campaign_id: campaignId })
      .select()
      .single()
    setSaving(false)
    if (data) {
      setEntries(prev => [data, ...prev])
      setForm(blankForm)
      setShowForm(false)
    }
  }

  const remove = async (id: string) => {
    await supabase.from('playbook_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const tabs: (PlaybookSection | 'all')[] = ['all', ...PLAYBOOK_SECTIONS]

  // Apply campaign filter
  const filtered = campaignFilter === 'all'
    ? entries
    : entries.filter(e => e.campaign_id === campaignFilter || e.campaign_id === null)

  const visibleEntries = activeTab === 'all' ? filtered : filtered.filter(e => e.section === activeTab)

  const groupedBySection = PLAYBOOK_SECTIONS.reduce((acc, sec) => {
    acc[sec] = filtered.filter(e => e.section === sec)
    return acc
  }, {} as Record<PlaybookSection, PlaybookEntry[]>)

  const unsectioned = filtered.filter(e => !e.section)

  const campaignName = (id: string) => campaigns.find(c => c.id === id)?.name

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
        What&apos;s working. What to repeat. Your living outbound manual.
      </p>

      {/* Campaign filter */}
      {campaigns.length > 1 && (
        <div className="flex items-center gap-2 mb-5">
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
                      <EntryCard key={entry.id} entry={entry} campaignName={entry.campaign_id ? campaignName(entry.campaign_id) : undefined} onDelete={remove} />
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
                  <EntryCard key={entry.id} entry={entry} campaignName={entry.campaign_id ? campaignName(entry.campaign_id) : undefined} onDelete={remove} />
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
                <EntryCard key={entry.id} entry={entry} campaignName={entry.campaign_id ? campaignName(entry.campaign_id) : undefined} onDelete={remove} />
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
}: {
  entry: PlaybookEntry
  campaignName?: string
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <button onClick={() => setExpanded(v => !v)} className="text-left w-full">
            <p className="font-medium text-gray-900 text-sm">{entry.title}</p>
          </button>
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
        <div className="flex items-center gap-2 shrink-0">
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
