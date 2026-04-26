import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLrcLyrics, checkLrcLyrics } from './lrclib';

const SYNCED_LYRICS = '[00:15.04]Tu equipo volvió a ganar\n[00:22.16]Te prendieron mil bengalas hoy\n[00:57.03]Arde la ciudad';

const TRACK = {
	id: 1,
	trackName: 'Arde la ciudad',
	artistName: 'Mancha de Rolando',
	albumName: 'Single',
	duration: 180,
	instrumental: false,
	plainLyrics: 'Tu equipo volvió a ganar\nTe prendieron mil bengalas hoy\nArde la ciudad',
	syncedLyrics: SYNCED_LYRICS
};

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
	vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

describe('fetchLrcLyrics', () => {
	it('returns parsed synced lyrics from /get', async () => {
		const fetchMock = vi.mocked(globalThis.fetch);
		fetchMock.mockResolvedValueOnce(jsonResponse(TRACK));

		const result = await fetchLrcLyrics('Mancha de Rolando', 'Arde la ciudad');

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.lines).toHaveLength(3);
		expect(result.lines[0]).toEqual({ startMs: 15_040, text: 'Tu equipo volvió a ganar' });
		expect(result.lines[2].text).toBe('Arde la ciudad');
	});

	it('falls back to /search on 404 and uses top result', async () => {
		const fetchMock = vi.mocked(globalThis.fetch);
		fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }));
		fetchMock.mockResolvedValueOnce(jsonResponse([TRACK]));

		const result = await fetchLrcLyrics('Manch de Rolando', 'Ardela ciudad');

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.lines).toHaveLength(3);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('returns no-lyrics when /get 404s and /search has no results', async () => {
		const fetchMock = vi.mocked(globalThis.fetch);
		fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }));
		fetchMock.mockResolvedValueOnce(jsonResponse([]));

		const result = await fetchLrcLyrics('Nobody', 'Nothing');

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe('no-lyrics');
	});

	it('returns no-synced-lyrics when track exists but has only plain lyrics', async () => {
		const fetchMock = vi.mocked(globalThis.fetch);
		fetchMock.mockResolvedValueOnce(jsonResponse({ ...TRACK, syncedLyrics: null }));

		const result = await fetchLrcLyrics('Mancha de Rolando', 'Arde la ciudad');

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe('no-synced-lyrics');
	});

	it('returns lrclib-error on network failure', async () => {
		const fetchMock = vi.mocked(globalThis.fetch);
		fetchMock.mockRejectedValueOnce(new Error('connection refused'));

		const result = await fetchLrcLyrics('Mancha de Rolando', 'Arde la ciudad');

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe('lrclib-error');
		expect(result.detail).toContain('connection refused');
	});

	it('returns no-lyrics when artist or title is empty without hitting the network', async () => {
		const fetchMock = vi.mocked(globalThis.fetch);

		const result = await fetchLrcLyrics('', 'Something');

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe('no-lyrics');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('returns no-synced-lyrics when LRC parses to zero cues', async () => {
		const fetchMock = vi.mocked(globalThis.fetch);
		fetchMock.mockResolvedValueOnce(jsonResponse({ ...TRACK, syncedLyrics: 'no timestamps here' }));

		const result = await fetchLrcLyrics('Mancha de Rolando', 'Arde la ciudad');

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe('no-synced-lyrics');
	});
});

describe('checkLrcLyrics', () => {
	it('returns true when synced lyrics exist', async () => {
		const fetchMock = vi.mocked(globalThis.fetch);
		fetchMock.mockResolvedValueOnce(jsonResponse(TRACK));

		expect(await checkLrcLyrics('Mancha de Rolando', 'Arde la ciudad')).toBe(true);
	});

	it('returns false when only plain lyrics exist', async () => {
		const fetchMock = vi.mocked(globalThis.fetch);
		fetchMock.mockResolvedValueOnce(jsonResponse({ ...TRACK, syncedLyrics: null }));

		expect(await checkLrcLyrics('Mancha de Rolando', 'Arde la ciudad')).toBe(false);
	});

	it('returns false on network error', async () => {
		const fetchMock = vi.mocked(globalThis.fetch);
		fetchMock.mockRejectedValueOnce(new Error('boom'));

		expect(await checkLrcLyrics('Anyone', 'Anything')).toBe(false);
	});

	it('returns false for empty inputs without hitting the network', async () => {
		const fetchMock = vi.mocked(globalThis.fetch);

		expect(await checkLrcLyrics('', '')).toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
