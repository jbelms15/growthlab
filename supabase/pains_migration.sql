-- Run this in the Supabase SQL editor

ALTER TABLE pains
  ADD COLUMN IF NOT EXISTS consequence TEXT,
  ADD COLUMN IF NOT EXISTS workaround TEXT;
