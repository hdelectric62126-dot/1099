CREATE TABLE `agent_activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`run_id` text NOT NULL,
	`agent_key` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'complete' NOT NULL,
	`summary` text NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_agent_activity_owner_created` ON `agent_activity` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_agent_activity_owner_run` ON `agent_activity` (`owner_id`,`run_id`);