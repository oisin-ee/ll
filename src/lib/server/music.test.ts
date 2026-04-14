import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { fetchYoutubeMetadata, saveSongLines } from './music';
import { db } from './db';
import { songs, songLines } from './db/schema';
import { extractYoutubeId } from '$lib/lrc';
import { eq } from 'drizzle-orm';

vi.mock('$lib/server/subtitles', () => ({
	fetchSubtitles: vi.fn(),
	translateLines: vi.fn(async (lines: string[]) => lines.map(() => null))
}));

import { fetchSubtitles } from '$lib/server/subtitles';

const OEMBED_RESPONSE = {
	title: 'Mancha de Rolando - Arde la ciudad (video oficial) HD',
	author_name: 'PopArt Discos'
};

const SAMPLE_LINES = [
	{ startMs: 15_040, text: 'Tu equipo volvió a ganar' },
	{ startMs: 22_160, text: 'Te prendieron mil bengalas hoy' },
	{ startMs: 57_030, text: 'Arde la ciudad' }
];

const UPDATED_LINES = [
	{ startMs: 15_040, text: 'Tu equipo volvió a ganar' },
	{ startMs: 57_030, text: 'Arde la ciudad' }
];

beforeEach(() => {
	vi.stubGlobal('fetch', vi.fn(async (url: string) => {
		if (url.includes('oembed')) return new Response(JSON.stringify(OEMBED_RESPONSE));
		if (url.includes('deepl')) return new Response(JSON.stringify({ translations: [] }));
		throw new Error(`Unexpected fetch call: ${url}`);
	}));
	vi.mocked(fetchSubtitles).mockReturnValue(SAMPLE_LINES);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

describe('fetchYoutubeMetadata', () => {
	it('extracts artist and title, ignoring label channel name', async () => {
		const result = await fetchYoutubeMetadata('-8vxXsfbxj4');
		expect(result.artist).toBe('Mancha de Rolando');
		expect(result.title).toBe('Arde la ciudad');
	});
});

describe('saveSongLines', () => {
	let insertedSongId: number | undefined;

	afterEach(() => {
		if (insertedSongId !== undefined) {
			db.delete(songs).where(eq(songs.id, insertedSongId)).run();
			insertedSongId = undefined;
		}
	});

	it('inserts parsed subtitle lines into song_lines', async () => {
		const youtubeId = '-8vxXsfbxj4';
		const song = db.insert(songs).values({
			title: 'Arde la ciudad',
			artist: 'Mancha de Rolando',
			youtubeId,
			lrcText: null,
			teacherNotes: null,
			createdAt: new Date().toISOString()
		}).returning().get();
		insertedSongId = song.id;

		const saved = await saveSongLines(song.id, youtubeId);

		expect(saved).toBe(true);
		const lines = db.select().from(songLines).where(eq(songLines.songId, song.id)).all();
		expect(lines).toHaveLength(3);
		expect(lines[0].startMs).toBe(15_040);
		expect(lines[0].spanish).toBe('Tu equipo volvió a ganar');
	});

	it('replaces existing lines on reload', async () => {
		const youtubeId = '-8vxXsfbxj4';
		const song = db.insert(songs).values({
			title: 'Arde la ciudad',
			artist: 'Mancha de Rolando',
			youtubeId,
			lrcText: null,
			teacherNotes: null,
			createdAt: new Date().toISOString()
		}).returning().get();
		insertedSongId = song.id;

		await saveSongLines(song.id, youtubeId);

		// Simulate reload with fewer lines
		vi.mocked(fetchSubtitles).mockReturnValue(UPDATED_LINES);
		await saveSongLines(song.id, youtubeId);

		const lines = db.select().from(songLines).where(eq(songLines.songId, song.id)).all();
		expect(lines).toHaveLength(2);
		expect(lines[1].spanish).toBe('Arde la ciudad');
	});

	it('returns false when yt-dlp finds no subtitles', async () => {
		vi.mocked(fetchSubtitles).mockReturnValue(null);

		const song = db.insert(songs).values({
			title: 'No Subtitles',
			artist: 'Nobody',
			youtubeId: 'jNQXAC9IVRw',
			lrcText: null,
			teacherNotes: null,
			createdAt: new Date().toISOString()
		}).returning().get();
		insertedSongId = song.id;

		const saved = await saveSongLines(song.id, 'jNQXAC9IVRw');
		expect(saved).toBe(false);

		const lines = db.select().from(songLines).where(eq(songLines.songId, song.id)).all();
		expect(lines).toHaveLength(0);
	});
});

describe('extractYoutubeId', () => {
	it('parses full watch URL', () => {
		expect(extractYoutubeId('https://www.youtube.com/watch?v=-8vxXsfbxj4')).toBe('-8vxXsfbxj4');
	});

	it('parses bare 11-char ID', () => {
		expect(extractYoutubeId('-8vxXsfbxj4')).toBe('-8vxXsfbxj4');
	});
});
