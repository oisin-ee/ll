import { db } from '../../../lib/server/db';
import { media, mediaLines, words } from '../../../lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { lookupCard, createCard } from '../../../lib/server/lingq';
import { fetchMediaMetadata, saveMediaLines, probeSources } from '../../../lib/server/media';
import { subtitleFailureMessage } from '../../../lib/server/subtitles';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Not authenticated');

	const id = parseInt(params.id);
	if (isNaN(id)) throw error(404, 'Video not found');

	const video = db
		.select()
		.from(media)
		.where(and(eq(media.id, id), eq(media.kind, 'video')))
		.get();
	if (!video) throw error(404, 'Video not found');

	const lines = db
		.select()
		.from(mediaLines)
		.where(eq(mediaLines.mediaId, id))
		.all()
		.sort((a, b) => a.startMs - b.startMs);

	const videoWords = db
		.select()
		.from(words)
		.where(and(eq(words.userId, user.id), eq(words.mediaId, id)))
		.all();

	const trackedWords = videoWords.map((w) => w.spanish.toLowerCase());

	const sources = await probeSources(video.youtubeId, video.artist, video.title);

	return { media: video, lines, words: videoWords, trackedWords, sources, breadcrumbLabel: video.title };
};

export const actions: Actions = {
	addWord: async ({ params, request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { addError: 'Not authenticated' });

		const mediaId = parseInt(params.id);
		if (isNaN(mediaId)) return fail(400, { addError: 'Invalid video' });

		const formData = await request.formData();
		const term = String(formData.get('term') ?? '').trim();
		if (!term) return fail(400, { addError: 'Word is required' });

		const video = db.select().from(media).where(eq(media.id, mediaId)).get();
		if (!video) return fail(404, { addError: 'Video not found' });

		const existing = db
			.select()
			.from(words)
			.where(and(eq(words.userId, user.id), eq(words.mediaId, mediaId)))
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
				episodeNumber: null,
				mediaId,
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

	reloadLines: async ({ params, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { reloadError: 'Not authenticated' });

		const mediaId = parseInt(params.id);
		if (isNaN(mediaId)) return fail(400, { reloadError: 'Invalid video' });

		const video = db.select().from(media).where(eq(media.id, mediaId)).get();
		if (!video) return fail(404, { reloadError: 'Video not found' });

		let metadata: { title: string; artist: string };
		try {
			metadata = await fetchMediaMetadata(video.youtubeId);
		} catch {
			return fail(400, { reloadError: 'Could not fetch video info from YouTube' });
		}

		db.update(media)
			.set({ title: metadata.title, artist: metadata.artist })
			.where(eq(media.id, mediaId))
			.run();

		const source = video.source === 'lyrics' ? 'lyrics' : 'captions';
		const result = await saveMediaLines(mediaId, video.youtubeId, source, metadata.artist, metadata.title);
		if (!result.ok) return fail(404, { reloadError: subtitleFailureMessage(result.reason) });
	},

	switchSource: async ({ params, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { reloadError: 'Not authenticated' });

		const mediaId = parseInt(params.id);
		if (isNaN(mediaId)) return fail(400, { reloadError: 'Invalid video' });

		const video = db.select().from(media).where(eq(media.id, mediaId)).get();
		if (!video) return fail(404, { reloadError: 'Video not found' });

		const newSource = video.source === 'lyrics' ? 'captions' : 'lyrics';
		const result = await saveMediaLines(mediaId, video.youtubeId, newSource, video.artist, video.title);
		if (!result.ok) return fail(400, { reloadError: subtitleFailureMessage(result.reason) });
	},

	deleteMedia: async ({ params, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { deleteError: 'Not authenticated' });

		const mediaId = parseInt(params.id);
		if (isNaN(mediaId)) return fail(400, { deleteError: 'Invalid video' });

		db.delete(media).where(eq(media.id, mediaId)).run();
		redirect(303, '/videos');
	}
};
