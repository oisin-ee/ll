PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_episode_concepts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`episode_number` integer NOT NULL,
	`concept_id` integer NOT NULL,
	`role` text DEFAULT 'introduced' NOT NULL,
	`summary` text,
	`rule` text,
	`examples` text,
	`notes` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_episode_concepts`("id", "episode_number", "concept_id", "role", "summary", "rule", "examples", "notes", "sort_order") SELECT "id", "episode_id", "concept_id", "role", "summary", "rule", "examples", "notes", "sort_order" FROM `episode_concepts`;--> statement-breakpoint
DROP TABLE `episode_concepts`;--> statement-breakpoint
ALTER TABLE `__new_episode_concepts` RENAME TO `episode_concepts`;--> statement-breakpoint
CREATE TABLE `__new_flashcard_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`episode_number` integer NOT NULL,
	`spanish` text NOT NULL,
	`card_state` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_flashcard_reviews`("id", "user_id", "episode_number", "spanish", "card_state", "created_at") SELECT "id", "user_id", "episode_id", "spanish", "card_state", "created_at" FROM `flashcard_reviews`;--> statement-breakpoint
DROP TABLE `flashcard_reviews`;--> statement-breakpoint
ALTER TABLE `__new_flashcard_reviews` RENAME TO `flashcard_reviews`;--> statement-breakpoint
CREATE UNIQUE INDEX `ux_flashcard_reviews` ON `flashcard_reviews` (`user_id`,`episode_number`,`spanish`);--> statement-breakpoint
CREATE TABLE `__new_user_episodes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`episode_number` integer NOT NULL,
	`listened` integer DEFAULT false NOT NULL,
	`listened_at` text,
	`playback_position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_user_episodes`("id", "user_id", "episode_number", "listened", "listened_at", "playback_position") SELECT "id", "user_id", "episode_id", "listened", "listened_at", "playback_position" FROM `user_episodes`;--> statement-breakpoint
DROP TABLE `user_episodes`;--> statement-breakpoint
ALTER TABLE `__new_user_episodes` RENAME TO `user_episodes`;--> statement-breakpoint
CREATE UNIQUE INDEX `ux_user_episodes` ON `user_episodes` (`user_id`,`episode_number`);--> statement-breakpoint
CREATE TABLE `__new_words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`spanish` text NOT NULL,
	`english` text NOT NULL,
	`example` text,
	`episode_number` integer,
	`song_id` integer,
	`video_id` integer,
	`lingq_id` integer,
	`lingq_status` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_words`("id", "user_id", "spanish", "english", "example", "episode_number", "song_id", "video_id", "lingq_id", "lingq_status", "created_at") SELECT "id", "user_id", "spanish", "english", "example", "episode_id", "song_id", "video_id", "lingq_id", "lingq_status", "created_at" FROM `words`;--> statement-breakpoint
DROP TABLE `words`;--> statement-breakpoint
ALTER TABLE `__new_words` RENAME TO `words`;--> statement-breakpoint
CREATE TABLE `__new_episode_summaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`episode_number` integer NOT NULL,
	`summary` text NOT NULL,
	`vocabulary_json` text
);
--> statement-breakpoint
INSERT INTO `__new_episode_summaries`("id", "episode_number", "summary", "vocabulary_json") SELECT "id", "episode_id", "summary", "vocabulary_json" FROM `episode_summaries`;--> statement-breakpoint
DROP TABLE `episode_summaries`;--> statement-breakpoint
ALTER TABLE `__new_episode_summaries` RENAME TO `episode_summaries`;--> statement-breakpoint
CREATE UNIQUE INDEX `episode_summaries_episode_number_unique` ON `episode_summaries` (`episode_number`);--> statement-breakpoint
DROP TABLE `episodes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
