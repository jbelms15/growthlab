export interface WizardData {
  target_segment?: string
  target_persona?: string
  phase?: 'building' | 'executing'
}

export interface Campaign {
  id: string
  name: string
  goal: string | null
  status: 'active' | 'paused' | 'done'
  daily_new_contacts: number
  daily_followups: number
  wizard_data: WizardData
  created_at: string
}

export interface ICP {
  id: string
  campaign_id: string
  industry: string | null
  company_size: string | null
  geography: string | null
  revenue_range: string | null
  notes: string | null
}

export interface Segment {
  id: string
  campaign_id: string
  name: string
  description: string | null
  why: string | null
  sort_order: number
  created_at: string
}

export interface Persona {
  id: string
  campaign_id: string
  segment_id: string | null
  title: string
  seniority: string | null
  goals: string | null
  frustrations: string | null
}

export interface Pain {
  id: string
  persona_id: string
  pain: string
  business_impact: string | null
  consequence: string | null
  workaround: string | null
}

export interface Company {
  id: string
  campaign_id: string
  name: string
  website: string | null
  linkedin_url: string | null
  segment_id: string | null
  priority: 'high' | 'medium' | 'low'
  status: 'prospect' | 'active' | 'paused' | 'done'
  notes: string | null
  added_at: string
}

export interface Observation {
  id: string
  company_id: string
  content: string
  signal_type: 'hiring' | 'funding' | 'new_role' | 'news' | 'other' | null
  created_at: string
}

export interface Touchpoint {
  id: string
  campaign_id: string
  company_id: string
  contact_name: string | null
  channel: 'email' | 'linkedin' | 'phone' | 'other' | null
  step_num: number | null
  status: 'sent' | 'replied' | 'meeting' | 'no_reply'
  date: string
  notes: string | null
  created_at: string
}

export interface WeeklyPlan {
  id: string
  campaign_id: string
  week_start: string
  priorities: string | null
  target_segment: string | null
  experiment: string | null
  daily_new_contacts: number
  daily_followups: number
  channel_focus: string | null
  messaging_angle: string | null
  expected_outcomes: string | null
  created_at: string
}

export interface WeeklyReport {
  id: string
  campaign_id: string
  week_start: string
  companies_contacted: number
  replies: number
  meetings: number
  sqls: number
  what_worked: string | null
  what_to_change: string | null
  performance_analysis: string | null
  key_insights: string | null
  risks: string | null
  recommendations: string | null
  playbook_learnings: string | null
  qualitative_input: Record<string, string> | null
  created_at: string
}

export const PLAYBOOK_SECTIONS = [
  'Strategic Decisions',
  'What Worked',
  'Hook Variations',
  'Segment Insights',
  'Reply Patterns',
  'Meeting Notes',
  'Performance Benchmarks',
] as const

export type PlaybookSection = typeof PLAYBOOK_SECTIONS[number]

export type PlaybookStatus = 'hypothesis' | 'in_testing' | 'locked'

export interface PlaybookEntry {
  id: string
  campaign_id: string | null
  type: string | null
  section: PlaybookSection | null
  title: string
  content: string | null
  status: PlaybookStatus
  created_at: string
}
