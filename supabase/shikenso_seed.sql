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
          "source_quote": "We track 10 sponsors manually — it doesn't scale.",
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
          "source_quote": "We lost [sponsor] at renewal because we couldn't show them the numbers.",
          "hook": "The reason most esports orgs lose sponsor renewals isn't the audience size — it's that they can't show brands what they actually got",
          "channel": "Email",
          "social_proof": "Orgs using Shikenso walk into renewals with a live performance report instead of a deck they built over a weekend. 300% increase in sponsor ROI is the average outcome we see.",
          "cta_soft": "Happy to send a sample sponsor report — takes 2 minutes to look at.",
          "cta_hard": "Would it be useful to run a free visibility audit on one of your current sponsors before your next renewal?"
        }
      ],
      "subject_lines": [
        {
          "id": "sl-1",
          "subject": "sponsor report for [ORG]",
          "pain_angle": "Manual reporting / hours wasted",
          "persona": "Head of Partnerships",
          "signal": "New sponsor announced",
          "notes": "Lower-case subject line performs better — looks like an internal forward. Works well as cold email opener."
        },
        {
          "id": "sl-2",
          "subject": "what did [Brand] actually get from [ORG]?",
          "pain_angle": "Can't prove ROI to sponsors",
          "persona": "Head of Partnerships",
          "signal": "Renewal season approaching",
          "notes": "Ask-style subject triggers curiosity. Works best when the brand name is a recognisable logo from their sponsor page."
        },
        {
          "id": "sl-3",
          "subject": "the data behind [ORG]'s next sponsorship pitch",
          "pain_angle": "Losing pitches to data-equipped orgs",
          "persona": "CEO / Founder",
          "signal": "Hiring partnerships role",
          "notes": "Positioning angle — implies we have something they don't. Good for orgs actively pitching new brands."
        },
        {
          "id": "sl-4",
          "subject": "how [similar org] automated sponsor reporting",
          "pain_angle": "Manual reporting / no scalable process",
          "persona": "Head of Partnerships",
          "signal": "Competing in upcoming season",
          "notes": "Social proof in subject line. Replace [similar org] with a relevant tier-1 reference (GIANTX, MOONTON) based on segment."
        },
        {
          "id": "sl-5",
          "subject": "re: [ORG] + [Brand] partnership",
          "pain_angle": "New sponsor needs strong first report",
          "persona": "Head of Partnerships",
          "signal": "New sponsor announced",
          "notes": "Reply-thread format gets high open rates. Use immediately after a new sponsorship announcement — timing is everything here."
        },
        {
          "id": "sl-6",
          "subject": "quick question on sponsor ROI",
          "pain_angle": "Can't prove ROI / sponsor churn",
          "persona": "Head of Partnerships",
          "signal": "Any qualifying signal",
          "notes": "Generic but reliable. Use as a fallback when no strong signal exists. Pair with a one-line question in the body."
        },
        {
          "id": "sl-7",
          "subject": "your sponsors are asking for data you don't have",
          "pain_angle": "Sponsor asks for numbers, org has nothing credible",
          "persona": "Head of Partnerships",
          "signal": "New hire in partnerships",
          "notes": "Provocative — works well with cold audiences. A/B against softer subject lines. Best for new hires who are about to face this problem for the first time."
        },
        {
          "id": "sl-8",
          "subject": "closing the loop on sponsor reporting",
          "pain_angle": "No response to previous touches",
          "persona": "Head of Partnerships",
          "signal": "Any",
          "notes": "Break-up email subject. Low-pressure, high open rate. Use only on Day 21 of sequence — never earlier."
        }
      ]
    },
    "competitive": {
      "competitors": [
        {
          "id": "comp-1",
          "name": "Blinkfire Analytics",
          "what_they_do": "Social media analytics platform for sports and esports sponsorships. Tracks logo/brand exposure in social posts, stories, and video clips. Used by many North American esports orgs.",
          "we_win_on": "Shikenso covers video + audio + social in one platform vs Blinkfire's social-first approach. EU-based (GDPR compliant). Better pricing for rights holders — Blinkfire is expensive and brand-focused. Faster onboarding (3-week guarantee).",
          "they_win_on": "Stronger North American market presence. More integrations with US-based social platforms. Established brand recognition in NA esports. Some teams prefer their interface.",
          "how_to_handle": "Ask where they track broadcast and stream visibility — Blinkfire doesn't cover live video well. If the prospect runs events or competes in leagues, that's a gap. Also ask about GDPR compliance if they're EU-based."
        },
        {
          "id": "comp-2",
          "name": "Nielsen Sports",
          "what_they_do": "Enterprise sports media measurement. Covers TV broadcast, digital, and social. Used by major rights holders, broadcast networks, and large brand sponsors for valuation.",
          "we_win_on": "Price — Nielsen is 10–20x more expensive and built for enterprise brands, not rights holders. Speed — Nielsen's reports take weeks, Shikenso delivers in real-time. We onboard in 3 weeks vs months-long Nielsen implementations.",
          "they_win_on": "Brand recognition — CFOs and board members trust the Nielsen name. Broader data coverage including TV and out-of-home. Better for orgs pitching enterprise-level brand partners.",
          "how_to_handle": "If they mention Nielsen, they're likely a larger prospect — or aspiring to be. Reframe: Nielsen is the enterprise layer brands use to validate what they already bought. Shikenso is the operational tool rights holders use to generate the data that earns those brand investments."
        },
        {
          "id": "comp-3",
          "name": "Zoomph",
          "what_they_do": "Social media measurement and audience intelligence platform for sports sponsorships. Tracks brand exposure on social, provides audience demographic data.",
          "we_win_on": "Video and audio tracking — Zoomph is social-only. Automated reporting delivered to sponsors directly. GDPR-compliant EU infrastructure. Simpler onboarding for smaller orgs.",
          "they_win_on": "Audience intelligence features (fan demographics, psychographics). Good at Instagram and Twitter tracking. Some US sports league integrations.",
          "how_to_handle": "Ask if they need to report on stream or broadcast performance — Zoomph can't do it. Most esports orgs have as much value on Twitch/YouTube as on social, so this is usually a clear win."
        },
        {
          "id": "comp-4",
          "name": "Manual tracking (Excel + screenshots)",
          "what_they_do": "In-house process: pulling stream screenshots, estimating visibility manually, building PowerPoint decks. Common in teams with 1 partnerships person and no analytics budget.",
          "we_win_on": "Speed (4-6 hours/sponsor/month → automated). Professionalism (live dashboards vs screenshot decks). Accuracy (AI measurement vs eyeballing). Scalability (handles 10+ sponsors at once). No human error.",
          "they_win_on": "Free. No learning curve. Full control over what's included in the report. Some partnerships leads prefer to frame the narrative themselves.",
          "how_to_handle": "This is the most common competitor. Don't trash it — acknowledge it works at small scale. Then ask: how long does it take per sponsor per month? What happens at renewal when the sponsor wants to compare against industry benchmarks? That usually opens the conversation."
        }
      ],
      "positioning_notes": "Core positioning: Shikenso is the sponsorship analytics platform built for rights holders, not brands. Every competitor either serves brands (Nielsen, enterprise tools) or focuses on social-only (Blinkfire, Zoomph) or is just a spreadsheet.\n\nWinning positioning statement: 'We give esports organisations the same data quality as the brands they're pitching — so renewals stop being a negotiation and start being a proof of value.'\n\nDon't lead with features. Lead with the outcome: sponsors renew, new deals close faster, manual reporting disappears.\n\nKey differentiators to always mention:\n1. Video + audio + social in one platform (no stitching tools)\n2. Built for rights holders, not brands (pricing and UX reflect this)\n3. 3-week onboarding guarantee\n4. EU-based, GDPR compliant\n5. Real-time dashboards (not weekly/monthly batch reports)"
    },
    "objections": {
      "objections": [
        {
          "id": "obj-1",
          "objection": "We're already using [Blinkfire / Zoomph / another tool]",
          "context": "Comes up early in the call or as a reason not to take a meeting. Often means they have something, not necessarily that it's working well.",
          "response": "That's useful to know — how are you currently handling broadcast and stream tracking alongside that? Most tools cover social well but miss the live video side, which is often where the majority of brand visibility actually lives for esports orgs.\n\nWe could run a quick side-by-side if you're open to it — happy to pull a report on one sponsor using Shikenso so you can compare what you're currently seeing.",
          "follow_up": "If they resist: 'Makes sense — what would need to change for you to consider a switch or an additional layer?' (Identifies the real objection underneath)"
        },
        {
          "id": "obj-2",
          "objection": "We don't have the budget right now",
          "context": "Most common deflection — often means priority, not money. Especially likely at smaller orgs or early in the year before budgets are set.",
          "response": "Totally fair. Can I ask — is it that the budget genuinely isn't there, or that it hasn't been allocated because sponsor reporting hasn't been a line item before?\n\nThe reason I ask: most orgs we talk to are already spending that money in headcount time — 4–6 hours per sponsor per month adds up fast. If I can show you that the cost pays for itself in time saved and one retained sponsor, does the conversation change?",
          "follow_up": "Offer a free visibility audit on one sponsor as a proof of value before any budget conversation. That lowers the barrier and demonstrates value on their own data."
        },
        {
          "id": "obj-3",
          "objection": "Send me some information and I'll take a look",
          "context": "Classic deferral — usually means they don't see it as urgent yet. Sending a generic deck rarely moves anything forward.",
          "response": "Happy to — though I'd rather send something specific to [ORG] than a generic deck. Can I ask two quick questions first: how many active sponsors are you currently managing, and how are you handling their monthly reporting right now?\n\nThat way I can send you a sample report that actually looks like what you'd get from Shikenso — not just a product overview.",
          "follow_up": "If they answer the questions, you've re-engaged them in a conversation. If they still want the deck first, send a one-pager (not a full pitch) with a specific CTA to review the sample report."
        },
        {
          "id": "obj-4",
          "objection": "We handle reporting in-house, it works fine",
          "context": "Comes from partnerships leads who are proud of their process or don't want to admit it's a problem. Usually untrue under the surface.",
          "response": "Good to hear — what does that look like currently? Specifically the video visibility piece — how are you capturing brand exposure across streams and broadcasts?\n\nAsking because that's usually the part that gets manual and slow, even when the rest of the process is solid. I'm not assuming you have a problem — just want to understand where you are.",
          "follow_up": "If they describe a manual process (spreadsheets, screenshots), reflect it back: 'So you're probably spending X hours per sponsor — is that sustainable as you scale to more sponsors?' Don't push — plant the seed."
        },
        {
          "id": "obj-5",
          "objection": "We're too small / not the right fit right now",
          "context": "Self-disqualification — often means they're unsure about the ROI or think the tool is for bigger orgs. May also mean genuinely not ICP.",
          "response": "Totally understand — can I ask, how many brand sponsors are you currently working with? We work with orgs ranging from 2 active sponsors upward, and our pricing is built specifically for rights holders at your stage, not enterprise brands.\n\nIf you have even 2–3 sponsors and you're doing their reporting manually, the maths usually works out — but I don't want to assume. What would 'the right fit' look like for you?",
          "follow_up": "If genuinely too small (1 sponsor, pre-revenue on commercial side), acknowledge it honestly: 'You might be right — let's reconnect when you've got 2–3 sponsors running in parallel. Happy to check back in [timeframe].'"
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
