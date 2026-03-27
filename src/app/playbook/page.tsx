'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { PlaybookEntry } from '@/lib/types'

const typeStyle: Record<string, string> = {
  hook: 'bg-purple-100 text-purple-700',
  sequence: 'bg-blue-100 text-blue-700',
  segment: 'bg-green-100 text-green-700',
  lesson: 'bg-orange-100 text-orange-700',
}

const typeLabels: Record<string, string> = {
  hook: 'Hook that worked',
  sequence: 'Sequence insight',
  segment: 'Segment insight',
  lesson: 'Lesson learned',
}

const blankForm = { type: 'lesson', title: '', content: '' }

export default function PlaybookPage() {
  const [entries, setEntries] = useState<PlaybookEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(blankForm)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    supabase
      .from('playbook_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setEntries(data || []))
  }, [])

  const add = async () => {
    if (!form.title.trim()) return
    const { data } = await supabase
      .from('playbook_entries')
      .insert(form)
      .select()
      .single()
    if (data) {
      setEntries(prev => [data, ...prev])
      setForm(blankForm)
      setShowForm(false)
    }
  }

  const filtered =
    filterType === 'all' ? entries : entries.filter(e => e.type === filterType)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Playbook</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          + Add Entry
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        What&apos;s working. What to repeat. Your living outbound manual.
      </p>

      {showForm && (
        <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
            >
              <option value="lesson">Lesson learned</option>
              <option value="hook">Hook that worked</option>
              <option value="sequence">Sequence insight</option>
              <option value="segment">Segment insight</option>
            </select>
            <input
              type="text"
              placeholder="Title *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
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
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Save
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

      <div className="flex gap-2 mb-5 flex-wrap">
        {(['all', 'lesson', 'hook', 'sequence', 'segment'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filterType === t
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {t === 'all' ? `All (${entries.length})` : typeLabels[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
          No entries yet. Start capturing what works.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <div key={entry.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                    typeStyle[entry.type || ''] || 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {typeLabels[entry.type || ''] || entry.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{entry.title}</p>
                  {entry.content && (
                    <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{entry.content}</p>
                  )}
                </div>
                <span className="text-xs text-gray-300 shrink-0">
                  {entry.created_at.split('T')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
