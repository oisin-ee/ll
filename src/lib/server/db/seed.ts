import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { episodes } from './schema';
import { resolve } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const dataDir = resolve('data');
if (!existsSync(dataDir)) {
	mkdirSync(dataDir, { recursive: true });
}

const dbPath = resolve('data/ll.db');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite);

// Push schema first (tables must exist)
const { sql } = await import('drizzle-orm');
db.run(sql`CREATE TABLE IF NOT EXISTS episodes (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	number INTEGER NOT NULL UNIQUE,
	title TEXT NOT NULL,
	listened INTEGER NOT NULL DEFAULT 0,
	listened_at TEXT,
	transcript_path TEXT
)`);
db.run(sql`CREATE TABLE IF NOT EXISTS words (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	spanish TEXT NOT NULL,
	english TEXT NOT NULL,
	example TEXT,
	episode_id INTEGER NOT NULL REFERENCES episodes(id),
	lingq_id INTEGER,
	lingq_status INTEGER,
	created_at TEXT NOT NULL
)`);
db.run(sql`CREATE TABLE IF NOT EXISTS concepts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	slug TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	description TEXT,
	category TEXT,
	mastery INTEGER NOT NULL DEFAULT 0
)`);
db.run(sql`CREATE TABLE IF NOT EXISTS episode_concepts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	episode_id INTEGER NOT NULL REFERENCES episodes(id),
	concept_id INTEGER NOT NULL REFERENCES concepts(id),
	role TEXT NOT NULL DEFAULT 'introduced',
	summary TEXT,
	rule TEXT,
	examples TEXT,
	notes TEXT,
	sort_order INTEGER NOT NULL DEFAULT 0
)`);
db.run(sql`CREATE TABLE IF NOT EXISTS episode_summaries (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	episode_id INTEGER NOT NULL UNIQUE REFERENCES episodes(id),
	summary TEXT NOT NULL,
	vocabulary_json TEXT
)`);
db.run(sql`CREATE TABLE IF NOT EXISTS lingq_sync_log (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	synced_at TEXT NOT NULL,
	cards_processed INTEGER NOT NULL,
	cards_matched INTEGER NOT NULL,
	status TEXT NOT NULL,
	error TEXT
)`);

// Seed 90 episodes
const existing = db.select().from(episodes).all();
if (existing.length === 0) {
	for (let i = 1; i <= 90; i++) {
		const num = String(i).padStart(2, '0');
		db.insert(episodes)
			.values({
				number: i,
				title: `Lesson ${num}`,
				transcriptPath: `transcripts/lesson-${num}.md`
			})
			.run();
	}
	console.log('Seeded 90 episodes');
} else {
	console.log(`Episodes already seeded (${existing.length} found)`);
}

sqlite.close();
