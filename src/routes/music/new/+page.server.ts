import { db } from '$lib/server/db';
import { songs } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { extractYoutubeId } from '$lib/lrc';
import { fetchYoutubeMetadata, fetchLrc, saveSongLines } from '$lib/server/music';
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

		let metadata: { title: string; artist: string };
		try {
			metadata = await fetchYoutubeMetadata(youtubeId);
		} catch {
			return fail(400, { error: 'Could not fetch video info from YouTube', youtubeInput });
		}

		const lrcText = await fetchLrc(metadata.title, metadata.artist);

		const song = db
			.insert(songs)
			.values({
				title: metadata.title,
				artist: metadata.artist,
				youtubeId,
				lrcText: lrcText ?? null,
				teacherNotes: teacherNotes || null,
				createdAt: new Date().toISOString()
			})
			.returning()
			.get();

		if (lrcText) saveSongLines(song.id, lrcText);

		redirect(303, `/music/${song.id}`);
	}
};
