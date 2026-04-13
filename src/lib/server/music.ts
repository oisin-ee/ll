import { z } from 'zod';
import getArtistTitle from 'get-artist-title';
import { db } from '$lib/server/db';
import { songLines } from '$lib/server/db/schema';
import { parseLrc } from '$lib/lrc';
import { eq } from 'drizzle-orm';

const oEmbedSchema = z.object({
	title: z.string(),
	author_name: z.string()
});

const lrcSearchSchema = z.array(z.object({
	syncedLyrics: z.string().nullable().optional()
}));

export async function fetchYoutubeMetadata(youtubeId: string): Promise<{ title: string; artist: string }> {
	const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
	const res = await fetch(url);
	if (!res.ok) throw new Error('Could not fetch YouTube metadata');
	const data = oEmbedSchema.parse(await res.json());

	const parsed = getArtistTitle(data.title, { defaultArtist: data.author_name });
	if (!parsed) throw new Error(`Could not parse artist/title from: ${data.title}`);
	const [artist, title] = parsed;
	return { artist, title };
}

export async function fetchLrc(title: string, artist: string): Promise<string | null> {
	const params = new URLSearchParams({ track_name: title, artist_name: artist });
	const res = await fetch(`https://lrclib.net/api/search?${params}`);
	if (!res.ok) return null;
	const results = lrcSearchSchema.parse(await res.json());
	return results.find((r) => r.syncedLyrics)?.syncedLyrics ?? null;
}

export function saveSongLines(songId: number, lrcText: string): void {
	const parsed = parseLrc(lrcText);
	if (parsed.length === 0) return;
	db.delete(songLines).where(eq(songLines.songId, songId)).run();
	db.insert(songLines)
		.values(parsed.map((line, i) => ({
			songId,
			lineNumber: i,
			startMs: line.startMs,
			spanish: line.text,
			english: null
		})))
		.run();
}
