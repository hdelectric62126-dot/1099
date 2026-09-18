CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`address` text,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `idx_customers_owner_name` ON `customers` (`owner_id`,`name`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`job_id` integer,
	`vendor` text NOT NULL,
	`amount` real NOT NULL,
	`transaction_date` text NOT NULL,
	`category` text NOT NULL,
	`business_purpose` text,
	`is_business_meal` integer DEFAULT 0 NOT NULL,
	`receipt_key` text,
	`review_status` text DEFAULT 'review' NOT NULL,
	`review_note` text
);
--> statement-breakpoint
CREATE INDEX `idx_expenses_owner_date` ON `expenses` (`owner_id`,`transaction_date`);--> statement-breakpoint
CREATE TABLE `income` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`job_id` integer,
	`payer` text NOT NULL,
	`amount` real NOT NULL,
	`received_date` text NOT NULL,
	`method` text,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `idx_income_owner_date` ON `income` (`owner_id`,`received_date`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`customer_id` integer,
	`name` text NOT NULL,
	`phase` text DEFAULT 'Estimate' NOT NULL,
	`status` text DEFAULT 'Open' NOT NULL,
	`quoted_amount` real DEFAULT 0 NOT NULL,
	`start_date` text,
	`address` text,
	`notes` text
);
--> statement-breakpoint
CREATE INDEX `idx_jobs_owner_created` ON `jobs` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `mileage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`job_id` integer,
	`trip_date` text NOT NULL,
	`miles` real NOT NULL,
	`vehicle` text,
	`purpose` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_mileage_owner_date` ON `mileage` (`owner_id`,`trip_date`);