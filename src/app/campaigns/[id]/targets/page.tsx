'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Company, Segment, Observation } from '@/lib/types'

const statusBadge: Record<string, string> = {
  prospect: 'bg-gray-100 text-gray-600',
  active: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
}

const priorityDot: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-yellow-400',
  low: 'text-gray-300',
}

const blankForm = { name: '', website: '', linkedin_url: '', segment_id: '', priority: 'medium', notes: '' }

export default function TargetsPage() {
  const { id } = useParams<{ id: string }>()
  const [companies, setCompanies] = useState<Company[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(blankForm)

  useEffect(() => {
    async function load() {
      const [compsRes, segsRes] = await Promise.all([
        supabase
          .from('companies')
          .select('*')
          .eq('campaign_id', id)
          .order('added_at', { ascending: false }),
        supabase.from('segments').select('*').eq('campaign_id', id).order('sort_order'),
      ])
      setCompanies(compsRes.data || [])
      setSegments(segsRes.data || [])
      setLoading(false)
    }
    load()
  }, [id])

  const addCompany = async () => {
    if (!form.name.trim()) return
    const { data } = await supabase
      .from('companies')
      .insert({
        campaign_id: id,
        name: form.name.trim(),
        website: form.website || null,
        linkedin_url: form.linkedin_url || null,
        segment_id: form.segment_id || null,
        priority: form.priority,
        notes: form.notes || null,
      })
      .select()
      .single()
    if (data) {
      setCompanies(prev => [data, ...prev])
      setForm(blankForm)
      setShowForm(false)
    }
  }

  const updateStatus = async (companyId: string, status: string) => {
    await supabase.from('companies').update({ status }).eq('id', companyId)
    setCompanies(prev =>
      prev.map(c => (c.id === companyId ? { ...c, status: status as Company['status'] } : c))
    )
  }

  const filtered =
    filter === 'all' ? companies : companies.filter(c => c.status === filter)

  const counts = {
    all: companies.length,
    prospect: companies.filter(c => c.status === 'prospect').length,
    active: companies.filter(c => c.status === 'active').length,
    paused: companies.filter(c => c.status === 'paused').length,
    done: companies.filter(c => c.status === 'done').length,
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/campaigns/${id}`} className="text-sm text-gray-400 hover:text-gray-600">
            ← Campaign
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Target List</h1>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          + Add Company
        </button>
      </div>

      {showForm && (
        <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4 mb-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">New Target</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Company name *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
              onKeyDown={e => e.key === 'Enter' && addCompany()}
            />
            <input
              type="text"
              placeholder="Website"
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="LinkedIn URL"
              value={form.linkedin_url}
              onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
              className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
            />
            <select
              value={form.segment_id}
              onChange={e => setForm(f => ({ ...f, segment_id: e.target.value }))}
              className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
            >
              <option value="">No segment</option>
              {segments.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
            >
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <textarea
              placeholder="Notes / signals"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={1}
              className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addCompany}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50 bg-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'prospect', 'active', 'paused', 'done'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? `All (${counts.all})` : `${s} (${counts[s]})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
          {filter === 'all'
            ? 'No companies yet. Add your first target above.'
            : `No companies with status "${filter}"`}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(company => (
            <CompanyRow
              key={company.id}
              company={company}
              segments={segments}
              onStatusChange={updateStatus}
              campaignId={id as string}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CompanyRow({
  company,
  segments,
  onStatusChange,
  campaignId,
}: {
  company: Company
  segments: Segment[]
  onStatusChange: (id: string, status: string) => void
  campaignId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [observations, setObservations] = useState<Observation[]>([])
  const [obsInput, setObsInput] = useState('')
  const [obsLoaded, setObsLoaded] = useState(false)
  const segment = segments.find(s => s.id === company.segment_id)

  const loadObs = async () => {
    if (obsLoaded) return
    const { data } = await supabase
      .from('observations')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
    setObservations(data || [])
    setObsLoaded(true)
  }

  const toggle = () => {
    setExpanded(v => !v)
    if (!expanded) loadObs()
  }

  const addObs = async () => {
    if (!obsInput.trim()) return
    const { data } = await supabase
      .from('observations')
      .insert({ company_id: company.id, content: obsInput.trim() })
      .select()
      .single()
    if (data) {
      setObservations(prev => [data, ...prev])
      setObsInput('')
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center px-4 py-3 gap-3">
        <span className={`text-lg leading-none ${company.priority === 'high' ? 'text-red-500' : company.priority === 'medium' ? 'text-yellow-400' : 'text-gray-200'}`}>
          ●
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 text-sm">{company.name}</span>
            {segment && (
              <span className="text-xs text-gray-400">{segment.name}</span>
            )}
          </div>
          {company.website && (
            <a
              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-indigo-600"
            >
              {company.website}
            </a>
          )}
        </div>
        <select
          value={company.status}
          onChange={e => onStatusChange(company.id, e.target.value)}
          className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statusBadge[company.status]}`}
        >
          <option value="prospect">prospect</option>
          <option value="active">active</option>
          <option value="paused">paused</option>
          <option value="done">done</option>
        </select>
        <button
          onClick={toggle}
          className="text-gray-300 hover:text-gray-600 text-sm w-5 text-center"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
          {company.notes && (
            <p className="text-xs text-gray-500">{company.notes}</p>
          )}

          {observations.length > 0 && (
            <div className="space-y-1">
              {observations.map(o => (
                <div key={o.id} className="flex gap-2 text-xs text-gray-500">
                  <span className="text-gray-300">{o.created_at.split('T')[0]}</span>
                  <span>{o.content}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={obsInput}
              onChange={e => setObsInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addObs()}
              placeholder="Add observation or signal..."
              className="flex-1 text-xs border border-gray-200 rounded-md px-3 py-1.5 bg-white"
            />
            <button
              onClick={addObs}
              className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-md hover:bg-gray-900"
            >
              Add
            </button>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/campaigns/${campaignId}/execution?company=${company.id}`}
              className="text-xs text-indigo-600 hover:underline"
            >
              → Log touchpoint
            </Link>
            {company.linkedin_url && (
              <a
                href={company.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                LinkedIn ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
