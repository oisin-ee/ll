export type LrcLine = {
	startMs: number;
	text: string;
};

const LRC_LINE_RE = /^\[(\d{1,2}):(\d{2})\.(\d{2,3})\](.*)/;

export function parseLrc(lrc: string): LrcLine[] {
	const results: LrcLine[] = [];

	for (const raw of lrc.split('\n')) {
		const line = raw.trim();
		const match = LRC_LINE_RE.exec(line);
		if (!match) continue;

		const [, mm, ss, ms, text] = match;
		const startMs =
			parseInt(mm) * 60_000 +
			parseInt(ss) * 1_000 +
			parseInt(ms.length === 2 ? ms + '0' : ms);

		const trimmed = text.trim();
		if (trimmed) {
			results.push({ startMs, text: trimmed });
		}
	}

	return results.sort((a, b) => a.startMs - b.startMs);
}

export function extractYoutubeId(input: string): string | null {
	const patterns = [
		/[?&]v=([^&\n#]+)/,
		/youtu\.be\/([^?&\n#]+)/,
		/youtube\.com\/embed\/([^?&\n#]+)/,
		/youtube\.com\/shorts\/([^?&\n#]+)/,
	];
	for (const pattern of patterns) {
		const match = pattern.exec(input);
		if (match) return match[1];
	}
	// bare 11-char ID
	if (/^[A-Za-z0-9_-]{11}$/.test(input.trim())) return input.trim();
	return null;
}
