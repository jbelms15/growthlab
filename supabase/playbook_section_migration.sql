-- Run this in the Supabase SQL editor

ALTER TABLE playbook_entries
  ADD COLUMN IF NOT EXISTS section TEXT;
