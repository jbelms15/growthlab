import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: Request) {
  const { campaign_id, week_data, week_plan, qualitative, sql_target = 6 } = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [campRes, workspaceRes] = await Promise.all([
    supabase.from('campaigns').select('name, goal, wizard_data').eq('id', campaign_id).single(),
    supabase.from('client_workspaces').select('data').eq('client_name', 'Shikenso').maybeSingle(),
  ])

  const campaign = campRes.data
  const ws = workspaceRes.data?.data
  const wd = campaign?.wizard_data || {}

  const icp = ws?.market_design?.icp
  const segments: any[] = ws?.market_design?.segments || []

  const icpText = icp
    ? `${icp.industry || '—'}, ${icp.company_size || '—'}, ${icp.geography || '—'}`
    : 'N/A'

  const segmentsText = segments.map(s => s.name).join(', ') || 'N/A'
  const targetSegment: string = wd.target_segment || 'Not set'
  const targetPersona: string = wd.target_persona || 'Not set'

  const replyRate =
    week_data.totalTouchpoints > 0
      ? Math.round(((week_data.replies + week_data.meetings) / week_data.totalTouchpoints) * 100)
      : 0

  const planText = week_plan
    ? `Target segment: ${week_plan.target_segment || 'Not set'}
Experiment: ${week_plan.experiment || 'Not set'}
Daily new contacts target: ${week_plan.daily_new_contacts}
Daily follow-ups target: ${week_plan.daily_followups}
Messaging angle: ${week_plan.messaging_angle || 'Not set'}
Expected outcomes: ${week_plan.expected_outcomes || 'Not set'}`
    : 'No Monday Plan was set for this week.'

  const prompt = `Generate a Friday Review for the outbound campaign below.

CAMPAIGN: ${campaign?.name}
GOAL: ${campaign?.goal || 'Not defined'}
ICP: ${icpText}
All segments: ${segmentsText}
This campaign's target: ${targetSegment} — ${targetPersona}

MONDAY'S PLAN:
${planText}

ACTUAL WEEK DATA:
- New companies prospected: ${week_data.newCompanies}
- Total touchpoints sent: ${week_data.totalTouchpoints}
- Replies received: ${week_data.replies}
- Meetings booked: ${week_data.meetings}
- SQLs (qualified meetings): ${week_data.sqls ?? 0} — north star target is ${sql_target}/month
- No replies: ${week_data.noReplies}
- Overall reply rate: ${replyRate}%

USER'S QUALITATIVE INPUT:
What worked: ${qualitative.what_worked || 'Not provided'}
What didn't work: ${qualitative.what_didnt || 'Not provided'}
Surprises: ${qualitative.surprises || 'Not provided'}
Other observations: ${qualitative.other || 'Not provided'}

Generate a structured Friday Review using EXACTLY these ## section headers:

## Weekly Summary
[2-3 sentences: factual summary of what happened this week — volume, results, key events]

## Performance Analysis
[Honest comparison of planned vs actual. What drove the results? What worked and what didn't — reference specific data points. Be direct, including about underperformance.]

## Key Insights
[2-3 numbered, specific insights grounded in this week's data — patterns, surprises, or validated hypotheses]

## Risks & Issues
[Any concerning trends, blockers, or things that need attention next week — be direct]

## Recommendations for Next Week
[3 numbered, specific, actionable recommendations for Monday's plan — concrete enough to act on immediately]

## Playbook Learnings
[1-3 learnings in exactly this format for each. Assign a Status based on evidence:
- Hypothesis: observed once, not yet confirmed
- In Testing: seen across 2+ weeks or multiple segments, actively testing
- Locked: consistent across 3+ weeks of data, validated — recommend capturing permanently

**Learning:** [what you learned this week that should be captured]
**Section:** [one of: What Worked / Hook Variations / Segment Insights / Reply Patterns / Meeting Notes / Performance Benchmarks]
**Status:** [Hypothesis / In Testing / Locked]
**Action:** [how to document or apply this going forward]]

Be specific and honest. Every observation must be grounded in the actual data provided.`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        stream: true,
        system:
          'You are a senior B2B outbound strategist reviewing a week of outbound execution. Be direct, specific, and honest — including about underperformance. Ground every observation in the actual data. Use exactly the ## section headers requested.',
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
