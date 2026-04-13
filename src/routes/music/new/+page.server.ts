import { db } from '$lib/server/db';
import { songs, songLines } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { parseLrc, extractYoutubeId } from '$lib/lrc';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

async function fetchYoutubeMetadata(youtubeId: string): Promise<{ title: string; artist: string }> {
	const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
	const res = await fetch(url);
	if (!res.ok) throw new Error('Could not fetch YouTube metadata');
	const data = await res.json() as { title: string; author_name: string };

	// Many music videos use "Artist - Song Title" format in the title
	const dashIndex = data.title.indexOf(' - ');
	if (dashIndex !== -1) {
		return {
			artist: data.title.slice(0, dashIndex).trim(),
			title: data.title.slice(dashIndex + 3).trim()
		};
	}

	return { title: data.title, artist: data.author_name };
}

async function fetchLrc(title: string, artist: string): Promise<string | null> {
	// Strip common suffixes like "(Official Video)", "(Lyrics)", etc.
	const cleanTitle = title.replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '').trim();
	const params = new URLSearchParams({ track_name: cleanTitle, artist_name: artist });
	const res = await fetch(`https://lrclib.net/api/get?${params}`);
	if (!res.ok) return null;
	const data = await res.json() as { syncedLyrics?: string };
	return data.syncedLyrics ?? null;
}

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const youtubeInput = String(formData.get('youtubeUrl') ?? '').trim();
		const teacherNotes = String(formData.get('teacherNotes') ?? '').trim();

		const youtubeId = extractYoutubeId(youtubeInput);
		if (!youtubeId) return fail(400, { error: 'Invalid YouTube URL or ID', youtubeInput });

		let title: string;
		let artist: string;
		try {
			({ title, artist } = await fetchYoutubeMetadata(youtubeId));
		} catch {
			return fail(400, { error: 'Could not fetch video info from YouTube', youtubeInput });
		}

		const lrcText = await fetchLrc(title, artist);

		const song = db
			.insert(songs)
			.values({
				title,
				artist,
				youtubeId,
				lrcText: lrcText ?? null,
				teacherNotes: teacherNotes || null,
				createdAt: new Date().toISOString()
			})
			.returning()
			.get();

		if (lrcText) {
			const parsed = parseLrc(lrcText);
			if (parsed.length > 0) {
				db.insert(songLines)
					.values(
						parsed.map((line, i) => ({
							songId: song.id,
							lineNumber: i,
							startMs: line.startMs,
							spanish: line.text,
							english: null
						}))
					)
					.run();
			}
		}

		redirect(303, `/music/${song.id}`);
	}
};
