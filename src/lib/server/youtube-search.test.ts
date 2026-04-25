import { EventEmitter } from 'node:events';
import type { ChildProcessWithoutNullStreams, SpawnSyncReturns } from 'node:child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseSearchOutput, searchYoutubeCandidates } from './youtube-search';

vi.mock('node:child_process', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:child_process')>();
	return {
		...actual,
		spawn: vi.fn(),
		spawnSync: vi.fn()
	};
});

import { spawn, spawnSync } from 'node:child_process';

const mockedSpawn = vi.mocked(spawn);
const mockedSpawnSync = vi.mocked(spawnSync);

function fakeChildProcess(stdoutData: string, exitCode = 0): ChildProcessWithoutNullStreams {
	const proc = new EventEmitter();
	const stdout = new EventEmitter();
	const stderr = new EventEmitter();
	Object.assign(proc, { stdout, stderr, kill: () => true });
	queueMicrotask(() => {
		stdout.emit('data', Buffer.from(stdoutData));
		proc.emit('close', exitCode);
	});
	// Test double: only the subset of ChildProcess that checkSpanishSubs uses is faithful.
	return proc as unknown as ChildProcessWithoutNullStreams;
}

function spawnSyncResult(overrides: Partial<SpawnSyncReturns<string>>): SpawnSyncReturns<string> {
	// Test double: SpawnSyncReturns has pid/signal/output we don't use here.
	return {
		pid: 0,
		output: [],
		stdout: '',
		stderr: '',
		status: 0,
		signal: null,
		...overrides
	} as SpawnSyncReturns<string>;
}

describe('parseSearchOutput', () => {
	it('returns parsed and validated candidates from yt-dlp output', () => {
		const stdout = [
			JSON.stringify({
				id: 'dQw4w9WgXcQ',
				title: 'Never Gonna Give You Up',
				uploader: 'Rick Astley',
				duration: 213
			}),
			JSON.stringify({
				id: 'm3XkU8Q8nKs',
				title: 'Never Gonna Give You Up Live',
				uploader: 'Rick Astley',
				duration: 257
			})
		].join('\n');

		const candidates = parseSearchOutput(stdout);

		expect(candidates).toHaveLength(2);
		expect(candidates[0]).toEqual({
			youtubeId: 'dQw4w9WgXcQ',
			title: 'Never Gonna Give You Up',
			channel: 'Rick Astley',
			durationSeconds: 213
		});
	});

	it('skips malformed and invalid rows', () => {
		const stdout = [
			'not-json',
			JSON.stringify({ id: 'invalid-id', title: 'bad' }),
			JSON.stringify({
				id: 'dQw4w9WgXcQ',
				title: 'Never Gonna Give You Up',
				uploader: 'Rick Astley'
			})
		].join('\n');

		const candidates = parseSearchOutput(stdout);

		expect(candidates).toHaveLength(1);
		expect(candidates[0]?.youtubeId).toBe('dQw4w9WgXcQ');
	});

	it('deduplicates by youtube id', () => {
		const stdout = [
			JSON.stringify({ id: 'dQw4w9WgXcQ', title: 'A', uploader: 'X' }),
			JSON.stringify({ id: 'dQw4w9WgXcQ', title: 'B', uploader: 'Y' })
		].join('\n');

		expect(parseSearchOutput(stdout)).toHaveLength(1);
	});
});

describe('searchYoutubeCandidates', () => {
	beforeEach(() => {
		mockedSpawn.mockReset();
		mockedSpawnSync.mockReset();
	});

	it('returns an empty array when yt-dlp search fails', async () => {
		mockedSpawnSync.mockReturnValue(
			spawnSyncResult({ status: 1, error: new Error('failed') })
		);

		const candidates = await searchYoutubeCandidates('bad search', 5);

		expect(candidates).toEqual([]);
		expect(mockedSpawn).not.toHaveBeenCalled();
	});

	it('returns only candidates that have Spanish subtitles', async () => {
		mockedSpawnSync.mockReturnValue(
			spawnSyncResult({
				stdout: [
					JSON.stringify({ id: 'aaaaaaaaaaa', title: 'Has subs', uploader: 'Chan' }),
					JSON.stringify({ id: 'bbbbbbbbbbb', title: 'No subs', uploader: 'Chan' })
				].join('\n')
			})
		);

		mockedSpawn.mockImplementation((_cmd, args) => {
			const url = Array.isArray(args) ? String(args[args.length - 1]) : '';
			const hasSubs = url.includes('aaaaaaaaaaa');
			return fakeChildProcess(hasSubs ? 'es  Spanish  vtt\n' : 'en  English  vtt\n');
		});

		const candidates = await searchYoutubeCandidates('query', 5);

		expect(candidates).toHaveLength(1);
		expect(candidates[0]?.youtubeId).toBe('aaaaaaaaaaa');
	});

	it('returns empty when no candidates have Spanish subtitles', async () => {
		mockedSpawnSync.mockReturnValue(
			spawnSyncResult({
				stdout: JSON.stringify({ id: 'aaaaaaaaaaa', title: 'No subs', uploader: 'Chan' })
			})
		);

		mockedSpawn.mockImplementation(() => fakeChildProcess('en  English  vtt\n'));

		const candidates = await searchYoutubeCandidates('query', 5);

		expect(candidates).toEqual([]);
	});
});
