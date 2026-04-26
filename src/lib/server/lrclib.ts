import { z } from 'zod';
import { logger } from '../../logger';
import { parseLrc } from '../lrc';
import type { SubtitleResult } from './subtitles';

const LRCLIB_BASE = 'https://lrclib.net/api';
const REQUEST_TIMEOUT_MS = 8_000;

const getResponseSchema = z.object({
	id: z.number(),
	trackName: z.string(),
	artistName: z.string(),
	albumName: z.string().nullable().optional(),
	duration: z.number().nullable().optional(),
	instrumental: z.boolean().optional(),
	plainLyrics: z.string().nullable().optional(),
	syncedLyrics: z.string().nullable().optional()
});

const searchResponseSchema = z.array(getResponseSchema);

type LrclibTrack = z.infer<typeof getResponseSchema>;

async function fetchWithTimeout(url: string): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		return await fetch(url, { signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

async function getTrack(artist: string, title: string): Promise<LrclibTrack | null> {
	const url = `${LRCLIB_BASE}/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
	const res = await fetchWithTimeout(url);
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`LRCLIB /get returned ${res.status}`);
	return getResponseSchema.parse(await res.json());
}

async function searchTrack(artist: string, title: string): Promise<LrclibTrack | null> {
	const url = `${LRCLIB_BASE}/search?q=${encodeURIComponent(`${artist} ${title}`)}`;
	const res = await fetchWithTimeout(url);
	if (!res.ok) throw new Error(`LRCLIB /search returned ${res.status}`);
	const results = searchResponseSchema.parse(await res.json());
	return results[0] ?? null;
}

async function findTrack(artist: string, title: string): Promise<LrclibTrack | null> {
	const direct = await getTrack(artist, title);
	if (direct) return direct;
	return searchTrack(artist, title);
}

export async function fetchLrcLyrics(artist: string, title: string): Promise<SubtitleResult> {
	if (!artist.trim() || !title.trim()) {
		return { ok: false, reason: 'no-lyrics' };
	}

	let track: LrclibTrack | null;
	try {
		track = await findTrack(artist, title);
	} catch (err) {
		const detail = err instanceof Error ? err.message : String(err);
		logger.warn({ artist, title, err: detail }, 'lrclib fetch failed');
		return { ok: false, reason: 'lrclib-error', detail };
	}

	if (!track) return { ok: false, reason: 'no-lyrics' };
	if (!track.syncedLyrics) return { ok: false, reason: 'no-synced-lyrics' };

	const lines = parseLrc(track.syncedLyrics);
	if (lines.length === 0) {
		return { ok: false, reason: 'no-synced-lyrics', detail: 'LRC parsed to zero cues' };
	}

	return { ok: true, lines, lang: 'es' };
}

export async function checkLrcLyrics(artist: string, title: string): Promise<boolean> {
	if (!artist.trim() || !title.trim()) return false;
	try {
		const track = await findTrack(artist, title);
		return Boolean(track?.syncedLyrics);
	} catch {
		return false;
	}
}
