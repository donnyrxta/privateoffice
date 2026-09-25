ALTER TABLE visits ADD COLUMN active_device_id text;
--> statement-breakpoint
ALTER TABLE visits ADD COLUMN last_sequence integer DEFAULT -1;
--> statement-breakpoint
ALTER TABLE visits ADD COLUMN tracking_health text DEFAULT 'idle';
--> statement-breakpoint
ALTER TABLE points ADD COLUMN device_id text;
--> statement-breakpoint
ALTER TABLE points ADD COLUMN share_epoch text;
--> statement-breakpoint
ALTER TABLE points ADD COLUMN sequence_number integer;
--> statement-breakpoint
ALTER TABLE points ADD COLUMN altitude real;
--> statement-breakpoint
ALTER TABLE points ADD COLUMN altitude_accuracy real;
--> statement-breakpoint
ALTER TABLE points ADD COLUMN heading real;
--> statement-breakpoint
ALTER TABLE points ADD COLUMN speed real;
--> statement-breakpoint
ALTER TABLE points ADD COLUMN simulated integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE points ADD COLUMN queued_at integer;
--> statement-breakpoint
ALTER TABLE points ADD COLUMN quality_class text;
--> statement-breakpoint
ALTER TABLE points ADD COLUMN plausibility_state text DEFAULT 'normal';
--> statement-breakpoint
ALTER TABLE points ADD COLUMN payload_hash text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS points_visit_epoch_sequence ON points (visit_id,share_epoch,sequence_number);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS devices (
  id text PRIMARY KEY NOT NULL,
  agent_id text NOT NULL,
  public_key_jwk text NOT NULL,
  platform text NOT NULL,
  app_version text,
  created_at integer NOT NULL,
  last_seen_at integer NOT NULL,
  revoked_at integer
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS devices_agent ON devices (agent_id,last_seen_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS agent_sessions (
  id text PRIMARY KEY NOT NULL,
  agent_id text NOT NULL,
  device_id text NOT NULL,
  started_at integer NOT NULL,
  last_seen_at integer NOT NULL,
  ended_at integer,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS agent_sessions_agent ON agent_sessions (agent_id,last_seen_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS security_events (
  id text PRIMARY KEY NOT NULL,
  agent_id text NOT NULL,
  device_id text NOT NULL,
  session_id text,
  visit_id text,
  share_epoch text,
  kind text NOT NULL,
  device_at integer NOT NULL,
  received_at integer NOT NULL,
  detail text,
  payload_hash text NOT NULL,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS security_events_agent_time ON security_events (agent_id,received_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS security_events_visit_time ON security_events (visit_id,received_at);
