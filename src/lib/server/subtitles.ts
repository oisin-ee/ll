import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { env } from '$env/dynamic/private';

export type SubtitleLine = {
	startMs: number;
	text: string;
};

const VTT_TIMESTAMP_RE = /^(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s+-->/;

const deeplResponseSchema = z.object({
	translations: z.array(z.object({ text: z.string() }))
});

export function parseVtt(vtt: string): SubtitleLine[] {
	const results: SubtitleLine[] = [];
	const blocks = vtt.split(/\n[ \t]*\n/);

	for (const block of blocks) {
		const lines = block.trim().split('\n');
		const tsIdx = lines.findIndex((l) => VTT_TIMESTAMP_RE.test(l));
		if (tsIdx === -1) continue;

		const match = VTT_TIMESTAMP_RE.exec(lines[tsIdx]);
		if (!match) continue;

		const [, hh, mm, ss, ms] = match;
		const startMs =
			parseInt(hh) * 3_600_000 +
			parseInt(mm) * 60_000 +
			parseInt(ss) * 1_000 +
			parseInt(ms);

		const text = lines
			.slice(tsIdx + 1)
			.join(' ')
			.trim();

		if (text) {
			results.push({ startMs, text });
		}
	}

	return results.sort((a, b) => a.startMs - b.startMs);
}

export function fetchSubtitles(youtubeId: string): SubtitleLine[] | null {
	if (!/^[A-Za-z0-9_-]{1,20}$/.test(youtubeId)) return null;

	const stem = join(tmpdir(), `ll-subs-${youtubeId}`);
	const outFile = `${stem}.es.vtt`;

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
			'--sub-format', 'vtt',
			'--skip-download',
			'-o', stem,
			`https://www.youtube.com/watch?v=${youtubeId}`
		],
		{ timeout: 60_000 }
	);

	if (!existsSync(outFile)) return null;

	try {
		const vtt = readFileSync(outFile, 'utf-8');
		unlinkSync(outFile);
		return parseVtt(vtt);
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
