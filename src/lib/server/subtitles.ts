import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, unlinkSync } from 'node:fs';
import { logger } from '../../logger';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { z } from 'zod';
import { env } from '$env/dynamic/private';
import { parseSync } from 'subtitle';
import striptags from 'striptags';

export type SubtitleLine = {
	startMs: number;
	text: string;
};

export type SubtitleFailureReason =
	| 'bad-id'
	| 'no-subs'
	| 'yt-dlp-error'
	| 'parse-error'
	| 'no-lyrics'
	| 'no-synced-lyrics'
	| 'lrclib-error';

export type SubtitleResult =
	| { ok: true; lines: SubtitleLine[]; lang: string | null }
	| { ok: false; reason: SubtitleFailureReason; detail?: string };

const SUBTITLE_FAILURE_MESSAGES: Record<SubtitleFailureReason, string> = {
	'bad-id': 'Invalid YouTube ID for this video',
	'no-subs': 'This video has no Spanish subtitles on YouTube',
	'yt-dlp-error': 'Could not fetch subtitles (yt-dlp error). Check server logs.',
	'parse-error': 'Subtitles were downloaded but could not be parsed',
	'no-lyrics': 'No lyrics found for this track on LRCLIB',
	'no-synced-lyrics': 'LRCLIB has plain lyrics but no synced (timed) version for this track',
	'lrclib-error': 'Could not reach LRCLIB. Check server logs.'
};

export function subtitleFailureMessage(reason: SubtitleFailureReason): string {
	return SUBTITLE_FAILURE_MESSAGES[reason];
}

const deeplResponseSchema = z.object({
	translations: z.array(z.object({ text: z.string() }))
});

function normalizeText(raw: string): string {
	return striptags(raw)
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

export function parseSrt(srt: string): SubtitleLine[] {
	const raw = parseSync(srt)
		.filter((node): node is Extract<typeof node, { type: 'cue' }> => node.type === 'cue')
		.map((node) => ({ startMs: node.data.start, text: normalizeText(node.data.text) }))
		.filter((line) => line.text.length > 0)
		.sort((a, b) => a.startMs - b.startMs);

	// YouTube auto-generated SRT has pairs of cues ~10ms apart:
	// - A shorter "base" cue at T (text already visible on screen)
	// - A longer "karaoke" cue at T+10ms (same base + upcoming words with inline timing)
	// After tag stripping, both are plain text and the base is a prefix of the karaoke.
	// Drop the base cue and keep the fuller karaoke cue to avoid duplicate lyric lines.
	return raw.filter((line, i) => {
		if (i >= raw.length - 1) return true;
		const next = raw[i + 1];
		return !(next.startMs - line.startMs <= 100 && next.text.startsWith(line.text));
	});
}

function findSubtitleFile(stem: string): { path: string; lang: string } | null {
	const dir = tmpdir();
	const prefix = basename(stem) + '.';
	const file = readdirSync(dir).find(
		(f) => f.startsWith(prefix) && (f.endsWith('.srt') || f.endsWith('.vtt'))
	);
	if (!file) return null;
	// Filename is "<stem>.<lang>.<ext>" — yt-dlp appends whichever lang tag matched.
	const lang = file.slice(prefix.length).replace(/\.(srt|vtt)$/, '');
	return { path: join(dir, file), lang };
}

function tailBytes(buf: Buffer | string | null | undefined, n: number): string {
	if (!buf) return '';
	const s = typeof buf === 'string' ? buf : buf.toString('utf-8');
	return s.length > n ? s.slice(-n) : s;
}

export function fetchSubtitles(youtubeId: string): SubtitleResult {
	if (!/^[A-Za-z0-9_-]{1,20}$/.test(youtubeId)) {
		return { ok: false, reason: 'bad-id' };
	}

	const stem = join(tmpdir(), `ll-subs-${youtubeId}`);

	// Clean up any stale files from a previous run for this video
	const stale = findSubtitleFile(stem);
	if (stale) {
		try { unlinkSync(stale.path); } catch { /* ignore */ }
	}

	const result = spawnSync(
		'yt-dlp',
		[
			'--write-subs',         // manually-uploaded tracks
			'--write-auto-subs',    // auto-generated tracks (additive)
			// yt-dlp accepts regex; matches es, es-419, es-orig, es-ES, es-MX, es-AR, es-US, etc.
			'--sub-langs', 'es.*',
			// Prefer SRT; let ffmpeg convert VTT when SRT isn't natively available.
			'--sub-format', 'srt/vtt/best',
			// Production containers pin node as the JS runtime; deno may not be present.
			'--js-runtimes', 'node',
			// Without -i, yt-dlp aborts the whole call when ANY single matching
			// sub-track fails (e.g. one regional variant returns HTTP 429). With
			// -i it skips that track and continues; we then check whether at
			// least one file was written via findSubtitleFile() below.
			'-i',
			'--skip-download',
			'--no-warnings',
			'-o', stem,
			`https://www.youtube.com/watch?v=${youtubeId}`
		],
		{ timeout: 60_000, encoding: 'buffer' }
	);

	if (result.error) {
		logger.warn({ youtubeId, err: result.error.message }, 'yt-dlp spawn failed');
		return { ok: false, reason: 'yt-dlp-error', detail: result.error.message };
	}
	if (result.status !== 0) {
		const detail = tailBytes(result.stderr, 500);
		logger.warn({ youtubeId, status: result.status, stderr: detail }, 'yt-dlp non-zero exit');
		return { ok: false, reason: 'yt-dlp-error', detail };
	}

	const outFile = findSubtitleFile(stem);
	if (!outFile) {
		// Exit 0 with no file: yt-dlp found the video but no matching Spanish caption track.
		const detail = tailBytes(result.stderr, 500);
		logger.info({ youtubeId, stderr: detail }, 'yt-dlp found no Spanish subtitles');
		return { ok: false, reason: 'no-subs', detail: detail || undefined };
	}

	try {
		const content = readFileSync(outFile.path, 'utf-8');
		try { unlinkSync(outFile.path); } catch { /* ignore */ }
		const lines = parseSrt(content);
		if (lines.length === 0) {
			return { ok: false, reason: 'parse-error', detail: 'Subtitle file parsed to zero cues' };
		}
		return { ok: true, lines, lang: outFile.lang };
	} catch (err) {
		const detail = err instanceof Error ? err.message : String(err);
		logger.warn({ youtubeId, err: detail }, 'subtitle parse failed');
		return { ok: false, reason: 'parse-error', detail };
	}
}

export async function translateLines(lines: string[]): Promise<(string | null)[]> {
	if (!env.DEEPL_API_KEY || lines.length === 0) return lines.map(() => null);
	try {
		const res = await fetch('https://api-free.deepl.com/v2/translate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `DeepL-Auth-Key ${env.DEEPL_API_KEY}`
			},
			body: JSON.stringify({ text: lines, source_lang: 'ES', target_lang: 'EN' })
		});
		if (!res.ok) return lines.map(() => null);
		const parsed = deeplResponseSchema.safeParse(await res.json());
		if (!parsed.success) return lines.map(() => null);
		return parsed.data.translations.map((t) => t.text);
	} catch {
		return lines.map(() => null);
	}
}
