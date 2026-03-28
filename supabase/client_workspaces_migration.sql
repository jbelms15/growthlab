-- Top-level client workspaces (not tied to a campaign)
-- Each row = one client/product strategy context
CREATE TABLE IF NOT EXISTS client_workspaces (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT       NOT NULL UNIQUE,
  data        JSONB       NOT NULL DEFAULT '{}',
  phase_status JSONB      NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
