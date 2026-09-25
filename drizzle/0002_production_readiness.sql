CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY NOT NULL,
  applied_at integer NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO schema_migrations (version,applied_at) VALUES ('0000_huge_blizzard',CAST(strftime('%s','now') AS integer)*1000);
--> statement-breakpoint
INSERT OR IGNORE INTO schema_migrations (version,applied_at) VALUES ('0001_durable_telemetry',CAST(strftime('%s','now') AS integer)*1000);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS observation_rejections (
  id text PRIMARY KEY NOT NULL,
  visit_id text NOT NULL,
  device_id text NOT NULL,
  share_epoch text NOT NULL,
  sequence_number integer NOT NULL,
  code text NOT NULL,
  raw_payload text,
  payload_hash text NOT NULL,
  received_at integer NOT NULL,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS observation_rejections_visit_epoch_sequence ON observation_rejections (visit_id,share_epoch,sequence_number);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS observation_rejections_visit_time ON observation_rejections (visit_id,received_at);
--> statement-breakpoint
ALTER TABLE points ADD COLUMN integrity_flags text;
--> statement-breakpoint
ALTER TABLE visits ADD COLUMN missing_observations integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE visits ADD COLUMN health_reason text;
--> statement-breakpoint
ALTER TABLE visits ADD COLUMN health_evaluated_at integer;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS visits_status ON visits (status,share_until);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS ops_state (
  key text PRIMARY KEY NOT NULL,
  value text NOT NULL,
  updated_at integer NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO schema_migrations (version,applied_at) VALUES ('0002_production_readiness',CAST(strftime('%s','now') AS integer)*1000);
