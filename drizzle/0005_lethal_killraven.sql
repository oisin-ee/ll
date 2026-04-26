CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`youtube_id` text NOT NULL,
	`lrc_text` text,
	`teacher_notes` text,
	`source` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`media_id` integer NOT NULL,
	`line_number` integer NOT NULL,
	`start_ms` integer NOT NULL,
	`spanish` text NOT NULL,
	`english` text,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `words` ADD `media_id` integer REFERENCES media(id);
--> statement-breakpoint
INSERT INTO `media` (`id`, `kind`, `title`, `artist`, `youtube_id`, `lrc_text`, `teacher_notes`, `source`, `created_at`)
	SELECT `id`, 'song', `title`, `artist`, `youtube_id`, `lrc_text`, `teacher_notes`, 'captions', `created_at` FROM `songs`;
--> statement-breakpoint
INSERT INTO `media` (`id`, `kind`, `title`, `artist`, `youtube_id`, `lrc_text`, `teacher_notes`, `source`, `created_at`)
	SELECT (SELECT COALESCE(MAX(`id`), 0) FROM `songs`) + `id`, 'video', `title`, `channel`, `youtube_id`, NULL, `teacher_notes`, 'captions', `created_at` FROM `videos`;
--> statement-breakpoint
INSERT INTO `media_lines` (`media_id`, `line_number`, `start_ms`, `spanish`, `english`)
	SELECT `song_id`, `line_number`, `start_ms`, `spanish`, `english` FROM `song_lines`;
--> statement-breakpoint
INSERT INTO `media_lines` (`media_id`, `line_number`, `start_ms`, `spanish`, `english`)
	SELECT (SELECT COALESCE(MAX(`id`), 0) FROM `songs`) + `video_id`, `line_number`, `start_ms`, `spanish`, `english` FROM `video_lines`;
--> statement-breakpoint
UPDATE `words` SET `media_id` = `song_id` WHERE `song_id` IS NOT NULL AND `media_id` IS NULL;
--> statement-breakpoint
UPDATE `words` SET `media_id` = (SELECT COALESCE(MAX(`id`), 0) FROM `songs`) + `video_id` WHERE `video_id` IS NOT NULL AND `media_id` IS NULL;
