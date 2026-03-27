'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Company, Observation, Touchpoint } from '@/lib/types'

const statusBadge: Record<string, string> = {
  prospect: 'bg-gray-100 text-gray-600',
  active: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
}

const statusStyle: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  replied: 'bg-purple-100 text-purple-700',
  meeting: 'bg-green-100 text-green-700',
  no_reply: 'bg-gray-100 text-gray-500',
}

const signalLabel: Record<string, string> = {
  hiring: 'Hiring',
  funding: 'Funding',
  new_role: 'New role',
  news: 'News',
  other: 'Signal',
}

export default function CompanyDetailPage() {
  const { id, companyId } = useParams<{ id: string; companyId: string }>()
  const [company, setCompany] = useState<Company | null>(null)
  const [observations, setObservations] = useState<Observation[]>([])
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([])
  const [obsInput, setObsInput] = useState('')
  const [obsSignalType, setObsSignalType] = useState('other')
  const [editingStatus, setEditingStatus] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesInput, setNotesInput] = useState('')
  const [deletingTp, setDeletingTp] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [compRes, obsRes, tpRes] = await Promise.all([
        supabase.from('companies').select('*').eq('id', companyId).single(),
        supabase.from('observations').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
        supabase.from('touchpoints').select('*').eq('company_id', companyId).order('date', { ascending: false }),
      ])
      setCompany(compRes.data)
      setObservations(obsRes.data || [])
      setTouchpoints(tpRes.data || [])
      setNotesInput(compRes.data?.notes || '')
    }
    load()
  }, [companyId])

  const updateStatus = async (status: string) => {
    await supabase.from('companies').update({ status }).eq('id', companyId)
    setCompany(c => c ? { ...c, status: status as Company['status'] } : c)
    setEditingStatus(false)
  }

  const saveNotes = async () => {
    await supabase.from('companies').update({ notes: notesInput || null }).eq('id', companyId)
    setCompany(c => c ? { ...c, notes: notesInput || null } : c)
    setEditingNotes(false)
  }

  const addObs = async () => {
    if (!obsInput.trim()) return
    const { data } = await supabase
      .from('observations')
      .insert({ company_id: companyId, content: obsInput.trim(), signal_type: obsSignalType })
      .select()
      .single()
    if (data) {
      setObservations(prev => [data, ...prev])
      setObsInput('')
      setObsSignalType('other')
    }
  }

  const deleteObs = async (obsId: string) => {
    await supabase.from('observations').delete().eq('id', obsId)
    setObservations(prev => prev.filter(o => o.id !== obsId))
  }

  const deleteTp = async (tpId: string) => {
    setDeletingTp(tpId)
    await supabase.from('touchpoints').delete().eq('id', tpId)
    setTouchpoints(prev => prev.filter(t => t.id !== tpId))
    setDeletingTp(null)
  }

  if (!company) return <p className="text-gray-400 text-sm">Loading...</p>

  const meetings = touchpoints.filter(t => t.status === 'meeting').length
  const replies = touchpoints.filter(t => t.status === 'replied' || t.status === 'meeting').length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href={`/campaigns/${id}/targets`} className="text-sm text-gray-400 hover:text-gray-600">
          ← Target List
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[company.status]}`}>
                {company.status}
              </span>
              {company.website && (
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-indigo-600"
                >
                  {company.website} ↗
                </a>
              )}
              {company.linkedin_url && (
                <a
                  href={company.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-indigo-600"
                >
                  LinkedIn ↗
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <select
              value={company.status}
              onChange={e => updateStatus(e.target.value)}
              className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${statusBadge[company.status]}`}
            >
              <option value="prospect">prospect</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="done">done</option>
            </select>
            <Link
              href={`/campaigns/${id}/execution?company=${companyId}`}
              className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700"
            >
              Log Touchpoint
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="text-2xl font-bold text-gray-900">{touchpoints.length}</div>
          <div className="text-xs text-gray-400 mt-1">Touchpoints</div>
        </div>
        <div className="border border-gray-200 rounded-xl p-4">
          <div className={`text-2xl font-bold ${replies > 0 ? 'text-green-600' : 'text-gray-900'}`}>{replies}</div>
          <div className="text-xs text-gray-400 mt-1">Replies</div>
        </div>
        <div className="border border-gray-200 rounded-xl p-4">
          <div className={`text-2xl font-bold ${meetings > 0 ? 'text-green-600' : 'text-gray-900'}`}>{meetings}</div>
          <div className="text-xs text-gray-400 mt-1">Meetings</div>
        </div>
      </div>

      {/* Notes */}
      <div className="border border-gray-200 rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Notes</span>
          {!editingNotes && (
            <button onClick={() => setEditingNotes(true)} className="text-xs text-indigo-500 hover:text-indigo-700">
              Edit
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notesInput}
              onChange={e => setNotesInput(e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={saveNotes} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-md">Save</button>
              <button onClick={() => { setEditingNotes(false); setNotesInput(company.notes || '') }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {company.notes || <span className="text-gray-300 italic">No notes yet.</span>}
          </p>
        )}
      </div>

      {/* Observations */}
      <div className="border border-gray-200 rounded-xl p-4 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Observations & Signals</p>

        <div className="flex gap-2 mb-4">
          <select
            value={obsSignalType}
            onChange={e => setObsSignalType(e.target.value)}
            className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white shrink-0"
          >
            <option value="hiring">Hiring</option>
            <option value="funding">Funding</option>
            <option value="new_role">New role</option>
            <option value="news">News</option>
            <option value="other">Other</option>
          </select>
          <input
            type="text"
            value={obsInput}
            onChange={e => setObsInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addObs()}
            placeholder="What did you observe?"
            className="flex-1 text-sm border border-gray-200 rounded-md px-3 py-1.5"
          />
          <button onClick={addObs} className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded-md hover:bg-gray-900 shrink-0">
            Add
          </button>
        </div>

        {observations.length === 0 ? (
          <p className="text-sm text-gray-300 italic">No observations logged.</p>
        ) : (
          <div className="space-y-2">
            {observations.map(o => (
              <div key={o.id} className="flex items-start gap-2 text-sm">
                <span className="text-xs text-gray-300 w-20 shrink-0 pt-0.5">{o.created_at.split('T')[0]}</span>
                {o.signal_type && o.signal_type !== 'other' && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded shrink-0">
                    {signalLabel[o.signal_type] || o.signal_type}
                  </span>
                )}
                <span className="flex-1 text-gray-700">{o.content}</span>
                <button onClick={() => deleteObs(o.id)} className="text-gray-300 hover:text-red-400 text-xs shrink-0">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Touchpoint history */}
      <div className="border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Touchpoint History</p>
        {touchpoints.length === 0 ? (
          <p className="text-sm text-gray-300 italic">No touchpoints yet.</p>
        ) : (
          <div className="space-y-2">
            {touchpoints.map(tp => (
              <div key={tp.id} className="flex items-start gap-3 text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 text-xs w-20 shrink-0 pt-0.5">{tp.date}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">{tp.channel} · step {tp.step_num}</span>
                    {tp.contact_name && <span className="text-xs text-gray-400">{tp.contact_name}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle[tp.status]}`}>
                      {tp.status === 'no_reply' ? 'no reply' : tp.status}
                    </span>
                  </div>
                  {tp.notes && <p className="text-xs text-gray-400 mt-0.5">{tp.notes}</p>}
                </div>
                <button
                  onClick={() => deleteTp(tp.id)}
                  disabled={deletingTp === tp.id}
                  className="text-gray-300 hover:text-red-400 text-xs shrink-0 disabled:opacity-50"
                >
                  {deletingTp === tp.id ? '...' : '✕'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
