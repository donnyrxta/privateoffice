CREATE TABLE `enquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`interest` text NOT NULL,
	`created_at` integer NOT NULL,
	`status` text DEFAULT 'new' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`visit_id` text NOT NULL,
	`kind` text NOT NULL,
	`actor` text NOT NULL,
	`at` integer NOT NULL,
	`detail` text,
	FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `events_visit_time` ON `events` (`visit_id`,`at`);--> statement-breakpoint
CREATE TABLE `office` (
	`id` integer PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`owner_email` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `points` (
	`id` text PRIMARY KEY NOT NULL,
	`visit_id` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`accuracy` real NOT NULL,
	`recorded_at` integer NOT NULL,
	`received_at` integer NOT NULL,
	FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `points_visit_time` ON `points` (`visit_id`,`received_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`agent_name` text NOT NULL,
	`agent_email` text NOT NULL,
	`agent_id` text,
	`client_name` text NOT NULL,
	`property` text NOT NULL,
	`meeting` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`scheduled_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`invite_hash` text NOT NULL,
	`client_hash` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`consent_at` integer,
	`consent_version` text,
	`share_started_at` integer,
	`share_epoch` text,
	`share_until` integer,
	`last_received_at` integer,
	`stopped_at` integer,
	`revoked_at` integer,
	`eta_minutes` integer,
	`client_confirmed_at` integer,
	`property_confirmed` text,
	`client_comment` text
);
--> statement-breakpoint
CREATE INDEX `visits_owner` ON `visits` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `visits_agent` ON `visits` (`agent_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `visits_invite` ON `visits` (`invite_hash`);--> statement-breakpoint
CREATE INDEX `visits_client` ON `visits` (`client_hash`);