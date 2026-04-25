import { spawn, spawnSync } from 'node:child_process';
import { z } from 'zod';

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

const searchResultSchema = z.object({
	id: z.string(),
	title: z.string().optional(),
	uploader: z.string().optional(),
	duration: z.number().nullable().optional()
});

export interface YoutubeSearchCandidate {
	youtubeId: string;
	title: string;
	channel: string;
	durationSeconds: number | null;
}

function clampLimit(limit: number): number {
	if (!Number.isFinite(limit)) return 5;
	return Math.min(Math.max(Math.floor(limit), 1), 10);
}

export function parseSearchOutput(stdout: string): YoutubeSearchCandidate[] {
	const seen = new Set<string>();
	const rows = stdout
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	const candidates: YoutubeSearchCandidate[] = [];
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
	const commandResult = spawnSync(
		'yt-dlp',
		['--dump-json', `ytsearch${searchLimit}:${trimmedQuery}`],
		{ encoding: 'utf-8', timeout: 20_000 }
	);

	if (commandResult.error || commandResult.status !== 0) return [];

	const candidates = parseSearchOutput(commandResult.stdout ?? '').slice(0, searchLimit);
	const subsResults = await Promise.all(candidates.map((c) => checkSpanishSubs(c.youtubeId)));
	return candidates.filter((_, i) => subsResults[i]);
}
