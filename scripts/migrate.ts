// Run drizzle migrations and FAIL LOUD on errors.
//
// Replacement for `pnpm drizzle-kit migrate` in the Dockerfile CMD. The
// drizzle-kit CLI has a bug where it catches migration errors, prints
// "migrations applied successfully", and exits 0 — allowing the container
// to start with the new app code against an unmigrated schema.
//
// This script imports the drizzle-orm migrator directly, lets errors
// propagate, and exits non-zero so the container refuses to start.

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { resolve, dirname } from 'node:path';
import { mkdirSync } from 'node:fs';

const dbPath = resolve('data/ll.db');
mkdirSync(dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite);

try {
	migrate(db, { migrationsFolder: resolve('drizzle') });
	process.stdout.write('migrations applied\n');
} catch (err) {
	const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
	process.stderr.write(`migrate failed: ${message}\n`);
	process.exit(1);
} finally {
	sqlite.close();
}
