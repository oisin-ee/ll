import { db } from '../../../lib/server/db';
import { media } from '../../../lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { extractYoutubeId } from '../../../lib/lrc';
import {
	fetchMediaMetadata,
	saveMediaLines,
	chooseSource,
	probeSources
} from '../../../lib/server/media';
import { searchYoutubeCandidates } from '../../../lib/server/youtube-search';
import { subtitleFailureMessage, type SubtitleFailureReason } from '../../../lib/server/subtitles';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const youtubeInput = String(formData.get('youtubeUrl') ?? '').trim();
		const teacherNotes = String(formData.get('teacherNotes') ?? '').trim();
		const selectedYoutubeId = String(formData.get('selectedYoutubeId') ?? '').trim();
		const intent = String(formData.get('intent') ?? '').trim();

		const youtubeId = extractYoutubeId(youtubeInput) ?? extractYoutubeId(selectedYoutubeId);
		if (!youtubeId) {
			const candidates = await searchYoutubeCandidates(youtubeInput);
			if (candidates.length === 0) {
				return fail(400, {
					error: 'No matching YouTube videos found. Try a more specific query.',
					youtubeInput,
					teacherNotes
				});
			}
			return fail(400, {
				error: intent === 'useSelected' ? 'Select a video to continue.' : undefined,
				youtubeInput,
				teacherNotes,
				candidates,
				selectedYoutubeId
			});
		}

		let metadata: { title: string; artist: string };
		try {
			metadata = await fetchMediaMetadata(youtubeId);
		} catch {
			return fail(400, { error: 'Could not fetch video info from YouTube', youtubeInput, teacherNotes });
		}

		const sources = await probeSources(youtubeId, metadata.artist, metadata.title);
		const chosenSource = chooseSource('video', sources);

		const video = db
			.insert(media)
			.values({
				kind: 'video',
				title: metadata.title,
				artist: metadata.artist,
				youtubeId,
				lrcText: null,
				teacherNotes: teacherNotes || null,
				source: chosenSource,
				createdAt: new Date().toISOString()
			})
			.returning()
			.get();

		const result = await saveMediaLines(video.id, youtubeId, chosenSource, metadata.artist, metadata.title);
		if (!result.ok) {
			db.delete(media).where(eq(media.id, video.id)).run();
			const reason: SubtitleFailureReason = result.reason;
			return fail(400, {
				error: subtitleFailureMessage(reason),
				youtubeInput,
				teacherNotes
			});
		}

		redirect(303, `/videos/${video.id}`);
	}
};
