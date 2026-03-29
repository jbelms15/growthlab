-- Add validation status to playbook entries
-- hypothesis = unproven idea, captured from a single observation
-- in_testing = being actively tested this execution cycle
-- locked = validated across multiple weeks / consistent data

ALTER TABLE playbook_entries
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'hypothesis'
  CHECK (status IN ('hypothesis', 'in_testing', 'locked'));

-- Backfill existing entries to hypothesis
UPDATE playbook_entries SET status = 'hypothesis' WHERE status IS NULL;
