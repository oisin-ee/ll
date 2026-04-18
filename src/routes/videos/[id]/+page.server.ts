import { db } from '$lib/server/db';
import { videos, videoLines, words } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { lookupCard, createCard } from '$lib/server/lingq';
import { fetchVideoMetadata, saveVideoLines } from '$lib/server/videos';
import { subtitleFailureMessage } from '../../../lib/server/subtitles';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Not authenticated');

	const id = parseInt(params.id);
	if (isNaN(id)) throw error(404, 'Video not found');

	const video = db.select().from(videos).where(eq(videos.id, id)).get();
	if (!video) throw error(404, 'Video not found');

	const lines = db
		.select()
		.from(videoLines)
		.where(eq(videoLines.videoId, id))
		.all()
		.sort((a, b) => a.startMs - b.startMs);

	const videoWords = db
		.select()
		.from(words)
		.where(and(eq(words.userId, user.id), eq(words.videoId, id)))
		.all();

	const trackedWords = videoWords.map((w) => w.spanish.toLowerCase());

	return { video, lines, videoWords, trackedWords, breadcrumbLabel: video.title };
};

export const actions: Actions = {
	addWord: async ({ params, request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { addError: 'Not authenticated' });

		const videoId = parseInt(params.id);
		if (isNaN(videoId)) return fail(400, { addError: 'Invalid video' });

		const formData = await request.formData();
		const term = String(formData.get('term') ?? '').trim();
		if (!term) return fail(400, { addError: 'Word is required' });

		const video = db.select().from(videos).where(eq(videos.id, videoId)).get();
		if (!video) return fail(404, { addError: 'Video not found' });

		const existing = db
			.select()
			.from(words)
			.where(and(eq(words.userId, user.id), eq(words.videoId, videoId)))
			.all()
			.find((w) => w.spanish.toLowerCase() === term.toLowerCase());

		if (existing) return { added: false, word: existing };

		let card = await lookupCard(term);
		if (!card) {
			card = await createCard(term, '');
		}

		const english =
			card.hints
				.filter((h) => h.locale === 'en')
				.sort((a, b) => b.popularity - a.popularity)
				.map((h) => h.text)
				.join(', ') || '';

		const result = db
			.insert(words)
			.values({
				userId: user.id,
				spanish: card.term,
				english,
				example: null,
				episodeId: null,
				songId: null,
				videoId,
				lingqId: card.pk,
				lingqStatus: card.status,
				createdAt: new Date().toISOString()
			})
			.returning()
			.get();

		return { added: true, word: result };
	},

	deleteWord: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { addError: 'Not authenticated' });

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		db.delete(words)
			.where(and(eq(words.id, id), eq(words.userId, user.id)))
			.run();
	},

	reloadSubtitles: async ({ params, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { reloadError: 'Not authenticated' });

		const videoId = parseInt(params.id);
		if (isNaN(videoId)) return fail(400, { reloadError: 'Invalid video' });

		const video = db.select().from(videos).where(eq(videos.id, videoId)).get();
		if (!video) return fail(404, { reloadError: 'Video not found' });

		let metadata: { title: string; channel: string };
		try {
			metadata = await fetchVideoMetadata(video.youtubeId);
		} catch {
			return fail(400, { reloadError: 'Could not fetch video info from YouTube' });
		}

		db.update(videos).set({ title: metadata.title, channel: metadata.channel }).where(eq(videos.id, videoId)).run();

		const result = await saveVideoLines(videoId, video.youtubeId);
		if (!result.ok) return fail(404, { reloadError: subtitleFailureMessage(result.reason) });
	}
};
