import { z } from 'zod';
import getArtistTitle from 'get-artist-title';
import { db } from './db';
import { mediaLines, media as mediaTable } from './db/schema';
import { fetchSubtitles, translateLines, type SubtitleFailureReason } from './subtitles';
import { fetchLrcLyrics, checkLrcLyrics } from './lrclib';
import { checkSpanishSubs } from './youtube-search';
import { eq } from 'drizzle-orm';

export type MediaKind = 'song' | 'video';
export type MediaSource = 'captions' | 'lyrics';

export type SaveMediaLinesResult =
	| { ok: true }
	| { ok: false; reason: SubtitleFailureReason; detail?: string };

const oEmbedSchema = z.object({
	title: z.string(),
	author_name: z.string()
});

/**
 * Fetch metadata from YouTube oEmbed and parse out a clean artist/title.
 * For songs, `get-artist-title` typically extracts the artist from the title
 * itself ("Bad Bunny - Tití Me Preguntó"); when it can't, we fall back to the
 * channel/uploader as the artist. Videos with no parseable artist still use
 * the channel name, which is what the user wants.
 */
export async function fetchMediaMetadata(
	youtubeId: string
): Promise<{ title: string; artist: string }> {
	const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
	const res = await fetch(url);
	if (!res.ok) throw new Error('Could not fetch YouTube metadata');
	const data = oEmbedSchema.parse(await res.json());

	const parsed = getArtistTitle(data.title, { defaultArtist: data.author_name });
	if (parsed) {
		const [artist, title] = parsed;
		if (artist?.trim() && title?.trim()) return { artist, title };
	}
	return { artist: data.author_name, title: data.title };
}

/**
 * Decide which source to use for a fresh ingest. Music pages prefer LRCLIB
 * synced lyrics (real lyrics > ASR captions), video pages prefer YouTube
 * captions (timed exactly to the audio of THAT video). Either falls back to
 * the other if its first choice isn't available.
 */
export function preferredSourceFor(kind: MediaKind): MediaSource {
	return kind === 'song' ? 'lyrics' : 'captions';
}

/**
 * Pick the actual source to use given a kind preference and a probe result.
 * If neither source is available, returns the kind's preferred source so the
 * subsequent ingest produces a meaningful failure reason rather than silently
 * succeeding with no lines.
 */
export function chooseSource(
	kind: MediaKind,
	available: { hasCaptions: boolean; hasSyncedLyrics: boolean }
): MediaSource {
	const preferred = preferredSourceFor(kind);
	if (preferred === 'lyrics' && available.hasSyncedLyrics) return 'lyrics';
	if (preferred === 'lyrics' && available.hasCaptions) return 'captions';
	if (preferred === 'captions' && available.hasCaptions) return 'captions';
	if (preferred === 'captions' && available.hasSyncedLyrics) return 'lyrics';
	return preferred;
}

/**
 * Populate media_lines for the given media row from the chosen source.
 * Replaces any existing lines so reloads and source swaps are idempotent.
 * Also persists the active `source` on the media row so future reloads
 * re-run the same provider unless explicitly switched.
 */
export async function saveMediaLines(
	mediaId: number,
	youtubeId: string,
	source: MediaSource,
	artist: string,
	title: string
): Promise<SaveMediaLinesResult> {
	const lineSource =
		source === 'lyrics'
			? await fetchLrcLyrics(artist, title)
			: fetchSubtitles(youtubeId);

	if (!lineSource.ok) {
		return { ok: false, reason: lineSource.reason, detail: lineSource.detail };
	}

	const { lines } = lineSource;
	const translations = await translateLines(lines.map((l) => l.text));

	db.delete(mediaLines).where(eq(mediaLines.mediaId, mediaId)).run();
	db.insert(mediaLines)
		.values(
			lines.map((line, i) => ({
				mediaId,
				lineNumber: i,
				startMs: line.startMs,
				spanish: line.text,
				english: translations[i] ?? null
			}))
		)
		.run();

	db.update(mediaTable).set({ source }).where(eq(mediaTable.id, mediaId)).run();

	return { ok: true };
}

/**
 * Probe both providers in parallel for the live availability of captions vs.
 * synced lyrics. Used by the detail page to decide whether to surface a
 * "Switch source" button (only when the alternative is actually available).
 */
export async function probeSources(
	youtubeId: string,
	artist: string,
	title: string
): Promise<{ hasCaptions: boolean; hasSyncedLyrics: boolean }> {
	const [hasCaptions, hasSyncedLyrics] = await Promise.all([
		checkSpanishSubs(youtubeId),
		checkLrcLyrics(artist, title)
	]);
	return { hasCaptions, hasSyncedLyrics };
}

