export interface FoundationData {
  product_knowledge: string
  inbound_analysis: string
  buyer_language: string
  case_studies: string
}

export interface ICPData {
  industry: string
  company_size: string
  geography: string
  stage: string
  revenue_range: string
  anti_icp: string
  notes: string
}

export interface Pain {
  id: string
  pain: string
  business_impact: string
  consequence: string
  workaround: string
}

export interface Persona {
  id: string
  segment_id: string
  title: string
  seniority: string
  goals: string
  frustrations: string
  triggers: string
  pains: Pain[]
}

export interface SegmentItem {
  id: string
  name: string
  description: string
  why_priority: string
  priority_rank: number
}

export interface MarketDesignData {
  icp: ICPData
  segments: SegmentItem[]
  personas: Persona[]
}

export interface SignalType {
  id: string
  name: string
  description: string
  where_to_find: string
  what_it_means: string
}

export interface SignalsData {
  signal_types: SignalType[]
  qualification_criteria: string
  disqualification_criteria: string
}

export interface SubjectLine {
  id: string
  subject: string
  pain_angle: string
  persona: string
  signal: string
  notes: string
}

export interface MessagingRow {
  id: string
  segment: string
  persona: string
  pain: string
  source_quote: string
  hook: string
  channel: string
  social_proof: string
  cta_soft: string
  cta_hard: string
}

export interface MessagingData {
  matrix: MessagingRow[]
  subject_lines: SubjectLine[]
}

export interface Competitor {
  id: string
  name: string
  what_they_do: string
  we_win_on: string
  they_win_on: string
  how_to_handle: string
}

export interface CompetitiveData {
  competitors: Competitor[]
  positioning_notes: string
}

export interface Objection {
  id: string
  objection: string
  context: string
  response: string
  follow_up: string
}

export interface ObjectionsData {
  objections: Objection[]
}

export interface SequenceStep {
  id: string
  day: number
  channel: string
  action: string
  content: string
  reply_rate?: string
  performance_notes?: string
}

export interface SequencesData {
  steps: SequenceStep[]
  notes: string
}

export interface WeeklyTarget {
  id: string
  week: string
  new_contacts: number
  follow_ups: number
  meetings_target: number
  focus: string
}

export interface LaunchPlanData {
  weekly_targets: WeeklyTarget[]
  success_metrics: string
  ramp_notes: string
}

export interface WorkspaceData {
  foundation: FoundationData
  market_design: MarketDesignData
  signals: SignalsData
  messaging: MessagingData
  competitive: CompetitiveData
  objections: ObjectionsData
  sequences: SequencesData
  launch_plan: LaunchPlanData
}

export const defaultWorkspaceData: WorkspaceData = {
  foundation: { product_knowledge: '', inbound_analysis: '', buyer_language: '', case_studies: '' },
  market_design: {
    icp: { industry: '', company_size: '', geography: '', stage: '', revenue_range: '', anti_icp: '', notes: '' },
    segments: [],
    personas: [],
  },
  signals: { signal_types: [], qualification_criteria: '', disqualification_criteria: '' },
  messaging: { matrix: [], subject_lines: [] },
  competitive: { competitors: [], positioning_notes: '' },
  objections: { objections: [] },
  sequences: { steps: [], notes: '' },
  launch_plan: { weekly_targets: [], success_metrics: '', ramp_notes: '' },
}
