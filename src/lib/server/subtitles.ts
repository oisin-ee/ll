import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, unlinkSync } from 'node:fs';
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

const deeplResponseSchema = z.object({
	translations: z.array(z.object({ text: z.string() }))
});

export function parseSrt(srt: string): SubtitleLine[] {
	const raw = parseSync(srt)
		.filter((node): node is Extract<typeof node, { type: 'cue' }> => node.type === 'cue')
		.map((node) => ({ startMs: node.data.start, text: striptags(node.data.text).trim() }))
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

function findSubtitleFile(stem: string): string | null {
	const dir = tmpdir();
	const prefix = basename(stem) + '.';
	const file = readdirSync(dir).find(
		(f) => f.startsWith(prefix) && (f.endsWith('.srt') || f.endsWith('.vtt'))
	);
	return file ? join(dir, file) : null;
}

export function fetchSubtitles(youtubeId: string): SubtitleLine[] | null {
	if (!/^[A-Za-z0-9_-]{1,20}$/.test(youtubeId)) return null;

	const stem = join(tmpdir(), `ll-subs-${youtubeId}`);

	// Clean up any stale files from a previous run for this video
	const stale = findSubtitleFile(stem);
	if (stale) {
		try { unlinkSync(stale); } catch { /* ignore */ }
	}

	spawnSync(
		'yt-dlp',
		[
			'--write-auto-sub',
			// es-419 (Latin American Spanish) is the auto-generated language code for
			// many Spanish-language videos; es is the code for Spain/generic Spanish.
			'--sub-langs', 'es,es-419',
			'--skip-download',
			'-o', stem,
			`https://www.youtube.com/watch?v=${youtubeId}`
		],
		{ timeout: 60_000 }
	);

	const outFile = findSubtitleFile(stem);
	if (!outFile) return null;

	try {
		const content = readFileSync(outFile, 'utf-8');
		unlinkSync(outFile);
		return parseSrt(content);
	} catch {
		return null;
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
