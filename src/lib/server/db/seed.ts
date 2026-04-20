// Legacy bootstrap helper. Tables are now created by drizzle-kit migrate at
// container startup (see Dockerfile runner stage). This script is kept as a
// dev convenience for initializing a clean sqlite file outside Docker.

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
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

const { sql } = await import('drizzle-orm');

// Episodes are not stored in the DB — see src/lib/server/episodes.ts.
// Only seed the ancillary tables that real migrations also manage.

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
	episode_number INTEGER NOT NULL,
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
	episode_number INTEGER NOT NULL UNIQUE,
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

sqlite.close();
