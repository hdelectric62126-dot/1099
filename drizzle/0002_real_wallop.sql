CREATE TABLE `agent_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`title` text NOT NULL,
	`details` text,
	`assigned_agent` text NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_agent_tasks_owner_status` ON `agent_tasks` (`owner_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_agent_tasks_owner_agent` ON `agent_tasks` (`owner_id`,`assigned_agent`);