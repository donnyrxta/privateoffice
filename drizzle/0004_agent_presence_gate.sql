ALTER TABLE agent_web_sessions ADD COLUMN last_lat real;
--> statement-breakpoint
ALTER TABLE agent_web_sessions ADD COLUMN last_lng real;
--> statement-breakpoint
ALTER TABLE agent_web_sessions ADD COLUMN last_accuracy real;
--> statement-breakpoint
ALTER TABLE agent_web_sessions ADD COLUMN last_location_at integer;
--> statement-breakpoint
ALTER TABLE agent_web_sessions ADD COLUMN location_verified_at integer;
--> statement-breakpoint
ALTER TABLE agent_web_sessions ADD COLUMN current_path text;
--> statement-breakpoint
ALTER TABLE agent_web_sessions ADD COLUMN current_path_since integer;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS agent_page_activity (
  id text PRIMARY KEY NOT NULL,
  agent_id text NOT NULL,
  session_token_hash text NOT NULL,
  path text NOT NULL,
  kind text NOT NULL,
  at integer NOT NULL,
  duration_ms integer DEFAULT 0 NOT NULL,
  lat real NOT NULL,
  lng real NOT NULL,
  accuracy real NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES agent_accounts(id) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS agent_page_activity_agent_time ON agent_page_activity (agent_id,at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS agent_page_activity_path_time ON agent_page_activity (path,at);
--> statement-breakpoint
INSERT OR IGNORE INTO schema_migrations (version,applied_at)
VALUES ('0004_agent_presence_gate',CAST(strftime('%s','now') AS integer)*1000);
