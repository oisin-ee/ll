import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import {
	fetchMediaMetadata,
	saveMediaLines,
	preferredSourceFor,
	probeSources
} from './media';
import { db } from './db';
import { media, mediaLines } from './db/schema';

vi.mock('./subtitles', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./subtitles')>();
	return {
		...actual,
		fetchSubtitles: vi.fn(),
		translateLines: vi.fn(async (lines: string[]) => lines.map(() => null))
	};
});

vi.mock('./lrclib', () => ({
	fetchLrcLyrics: vi.fn(),
	checkLrcLyrics: vi.fn()
}));

vi.mock('./youtube-search', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./youtube-search')>();
	return {
		...actual,
		checkSpanishSubs: vi.fn()
	};
});

import { fetchSubtitles } from './subtitles';
import { fetchLrcLyrics, checkLrcLyrics } from './lrclib';
import { checkSpanishSubs } from './youtube-search';

const SAMPLE_LINES = [
	{ startMs: 15_040, text: 'Tu equipo volvió a ganar' },
	{ startMs: 22_160, text: 'Te prendieron mil bengalas hoy' }
];

const OEMBED_BAD_BUNNY = {
	title: 'Bad Bunny - Tití Me Preguntó (Official Video)',
	author_name: 'Bad Bunny'
};

const OEMBED_VLOG = {
	title: 'Spanish vlog from Madrid',
	author_name: 'Dreaming Spanish'
};

beforeEach(() => {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string) => {
			if (url.includes('Tit%C3%AD') || url.includes('Bad+Bunny') || url.includes('Cr8K88UcO5s')) {
				return new Response(JSON.stringify(OEMBED_BAD_BUNNY));
			}
			if (url.includes('oembed')) return new Response(JSON.stringify(OEMBED_VLOG));
			throw new Error(`Unexpected fetch: ${url}`);
		})
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

describe('preferredSourceFor', () => {
	it('returns lyrics for songs and captions for videos', () => {
		expect(preferredSourceFor('song')).toBe('lyrics');
		expect(preferredSourceFor('video')).toBe('captions');
	});
});

describe('fetchMediaMetadata', () => {
	it('extracts artist and title from the video title for music', async () => {
		const result = await fetchMediaMetadata('Cr8K88UcO5s');
		expect(result.artist).toBe('Bad Bunny');
		expect(result.title).toBe('Tití Me Preguntó');
	});

	it('falls back to channel name as artist when title has no separator', async () => {
		const result = await fetchMediaMetadata('vlogabcdefg');
		expect(result.artist).toBe('Dreaming Spanish');
		expect(result.title).toBe('Spanish vlog from Madrid');
	});
});

describe('saveMediaLines', () => {
	let insertedMediaId: number | undefined;

	afterEach(() => {
		if (insertedMediaId !== undefined) {
			db.delete(media).where(eq(media.id, insertedMediaId)).run();
			insertedMediaId = undefined;
		}
	});

	function insertMedia(source: 'captions' | 'lyrics' = 'captions') {
		const row = db
			.insert(media)
			.values({
				kind: 'song',
				title: 'Test',
				artist: 'Test Artist',
				youtubeId: 'aaaaaaaaaaa',
				lrcText: null,
				teacherNotes: null,
				source,
				createdAt: new Date().toISOString()
			})
			.returning()
			.get();
		insertedMediaId = row.id;
		return row;
	}

	it('dispatches to fetchSubtitles when source=captions', async () => {
		vi.mocked(fetchSubtitles).mockReturnValue({ ok: true, lines: SAMPLE_LINES, lang: 'es' });
		const row = insertMedia('lyrics'); // start with lyrics, swap to captions

		const result = await saveMediaLines(row.id, row.youtubeId, 'captions', row.artist, row.title);

		expect(result.ok).toBe(true);
		expect(fetchSubtitles).toHaveBeenCalledWith('aaaaaaaaaaa');
		expect(fetchLrcLyrics).not.toHaveBeenCalled();

		const lines = db.select().from(mediaLines).where(eq(mediaLines.mediaId, row.id)).all();
		expect(lines).toHaveLength(2);
		expect(lines[0].spanish).toBe('Tu equipo volvió a ganar');

		// Verify the source was persisted
		const updated = db.select().from(media).where(eq(media.id, row.id)).get();
		expect(updated?.source).toBe('captions');
	});

	it('dispatches to fetchLrcLyrics when source=lyrics', async () => {
		vi.mocked(fetchLrcLyrics).mockResolvedValue({ ok: true, lines: SAMPLE_LINES, lang: 'es' });
		const row = insertMedia('captions');

		const result = await saveMediaLines(row.id, row.youtubeId, 'lyrics', row.artist, row.title);

		expect(result.ok).toBe(true);
		expect(fetchLrcLyrics).toHaveBeenCalledWith('Test Artist', 'Test');
		expect(fetchSubtitles).not.toHaveBeenCalled();

		const updated = db.select().from(media).where(eq(media.id, row.id)).get();
		expect(updated?.source).toBe('lyrics');
	});

	it('replaces existing lines on reload', async () => {
		vi.mocked(fetchSubtitles).mockReturnValue({ ok: true, lines: SAMPLE_LINES, lang: 'es' });
		const row = insertMedia('captions');

		await saveMediaLines(row.id, row.youtubeId, 'captions', row.artist, row.title);

		vi.mocked(fetchSubtitles).mockReturnValue({
			ok: true,
			lines: [{ startMs: 0, text: 'Just one line' }],
			lang: 'es'
		});
		await saveMediaLines(row.id, row.youtubeId, 'captions', row.artist, row.title);

		const lines = db.select().from(mediaLines).where(eq(mediaLines.mediaId, row.id)).all();
		expect(lines).toHaveLength(1);
		expect(lines[0].spanish).toBe('Just one line');
	});

	it('propagates failure reason without writing lines', async () => {
		vi.mocked(fetchLrcLyrics).mockResolvedValue({ ok: false, reason: 'no-synced-lyrics' });
		const row = insertMedia('captions');

		const result = await saveMediaLines(row.id, row.youtubeId, 'lyrics', row.artist, row.title);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe('no-synced-lyrics');

		const lines = db.select().from(mediaLines).where(eq(mediaLines.mediaId, row.id)).all();
		expect(lines).toHaveLength(0);

		// Source should NOT be updated on failure
		const unchanged = db.select().from(media).where(eq(media.id, row.id)).get();
		expect(unchanged?.source).toBe('captions');
	});
});

describe('probeSources', () => {
	it('returns availability flags for both providers', async () => {
		vi.mocked(checkSpanishSubs).mockResolvedValue(true);
		vi.mocked(checkLrcLyrics).mockResolvedValue(false);

		const result = await probeSources('aaaaaaaaaaa', 'Artist', 'Track');

		expect(result).toEqual({ hasCaptions: true, hasSyncedLyrics: false });
	});
});
