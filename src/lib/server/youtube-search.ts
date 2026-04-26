import { spawn, spawnSync } from 'node:child_process';
import { z } from 'zod';
import getArtistTitle from 'get-artist-title';
import { checkLrcLyrics } from './lrclib';

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

const searchResultSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	uploader: z.string().optional(),
	duration: z.number().nullable().optional()
});

export interface YoutubeSearchCandidateBase {
	youtubeId: string;
	title: string;
	channel: string;
	durationSeconds: number | null;
}

export interface YoutubeSearchCandidate extends YoutubeSearchCandidateBase {
	hasCaptions: boolean;
	hasSyncedLyrics: boolean;
}

/**
 * Parse "Artist - Title" out of a YouTube video title, falling back to the
 * uploader/channel as the artist when the title doesn't carry one. Mirrors the
 * heuristic used by `fetchYoutubeMetadata` so the picker's LRCLIB lookup uses
 * the same artist/title the ingest pipeline will use.
 */
export function parseArtistTitle(
	title: string,
	channel: string
): { artist: string; title: string } | null {
	const parsed = getArtistTitle(title, { defaultArtist: channel });
	if (!parsed) return null;
	const [artist, parsedTitle] = parsed;
	if (!artist?.trim() || !parsedTitle?.trim()) return null;
	return { artist, title: parsedTitle };
}

function clampLimit(limit: number): number {
	if (!Number.isFinite(limit)) return 5;
	return Math.min(Math.max(Math.floor(limit), 1), 10);
}

export function parseSearchOutput(stdout: string): YoutubeSearchCandidateBase[] {
	const seen = new Set<string>();
	const rows = stdout
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	const candidates: YoutubeSearchCandidateBase[] = [];
	for (const row of rows) {
		let json: unknown;
		try {
			json = JSON.parse(row);
		} catch {
			continue;
		}

		const normalized = searchResultSchema.safeParse(json);
		if (!normalized.success) continue;

		const youtubeId = normalized.data.id.trim();
		if (!YOUTUBE_ID_RE.test(youtubeId)) continue;
		if (seen.has(youtubeId)) continue;

		seen.add(youtubeId);
		candidates.push({
			youtubeId,
			title: normalized.data.title?.trim() || 'Untitled',
			channel: normalized.data.uploader?.trim() || 'Unknown channel',
			durationSeconds: normalized.data.duration ?? null
		});
	}

	return candidates;
}

export function checkSpanishSubs(youtubeId: string): Promise<boolean> {
	if (!/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) return Promise.resolve(false);
	return new Promise((resolve) => {
		let output = '';
		let settled = false;
		const settle = (result: boolean) => {
			if (!settled) { settled = true; resolve(result); }
		};
		const child = spawn('yt-dlp', ['--list-subs', '--sub-lang', 'es', `https://www.youtube.com/watch?v=${youtubeId}`]);
		const timer = setTimeout(() => { child.kill(); settle(false); }, 15_000);
		child.stdout.on('data', (d: Buffer) => { output += d.toString(); });
		child.stderr.on('data', (d: Buffer) => { output += d.toString(); });
		child.on('close', () => { clearTimeout(timer); settle(/^es[\s-]/m.test(output)); });
		child.on('error', () => { clearTimeout(timer); settle(false); });
	});
}

export async function searchYoutubeCandidates(query: string, limit = 5): Promise<YoutubeSearchCandidate[]> {
	const trimmedQuery = query.trim();
	if (trimmedQuery.length === 0) return [];

	const searchLimit = clampLimit(limit);
	// `--print` with a JSON template gives us only the fields we need (~200B
	// per row) instead of `--dump-json`'s ~600KB per row of formats/thumbnails.
	// At 5 results, the slim form is ~1KB vs ~3MB and avoids the spawnSync
	// default maxBuffer (1MB) ENOBUFS error.
	const commandResult = spawnSync(
		'yt-dlp',
		[
			'--print',
			'{"id":%(id)j,"title":%(title)j,"uploader":%(uploader)j,"duration":%(duration)j}',
			`ytsearch${searchLimit}:${trimmedQuery}`
		],
		{ encoding: 'utf-8', timeout: 20_000 }
	);

	if (commandResult.error || commandResult.status !== 0) return [];

	const baseCandidates = parseSearchOutput(commandResult.stdout ?? '').slice(0, searchLimit);

	const enriched = await Promise.all(
		baseCandidates.map(async (candidate) => {
			const parsed = parseArtistTitle(candidate.title, candidate.channel);
			const [hasCaptions, hasSyncedLyrics] = await Promise.all([
				checkSpanishSubs(candidate.youtubeId),
				parsed ? checkLrcLyrics(parsed.artist, parsed.title) : Promise.resolve(false)
			]);
			return { ...candidate, hasCaptions, hasSyncedLyrics };
		})
	);

	return enriched.filter((c) => c.hasCaptions || c.hasSyncedLyrics);
}
