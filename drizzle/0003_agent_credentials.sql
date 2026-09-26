CREATE TABLE IF NOT EXISTS agent_accounts (
  id text PRIMARY KEY NOT NULL,
  username text NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  password_salt text NOT NULL,
  password_hash text NOT NULL,
  password_iterations integer NOT NULL,
  active integer DEFAULT 1 NOT NULL,
  created_at integer NOT NULL,
  updated_at integer NOT NULL,
  last_login_at integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS agent_accounts_username ON agent_accounts (username);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS agent_accounts_email ON agent_accounts (email);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS agent_web_sessions (
  token_hash text PRIMARY KEY NOT NULL,
  agent_id text NOT NULL,
  created_at integer NOT NULL,
  last_seen_at integer NOT NULL,
  expires_at integer NOT NULL,
  revoked_at integer,
  FOREIGN KEY (agent_id) REFERENCES agent_accounts(id) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS agent_web_sessions_agent ON agent_web_sessions (agent_id,expires_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS agent_web_sessions_expiry ON agent_web_sessions (expires_at,revoked_at);
--> statement-breakpoint
INSERT OR IGNORE INTO schema_migrations (version,applied_at)
VALUES ('0003_agent_credentials',CAST(strftime('%s','now') AS integer)*1000);
