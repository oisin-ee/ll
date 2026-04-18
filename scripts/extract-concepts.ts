/**
 * Populate concept data from pre-extracted JSON files.
 *
 * Reads data/extracted/lesson-NN.json and inserts concepts,
 * episode_concepts (with rich fields), and episode_summaries.
 */

import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const dbPath = resolve('data/ll.db');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

interface Example {
	spanish: string;
	english: string;
}

interface Teaching {
	conceptSlug: string;
	conceptName: string;
	category: string;
	role: string;
	summary: string;
	rule: string | null;
	examples: Example[];
	notes: string | null;
}

interface VocabItem {
	spanish: string;
	english: string;
	derivation: string | null;
}

interface ExtractedLesson {
	episode: number;
	summary: string;
	teachings: Teaching[];
	vocabulary: VocabItem[];
}

// Clear existing concept data (will be fully regenerated)
sqlite.exec('DELETE FROM episode_concepts');
sqlite.exec('DELETE FROM concepts');
sqlite.exec('DELETE FROM episode_summaries');

// Ensure new columns exist (for databases created before schema update)
const addColumn = (table: string, col: string, type: string) => {
	try {
		sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
	} catch {
		// column already exists
	}
};
addColumn('concepts', 'slug', 'TEXT');
addColumn('episode_concepts', 'summary', 'TEXT');
addColumn('episode_concepts', 'rule', 'TEXT');
addColumn('episode_concepts', 'examples', 'TEXT');
addColumn('episode_concepts', 'notes', 'TEXT');
addColumn('episode_concepts', 'sort_order', 'INTEGER NOT NULL DEFAULT 0');

// Create episode_summaries if not exists
sqlite.exec(`CREATE TABLE IF NOT EXISTS episode_summaries (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	episode_id INTEGER NOT NULL UNIQUE REFERENCES episodes(id),
	summary TEXT NOT NULL,
	vocabulary_json TEXT
)`);

// Ensure unique index
sqlite.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_episode_concepts_unique ON episode_concepts(episode_id, concept_id)');
sqlite.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_concepts_slug ON concepts(slug)');

const insertConcept = sqlite.prepare(
	'INSERT OR IGNORE INTO concepts (slug, name, description, category, mastery) VALUES (?, ?, ?, ?, 0)'
);
const updateConcept = sqlite.prepare(
	'UPDATE concepts SET name = ?, category = ? WHERE slug = ?'
);
const getConceptId = sqlite.prepare('SELECT id FROM concepts WHERE slug = ?');
const getEpisodeId = sqlite.prepare('SELECT id FROM episodes WHERE number = ?');
const insertLink = sqlite.prepare(
	'INSERT OR IGNORE INTO episode_concepts (episode_id, concept_id, role, summary, rule, examples, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);
const insertSummary = sqlite.prepare(
	'INSERT OR REPLACE INTO episode_summaries (episode_id, summary, vocabulary_json) VALUES (?, ?, ?)'
);

const extractedDir = resolve('data/extracted');
const files = readdirSync(extractedDir)
	.filter((f) => f.endsWith('.json'))
	.sort();

let conceptCount = 0;
let linkCount = 0;
let summaryCount = 0;

for (const file of files) {
	const data: ExtractedLesson = JSON.parse(readFileSync(resolve(extractedDir, file), 'utf-8'));

	const episode = getEpisodeId.get(data.episode) as { id: number } | undefined;
	if (!episode) {
		console.warn(`Episode ${data.episode} not found in DB, skipping`);
		continue;
	}

	// Insert episode summary
	if (data.summary) {
		insertSummary.run(episode.id, data.summary, JSON.stringify(data.vocabulary ?? []));
		summaryCount++;
	}

	// Insert concepts and links
	for (let i = 0; i < data.teachings.length; i++) {
		const t = data.teachings[i];

		// Upsert concept
		insertConcept.run(t.conceptSlug, t.conceptName, t.summary, t.category);
		updateConcept.run(t.conceptName, t.category, t.conceptSlug);

		const concept = getConceptId.get(t.conceptSlug) as { id: number };
		conceptCount++;

		try {
			insertLink.run(
				episode.id,
				concept.id,
				t.role,
				t.summary,
				t.rule ?? null,
				JSON.stringify(t.examples ?? []),
				t.notes ?? null,
				i
			);
			linkCount++;
		} catch {
			// duplicate link, skip
		}
	}
}

console.log(`Loaded ${conceptCount} concept references, ${linkCount} episode links, ${summaryCount} episode summaries`);

sqlite.close();
