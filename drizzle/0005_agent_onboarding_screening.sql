CREATE TABLE IF NOT EXISTS agent_onboarding_invites (
  id text PRIMARY KEY NOT NULL,
  token_hash text NOT NULL,
  intended_email text,
  status text DEFAULT 'issued' NOT NULL,
  created_at integer NOT NULL,
  expires_at integer NOT NULL,
  opened_at integer,
  submitted_at integer,
  revoked_at integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS agent_onboarding_invites_token ON agent_onboarding_invites (token_hash);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS agent_onboarding_invites_status ON agent_onboarding_invites (status,expires_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS agent_applications (
  id text PRIMARY KEY NOT NULL,
  invite_id text NOT NULL,
  full_name text,
  email text,
  phone text,
  city text,
  country text,
  current_company text,
  years_experience integer,
  languages_json text DEFAULT '[]' NOT NULL,
  markets_json text DEFAULT '[]' NOT NULL,
  specialisms_json text DEFAULT '[]' NOT NULL,
  experience_summary text,
  motivation text,
  status text DEFAULT 'draft' NOT NULL,
  created_at integer NOT NULL,
  updated_at integer NOT NULL,
  submitted_at integer,
  reviewed_at integer,
  reviewed_by text,
  review_note text,
  approved_agent_id text,
  FOREIGN KEY (invite_id) REFERENCES agent_onboarding_invites(id) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (approved_agent_id) REFERENCES agent_accounts(id) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS agent_applications_invite ON agent_applications (invite_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS agent_applications_status ON agent_applications (status,submitted_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS agent_screening_sessions (
  id text PRIMARY KEY NOT NULL,
  application_id text NOT NULL,
  version text NOT NULL,
  answers_json text DEFAULT '{}' NOT NULL,
  classification_json text,
  created_at integer NOT NULL,
  updated_at integer NOT NULL,
  completed_at integer,
  FOREIGN KEY (application_id) REFERENCES agent_applications(id) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS agent_screening_sessions_application ON agent_screening_sessions (application_id);
--> statement-breakpoint
INSERT OR IGNORE INTO schema_migrations (version,applied_at)
VALUES ('0005_agent_onboarding_screening',CAST(strftime('%s','now') AS integer)*1000);
