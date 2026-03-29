import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

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
  const { campaign_id } = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const weekStart = getWeekStart()

  const [campRes, workspaceRes, lastReviewRes] = await Promise.all([
    supabase.from('campaigns').select('name, goal').eq('id', campaign_id).single(),
    supabase.from('client_workspaces').select('data').eq('client_name', 'Shikenso').maybeSingle(),
    supabase
      .from('weekly_reports')
      .select('recommendations, key_insights, week_start')
      .eq('campaign_id', campaign_id)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const campaign = campRes.data
  const ws = workspaceRes.data?.data || {}
  const lastReview = lastReviewRes.data

  // Build section completion status
  const sectionStatus = PHASES.map(p => ({
    ...p,
    done: isStarted(ws, p.id),
  }))

  const completedCount = sectionStatus.filter(s => s.done).length
  const completedSections = sectionStatus.filter(s => s.done).map(s => s.label).join(', ') || 'None yet'
  const remainingSections = sectionStatus.filter(s => !s.done).map(s => `${s.label} (${s.timeline})`).join(', ') || 'All done!'

  const sectionStatusText = sectionStatus
    .map(s => `${s.done ? '✅' : '○'} ${s.label} (${s.timeline})`)
    .join('\n')

  const lastReviewText = lastReview
    ? `Week of ${lastReview.week_start}:\n- Recommendations: ${lastReview.recommendations || 'N/A'}\n- Key insights: ${lastReview.key_insights || 'N/A'}`
    : 'No previous review — this is the first week of building.'

  const prompt = `Generate a Building Plan for Week starting: ${weekStart}.

This is a SYSTEM DESIGN week — not execution. The goal is to build Shikenso's B2B Outbound Playbook before starting outreach. North star: >6 SQLs/month once in execution.

CAMPAIGN: ${campaign?.name}
GOAL: ${campaign?.goal || 'Not defined'}

STRATEGY WORKSPACE COMPLETION (${completedCount}/8 sections):
${sectionStatusText}

Completed: ${completedSections}
Remaining: ${remainingSections}

LAST FRIDAY'S REVIEW:
${lastReviewText}

Generate a structured Building Plan using EXACTLY these ## section headers:

## Focus Areas
[1-2 Strategy sections to complete or significantly advance this week — reference the timeline and what's already done. Be specific about what "done" means for each section.]

## Key Questions to Answer
[2-3 specific questions that must be resolved this week to build the strategy correctly — things you need to research, validate, or decide]

## Deliverables by Friday
[Concrete, specific outputs that will exist Friday and don't exist today — not vague tasks, but actual documents, decisions, or completed sections. Format as a bullet list.]

## Inputs Needed
[What information do you need from Shikenso's team, their tools (HubSpot, Sales Nav), or external research to complete this week's work?]

## Next Week Preview
[What becomes unlocked once this week's deliverables are done — what's the logical next step?]

Be direct and specific. This is a design plan, not an execution plan. Every recommendation should advance the B2B outbound system toward launch readiness.`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        stream: true,
        system:
          'You are a senior B2B outbound strategist helping design an outbound system before execution begins. Generate structured, specific building plans focused on completing the strategic framework — ICP, messaging, sequences, and launch readiness. Use exactly the ## section headers requested. Be direct and concrete.',
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
