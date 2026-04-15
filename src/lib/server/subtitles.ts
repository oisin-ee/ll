import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
	return parseSync(srt)
		.filter((node): node is Extract<typeof node, { type: 'cue' }> => node.type === 'cue')
		.map((node) => ({ startMs: node.data.start, text: striptags(node.data.text).trim() }))
		.filter((line) => line.text.length > 0)
		.sort((a, b) => a.startMs - b.startMs);
}

export function fetchSubtitles(youtubeId: string): SubtitleLine[] | null {
	if (!/^[A-Za-z0-9_-]{1,20}$/.test(youtubeId)) return null;

	const stem = join(tmpdir(), `ll-subs-${youtubeId}`);
	const outFile = `${stem}.es.srt`;

	if (existsSync(outFile)) {
		try {
			unlinkSync(outFile);
		} catch {
			// ignore stale file cleanup failure
		}
	}

	spawnSync(
		'yt-dlp',
		[
			'--write-auto-sub',
			'--sub-lang', 'es',
			'--sub-format', 'srt',
			'--skip-download',
			'-o', stem,
			`https://www.youtube.com/watch?v=${youtubeId}`
		],
		{ timeout: 60_000 }
	);

	if (!existsSync(outFile)) return null;

	try {
		const srt = readFileSync(outFile, 'utf-8');
		unlinkSync(outFile);
		return parseSrt(srt);
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
