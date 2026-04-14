import { describe, it, expect } from 'vitest';
import { parseVtt } from './subtitles';

const SAMPLE_VTT = `WEBVTT
Kind: captions
Language: es

00:00:00.433 --> 00:00:10.477
♪   ♪

00:00:27.726 --> 00:00:29.129
♪ AAAAY ♪

00:00:41.207 --> 00:00:45.678
♪ SI... SABES QUE YA LLEVO
UN RATO MIRÁNDOTE ♪

00:01:00.827 --> 00:01:02.000
TENGO QUE BAILAR CONTIGO HOY
`;

describe('parseVtt', () => {
	it('parses single-line cues with correct millisecond timing', () => {
		const lines = parseVtt(SAMPLE_VTT);
		const aaaay = lines.find((l) => l.text.includes('AAAAY'));
		expect(aaaay?.startMs).toBe(27_726);
	});

	it('joins multi-line cues into one text with a space', () => {
		const lines = parseVtt(SAMPLE_VTT);
		const multiLine = lines.find((l) => l.text.includes('SABES QUE YA LLEVO'));
		expect(multiLine?.text).toBe('♪ SI... SABES QUE YA LLEVO UN RATO MIRÁNDOTE ♪');
	});

	it('converts HH:MM:SS.mmm timestamps to milliseconds correctly', () => {
		const lines = parseVtt(SAMPLE_VTT);
		const bailar = lines.find((l) => l.text.includes('BAILAR'));
		// 00:01:00.827 = 60 * 1000 + 827 = 60827
		expect(bailar?.startMs).toBe(60_827);
	});

	it('skips WEBVTT header and metadata blocks (no timestamp line)', () => {
		const lines = parseVtt(SAMPLE_VTT);
		expect(lines.every((l) => l.text !== 'WEBVTT')).toBe(true);
		expect(lines.every((l) => !l.text.startsWith('Kind:'))).toBe(true);
	});

	it('returns lines sorted by startMs', () => {
		const lines = parseVtt(SAMPLE_VTT);
		for (let i = 1; i < lines.length; i++) {
			expect(lines[i].startMs).toBeGreaterThanOrEqual(lines[i - 1].startMs);
		}
	});

	it('returns empty array for empty input', () => {
		expect(parseVtt('')).toEqual([]);
	});

	it('includes cues with only music symbols (♪)', () => {
		const lines = parseVtt(SAMPLE_VTT);
		const musicOnly = lines.find((l) => l.text === '♪   ♪');
		expect(musicOnly).toBeDefined();
	});
});
