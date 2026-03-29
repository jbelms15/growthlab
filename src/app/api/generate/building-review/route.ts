import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const PHASES = [
  { id: 'foundation',    label: 'Foundation',    timeline: 'Weeks 1–2' },
  { id: 'market_design', label: 'Market Design', timeline: 'Weeks 2–3' },
  { id: 'signals',       label: 'Signals',       timeline: 'Week 3'    },
  { id: 'messaging',     label: 'Messaging',     timeline: 'Weeks 3–4' },
  { id: 'competitive',   label: 'Competitive',   timeline: 'Ongoing'   },
  { id: 'objections',    label: 'Objections',    timeline: 'Ongoing'   },
  { id: 'sequences',     label: 'Sequences',     timeline: 'Week 4'    },
  { id: 'launch_plan',   label: 'Launch Plan',   timeline: 'Weeks 5–6' },
]

function isStarted(data: any, id: string): boolean {
  switch (id) {
    case 'foundation':    return Object.values(data.foundation || {}).some((v: any) => (v ?? '').trim?.().length > 0)
    case 'market_design': return Object.values(data.market_design?.icp || {}).some((v: any) => (v ?? '').trim?.().length > 0)
                            || (data.market_design?.segments?.length ?? 0) > 0
                            || (data.market_design?.personas?.length ?? 0) > 0
    case 'signals':       return (data.signals?.signal_types?.length ?? 0) > 0 || !!(data.signals?.qualification_criteria?.trim())
    case 'messaging':     return (data.messaging?.matrix?.length ?? 0) > 0 || (data.messaging?.subject_lines?.length ?? 0) > 0
    case 'competitive':   return (data.competitive?.competitors?.length ?? 0) > 0 || !!(data.competitive?.positioning_notes?.trim())
    case 'objections':    return (data.objections?.objections?.length ?? 0) > 0
    case 'sequences':     return (data.sequences?.steps?.length ?? 0) > 0
    case 'launch_plan':   return (data.launch_plan?.weekly_targets?.length ?? 0) > 0 || !!(data.launch_plan?.success_metrics?.trim())
    default: return false
  }
}

export async function POST(req: Request) {
  const { campaign_id, qualitative, week_plan } = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [campRes, workspaceRes] = await Promise.all([
    supabase.from('campaigns').select('name, goal').eq('id', campaign_id).single(),
    supabase.from('client_workspaces').select('data').eq('client_name', 'Shikenso').maybeSingle(),
  ])

  const campaign = campRes.data
  const ws = workspaceRes.data?.data || {}

  const sectionStatus = PHASES.map(p => ({
    ...p,
    done: isStarted(ws, p.id),
  }))

  const completedCount = sectionStatus.filter(s => s.done).length
  const sectionStatusText = sectionStatus
    .map(s => `${s.done ? '✅' : '○'} ${s.label} (${s.timeline})`)
    .join('\n')

  const planText = week_plan
    ? `Focus Areas: ${week_plan.priorities || 'Not set'}\nKey Questions: ${week_plan.experiment || 'Not set'}\nDeliverables planned: ${week_plan.expected_outcomes || 'Not set'}`
    : 'No Monday Plan was set for this week.'

  const prompt = `Generate a Friday Review for a SYSTEM DESIGN week — not execution. This week was spent building Shikenso's B2B Outbound Playbook.

CAMPAIGN: ${campaign?.name}
GOAL: ${campaign?.goal || 'Not defined'}

STRATEGY WORKSPACE COMPLETION (${completedCount}/8 sections):
${sectionStatusText}

MONDAY'S BUILDING PLAN:
${planText}

WHAT THE STRATEGIST DID THIS WEEK:
Completed: ${qualitative.completed || 'Not provided'}
Still unclear: ${qualitative.unclear || 'Not provided'}
Key decisions made: ${qualitative.decisions || 'Not provided'}
Inputs still needed: ${qualitative.inputs_needed || 'Not provided'}

Generate a structured Friday Building Review using EXACTLY these ## section headers:

## What You Completed
[Specific sections/outputs completed this week — compare to what was planned. Be honest about gaps.]

## Key Decisions Made
[Strategic decisions locked in this week — document these clearly as they shape everything downstream]

## Open Questions
[Specific unresolved questions that still need answers before this section or the next can be solid]

## System Readiness
[Honest assessment of where the B2B outbound system stands today — what's solid, what needs more work, what's blocking launch. Reference the section completion status.]

## Next Week Priorities
[Top 3 specific priorities for next week — grounded in what's remaining and what's most important to unblock]

Be direct and honest. This is a design phase — the goal is to build a high-quality system, not to rush through sections.`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        stream: true,
        system:
          'You are a senior B2B outbound strategist reviewing a week of system design work. Be direct and honest about system readiness — gaps in the strategy now become execution problems later. Use exactly the ## section headers requested.',
        messages: [{ role: 'user', content: prompt }],
      })
      for await (const chunk of response) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
