CREATE TABLE `video_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`video_id` integer NOT NULL,
	`line_number` integer NOT NULL,
	`start_ms` integer NOT NULL,
	`spanish` text NOT NULL,
	`english` text,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`channel` text NOT NULL,
	`youtube_id` text NOT NULL,
	`teacher_notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `words` ADD `video_id` integer REFERENCES videos(id);