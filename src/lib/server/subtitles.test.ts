import { describe, it, expect } from 'vitest';
import { parseSrt, fetchSubtitles } from './subtitles';

const SAMPLE_SRT = `1
00:00:00,433 --> 00:00:10,477
♪   ♪

2
00:00:27,726 --> 00:00:29,129
♪ AAAAY ♪

3
00:00:41,207 --> 00:00:45,678
♪ SI... SABES QUE YA LLEVO
UN RATO MIRÁNDOTE ♪

4
00:01:00,827 --> 00:01:02,000
TENGO QUE BAILAR CONTIGO HOY
`;

// YouTube auto-generated SRTs embed karaoke-style timing tags within each cue
const SAMPLE_SRT_WITH_INLINE_TAGS = `1
00:00:04,799 --> 00:00:08,500
<00:00:04.799><c>caminando</c><00:00:05.620><c>caminando</c>
<00:00:05.620><c>caminando caminando caminando</c>

2
00:00:08,500 --> 00:00:12,000
<00:00:08.500><c>mi</c> <00:00:08.880><c>calle</c> <00:00:09.280><c>que</c>
`;

// Mirrors the real YouTube production format: pairs of cues ~10ms apart where
// the first is a short "base" cue and the second is the same text + upcoming words.
const SAMPLE_SRT_WITH_BASE_KARAOKE_PAIRS = `1
00:00:03,789 --> 00:00:06,749
caminando caminandote

2
00:00:03,799 --> 00:00:06,759
caminando caminandote mi<00:00:04.799><c> calle</c><00:00:05.520><c> que</c>

3
00:00:06,749 --> 00:00:09,000
mi calle que

4
00:00:06,759 --> 00:00:09,010
mi calle que quizás<00:00:07.759><c> yo</c><00:00:08.559><c> pueda</c>
`;

describe('parseSrt', () => {
	it('parses single-line cues with correct millisecond timing', () => {
		const lines = parseSrt(SAMPLE_SRT);
		const aaaay = lines.find((l) => l.text.includes('AAAAY'));
		expect(aaaay?.startMs).toBe(27_726);
	});

	it('joins multi-line cues into one text', () => {
		const lines = parseSrt(SAMPLE_SRT);
		const multiLine = lines.find((l) => l.text.includes('SABES QUE YA LLEVO'));
		expect(multiLine?.text).toContain('SABES QUE YA LLEVO');
		expect(multiLine?.text).toContain('RATO MIRÁNDOTE');
	});

	it('converts HH:MM:SS,mmm timestamps to milliseconds correctly', () => {
		const lines = parseSrt(SAMPLE_SRT);
		const bailar = lines.find((l) => l.text.includes('BAILAR'));
		// 00:01:00,827 = 60 * 1000 + 827 = 60827
		expect(bailar?.startMs).toBe(60_827);
	});

	it('returns lines sorted by startMs', () => {
		const lines = parseSrt(SAMPLE_SRT);
		for (let i = 1; i < lines.length; i++) {
			expect(lines[i].startMs).toBeGreaterThanOrEqual(lines[i - 1].startMs);
		}
	});

	it('returns empty array for empty input', () => {
		expect(parseSrt('')).toEqual([]);
	});

	it('includes cues with only music symbols (♪)', () => {
		const lines = parseSrt(SAMPLE_SRT);
		const musicOnly = lines.find((l) => l.text.includes('♪'));
		expect(musicOnly).toBeDefined();
	});
});

describe('parseSrt with YouTube inline karaoke tags', () => {
	it('strips inline timestamp tags like <00:00:04.799>', () => {
		const lines = parseSrt(SAMPLE_SRT_WITH_INLINE_TAGS);
		const hasTimestampTags = lines.some((l) => /<\d{2}:\d{2}:\d{2}\.\d{3}>/.test(l.text));
		expect(hasTimestampTags).toBe(false);
	});

	it('strips <c> and </c> karaoke class tags', () => {
		const lines = parseSrt(SAMPLE_SRT_WITH_INLINE_TAGS);
		const hasCTags = lines.some((l) => /<\/?c>/.test(l.text));
		expect(hasCTags).toBe(false);
	});

	it('preserves the actual word text after stripping tags', () => {
		const lines = parseSrt(SAMPLE_SRT_WITH_INLINE_TAGS);
		const first = lines[0];
		expect(first.text).toContain('caminando');
		expect(first.text).not.toMatch(/<[^>]+>/);
	});
});

describe('parseSrt deduplication of YouTube base/karaoke cue pairs', () => {
	it('drops the base cue when the next cue starts within 100ms and shares the same prefix', () => {
		const lines = parseSrt(SAMPLE_SRT_WITH_BASE_KARAOKE_PAIRS);
		// Should have 2 lines (the karaoke ones), not 4
		expect(lines).toHaveLength(2);
	});

	it('keeps the fuller karaoke cue and drops the shorter base cue', () => {
		const lines = parseSrt(SAMPLE_SRT_WITH_BASE_KARAOKE_PAIRS);
		expect(lines[0].text).toBe('caminando caminandote mi calle que');
		expect(lines[1].text).toBe('mi calle que quizás yo pueda');
	});

	it('uses the karaoke cue start time (T+10ms), not the base cue time', () => {
		const lines = parseSrt(SAMPLE_SRT_WITH_BASE_KARAOKE_PAIRS);
		expect(lines[0].startMs).toBe(3799);
		expect(lines[1].startMs).toBe(6759);
	});
});

describe('fetchSubtitles', () => {
	it('downloads and parses Spanish SRT from a real YouTube video with no inline tags', () => {
		// Bad Bunny - Tití Me Preguntó: native Spanish audio with auto-generated es SRT
		const lines = fetchSubtitles('YlUKcNNmywk');
		expect(lines).not.toBeNull();
		expect(lines!.length).toBeGreaterThan(0);
		const hasTags = lines!.some((l) => /<[^>]+>/.test(l.text));
		expect(hasTags).toBe(false);
		const allHaveStartMs = lines!.every((l) => typeof l.startMs === 'number' && l.startMs >= 0);
		expect(allHaveStartMs).toBe(true);
	}, 90_000);
});
