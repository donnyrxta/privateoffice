CREATE TABLE IF NOT EXISTS screening_location_checks (
 id text PRIMARY KEY NOT NULL,
 invite_id text NOT NULL REFERENCES agent_onboarding_invites(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('location','manual_requested','manual_approved')),
 lat real,
 lng real,
 accuracy real,
 recorded_at integer,
 received_at integer NOT NULL,
 consent_version text,
 note text,
 reviewer_id text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS screening_location_invite ON screening_location_checks(invite_id,received_at);
--> statement-breakpoint
INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES('0007_screening_location',CAST(strftime('%s','now') AS integer)*1000);
