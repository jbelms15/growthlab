'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Company, Touchpoint } from '@/lib/types'

const statusStyle: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  replied: 'bg-purple-100 text-purple-700',
  meeting: 'bg-green-100 text-green-700',
  no_reply: 'bg-gray-100 text-gray-500',
}

const blankForm = {
  company_id: '',
  contact_name: '',
  channel: 'linkedin',
  step_num: 1,
  status: 'sent',
  notes: '',
  date: new Date().toISOString().split('T')[0],
}

export default function ExecutionPage() {
  const { id } = useParams<{ id: string }>()
  const [companies, setCompanies] = useState<Company[]>([])
  const [touchpoints, setTouchpoints] = useState<(Touchpoint & { company_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(blankForm)
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const [compsRes, tpsRes] = await Promise.all([
        supabase
          .from('companies')
          .select('*')
          .eq('campaign_id', id)
          .in('status', ['prospect', 'active'])
          .order('priority', { ascending: false }),
        supabase
          .from('touchpoints')
          .select('*')
          .eq('campaign_id', id)
          .order('created_at', { ascending: false })
          .limit(60),
      ])
      setCompanies(compsRes.data || [])
      setTouchpoints(tpsRes.data || [])
      setLoading(false)
    }
    load()
  }, [id])

  // Preselect company from URL query (from targets page)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const cid = params.get('company')
      if (cid) setForm(f => ({ ...f, company_id: cid }))
    }
  }, [])

  const companyName = (cid: string) => companies.find(c => c.id === cid)?.name || '—'

  const log = async () => {
    if (!form.company_id) return
    setSubmitting(true)
    const { data } = await supabase
      .from('touchpoints')
      .insert({
        campaign_id: id,
        company_id: form.company_id,
        contact_name: form.contact_name || null,
        channel: form.channel,
        step_num: form.step_num,
        status: form.status,
        date: form.date,
        notes: form.notes || null,
      })
      .select()
      .single()

    if (data) {
      setTouchpoints(prev => [data, ...prev])
      // Auto-promote prospect → active
      const company = companies.find(c => c.id === form.company_id)
      if (company?.status === 'prospect') {
        await supabase.from('companies').update({ status: 'active' }).eq('id', form.company_id)
        setCompanies(prev =>
          prev.map(c => (c.id === form.company_id ? { ...c, status: 'active' as const } : c))
        )
      }
      setForm(f => ({ ...blankForm, date: f.date }))
    }
    setSubmitting(false)
  }

  const todayTps = touchpoints.filter(t => t.date === today)
  const todaySent = todayTps.length
  const todayReplies = todayTps.filter(t => t.status === 'replied' || t.status === 'meeting').length
  const totalMeetings = touchpoints.filter(t => t.status === 'meeting').length

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div>
      <div className="mb-6">
        <Link href={`/campaigns/${id}`} className="text-sm text-gray-400 hover:text-gray-600">
          ← Campaign
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Execution</h1>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Touched today" value={todaySent} />
        <Stat label="Replies / meetings today" value={todayReplies} accent={todayReplies > 0} />
        <Stat label="Total meetings booked" value={totalMeetings} accent={totalMeetings > 0} />
      </div>

      {/* Log form */}
      <div className="border border-gray-200 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Log Touchpoint</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Company *</label>
            <select
              value={form.company_id}
              onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
            >
              <option value="">Select company...</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Contact name</label>
            <input
              type="text"
              value={form.contact_name}
              onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2"
              placeholder="Name / title"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Channel</label>
            <select
              value={form.channel}
              onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
            >
              <option value="linkedin">LinkedIn</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Step #</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.step_num}
              onChange={e => setForm(f => ({ ...f, step_num: Number(e.target.value) }))}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Outcome</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
            >
              <option value="sent">Sent</option>
              <option value="replied">Replied</option>
              <option value="meeting">Meeting booked</option>
              <option value="no_reply">No reply</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2"
            />
          </div>
        </div>
        <textarea
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={2}
          className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 resize-none mb-3"
          placeholder="Notes (optional)"
        />
        <button
          onClick={log}
          disabled={!form.company_id || submitting}
          className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-40"
        >
          {submitting ? 'Saving...' : 'Log'}
        </button>
      </div>

      {/* Recent log */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Activity Log</h3>
      {touchpoints.length === 0 ? (
        <p className="text-sm text-gray-400">No touchpoints yet.</p>
      ) : (
        <div className="space-y-1.5">
          {touchpoints.map(tp => (
            <div
              key={tp.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 text-sm"
            >
              <span className="text-gray-400 text-xs w-20 shrink-0">{tp.date}</span>
              <span className="font-medium text-gray-900 flex-1 truncate">
                {companyName(tp.company_id)}
              </span>
              {tp.contact_name && (
                <span className="text-gray-400 text-xs truncate max-w-24">{tp.contact_name}</span>
              )}
              <span className="text-xs text-gray-400 shrink-0">
                {tp.channel} #{tp.step_num}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusStyle[tp.status]}`}
              >
                {tp.status === 'no_reply' ? 'no reply' : tp.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 text-center">
      <div className={`text-3xl font-bold ${accent ? 'text-green-600' : 'text-gray-900'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  )
}
