import { db } from '$lib/server/db';
import { videos } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { extractYoutubeId } from '$lib/lrc';
import { fetchVideoMetadata, saveVideoLines } from '$lib/server/videos';
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

		let metadata: { title: string; channel: string };
		try {
			metadata = await fetchVideoMetadata(youtubeId);
		} catch {
			return fail(400, { error: 'Could not fetch video info from YouTube', youtubeInput });
		}

		const video = db
			.insert(videos)
			.values({
				title: metadata.title,
				channel: metadata.channel,
				youtubeId,
				teacherNotes: teacherNotes || null,
				createdAt: new Date().toISOString()
			})
			.returning()
			.get();

		const hasSubs = await saveVideoLines(video.id, youtubeId);
		if (!hasSubs) {
			db.delete(videos).where(eq(videos.id, video.id)).run();
			return fail(400, {
				error: 'No Spanish subtitles found for this video. Try a different video.',
				youtubeInput
			});
		}

		redirect(303, `/videos/${video.id}`);
	}
};
