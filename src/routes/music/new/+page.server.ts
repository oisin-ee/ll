import { db } from '$lib/server/db';
import { songs, songLines } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { parseLrc, extractYoutubeId } from '$lib/lrc';
import { fetchYoutubeMetadata, fetchLrc } from '$lib/server/music';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

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
