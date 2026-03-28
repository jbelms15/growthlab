-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS strategy_workspace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE UNIQUE,
  data JSONB DEFAULT '{}',
  phase_status JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
