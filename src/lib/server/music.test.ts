import { describe, it, expect } from 'vitest';
import { fetchYoutubeMetadata, fetchLrc } from './music';

describe('fetchYoutubeMetadata', () => {
	it('extracts artist and title from a music video with label channel', async () => {
		// "Mancha de Rolando - Arde la ciudad (video oficial) HD", channel "PopArt Discos"
		const result = await fetchYoutubeMetadata('-8vxXsfbxj4');
		expect(result.artist).toBe('Mancha de Rolando');
		expect(result.title).toBe('Arde la ciudad');
	});
});

describe('fetchLrc', () => {
	it('finds synced lyrics for Arde la ciudad', async () => {
		const lrc = await fetchLrc('Arde la ciudad', 'Mancha de Rolando');
		expect(lrc).not.toBeNull();
		expect(lrc).toContain('[');
	});

	it('returns null for a nonexistent track', async () => {
		const lrc = await fetchLrc('zzz_nonexistent_track_xyz', 'zzz_nonexistent_artist_xyz');
		expect(lrc).toBeNull();
	});
});
