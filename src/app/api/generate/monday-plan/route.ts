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

  const [campRes, workspaceRes, lastReviewRes, activeRes, playbookRes] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', campaign_id).single(),
    supabase.from('client_workspaces').select('data').eq('client_name', 'Shikenso').maybeSingle(),
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
    supabase
      .from('playbook_entries')
      .select('section, title, content, status')
      .eq('campaign_id', campaign_id)
      .in('section', ['What Worked', 'Strategic Decisions'])
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const { data: weekTps } = await supabase
    .from('touchpoints')
    .select('status')
    .eq('campaign_id', campaign_id)
    .gte('date', weekStart)

  const campaign = campRes.data
  const ws = workspaceRes.data?.data
  const lastReview = lastReviewRes.data
  const activeTargets = activeRes.count || 0
  const tps = weekTps || []
  const wd = campaign?.wizard_data || {}

  // Pull strategy context from workspace
  const icp = ws?.market_design?.icp
  const allSegments: any[] = ws?.market_design?.segments || []
  const allPersonas: any[] = ws?.market_design?.personas || []
  const signals: any[] = ws?.signals?.signal_types || []
  const messagingMatrix: any[] = ws?.messaging?.matrix || []
  const subjectLines: any[] = ws?.messaging?.subject_lines || []
  const sequences: any[] = ws?.sequences?.steps || []

  // Campaign-specific targeting
  const targetSegmentName: string = wd.target_segment || ''
  const targetPersonaName: string = wd.target_persona || ''
  const targetSegment = allSegments.find(s => s.name === targetSegmentName)
  const targetPersona = allPersonas.find(p => p.title === targetPersonaName)
  const relevantMessaging =
    messagingMatrix.find(m => m.segment === targetSegmentName || m.persona === targetPersonaName) ||
    messagingMatrix[0]

  const icpText = icp
    ? `Industry: ${icp.industry || '—'} | Size: ${icp.company_size || '—'} | Geography: ${icp.geography || '—'} | Stage: ${icp.stage || '—'} | Revenue: ${icp.revenue_range || '—'}\nAnti-ICP: ${icp.anti_icp || '—'}`
    : 'Not defined'

  const targetingText = targetSegment
    ? [
        `Segment: ${targetSegment.name}`,
        `Why priority: ${targetSegment.why_priority}`,
        `Persona: ${targetPersonaName || 'Not specified'}`,
        targetPersona
          ? [
              `Goals: ${targetPersona.goals}`,
              `Frustrations: ${targetPersona.frustrations}`,
              `Pains:\n${(targetPersona.pains || [])
                .map(
                  (p: any) =>
                    `  • ${p.pain}\n    Impact: ${p.business_impact || '—'}\n    Workaround today: ${p.workaround || '—'}`
                )
                .join('\n')}`,
            ].join('\n')
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    : `Segment: ${targetSegmentName || 'Not set'}\nPersona: ${targetPersonaName || 'Not set'}`

  const messagingText = relevantMessaging
    ? [
        `Hook: ${relevantMessaging.hook}`,
        `Source quote: ${relevantMessaging.source_quote || '—'}`,
        `Social proof: ${relevantMessaging.social_proof || '—'}`,
        `CTA soft: ${relevantMessaging.cta_soft}`,
        `CTA hard: ${relevantMessaging.cta_hard}`,
      ].join('\n')
    : 'Not defined'

  const subjectLinesText =
    subjectLines
      .filter(
        sl => !targetPersonaName || sl.persona === targetPersonaName || !sl.persona
      )
      .slice(0, 3)
      .map(sl => `• "${sl.subject}" — ${sl.pain_angle} (signal: ${sl.signal})`)
      .join('\n') || 'Not defined'

  const signalsText = signals.length
    ? signals
        .map(s => `• ${s.name}: ${s.what_it_means}\n  Find via: ${s.where_to_find}`)
        .join('\n')
    : ws?.signals?.qualification_criteria || 'Not defined'

  const sequenceText = sequences.length
    ? sequences.map(s => `Day ${s.day} (${s.channel}): ${s.action}`).join('\n')
    : 'Not defined'

  const playbookEntries = playbookRes.data || []
  const playbookText = playbookEntries.length
    ? playbookEntries
        .map(e => {
          const status = e.status || 'hypothesis'
          const statusLabel = status === 'locked' ? '[LOCKED ✓]' : status === 'in_testing' ? '[In Testing]' : '[Hypothesis]'
          return `${statusLabel} [${e.section}] ${e.title}${e.content ? ': ' + e.content.slice(0, 200) : ''}`
        })
        .join('\n')
    : 'No playbook entries yet.'

  const lastReviewText = lastReview
    ? `Week of ${lastReview.week_start}:
- Touchpoints: ${lastReview.companies_contacted} | Replies: ${lastReview.replies} | Meetings: ${lastReview.meetings} | SQLs: ${lastReview.sqls ?? 0}
- Recommendations: ${lastReview.recommendations || 'N/A'}
- Key insights: ${lastReview.key_insights || 'N/A'}
- What worked: ${lastReview.what_worked || 'N/A'}`
    : 'No previous review — this is the first week of execution.'

  const prompt = `Generate a Monday Plan for the outbound campaign below. Week starting: ${weekStart}.

CAMPAIGN: ${campaign?.name}
GOAL: ${campaign?.goal || 'Not defined'}

ICP:
${icpText}

THIS CAMPAIGN'S TARGET:
${targetingText}

MESSAGING FOR THIS SEGMENT/PERSONA:
${messagingText}

SUBJECT LINE VARIANTS TO TEST:
${subjectLinesText}

BUYING SIGNALS TO WATCH:
${signalsText}

OUTREACH SEQUENCE:
${sequenceText}

CURRENT STATUS:
- Active/prospect targets in list: ${activeTargets}
- Touchpoints this week so far: ${tps.length}
- Replies this week: ${tps.filter((t: any) => t.status === 'replied').length}
- Meetings this week: ${tps.filter((t: any) => t.status === 'meeting').length}

NORTH STAR: 6 SQLs/month (SQL = meeting that passes qualification). Meetings are a leading indicator — SQLs are the metric that matters.

PLAYBOOK — WHAT'S WORKED / STRATEGIC DECISIONS:
${playbookText}

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
