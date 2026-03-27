-- Run this in the Supabase SQL editor AFTER the initial schema

-- Weekly plans (Monday Plan per campaign per week)
CREATE TABLE weekly_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  priorities TEXT,
  target_segment TEXT,
  experiment TEXT,
  daily_new_contacts INTEGER DEFAULT 5,
  daily_followups INTEGER DEFAULT 10,
  channel_focus TEXT,
  messaging_angle TEXT,
  expected_outcomes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, week_start)
);

-- Add AI output + qualitative fields to weekly_reports
ALTER TABLE weekly_reports
  ADD COLUMN IF NOT EXISTS performance_analysis TEXT,
  ADD COLUMN IF NOT EXISTS key_insights TEXT,
  ADD COLUMN IF NOT EXISTS risks TEXT,
  ADD COLUMN IF NOT EXISTS recommendations TEXT,
  ADD COLUMN IF NOT EXISTS playbook_learnings TEXT,
  ADD COLUMN IF NOT EXISTS qualitative_input JSONB DEFAULT '{}';
