import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { fetchYoutubeMetadata, fetchLrc, saveSongLines } from './music';
import { db } from './db';
import { songs, songLines } from './db/schema';
import { extractYoutubeId } from '$lib/lrc';
import { eq } from 'drizzle-orm';

const OEMBED_RESPONSE = {
	title: 'Mancha de Rolando - Arde la ciudad (video oficial) HD',
	author_name: 'PopArt Discos'
};

const UPDATED_OEMBED_RESPONSE = {
	title: 'Mancha de Rolando - Arde la ciudad (video oficial) HD',
	author_name: 'PopArt Discos'
};

const LRCLIB_RESPONSE = [
	{
		trackName: 'Arde la Ciudad',
		artistName: 'Mancha De Rolando',
		syncedLyrics: '[00:15.04] Tu equipo volvió a ganar\n[00:22.16] Te prendieron mil bengalas hoy\n[00:57.03] Arde la ciudad'
	}
];

const UPDATED_LRCLIB_RESPONSE = [
	{
		trackName: 'Arde la Ciudad',
		artistName: 'Mancha De Rolando',
		syncedLyrics: '[00:15.04] Tu equipo volvió a ganar\n[00:57.03] Arde la ciudad'
	}
];

beforeEach(() => {
	vi.stubGlobal('fetch', vi.fn(async (url: string) => {
		if (url.includes('oembed')) return new Response(JSON.stringify(OEMBED_RESPONSE));
		if (url.includes('lrclib')) return new Response(JSON.stringify(LRCLIB_RESPONSE));
		throw new Error(`Unexpected fetch call: ${url}`);
	}));
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('fetchYoutubeMetadata', () => {
	it('extracts artist and title, ignoring label channel name', async () => {
		// oEmbed returns "Mancha de Rolando - Arde la ciudad (video oficial) HD", channel "PopArt Discos" (a label)
		// get-artist-title should parse the title, not use the channel name as artist
		const result = await fetchYoutubeMetadata('-8vxXsfbxj4');
		expect(result.artist).toBe('Mancha de Rolando');
		expect(result.title).toBe('Arde la ciudad');
	});
});

describe('fetchLrc', () => {
	it('returns syncedLyrics from the first matching result', async () => {
		const lrc = await fetchLrc('Arde la ciudad', 'Mancha de Rolando');
		expect(lrc).toBe(LRCLIB_RESPONSE[0].syncedLyrics);
	});

	it('returns null when lrclib returns no results', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([]))));
		const lrc = await fetchLrc('nonexistent', 'nobody');
		expect(lrc).toBeNull();
	});
});

describe('song insertion and reload flow', () => {
	let insertedSongId: number | undefined;

	afterEach(() => {
		if (insertedSongId !== undefined) {
			db.delete(songs).where(eq(songs.id, insertedSongId)).run();
			insertedSongId = undefined;
		}
	});

	it('creates a song with parsed lyric lines from a YouTube URL', async () => {
		const youtubeId = extractYoutubeId('https://www.youtube.com/watch?v=-8vxXsfbxj4');
		expect(youtubeId).toBe('-8vxXsfbxj4');
		if (!youtubeId) return;

		const metadata = await fetchYoutubeMetadata(youtubeId);
		const lrcText = await fetchLrc(metadata.title, metadata.artist);
		expect(lrcText).not.toBeNull();
		if (!lrcText) return;

		const song = db.insert(songs).values({
			title: metadata.title,
			artist: metadata.artist,
			youtubeId,
			lrcText,
			teacherNotes: null,
			createdAt: new Date().toISOString()
		}).returning().get();

		insertedSongId = song.id;
		saveSongLines(song.id, lrcText);

		const lines = await db.query.songLines.findMany({ where: eq(songLines.songId, song.id) });
		expect(lines).toHaveLength(3);
		expect(lines[0].startMs).toBe(15040);
		expect(lines[0].spanish).toBe('Tu equipo volvió a ganar');
	});

	it('reload replaces song lines with freshly fetched metadata and lyrics', async () => {
		// Insert a song with stale data (no lyrics)
		const song = db.insert(songs).values({
			title: 'stale title',
			artist: 'stale artist',
			youtubeId: '-8vxXsfbxj4',
			lrcText: null,
			teacherNotes: null,
			createdAt: new Date().toISOString()
		}).returning().get();

		insertedSongId = song.id;

		// Simulate reload: fetch updated metadata and lyrics, then save
		vi.stubGlobal('fetch', vi.fn(async (url: string) => {
			if (url.includes('oembed')) return new Response(JSON.stringify(UPDATED_OEMBED_RESPONSE));
			if (url.includes('lrclib')) return new Response(JSON.stringify(UPDATED_LRCLIB_RESPONSE));
			throw new Error(`Unexpected fetch call: ${url}`);
		}));

		const metadata = await fetchYoutubeMetadata(song.youtubeId);
		const lrcText = await fetchLrc(metadata.title, metadata.artist);
		expect(lrcText).not.toBeNull();
		if (!lrcText) return;

		db.update(songs).set({ title: metadata.title, artist: metadata.artist, lrcText }).where(eq(songs.id, song.id)).run();
		saveSongLines(song.id, lrcText);

		const updated = db.select().from(songs).where(eq(songs.id, song.id)).get();
		expect(updated?.title).toBe('Arde la ciudad');
		expect(updated?.artist).toBe('Mancha de Rolando');

		const lines = await db.query.songLines.findMany({ where: eq(songLines.songId, song.id) });
		expect(lines).toHaveLength(2);
		expect(lines[0].spanish).toBe('Tu equipo volvió a ganar');
		expect(lines[1].spanish).toBe('Arde la ciudad');
	});
});
