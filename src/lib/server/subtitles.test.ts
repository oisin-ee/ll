import { describe, it, expect } from 'vitest';
import { parseSrt } from './subtitles';

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
