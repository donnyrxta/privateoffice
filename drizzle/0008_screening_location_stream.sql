CREATE TABLE IF NOT EXISTS screening_location_observations (
  id text PRIMARY KEY NOT NULL,
  invite_id text NOT NULL REFERENCES agent_onboarding_invites(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  sequence_number integer NOT NULL,
  lat real NOT NULL,
  lng real NOT NULL,
  accuracy real NOT NULL,
  altitude real,
  altitude_accuracy real,
  heading real,
  speed real,
  recorded_at integer NOT NULL,
  received_at integer NOT NULL,
  consent_version text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS screening_location_observation_sequence
ON screening_location_observations(invite_id,session_id,sequence_number);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS screening_location_observation_time
ON screening_location_observations(invite_id,received_at);
--> statement-breakpoint
INSERT OR IGNORE INTO schema_migrations(version,applied_at)
VALUES('0008_screening_location_stream',CAST(strftime('%s','now') AS integer)*1000);
