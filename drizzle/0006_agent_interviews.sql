CREATE TABLE IF NOT EXISTS agent_onboarding (
 agent_id text PRIMARY KEY NOT NULL REFERENCES agent_accounts(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','changes_requested','approved')),
 data_json text NOT NULL DEFAULT '{}',
 revision integer NOT NULL DEFAULT 0,
 updated_at integer NOT NULL,
 submitted_at integer,
 reviewed_at integer,
 reviewed_by text,
 feedback text,
 classification text,
 review_json text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS agent_review_events (
 id text PRIMARY KEY NOT NULL,
 agent_id text NOT NULL REFERENCES agent_accounts(id) ON DELETE CASCADE,
 reviewer_id text NOT NULL,
 decision text NOT NULL,
 review_json text NOT NULL,
 at integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS agent_onboarding_status ON agent_onboarding(status,updated_at);
--> statement-breakpoint
INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES('0006_agent_interviews',CAST(strftime('%s','now') AS integer)*1000);
--> statement-breakpoint
