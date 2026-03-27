-- Outbound Workstation — Supabase Schema
-- Run this in the Supabase SQL editor

-- Campaigns (top-level entity, wizard is per-campaign)
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Untitled Campaign',
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'done')),
  daily_new_contacts INTEGER NOT NULL DEFAULT 5,
  daily_followups INTEGER NOT NULL DEFAULT 10,
  wizard_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ICP (one per campaign)
CREATE TABLE icp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  industry TEXT,
  company_size TEXT,
  geography TEXT,
  revenue_range TEXT,
  notes TEXT,
  UNIQUE(campaign_id)
);

-- Segments
CREATE TABLE segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  why TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Personas
CREATE TABLE personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES segments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  seniority TEXT,
  goals TEXT,
  frustrations TEXT
);

-- Pains
CREATE TABLE pains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  pain TEXT NOT NULL,
  business_impact TEXT
);

-- Companies (target list)
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  linkedin_url TEXT,
  segment_id UUID REFERENCES segments(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'paused', 'done')),
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Observations / signals per company
CREATE TABLE observations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  signal_type TEXT CHECK (signal_type IN ('hiring', 'funding', 'new_role', 'news', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Touchpoints (execution log)
CREATE TABLE touchpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_name TEXT,
  channel TEXT CHECK (channel IN ('email', 'linkedin', 'phone', 'other')),
  step_num INTEGER,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'replied', 'meeting', 'no_reply')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Weekly reports
CREATE TABLE weekly_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  companies_contacted INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  meetings INTEGER NOT NULL DEFAULT 0,
  what_worked TEXT,
  what_to_change TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Playbook entries
CREATE TABLE playbook_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('hook', 'sequence', 'segment', 'lesson')),
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
