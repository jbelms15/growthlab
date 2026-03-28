-- Seed example Shikenso strategy data
-- Run this in Supabase SQL Editor to pre-fill the Strategy Workspace

INSERT INTO client_workspaces (client_name, data, updated_at)
VALUES (
  'Shikenso',
  $json${
    "foundation": {
      "product_knowledge": "Shikenso is an AI-powered sponsorship analytics platform. It automatically tracks brand exposure across video (streams, broadcasts, TV), audio, and social media — then converts raw exposure into quantified media value reports.\n\nWhat it does in one line: it tells sponsors exactly what they got for their money, in hours not days.\n\nKey features:\n• Video asset recognition + visibility grading + media valuation\n• Audio tracking (voice mentions, jingles)\n• Social media monitoring (hashtags, branded content)\n• White-label sponsor reports delivered automatically\n• GDPR compliant, EU-based infrastructure\n\nPricing: starts at $1,240/month. Flexible model based on volume of content tracked. Includes a 3-week implementation guarantee — money back if not live in time.\n\nProof points:\n• MOONTON Games: €115M in branded media value tracked\n• OMR Festival: €130K in sponsorship media value generated\n• 300% increase in sponsor ROI reported after adopting data-driven approach\n• 98% client satisfaction from post-demo surveys\n• 20M+ brand impressions tracked monthly globally\n• GIANTX: integrated 17 new brand partners using Shikenso data",
      "inbound_analysis": "Inbound buyers tend to be Heads of Partnerships or commercial leads at esports organisations and sports properties who are about to enter renewals season or have just lost a sponsor.\n\nThey find Shikenso via: word of mouth from other org ops teams, esports industry newsletters, or being referred by an agency.\n\nCommon trigger for inbound: a sponsor asked for a performance report and the org realised they had nothing credible to send — or they lost a deal at renewal because a competitor showed better data.\n\nWhy they choose Shikenso:\n• Only platform priced for rights holders, not enterprise brands\n• Fast onboarding — first report live within 3 weeks (guaranteed)\n• Covers video + audio + social in one place vs. stitching tools together\n• EU-based (matters for GDPR compliance in European leagues and broadcasters)",
      "buyer_language": "Exact phrases heard on calls and in the market:\n\n• \"Our sponsors keep asking what they're getting and we send them a screenshot deck.\"\n• \"We lost [sponsor] at renewal because we couldn't show them the numbers.\"\n• \"Everyone else seems to have a proper data story — we're still doing it in Excel.\"\n• \"I need something professional I can put in front of a brand's CMO.\"\n• \"If I could automate the reporting I'd get hours back every week.\"\n• \"We're trying to upsell our sponsors but it's hard without historical performance data.\"\n• \"Our agency keeps asking for reports and it takes us days to put together.\"\n• \"We track 10 sponsors manually — it doesn't scale.\"",
      "case_studies": "MOONTON Games\n€115M in branded media value tracked. Used Shikenso to quantify exposure across their Mobile Legends Bang Bang esports ecosystem.\n\nOMR Festival\n€130K in sponsorship media value generated. Used automated tracking across the event's stream and social coverage.\n\nGIANTX (esports team)\nIntegrated 17 new brand partners using Shikenso's performance data as part of the pitch. Data-driven approach enabled faster deal closure.\n\nKRÜ Esports\n280% increase in fan engagement after adopting data-backed sponsor activations.\n\nPattern across wins: organisations that replace manual reporting with Shikenso close more sponsors, upsell existing ones, and reduce churn at renewal — because they walk into every sponsor conversation with numbers."
    },
    "market_design": {
      "icp": {
        "industry": "Esports organisations — teams, tournament organisers, leagues, media properties. Also: sports clubs with esports divisions.",
        "company_size": "15–300 employees",
        "geography": "Europe (DACH, UK, Nordics, Benelux priority). Expanding to NA.",
        "stage": "Post-seed or profitable. 2+ active brand sponsors. Active in competition or running regular events.",
        "revenue_range": "€500K–€20M annual revenue",
        "anti_icp": "Solo content creators or streamers (no sponsorship infrastructure). Pure B2C gaming brands (they'd be the sponsor, not the buyer). Orgs with zero current sponsors — no urgency. US-only orgs (outside current territory focus). Agencies that don't own the sponsorship relationship.",
        "notes": "Best fit signals: 3+ active sponsors, renewals coming up in 3–6 months, dedicated partnerships lead exists. Strong fit if they've recently lost a sponsor or are pitching new brands and losing on data."
      },
      "segments": [
        {
          "id": "seg-1",
          "name": "Esports tournament organisers",
          "description": "Companies that run recurring tournaments or leagues — ESL, BLAST-style regional operators, or national league operators. Manage 5–15+ brand sponsors simultaneously across events.",
          "why_priority": "Highest pain — tracking ROI across 10+ sponsors manually is impossible. Clear before/after story. Budget available from event revenue. Decision is often a single commercial director.",
          "priority_rank": 1
        },
        {
          "id": "seg-2",
          "name": "Esports teams (league-level)",
          "description": "Teams competing in LEC, ESL Pro League, regional leagues (LFL, PG Nationals, etc). Have 3–10 brand sponsors and a dedicated partnerships function.",
          "why_priority": "Predictable renewal cycle tied to competitive season. Head of Partnerships role almost always exists. Proof-of-concept is easy — offer to run a free report on one sponsor.",
          "priority_rank": 2
        },
        {
          "id": "seg-3",
          "name": "Sports clubs with esports divisions",
          "description": "Traditional football/basketball clubs (e.g. Club Brugge) that have launched an esports arm. Often have existing corporate sponsor relationships to extend into esports.",
          "why_priority": "Faster sales cycle — decision maker is the club's commercial director who already understands ROI reporting. Budget is not the constraint. Shikenso already has Club Brugge as a reference.",
          "priority_rank": 3
        }
      ],
      "personas": [
        {
          "id": "persona-1",
          "segment_id": "seg-1",
          "title": "Head of Partnerships",
          "seniority": "Senior Manager / Director",
          "goals": "Hit annual sponsorship revenue target. Renew existing sponsors at same or higher tier. Close 2–3 new brand deals per quarter. Build a pitch deck that wins competitive RFPs against bigger orgs.",
          "frustrations": "Spends hours each month compiling sponsor reports from stream VODs, social screenshots, and spreadsheets. Sponsors ask for data we can't access cleanly. Losing deals at renewal because we can't prove value. Hard to upsell without historical performance data.",
          "triggers": "Sponsor renewal coming up in the next 90 days. Just lost a sponsor at renewal. New sponsor just signed and needs a strong first report. CEO has set a sponsorship revenue growth target.",
          "pains": [
            {
              "id": "pain-1-1",
              "pain": "Can't prove sponsorship ROI — reports are manual, slow, and unconvincing",
              "business_impact": "Sponsors don't renew or downgrade. Each churned sponsor is €20–150K in lost revenue.",
              "consequence": "Sponsorship revenue stagnates. Org becomes less competitive. CEO pressure increases. Partnerships team loses credibility.",
              "workaround": "Manual Excel/PowerPoint decks built from stream screenshots and social stats. Takes 4–6 hours per sponsor per month. Still looks unprofessional."
            },
            {
              "id": "pain-1-2",
              "pain": "Losing new sponsor pitches to orgs with better data",
              "business_impact": "Missing revenue from brands actively investing in esports. Can't differentiate when competing for the same brand budget.",
              "consequence": "Stuck at the same sponsorship revenue year over year while data-driven competitors grow.",
              "workaround": "Rely on relationships and audience size claims. Works less well with new brands unfamiliar with esports who want hard numbers."
            }
          ]
        },
        {
          "id": "persona-2",
          "segment_id": "seg-2",
          "title": "CEO / Founder",
          "seniority": "C-suite (smaller orgs, <50 employees)",
          "goals": "Grow commercial revenue to fund roster, operations, and growth. Attract tier-1 brand sponsors. Reduce dependency on prize money. Build a scalable business.",
          "frustrations": "Commercial team is small — every hour on admin is an hour not closing deals. Hard to compete for premium brand budgets without enterprise analytics. Board and investors want to see recurring revenue growth.",
          "triggers": "Board meeting or investor update. Hiring a first dedicated partnerships person. Just missed a revenue target. Competitor signed a brand they were pitching.",
          "pains": [
            {
              "id": "pain-2-1",
              "pain": "No scalable way to manage sponsor reporting — everything is manual and person-dependent",
              "business_impact": "Revenue growth is capped by headcount. If the partnerships person leaves, institutional knowledge and sponsor relationships are at risk.",
              "consequence": "Can't scale sponsor revenue without scaling headcount. Business is fragile and hard to value.",
              "workaround": "One person manages all sponsor comms from memory and personal spreadsheets. No system, no audit trail."
            }
          ]
        }
      ]
    },
    "signals": {
      "signal_types": [
        {
          "id": "sig-1",
          "name": "Hiring a Partnerships Manager or Sponsorship Executive",
          "description": "Org is actively recruiting for a partnerships-focused role",
          "where_to_find": "LinkedIn Jobs, Sales Navigator company alerts, org careers page",
          "what_it_means": "Scaling their sponsorship function — budget exists, intent to invest in the right infrastructure. High urgency window."
        },
        {
          "id": "sig-2",
          "name": "Announced a new brand sponsor",
          "description": "Org announced a new sponsorship deal on LinkedIn, Twitter/X, or via press release",
          "where_to_find": "LinkedIn company page, Twitter/X, Esports Insider, Dot Esports",
          "what_it_means": "New sponsor = immediate need to prove ROI from day one. Best time to reach out — they want to start the relationship well and set the right expectations."
        },
        {
          "id": "sig-3",
          "name": "Competing in or hosting a major event season",
          "description": "Org is entering a league season, tournament run, or hosting a flagship event in the next 4–8 weeks",
          "where_to_find": "Liquipedia, Battlefy, ESL/FACEIT tournament pages, Esports Charts",
          "what_it_means": "High sponsor activity period. Reporting will be needed. Decision makers are in planning and budget mode."
        },
        {
          "id": "sig-4",
          "name": "Funding round or investment announced",
          "description": "Org has raised seed, Series A, or secured strategic investment",
          "where_to_find": "Crunchbase, LinkedIn, Esports Insider, TechCrunch",
          "what_it_means": "Budget available. Growth mode. Likely investing in infrastructure to support commercial targets."
        },
        {
          "id": "sig-5",
          "name": "New commercial / partnerships hire joined",
          "description": "A new Head of Partnerships, Commercial Director, or Sponsorship Manager just started",
          "where_to_find": "LinkedIn 'new role' notifications via Sales Navigator",
          "what_it_means": "New hire wants to make an impact fast. First 90 days = high openness to new tools. They'll own the decision."
        }
      ],
      "qualification_criteria": "✓ Esports org with 2+ active brand sponsors\n✓ Has a dedicated partnerships lead or commercial director\n✓ 15+ employees (budget and structure in place)\n✓ Active in competition or running regular events\n✓ Located in Europe (DACH, UK, Nordics, Benelux preferred)\n✓ At least one qualifying signal present before outreach\n✓ Renewal season within the next 6 months (ideal)",
      "disqualification_criteria": "✗ No current sponsors — no urgency, 6+ month sales cycle\n✗ Fewer than 10 employees — likely no budget or dedicated function\n✗ Pure content creator or influencer-based org\n✗ Already a known Shikenso customer\n✗ US-only org (outside current territory focus)\n✗ Agency without direct sponsorship ownership"
    },
    "messaging": {
      "matrix": [
        {
          "id": "msg-1",
          "segment": "Tournament organisers",
          "persona": "Head of Partnerships",
          "pain": "Manual sponsor reporting across 10+ sponsors — hours wasted, looks unprofessional",
          "hook": "How [Esports org] went from 4-hour manual reports to automated sponsor dashboards — and renewed every sponsor that season",
          "channel": "LinkedIn",
          "social_proof": "GIANTX used Shikenso data to integrate 17 new brand partners. MOONTON tracked €115M in branded media value. Both started because manual reporting had become unmanageable.",
          "cta_soft": "Curious if you're running into the same reporting challenge — worth a quick chat?",
          "cta_hard": "Can I show you what your sponsor dashboard would look like for [upcoming event]? 20 minutes, no prep needed."
        },
        {
          "id": "msg-2",
          "segment": "Esports teams",
          "persona": "Head of Partnerships",
          "pain": "Losing sponsor pitches and renewals to orgs with better performance data",
          "hook": "The reason most esports orgs lose sponsor renewals isn't the audience size — it's that they can't show brands what they actually got",
          "channel": "Email",
          "social_proof": "Orgs using Shikenso walk into renewals with a live performance report instead of a deck they built over a weekend. 300% increase in sponsor ROI is the average outcome we see.",
          "cta_soft": "Happy to send a sample sponsor report — takes 2 minutes to look at.",
          "cta_hard": "Would it be useful to run a free visibility audit on one of your current sponsors before your next renewal?"
        }
      ]
    },
    "sequences": {
      "steps": [
        {
          "id": "step-1",
          "day": 1,
          "channel": "linkedin",
          "action": "Connection request — no note",
          "content": "Send connection request with no accompanying message. Personalisation comes in Day 3 once connected. Keep it clean — unsolicited notes on connection requests reduce accept rates."
        },
        {
          "id": "step-2",
          "day": 3,
          "channel": "linkedin",
          "action": "First message — hook tied to signal",
          "content": "Hi [Name], noticed [ORG] just [signal — e.g. announced the partnership with [Brand] / are heading into [Tournament] season].\n\nOne thing orgs often find at this stage: the first sponsor report is the hardest — especially under pressure to show early ROI.\n\nWe help teams like yours automate that. Worth a quick look?"
        },
        {
          "id": "step-3",
          "day": 7,
          "channel": "email",
          "action": "Full email — hook + body + soft CTA",
          "content": "Subject: sponsor reporting for [ORG]\n\nHi [Name],\n\nMost partnerships leads I talk to are spending 4+ hours per sponsor per month on reports — usually a mix of stream screenshots, spreadsheets, and hoping the sponsor doesn't ask too many questions.\n\nShikenso automates brand visibility tracking across video, audio, and social — so you can send sponsors a live performance dashboard instead of a deck you built over a weekend.\n\nGIANTX used it to bring on 17 new brand partners. MOONTON tracked €115M in branded media value. Both started where you likely are now.\n\nWorth 20 minutes to see if it fits [ORG]'s setup?"
        },
        {
          "id": "step-4",
          "day": 10,
          "channel": "linkedin",
          "action": "LinkedIn follow-up — one-liner",
          "content": "Following up on my email — did it land? Happy to pull a sample report for one of [ORG]'s sponsors if it helps make it concrete."
        },
        {
          "id": "step-5",
          "day": 14,
          "channel": "email",
          "action": "Email — different angle, ask a question",
          "content": "Subject: re: sponsor reporting\n\nHi [Name],\n\nDifferent angle — not pushing Shikenso specifically.\n\nHow are you currently handling sponsor ROI reporting for [ORG]? Specifically the 'here's what your logo exposure looked like this month across streams and social' part.\n\nAsking because there's a wide range — some orgs have it fully automated, others are still doing it manually. Just trying to understand where you are.\n\n[Name]"
        },
        {
          "id": "step-6",
          "day": 21,
          "channel": "email",
          "action": "Break-up message — leave the door open",
          "content": "Subject: closing the loop\n\nHi [Name],\n\nI've reached out a few times — I'll take the silence as 'not right now' and won't follow up again.\n\nIf sponsor reporting or proving ROI to brands ever becomes a priority, I'm at [email]. Happy to pick this up whenever the timing makes sense.\n\n[Name]"
        }
      ],
      "notes": "6-step sequence over 21 days. LinkedIn first (lower friction for first touch), then email for the full pitch. Day 14 email deliberately avoids pitching — asks a question to re-engage without pressure.\n\nVariant: if LinkedIn connection not accepted by Day 5, skip Day 3 LinkedIn message and go straight to email on Day 7 with a cold intro line added.\n\nBuild in HubSpot. Design here, execute there."
    },
    "launch_plan": {
      "weekly_targets": [
        {
          "id": "wk-1",
          "week": "May wk 1",
          "new_contacts": 5,
          "follow_ups": 0,
          "meetings_target": 0,
          "focus": "Test messaging — 2 variants in parallel. Track open and reply rate only."
        },
        {
          "id": "wk-2",
          "week": "May wk 2",
          "new_contacts": 8,
          "follow_ups": 5,
          "meetings_target": 1,
          "focus": "Ramp volume. Identify winning variant. First meeting target."
        },
        {
          "id": "wk-3",
          "week": "May wk 3",
          "new_contacts": 10,
          "follow_ups": 10,
          "meetings_target": 2,
          "focus": "Full cadence running. Optimise follow-up timing and angles."
        },
        {
          "id": "wk-4",
          "week": "May wk 4",
          "new_contacts": 10,
          "follow_ups": 15,
          "meetings_target": 3,
          "focus": "Friday review — kill what isn't working. Double down on best segment."
        }
      ],
      "success_metrics": "Month 1 (May): 2–3 meetings booked, reply rate >8%\nMonth 2 (Jun): 4–5 meetings/month, reply rate >10%, 1 qualified opportunity in pipeline\nMonth 3 (Jul): 6+ meetings/month consistently, 2–3 active opportunities\n\nWeekly leading indicators:\n• Reply rate (target 8–12%)\n• Meeting conversion from reply (target 30–40%)\n• LinkedIn connection accept rate (target 25–35%)",
      "ramp_notes": "Weeks 1–2: Test mode. Low volume (5–8 new/day), 2 message variants running. Focus is learning signal, not volume.\n\nWeeks 3–4: Ramp mode. Kill losing variant. Scale to 10 new/day with sequence follow-ups running. Expect first meetings.\n\nMonth 2+: Full capacity. Sequence fully loaded. Focus shifts to reply-to-meeting conversion. Friday Review drives weekly iteration.\n\nWorking backwards from 6 meetings/month:\n→ 6 meetings ÷ 35% reply-to-meeting = ~17 replies needed\n→ 17 replies ÷ 8% reply rate = ~210 touchpoints/month\n→ = 10 new contacts/day + existing sequence follow-ups"
    }
  }$json$::jsonb,
  now()
)
ON CONFLICT (client_name)
DO UPDATE SET
  data       = EXCLUDED.data,
  updated_at = now();
