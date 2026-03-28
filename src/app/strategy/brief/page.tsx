'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  type WorkspaceData, type ICPData, type SegmentItem, type Persona, type Pain,
  type SignalsData, type MessagingRow, type SubjectLine, type CompetitiveData,
  type Competitor, type ObjectionsData, type Objection,
  type SequenceStep, type LaunchPlanData,
  defaultWorkspaceData,
} from '@/lib/workspace-types'

const CLIENT_NAME = 'Shikenso'
const PREPARED_BY  = 'Joanna'

const CH_COLOR: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-700',
  email:    'bg-emerald-100 text-emerald-700',
  phone:    'bg-orange-100 text-orange-700',
  other:    'bg-gray-100 text-gray-500',
}
const CH_DOT: Record<string, string> = {
  linkedin: 'bg-blue-400',
  email:    'bg-emerald-400',
  phone:    'bg-orange-400',
  other:    'bg-gray-300',
}

export default function BriefPage() {
  const [data, setData]           = useState<WorkspaceData | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('client_workspaces')
      .select('data, updated_at')
      .eq('client_name', CLIENT_NAME)
      .single()
      .then(({ data: row }) => {
        setData(row?.data ? { ...defaultWorkspaceData, ...(row.data as WorkspaceData) } : defaultWorkspaceData)
        if (row?.updated_at) setUpdatedAt(row.updated_at as string)
      })
  }, [])

  if (!data) return <p className="text-sm text-gray-400 py-20 text-center">Loading…</p>

  const dateLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const md = data.market_design
  const hasFoundation   = Object.values(data.foundation).some(v => v.trim())
  const hasMarket       = Object.values(md.icp).some(v => (v ?? '').trim()) || md.segments.length > 0 || md.personas.length > 0
  const hasSignals      = data.signals.signal_types.length > 0 || !!data.signals.qualification_criteria.trim()
  const hasMessaging    = data.messaging.matrix.length > 0
  const hasSequences    = data.sequences.steps.length > 0
  const hasCompetitive  = (data.competitive?.competitors?.length ?? 0) > 0 || !!data.competitive?.positioning_notes?.trim()
  const hasObjections   = (data.objections?.objections?.length ?? 0) > 0
  const hasLaunch       = data.launch_plan.weekly_targets.length > 0 || !!data.launch_plan.success_metrics.trim()

  return (
    <>
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      {/* ── HEADER BANNER ─────────────────────────────────────────── */}
      <div className="-mx-4 -mt-8 mb-10 bg-gray-900 px-8 py-10">
        <div className="max-w-3xl mx-auto">
          {/* Top line */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Outbound Strategy Brief</p>
              <h1 className="text-4xl font-bold text-white tracking-tight">{CLIENT_NAME}</h1>
              <p className="text-sm text-gray-500 mt-1">Prepared by {PREPARED_BY} · {dateLabel}</p>
            </div>
            <div className="flex gap-2 no-print mt-1">
              <button
                onClick={() => window.print()}
                className="text-xs px-3 py-1.5 border border-gray-700 rounded-lg text-gray-400 hover:bg-gray-800"
              >
                Print / PDF
              </button>
              <Link href="/strategy" className="text-xs px-3 py-1.5 bg-white/10 rounded-lg text-gray-300 hover:bg-white/20">
                ← Edit
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 pt-5 border-t border-gray-800">
            <Stat label="North Star"        value="6 meetings / month" />
            <div className="w-px h-8 bg-gray-800" />
            <Stat label="Timeline"          value="April – June 2026"  />
            <div className="w-px h-8 bg-gray-800" />
            <Stat label="Primary Channels"  value="LinkedIn + Email"   />
            <div className="w-px h-8 bg-gray-800" />
            <Stat label="Tool Stack"        value="Sales Nav · HubSpot · GrowthLab" />
          </div>
        </div>
      </div>

      {/* ── CONTENT ───────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto space-y-14">

        {hasFoundation && (
          <section>
            <SectionHead n="01" title="Foundation" sub="What we know about the product and who's buying it" />
            <div className="space-y-6">
              <TextBlock label="Product"         text={data.foundation.product_knowledge} />
              <TextBlock label="Inbound Analysis" text={data.foundation.inbound_analysis}  />
              <BuyerLanguageBlock text={data.foundation.buyer_language} />
              <TextBlock label="Case Studies"    text={data.foundation.case_studies}      />
            </div>
          </section>
        )}

        {hasMarket && (
          <section>
            <SectionHead n="02" title="Market Design" sub="Who we're going after and why" />
            {(Object.values(md.icp).some(v => (v ?? '').trim())) && <ICPBlock icp={md.icp} />}
            {md.segments.length > 0 && <SegmentsBlock segments={md.segments} />}
            {md.personas.length > 0 && <PersonasBlock personas={md.personas} segments={md.segments} />}
          </section>
        )}

        {hasSignals && (
          <section>
            <SectionHead n="03" title="Signal Playbook" sub="What 'ready to buy' looks like before we reach out" />
            <SignalsBlock signals={data.signals} />
          </section>
        )}

        {hasMessaging && (
          <section>
            <SectionHead n="04" title="Messaging Architecture" sub="Hooks, subject lines — one angle per persona / pain" />
            <div className="space-y-4 mb-8">
              {data.messaging.matrix.map((row, i) => <HookCard key={row.id} row={row} index={i} />)}
            </div>
            {(data.messaging.subject_lines ?? []).length > 0 && (
              <SubjectLinesBlock lines={data.messaging.subject_lines ?? []} />
            )}
          </section>
        )}

        {hasCompetitive && (
          <section>
            <SectionHead n="05" title="Competitive Positioning" sub="How we win — and what to say when they bring up a competitor" />
            <CompetitiveSection competitive={data.competitive} />
          </section>
        )}

        {hasObjections && (
          <section>
            <SectionHead n="06" title="Objection Handling" sub="Scripted responses to the most common pushback" />
            <ObjectionsSection objections={data.objections} />
          </section>
        )}

        {hasSequences && (
          <section>
            <SectionHead n="07" title="Sequence Blueprint" sub={`${data.sequences.steps.length}-step cadence · design here, build in HubSpot`} />
            <SequenceTimeline steps={data.sequences.steps} notes={data.sequences.notes} />
          </section>
        )}

        {hasLaunch && (
          <section>
            <SectionHead n="08" title="Launch Plan" sub="Working backwards from 6 meetings / month" />
            <LaunchBlock lp={data.launch_plan} />
          </section>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 pt-6 pb-12 flex justify-between items-center text-xs text-gray-300">
          <span>{CLIENT_NAME} · Outbound Strategy Brief · {dateLabel}</span>
          <span>Prepared by {PREPARED_BY} · GrowthLab</span>
        </div>
      </div>
    </>
  )
}

// ── Header helpers ────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-600 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function SectionHead({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-4 mb-7">
      <span className="text-3xl font-bold text-gray-100 leading-none mt-0.5 w-10 shrink-0">{n}</span>
      <div className="flex-1 border-t border-gray-200 pt-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

// ── Foundation ────────────────────────────────────────────────────────────────

function TextBlock({ label, text }: { label: string; text: string }) {
  if (!text?.trim()) return null
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  )
}

function BuyerLanguageBlock({ text }: { text: string }) {
  if (!text?.trim()) return null
  // Try to split on bullet lines for quote styling; fall back to plain text
  const lines = text.split('\n').filter(l => l.trim())
  const quotes = lines.filter(l => l.trim().startsWith('•') || l.trim().startsWith('-') || l.trim().startsWith('"'))
  const intro  = lines.filter(l => !l.trim().startsWith('•') && !l.trim().startsWith('-') && !l.trim().startsWith('"'))

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Buyer Language</p>
      {intro.map((l, i) => <p key={i} className="text-sm text-gray-500 mb-3">{l}</p>)}
      {quotes.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {quotes.map((q, i) => (
            <div key={i} className="bg-gray-50 border-l-2 border-gray-200 rounded-r-lg pl-3 pr-4 py-2">
              <p className="text-sm text-gray-700 italic leading-snug">
                {q.replace(/^[•\-"]\s*/, '').replace(/"$/, '')}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{text}</p>
      )}
    </div>
  )
}

// ── Market Design ─────────────────────────────────────────────────────────────

function ICPBlock({ icp }: { icp: ICPData }) {
  const rows: [string, string][] = ([
    ['Industry',      icp.industry],
    ['Company Size',  icp.company_size],
    ['Geography',     icp.geography],
    ['Stage',         icp.stage],
    ['Revenue Range', icp.revenue_range],
  ] as [string, string][]).filter(([, v]) => v?.trim())

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {/* ICP card — dark */}
      <div className="col-span-2 bg-gray-900 rounded-xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Ideal Customer Profile</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {rows.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-gray-600 mb-0.5">{label}</p>
              <p className="text-sm font-medium text-white">{value}</p>
            </div>
          ))}
        </div>
        {icp.notes?.trim() && (
          <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-800">{icp.notes}</p>
        )}
      </div>

      {/* Anti-ICP card — red tint */}
      {icp.anti_icp?.trim() && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Not This</p>
          <p className="text-sm text-red-700 leading-relaxed">{icp.anti_icp}</p>
        </div>
      )}
    </div>
  )
}

function SegmentsBlock({ segments }: { segments: SegmentItem[] }) {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Segments — priority order</p>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={seg.id} className="flex gap-4 border border-gray-200 rounded-xl px-5 py-4">
            <span className="text-2xl font-bold text-gray-100 shrink-0 w-7 leading-tight">{i + 1}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{seg.name}</p>
              {seg.description?.trim()  && <p className="text-sm text-gray-500 mt-0.5">{seg.description}</p>}
              {seg.why_priority?.trim() && (
                <p className="text-xs text-gray-400 mt-1.5">
                  <span className="font-medium text-gray-500">Why first: </span>{seg.why_priority}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PersonasBlock({ personas, segments }: { personas: Persona[]; segments: SegmentItem[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Personas & Pain Maps</p>
      <div className="space-y-5">
        {personas.map(p => (
          <PersonaCard key={p.id} persona={p} segment={segments.find(s => s.id === p.segment_id)} />
        ))}
      </div>
    </div>
  )
}

function PersonaCard({ persona, segment }: { persona: Persona; segment?: SegmentItem }) {
  const cols = [
    { label: 'Goals & KPIs',  text: persona.goals        },
    { label: 'Frustrations',  text: persona.frustrations  },
    { label: 'Triggers',      text: persona.triggers      },
  ].filter(c => c.text?.trim())

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Dark header */}
      <div className="bg-gray-900 px-5 py-4 flex items-baseline justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">{persona.title || 'Untitled'}</h3>
          {persona.seniority?.trim() && <p className="text-xs text-gray-500 mt-0.5">{persona.seniority}</p>}
        </div>
        {segment?.name && (
          <span className="text-xs bg-white/10 text-gray-400 px-2.5 py-1 rounded-full shrink-0 ml-4">{segment.name}</span>
        )}
      </div>

      {/* Attributes grid */}
      {cols.length > 0 && (
        <div className={`grid divide-x divide-gray-100 bg-white`} style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}>
          {cols.map(col => (
            <div key={col.label} className="px-4 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{col.label}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{col.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pain map */}
      {persona.pains.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-100 px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pain Map</p>
          <div className="space-y-3">
            {persona.pains.map((pain, i) => <PainRow key={pain.id} pain={pain} index={i} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function PainRow({ pain, index }: { pain: Pain; index: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-sm font-semibold text-gray-900 mb-3">
        <span className="text-gray-300 mr-2">{index + 1}.</span>{pain.pain}
      </p>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Business Impact',    text: pain.business_impact },
          { label: 'If Left Unsolved',   text: pain.consequence     },
          { label: "Today's Workaround", text: pain.workaround      },
        ].map(col => col.text?.trim() ? (
          <div key={col.label}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{col.label}</p>
            <p className="text-xs text-gray-600 leading-relaxed">{col.text}</p>
          </div>
        ) : null)}
      </div>
    </div>
  )
}

// ── Signals ───────────────────────────────────────────────────────────────────

function SignalsBlock({ signals }: { signals: SignalsData }) {
  return (
    <div className="space-y-6">
      {signals.signal_types.length > 0 && (
        <div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Signal</th>
                  <th className="px-4 py-3 text-left">Where to find</th>
                  <th className="px-4 py-3 text-left">What it means</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {signals.signal_types.map(sig => (
                  <tr key={sig.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{sig.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{sig.where_to_find}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{sig.what_it_means}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(signals.qualification_criteria.trim() || signals.disqualification_criteria.trim()) && (
        <div className="grid grid-cols-2 gap-4">
          {signals.qualification_criteria.trim() && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Qualified if</p>
              <p className="text-xs text-green-800 whitespace-pre-wrap leading-relaxed">{signals.qualification_criteria}</p>
            </div>
          )}
          {signals.disqualification_criteria.trim() && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">Disqualified if</p>
              <p className="text-xs text-red-700 whitespace-pre-wrap leading-relaxed">{signals.disqualification_criteria}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Messaging ─────────────────────────────────────────────────────────────────

function HookCard({ row, index }: { row: MessagingRow; index: number }) {
  const chKey = row.channel?.toLowerCase() ?? 'other'
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Context bar */}
      <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-mono text-gray-300 mr-1">{String(index + 1).padStart(2, '0')}</span>
        {row.segment && <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">{row.segment}</span>}
        {row.persona && <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-medium">{row.persona}</span>}
        {row.channel && <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${CH_COLOR[chKey] ?? CH_COLOR.other}`}>{row.channel}</span>}
      </div>

      <div className="px-5 py-5">
        {/* Pain context */}
        {row.pain?.trim() && (
          <p className="text-xs text-gray-400 mb-4">
            <span className="font-semibold text-gray-500">Pain: </span>{row.pain}
          </p>
        )}

        {/* Hook — the star of the show */}
        {row.hook?.trim() && (
          <div className="border-l-[3px] border-gray-900 pl-4 mb-5">
            <p className="text-lg font-semibold text-gray-900 leading-snug">&ldquo;{row.hook}&rdquo;</p>
          </div>
        )}

        {/* Social proof */}
        {row.social_proof?.trim() && (
          <div className="flex gap-3 bg-emerald-50 rounded-xl px-4 py-3 mb-4">
            <span className="text-emerald-500 text-base shrink-0">↑</span>
            <p className="text-xs text-emerald-800 leading-relaxed">{row.social_proof}</p>
          </div>
        )}

        {/* CTAs */}
        {(row.cta_soft?.trim() || row.cta_hard?.trim()) && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            {row.cta_soft?.trim() && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Soft CTA <span className="normal-case font-normal">(first touch)</span></p>
                <p className="text-sm text-gray-700">{row.cta_soft}</p>
              </div>
            )}
            {row.cta_hard?.trim() && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Hard CTA <span className="normal-case font-normal">(later in sequence)</span></p>
                <p className="text-sm text-gray-700">{row.cta_hard}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Subject Lines ─────────────────────────────────────────────────────────────

function SubjectLinesBlock({ lines }: { lines: SubjectLine[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Subject Line Library</p>
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wider">
              <th className="px-4 py-2 text-left">Subject line</th>
              <th className="px-4 py-2 text-left">Pain / angle</th>
              <th className="px-4 py-2 text-left">Persona</th>
              <th className="px-4 py-2 text-left">Signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lines.map(sl => (
              <tr key={sl.id}>
                <td className="px-4 py-2.5 font-medium text-gray-900">{sl.subject}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{sl.pain_angle}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{sl.persona}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{sl.signal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Competitive ───────────────────────────────────────────────────────────────

function CompetitiveSection({ competitive }: { competitive: CompetitiveData }) {
  return (
    <div className="space-y-4">
      {competitive.competitors.map((c: Competitor) => (
        <div key={c.id} className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{c.name}</p>
            {c.what_they_do?.trim() && <p className="text-xs text-gray-500 mt-0.5">{c.what_they_do}</p>}
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {c.we_win_on?.trim() && (
              <div className="px-4 py-4 bg-green-50">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1.5">We win on</p>
                <p className="text-xs text-green-800 leading-relaxed whitespace-pre-wrap">{c.we_win_on}</p>
              </div>
            )}
            {c.they_win_on?.trim() && (
              <div className="px-4 py-4 bg-red-50">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1.5">They win on</p>
                <p className="text-xs text-red-700 leading-relaxed whitespace-pre-wrap">{c.they_win_on}</p>
              </div>
            )}
            {c.how_to_handle?.trim() && (
              <div className="px-4 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">How to handle</p>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{c.how_to_handle}</p>
              </div>
            )}
          </div>
        </div>
      ))}
      {competitive.positioning_notes?.trim() && (
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Overall Positioning</p>
          <p className="text-sm text-gray-600 leading-relaxed">{competitive.positioning_notes}</p>
        </div>
      )}
    </div>
  )
}

// ── Objections ────────────────────────────────────────────────────────────────

function ObjectionsSection({ objections }: { objections: ObjectionsData }) {
  return (
    <div className="space-y-4">
      {objections.objections.map((o: Objection, i: number) => (
        <div key={o.id} className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-start gap-4 bg-gray-50 px-5 py-3 border-b border-gray-100">
            <span className="text-xs font-mono font-bold text-gray-300 mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{o.objection}</p>
              {o.context?.trim() && <p className="text-xs text-gray-400 mt-0.5">{o.context}</p>}
            </div>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-6">
            {o.response?.trim() && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Response</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{o.response}</p>
              </div>
            )}
            {o.follow_up?.trim() && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">If no reply</p>
                <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">{o.follow_up}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Sequences ─────────────────────────────────────────────────────────────────

function SequenceTimeline({ steps, notes }: { steps: SequenceStep[]; notes: string }) {
  return (
    <div>
      <div className="relative pl-6">
        {/* Vertical track */}
        <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gray-200" />
        <div className="space-y-0">
          {steps.map((step, i) => {
            const chKey = step.channel?.toLowerCase() ?? 'other'
            const isLast = i === steps.length - 1
            return (
              <div key={step.id} className={`flex gap-4 ${isLast ? 'pb-0' : 'pb-6'}`}>
                {/* Dot */}
                <div className={`w-3.5 h-3.5 rounded-full ${CH_DOT[chKey] ?? CH_DOT.other} shrink-0 mt-1 -ml-6 z-10 ring-2 ring-white`} />
                {/* Content */}
                <div className="flex-1 -mt-0.5">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">Day {step.day}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${CH_COLOR[chKey] ?? CH_COLOR.other}`}>{step.channel}</span>
                    <span className="text-sm font-medium text-gray-800">{step.action}</span>
                  </div>
                  {step.content?.trim() && (
                    <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{step.content}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {notes?.trim() && (
        <div className="mt-5 bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </div>
  )
}

// ── Launch Plan ───────────────────────────────────────────────────────────────

function LaunchBlock({ lp }: { lp: LaunchPlanData }) {
  return (
    <div className="space-y-6">
      {/* Math funnel */}
      <div className="bg-gray-900 rounded-xl px-6 py-5 flex items-center justify-between gap-4">
        {[
          { n: '6',    sub: 'meetings / month',        note: 'the goal'             },
          { n: '←',    sub: '',                        note: ''                     },
          { n: '~17',  sub: 'replies needed',          note: '35% reply→meeting'    },
          { n: '←',    sub: '',                        note: ''                     },
          { n: '~210', sub: 'touchpoints / month',     note: '8% reply rate'        },
          { n: '←',    sub: '',                        note: ''                     },
          { n: '10',   sub: 'new contacts / day',      note: '+ follow-ups running' },
        ].map((item, i) =>
          item.sub === '' ? (
            <span key={i} className="text-gray-700 text-xl font-light shrink-0">{item.n}</span>
          ) : (
            <div key={i} className="text-center shrink-0">
              <p className="text-2xl font-bold text-white leading-none">{item.n}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
              {item.note && <p className="text-xs text-gray-600 mt-0.5">{item.note}</p>}
            </div>
          )
        )}
      </div>

      {/* Weekly ramp table */}
      {lp.weekly_targets.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Weekly Ramp</p>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Week</th>
                  <th className="px-4 py-3 text-center">New / day</th>
                  <th className="px-4 py-3 text-center">Follow-ups / day</th>
                  <th className="px-4 py-3 text-center">Meetings target</th>
                  <th className="px-4 py-3 text-left">Focus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lp.weekly_targets.map(w => (
                  <tr key={w.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{w.week}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{w.new_contacts}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{w.follow_ups}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-gray-900 text-white text-xs font-semibold px-2 py-0.5 rounded-full">{w.meetings_target}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{w.focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Metrics + ramp notes */}
      <div className="grid grid-cols-2 gap-4">
        {lp.success_metrics?.trim() && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Success Metrics</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{lp.success_metrics}</p>
          </div>
        )}
        {lp.ramp_notes?.trim() && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ramp Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{lp.ramp_notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
