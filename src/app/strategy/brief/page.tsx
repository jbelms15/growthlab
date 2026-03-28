'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  type WorkspaceData, type ICPData, type SegmentItem, type Persona,
  type SignalsData, type MessagingRow, type SequenceStep, type LaunchPlanData,
  defaultWorkspaceData,
} from '@/lib/workspace-types'

const CLIENT_NAME = 'Shikenso'

const CHANNEL_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-700',
  email:    'bg-green-100 text-green-700',
  phone:    'bg-orange-100 text-orange-700',
  other:    'bg-gray-100 text-gray-600',
}

export default function BriefPage() {
  const [data, setData] = useState<WorkspaceData | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('client_workspaces')
      .select('data, updated_at')
      .eq('client_name', CLIENT_NAME)
      .single()
      .then(({ data: row }) => {
        if (row) {
          setData({ ...defaultWorkspaceData, ...(row.data as WorkspaceData) })
          setUpdatedAt(row.updated_at as string)
        } else {
          setData(defaultWorkspaceData)
        }
      })
  }, [])

  if (!data) return <p className="text-sm text-gray-400">Loading...</p>

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const hasFoundation    = Object.values(data.foundation).some(v => v.trim())
  const hasMarketDesign  = Object.values(data.market_design.icp).some(v => (v ?? '').trim()) || data.market_design.segments.length > 0 || data.market_design.personas.length > 0
  const hasSignals       = data.signals.signal_types.length > 0 || !!data.signals.qualification_criteria.trim()
  const hasMessaging     = data.messaging.matrix.length > 0
  const hasSequences     = data.sequences.steps.length > 0
  const hasLaunchPlan    = data.launch_plan.weekly_targets.length > 0 || !!data.launch_plan.success_metrics.trim()
  const phasesStarted    = [hasFoundation, hasMarketDesign, hasSignals, hasMessaging, hasSequences, hasLaunchPlan].filter(Boolean).length

  return (
    <div className="max-w-2xl mx-auto">
      {/* Print: hide nav */}
      <style>{`@media print { nav { display: none !important; } .no-print { display: none !important; } }`}</style>

      {/* Header */}
      <div className="flex items-start justify-between mb-10 no-print">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Strategy Brief</p>
          <h1 className="text-2xl font-bold text-gray-900">{CLIENT_NAME}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Outbound System Design
            {updatedLabel && <span> · Updated {updatedLabel}</span>}
            <span className="ml-2 text-gray-300">{phasesStarted}/6 phases</span>
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => window.print()}
            className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
          >
            Print
          </button>
          <Link href="/strategy" className="text-sm px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
            ← Edit
          </Link>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block mb-8">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Strategy Brief · {CLIENT_NAME}</p>
        <h1 className="text-xl font-bold text-gray-900">Outbound System Design{updatedLabel && ` · ${updatedLabel}`}</h1>
      </div>

      {/* Empty state */}
      {phasesStarted === 0 && (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
          Nothing here yet.{' '}
          <Link href="/strategy" className="text-indigo-600 hover:underline">Start filling in the workspace →</Link>
        </div>
      )}

      {/* Sections */}
      {hasFoundation    && <FoundationSection    data={data} />}
      {hasMarketDesign  && <MarketDesignSection  data={data} />}
      {hasSignals       && <SignalsSection        data={data} />}
      {hasMessaging     && <MessagingSection      data={data} />}
      {hasSequences     && <SequencesSection      data={data} />}
      {hasLaunchPlan    && <LaunchPlanSection     data={data} />}
    </div>
  )
}

// ─── Shared layout helpers ────────────────────────────────────────────────────

function SectionHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-xs font-mono text-gray-300 w-5 shrink-0">{String(n).padStart(2, '0')}</span>
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">{title}</h2>
      <div className="flex-1 border-t border-gray-100" />
    </div>
  )
}

function LabeledBlock({ label, text }: { label: string; text: string }) {
  if (!text?.trim()) return null
  return (
    <div className="mb-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  )
}

// ─── Foundation ───────────────────────────────────────────────────────────────

function FoundationSection({ data }: { data: WorkspaceData }) {
  const f = data.foundation
  return (
    <div className="mb-12">
      <SectionHeader n={1} title="Foundation" />
      <LabeledBlock label="Product Knowledge"   text={f.product_knowledge} />
      <LabeledBlock label="Inbound Analysis"    text={f.inbound_analysis}  />
      <LabeledBlock label="Buyer Language"      text={f.buyer_language}    />
      <LabeledBlock label="Case Studies & Wins" text={f.case_studies}      />
    </div>
  )
}

// ─── Market Design ────────────────────────────────────────────────────────────

function MarketDesignSection({ data }: { data: WorkspaceData }) {
  const md = data.market_design
  return (
    <div className="mb-12">
      <SectionHeader n={2} title="Market Design" />
      <ICPBlock icp={md.icp} />
      {md.segments.length > 0 && <SegmentsBlock segments={md.segments} />}
      {md.personas.length > 0  && <PersonasBlock personas={md.personas} segments={md.segments} />}
    </div>
  )
}

function ICPBlock({ icp }: { icp: ICPData }) {
  const rows: [string, string][] = [
    ['Industry',      icp.industry],
    ['Company Size',  icp.company_size],
    ['Geography',     icp.geography],
    ['Stage',         icp.stage],
    ['Revenue Range', icp.revenue_range],
  ].filter((r): r is [string, string] => !!r[1]?.trim())

  if (rows.length === 0 && !icp.anti_icp?.trim() && !icp.notes?.trim()) return null

  return (
    <div className="mb-6">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Ideal Customer Profile</p>
      {rows.length > 0 && (
        <div className="border border-gray-100 rounded-xl overflow-hidden mb-3">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <td className="px-4 py-2 text-xs text-gray-400 w-32 shrink-0">{label}</td>
                  <td className="px-4 py-2 text-gray-700">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {icp.anti_icp?.trim() && (
        <div className="mb-2">
          <span className="text-xs text-gray-400">Anti-ICP: </span>
          <span className="text-sm text-gray-600">{icp.anti_icp}</span>
        </div>
      )}
      {icp.notes?.trim() && (
        <div>
          <span className="text-xs text-gray-400">Notes: </span>
          <span className="text-sm text-gray-600">{icp.notes}</span>
        </div>
      )}
    </div>
  )
}

function SegmentsBlock({ segments }: { segments: SegmentItem[] }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Segments (priority order)</p>
      <div className="space-y-3">
        {segments.map((seg, i) => (
          <div key={seg.id} className="flex gap-3">
            <span className="text-xs font-semibold text-gray-300 mt-0.5 w-4 shrink-0">{i + 1}</span>
            <div>
              <p className="text-sm font-medium text-gray-900">{seg.name}</p>
              {seg.description?.trim()  && <p className="text-sm text-gray-500 mt-0.5">{seg.description}</p>}
              {seg.why_priority?.trim() && <p className="text-xs text-gray-400 mt-0.5">Why: {seg.why_priority}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PersonasBlock({ personas, segments }: { personas: Persona[]; segments: SegmentItem[] }) {
  return (
    <div className="mb-2">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Personas & Pain Maps</p>
      <div className="space-y-6">
        {personas.map(p => {
          const segment = segments.find(s => s.id === p.segment_id)
          return (
            <div key={p.id} className="border border-gray-100 rounded-xl p-4">
              {/* Persona header */}
              <div className="flex items-baseline gap-2 mb-3">
                <p className="text-sm font-semibold text-gray-900">{p.title || 'Untitled'}</p>
                {p.seniority && <span className="text-xs text-gray-400">{p.seniority}</span>}
                {segment?.name && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-auto">{segment.name}</span>}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                {p.goals?.trim()        && <div><p className="text-gray-400 font-medium mb-0.5">Goals</p><p className="text-gray-600">{p.goals}</p></div>}
                {p.frustrations?.trim() && <div><p className="text-gray-400 font-medium mb-0.5">Frustrations</p><p className="text-gray-600">{p.frustrations}</p></div>}
                {p.triggers?.trim()     && <div><p className="text-gray-400 font-medium mb-0.5">Triggers</p><p className="text-gray-600">{p.triggers}</p></div>}
              </div>

              {p.pains.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2">Pain Map</p>
                  <div className="space-y-2">
                    {p.pains.map((pain, pi) => (
                      <div key={pain.id} className="bg-gray-50 rounded-lg p-3 text-xs">
                        <p className="font-medium text-gray-800 mb-1">{pi + 1}. {pain.pain}</p>
                        <div className="grid grid-cols-3 gap-2 text-gray-500">
                          {pain.business_impact?.trim() && <div><span className="text-gray-400">Impact: </span>{pain.business_impact}</div>}
                          {pain.consequence?.trim()     && <div><span className="text-gray-400">If unsolved: </span>{pain.consequence}</div>}
                          {pain.workaround?.trim()      && <div><span className="text-gray-400">Today: </span>{pain.workaround}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Signals ──────────────────────────────────────────────────────────────────

function SignalsSection({ data }: { data: WorkspaceData }) {
  const s = data.signals
  return (
    <div className="mb-12">
      <SectionHeader n={3} title="Signals" />
      {s.signal_types.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Buying Signals</p>
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400">
                  <th className="px-4 py-2 text-left font-medium">Signal</th>
                  <th className="px-4 py-2 text-left font-medium">Where to find</th>
                  <th className="px-4 py-2 text-left font-medium">What it means</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {s.signal_types.map(sig => (
                  <tr key={sig.id}>
                    <td className="px-4 py-2 font-medium text-gray-800">{sig.name}</td>
                    <td className="px-4 py-2 text-gray-500">{sig.where_to_find}</td>
                    <td className="px-4 py-2 text-gray-500">{sig.what_it_means}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <SignalsCriteria signals={s} />
    </div>
  )
}

function SignalsCriteria({ signals }: { signals: SignalsData }) {
  const hasQual   = signals.qualification_criteria.trim()
  const hasDisqual = signals.disqualification_criteria.trim()
  if (!hasQual && !hasDisqual) return null
  return (
    <div className="grid grid-cols-2 gap-4">
      {hasQual    && <LabeledBlock label="Qualification Criteria"    text={signals.qualification_criteria}    />}
      {hasDisqual && <LabeledBlock label="Disqualification Criteria" text={signals.disqualification_criteria} />}
    </div>
  )
}

// ─── Messaging ────────────────────────────────────────────────────────────────

function MessagingSection({ data }: { data: WorkspaceData }) {
  const matrix = data.messaging.matrix
  return (
    <div className="mb-12">
      <SectionHeader n={4} title="Messaging Architecture" />
      <div className="space-y-4">
        {matrix.map((row, i) => <MessagingCard key={row.id} row={row} index={i} />)}
      </div>
    </div>
  )
}

function MessagingCard({ row, index }: { row: MessagingRow; index: number }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      {/* Top row: context tags */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-gray-400 font-mono">{String(index + 1).padStart(2, '0')}</span>
        {row.segment && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{row.segment}</span>}
        {row.persona && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{row.persona}</span>}
        {row.channel && <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CHANNEL_COLORS[row.channel.toLowerCase()] ?? CHANNEL_COLORS.other}`}>{row.channel}</span>}
      </div>

      {row.pain?.trim() && (
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-0.5">Pain</p>
          <p className="text-sm text-gray-600">{row.pain}</p>
        </div>
      )}
      {row.hook?.trim() && (
        <div className="mb-3 bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400 mb-0.5">Hook</p>
          <p className="text-sm font-medium text-gray-800">&ldquo;{row.hook}&rdquo;</p>
        </div>
      )}
      {row.social_proof?.trim() && (
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-0.5">Social proof</p>
          <p className="text-sm text-gray-600">{row.social_proof}</p>
        </div>
      )}
      {(row.cta_soft?.trim() || row.cta_hard?.trim()) && (
        <div className="grid grid-cols-2 gap-3">
          {row.cta_soft?.trim() && <div><p className="text-xs text-gray-400 mb-0.5">Soft CTA</p><p className="text-sm text-gray-600">{row.cta_soft}</p></div>}
          {row.cta_hard?.trim() && <div><p className="text-xs text-gray-400 mb-0.5">Hard CTA</p><p className="text-sm text-gray-600">{row.cta_hard}</p></div>}
        </div>
      )}
    </div>
  )
}

// ─── Sequences ────────────────────────────────────────────────────────────────

function SequencesSection({ data }: { data: WorkspaceData }) {
  const { steps, notes } = data.sequences
  return (
    <div className="mb-12">
      <SectionHeader n={5} title="Sequence Blueprint" />
      <div className="space-y-1 mb-4">
        {steps.map((step, i) => <SequenceRow key={step.id} step={step} isLast={i === steps.length - 1} />)}
      </div>
      {notes?.trim() && <LabeledBlock label="Notes" text={notes} />}
    </div>
  )
}

function SequenceRow({ step, isLast }: { step: SequenceStep; isLast: boolean }) {
  const color = CHANNEL_COLORS[step.channel.toLowerCase()] ?? CHANNEL_COLORS.other
  return (
    <div className="flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 shrink-0" />
        {!isLast && <div className="w-px flex-1 bg-gray-100 mt-1" />}
      </div>
      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-mono font-bold text-gray-400 shrink-0">Day {step.day}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${color}`}>{step.channel}</span>
          <span className="text-sm text-gray-700 truncate">{step.action}</span>
        </div>
        {step.content?.trim() && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.content}</p>}
      </div>
    </div>
  )
}

// ─── Launch Plan ──────────────────────────────────────────────────────────────

function LaunchPlanSection({ data }: { data: WorkspaceData }) {
  const lp: LaunchPlanData = data.launch_plan
  return (
    <div className="mb-12">
      <SectionHeader n={6} title="Launch Plan" />
      {lp.weekly_targets.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Weekly Ramp</p>
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400">
                  <th className="px-4 py-2 text-left font-medium">Week</th>
                  <th className="px-4 py-2 text-center font-medium">New/day</th>
                  <th className="px-4 py-2 text-center font-medium">Follow-ups/day</th>
                  <th className="px-4 py-2 text-center font-medium">Mtg target</th>
                  <th className="px-4 py-2 text-left font-medium">Focus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lp.weekly_targets.map(w => (
                  <tr key={w.id}>
                    <td className="px-4 py-2 font-medium text-gray-800">{w.week}</td>
                    <td className="px-4 py-2 text-center text-gray-600">{w.new_contacts}</td>
                    <td className="px-4 py-2 text-center text-gray-600">{w.follow_ups}</td>
                    <td className="px-4 py-2 text-center text-gray-600">{w.meetings_target}</td>
                    <td className="px-4 py-2 text-gray-500">{w.focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <LabeledBlock label="Success Metrics" text={lp.success_metrics} />
        <LabeledBlock label="Ramp Notes"      text={lp.ramp_notes}      />
      </div>
    </div>
  )
}
