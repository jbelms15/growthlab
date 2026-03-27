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

export async function POST(req: Request) {
  const { campaign_id } = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const weekStart = getWeekStart()

  const [campRes, icpRes, segsRes, personasRes, lastReviewRes, activeRes] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', campaign_id).single(),
    supabase.from('icp').select('*').eq('campaign_id', campaign_id).maybeSingle(),
    supabase.from('segments').select('*').eq('campaign_id', campaign_id).order('sort_order'),
    supabase.from('personas').select('*, pains(*)').eq('campaign_id', campaign_id),
    supabase
      .from('weekly_reports')
      .select('*')
      .eq('campaign_id', campaign_id)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign_id)
      .in('status', ['prospect', 'active']),
  ])

  const { data: weekTps } = await supabase
    .from('touchpoints')
    .select('status')
    .eq('campaign_id', campaign_id)
    .gte('date', weekStart)

  const campaign = campRes.data
  const icp = icpRes.data
  const segments = segsRes.data || []
  const personas = personasRes.data || []
  const lastReview = lastReviewRes.data
  const activeTargets = activeRes.count || 0
  const tps = weekTps || []

  const wd = campaign?.wizard_data || {}

  const icpText = icp
    ? `Industry: ${icp.industry || '—'} | Size: ${icp.company_size || '—'} | Geography: ${icp.geography || '—'} | Stage: ${icp.revenue_range || '—'}`
    : 'Not defined'

  const segmentsText =
    segments.map((s: any) => `- ${s.name}${s.why ? `: ${s.why}` : ''}`).join('\n') ||
    'Not defined'

  const personasText =
    personas
      .map(
        (p: any) =>
          `- ${p.title} (${p.seniority || 'N/A'})\n  Goals: ${p.goals || 'N/A'}\n  Frustrations: ${p.frustrations || 'N/A'}\n  Pains:\n${(p.pains || []).map((x: any) => `    • ${x.pain}${x.consequence ? `\n      Consequence: ${x.consequence}` : ''}${x.workaround ? `\n      Workaround today: ${x.workaround}` : ''}`).join('\n') || '    N/A'}`
      )
      .join('\n') || 'Not defined'

  const messagingText = wd.messaging
    ? `Hook: ${wd.messaging.hook}\nBody: ${wd.messaging.body}\nCTA: ${wd.messaging.cta}\nChannel: ${wd.messaging.channel}`
    : 'Not defined'

  const signalsText = wd.signals || 'Not defined'

  const lastReviewText = lastReview
    ? `Week of ${lastReview.week_start}:
- Touchpoints: ${lastReview.companies_contacted} | Replies: ${lastReview.replies} | Meetings: ${lastReview.meetings}
- Recommendations: ${lastReview.recommendations || 'N/A'}
- Key insights: ${lastReview.key_insights || 'N/A'}
- What worked: ${lastReview.what_worked || 'N/A'}`
    : 'No previous review — this is the first week of execution.'

  const prompt = `Generate a Monday Plan for the outbound campaign below. Week starting: ${weekStart}.

CAMPAIGN: ${campaign?.name}
GOAL: ${campaign?.goal || 'Not defined'}

ICP:
${icpText}

SEGMENTS:
${segmentsText}

PERSONAS & PAINS:
${personasText}

CURRENT MESSAGING:
${messagingText}

BUYING SIGNALS:
${signalsText}

CURRENT STATUS:
- Active/prospect targets in list: ${activeTargets}
- Touchpoints this week so far: ${tps.length}
- Replies this week: ${tps.filter((t: any) => t.status === 'replied').length}
- Meetings this week: ${tps.filter((t: any) => t.status === 'meeting').length}

LAST FRIDAY'S REVIEW:
${lastReviewText}

Generate a structured Monday Plan using EXACTLY these ## section headers:

## Top 3 Priorities
[3 numbered, specific, actionable priorities — grounded in the campaign context and last week's learnings]

## Target Segment
[Which segment to focus on this week and the specific reason why — reference the data or last week's insights]

## Experiment
[One clear, testable experiment with a specific hypothesis — what you're testing, what you expect to learn]

## Daily Targets
[Bullet list with: new contacts/day, follow-ups/day, channel focus, expected replies to handle]

## Messaging Angle
[Specific hook/angle tied to the target segment and their most relevant pain — not generic, reference a real signal if possible]

## Expected Outcomes
[What success looks like by Friday — be specific with numbers: contacts reached, replies expected, anything to validate]

Be direct and specific. Ground every recommendation in the campaign data and previous results. If this is the first week, focus on Phase 1: Foundation (list building, first outreach, establishing baseline).`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        stream: true,
        system:
          'You are a senior B2B outbound strategist. Generate structured, specific, actionable outbound plans. Use exactly the ## section headers requested. Be direct, avoid generic advice, and ground every recommendation in the provided data.',
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
