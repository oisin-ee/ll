import { describe, it, expect, afterEach } from 'vitest';
import { fetchYoutubeMetadata, fetchLrc } from './music';
import { db } from './db';
import { songs, songLines } from './db/schema';
import { parseLrc, extractYoutubeId } from '$lib/lrc';
import { eq } from 'drizzle-orm';

describe('fetchYoutubeMetadata', () => {
	it('extracts artist and title from a music video with label channel', async () => {
		// YouTube title: "Mancha de Rolando - Arde la ciudad (video oficial) HD"
		// Channel: "PopArt Discos" (a label, not the artist)
		const result = await fetchYoutubeMetadata('-8vxXsfbxj4');
		expect(result.artist).toBe('Mancha de Rolando');
		expect(result.title).toBe('Arde la ciudad');
	});
});

describe('fetchLrc', () => {
	it('finds synced lyrics for Arde la ciudad', async () => {
		const lrc = await fetchLrc('Arde la ciudad', 'Mancha de Rolando');
		expect(lrc).not.toBeNull();
		expect(lrc).toContain('[');
	});

	it('returns null for a nonexistent track', async () => {
		const lrc = await fetchLrc('zzz_nonexistent_track_xyz', 'zzz_nonexistent_artist_xyz');
		expect(lrc).toBeNull();
	}, 15_000);
});

describe('full song insertion flow', () => {
	const testYoutubeUrl = 'https://www.youtube.com/watch?v=-8vxXsfbxj4&pp=ygUOYXJkZSBsYSBjaXVkYWQ%3D';
	let insertedSongId: number | undefined;

	afterEach(() => {
		if (insertedSongId !== undefined) {
			db.delete(songs).where(eq(songs.id, insertedSongId)).run();
			insertedSongId = undefined;
		}
	});

	it('creates a song with synced lyric lines from a YouTube URL', async () => {
		const youtubeId = extractYoutubeId(testYoutubeUrl);
		expect(youtubeId).toBe('-8vxXsfbxj4');
		if (!youtubeId) return;

		const { title, artist } = await fetchYoutubeMetadata(youtubeId);
		const lrcText = await fetchLrc(title, artist);
		expect(lrcText).not.toBeNull();
		if (!lrcText) return;

		const song = db.insert(songs).values({
			title,
			artist,
			youtubeId,
			lrcText,
			teacherNotes: null,
			createdAt: new Date().toISOString()
		}).returning().get();

		insertedSongId = song.id;

		const parsed = parseLrc(lrcText);
		expect(parsed.length).toBeGreaterThan(0);

		db.insert(songLines).values(
			parsed.map((line, i) => ({
				songId: song.id,
				lineNumber: i,
				startMs: line.startMs,
				spanish: line.text,
				english: null
			}))
		).run();

		const lines = await db.query.songLines.findMany({ where: eq(songLines.songId, song.id) });
		expect(lines.length).toBe(parsed.length);
		expect(lines[0].startMs).toBeGreaterThan(0);
		expect(lines[0].spanish).toBeTruthy();
	});
});
