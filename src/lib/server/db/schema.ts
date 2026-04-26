import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ── Auth ─────────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name'),
	avatar: text('avatar'),
	createdAt: text('created_at').notNull()
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: integer('expires_at').notNull()
});

// ── Shared catalog ────────────────────────────────────────────────────────────
// Episodes themselves are not stored in the DB — they are fixed (90 Language
// Transfer lessons) and their metadata is derived in src/lib/server/episodes.ts,
// with transcripts fetched from the oisincoveney/ll-episodes repo at request
// time. Tables below reference episodes via `episode_number` (integer).

export const concepts = sqliteTable('concepts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull(),
	description: text('description'),
	category: text('category'),
	// legacy column retained to avoid destructive migration
	mastery: integer('mastery')
});

export const episodeConcepts = sqliteTable('episode_concepts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	episodeNumber: integer('episode_number').notNull(),
	conceptId: integer('concept_id')
		.notNull()
		.references(() => concepts.id),
	role: text('role').notNull().default('introduced'),
	summary: text('summary'),
	rule: text('rule'),
	examples: text('examples'),
	notes: text('notes'),
	sortOrder: integer('sort_order').notNull().default(0)
});

export const episodeSummaries = sqliteTable('episode_summaries', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	episodeNumber: integer('episode_number').notNull().unique(),
	summary: text('summary').notNull(),
	vocabularyJson: text('vocabulary_json')
});

// ── Media catalog (songs + videos unified) ────────────────────────────────────
// `kind` discriminates the user-facing view (song vs video); `source` records
// which provider (yt-dlp Spanish captions vs LRCLIB synced lyrics) populated
// the timed lines, so reloads re-run the same source and detail pages can
// offer to swap when the alternative is available.

export const media = sqliteTable('media', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	kind: text('kind').notNull(),
	title: text('title').notNull(),
	artist: text('artist').notNull(),
	youtubeId: text('youtube_id').notNull(),
	lrcText: text('lrc_text'),
	teacherNotes: text('teacher_notes'),
	source: text('source').notNull(),
	createdAt: text('created_at').notNull()
});

export const mediaLines = sqliteTable('media_lines', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	mediaId: integer('media_id')
		.notNull()
		.references(() => media.id, { onDelete: 'cascade' }),
	lineNumber: integer('line_number').notNull(),
	startMs: integer('start_ms').notNull(),
	spanish: text('spanish').notNull(),
	english: text('english')
});

// ── Legacy music/video catalogs ───────────────────────────────────────────────
// Retained read-only during the data-copy migration so the migration is
// non-destructive (CLAUDE.md: never delete user data without explicit
// approval). A follow-up migration drops these once the unified tables are
// verified in production.

export const songs = sqliteTable('songs', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	artist: text('artist').notNull(),
	youtubeId: text('youtube_id').notNull(),
	lrcText: text('lrc_text'),
	teacherNotes: text('teacher_notes'),
	createdAt: text('created_at').notNull()
});

export const songLines = sqliteTable('song_lines', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	songId: integer('song_id')
		.notNull()
		.references(() => songs.id, { onDelete: 'cascade' }),
	lineNumber: integer('line_number').notNull(),
	startMs: integer('start_ms').notNull(),
	spanish: text('spanish').notNull(),
	english: text('english')
});

export const videos = sqliteTable('videos', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	channel: text('channel').notNull(),
	youtubeId: text('youtube_id').notNull(),
	teacherNotes: text('teacher_notes'),
	createdAt: text('created_at').notNull()
});

export const videoLines = sqliteTable('video_lines', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	videoId: integer('video_id')
		.notNull()
		.references(() => videos.id, { onDelete: 'cascade' }),
	lineNumber: integer('line_number').notNull(),
	startMs: integer('start_ms').notNull(),
	spanish: text('spanish').notNull(),
	english: text('english')
});

// ── User-scoped data ──────────────────────────────────────────────────────────

export const userEpisodes = sqliteTable(
	'user_episodes',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		episodeNumber: integer('episode_number').notNull(),
		listened: integer('listened', { mode: 'boolean' }).notNull().default(false),
		listenedAt: text('listened_at'),
		playbackPosition: integer('playback_position').notNull().default(0)
	},
	(t) => [uniqueIndex('ux_user_episodes').on(t.userId, t.episodeNumber)]
);

export const words = sqliteTable('words', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id').references(() => users.id),
	spanish: text('spanish').notNull(),
	english: text('english').notNull(),
	example: text('example'),
	// nullable: words from media will have mediaId set instead
	episodeNumber: integer('episode_number'),
	mediaId: integer('media_id').references(() => media.id, { onDelete: 'set null' }),
	// legacy FKs retained until follow-up migration drops them
	songId: integer('song_id').references(() => songs.id, { onDelete: 'set null' }),
	videoId: integer('video_id').references(() => videos.id, { onDelete: 'set null' }),
	lingqId: integer('lingq_id'),
	lingqStatus: integer('lingq_status'),
	createdAt: text('created_at').notNull()
});

export const userConcepts = sqliteTable(
	'user_concepts',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		conceptId: integer('concept_id')
			.notNull()
			.references(() => concepts.id),
		mastery: integer('mastery').notNull().default(0)
	},
	(t) => [uniqueIndex('ux_user_concepts').on(t.userId, t.conceptId)]
);

export const flashcardReviews = sqliteTable(
	'flashcard_reviews',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		episodeNumber: integer('episode_number').notNull(),
		spanish: text('spanish').notNull(),
		cardState: text('card_state').notNull(),
		createdAt: text('created_at').notNull()
	},
	(t) => [uniqueIndex('ux_flashcard_reviews').on(t.userId, t.episodeNumber, t.spanish)]
);

export const lingqSyncLog = sqliteTable('lingq_sync_log', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	userId: text('user_id').references(() => users.id),
	syncedAt: text('synced_at').notNull(),
	cardsProcessed: integer('cards_processed').notNull(),
	cardsMatched: integer('cards_matched').notNull(),
	status: text('status').notNull(),
	error: text('error')
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	userEpisodes: many(userEpisodes),
	words: many(words),
	userConcepts: many(userConcepts)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

export const mediaRelations = relations(media, ({ many }) => ({
	lines: many(mediaLines),
	words: many(words)
}));

export const mediaLinesRelations = relations(mediaLines, ({ one }) => ({
	media: one(media, { fields: [mediaLines.mediaId], references: [media.id] })
}));

export const songsRelations = relations(songs, ({ many }) => ({
	lines: many(songLines),
	words: many(words)
}));

export const songLinesRelations = relations(songLines, ({ one }) => ({
	song: one(songs, { fields: [songLines.songId], references: [songs.id] })
}));

export const videosRelations = relations(videos, ({ many }) => ({
	lines: many(videoLines),
	words: many(words)
}));

export const videoLinesRelations = relations(videoLines, ({ one }) => ({
	video: one(videos, { fields: [videoLines.videoId], references: [videos.id] })
}));

export const wordsRelations = relations(words, ({ one }) => ({
	media: one(media, { fields: [words.mediaId], references: [media.id] }),
	song: one(songs, { fields: [words.songId], references: [songs.id] }),
	video: one(videos, { fields: [words.videoId], references: [videos.id] }),
	user: one(users, { fields: [words.userId], references: [users.id] })
}));

export const conceptsRelations = relations(concepts, ({ many }) => ({
	episodeConcepts: many(episodeConcepts),
	userConcepts: many(userConcepts)
}));

export const episodeConceptsRelations = relations(episodeConcepts, ({ one }) => ({
	concept: one(concepts, { fields: [episodeConcepts.conceptId], references: [concepts.id] })
}));

export const userEpisodesRelations = relations(userEpisodes, ({ one }) => ({
	user: one(users, { fields: [userEpisodes.userId], references: [users.id] })
}));

export const userConceptsRelations = relations(userConcepts, ({ one }) => ({
	user: one(users, { fields: [userConcepts.userId], references: [users.id] }),
	concept: one(concepts, { fields: [userConcepts.conceptId], references: [concepts.id] })
}));

export const flashcardReviewsRelations = relations(flashcardReviews, ({ one }) => ({
	user: one(users, { fields: [flashcardReviews.userId], references: [users.id] })
}));
