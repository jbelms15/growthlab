-- Add SQLs column to weekly_reports
-- Run this in Supabase SQL Editor

ALTER TABLE weekly_reports
ADD COLUMN IF NOT EXISTS sqls integer DEFAULT 0;
