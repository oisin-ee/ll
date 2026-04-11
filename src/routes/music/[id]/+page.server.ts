import { db } from '$lib/server/db';
import { songs, songLines, words } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { lookupCard, createCard } from '$lib/server/lingq';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Not authenticated');

	const id = parseInt(params.id);
	if (isNaN(id)) throw error(404, 'Song not found');

	const song = db.select().from(songs).where(eq(songs.id, id)).get();
	if (!song) throw error(404, 'Song not found');

	const lines = db
		.select()
		.from(songLines)
		.where(eq(songLines.songId, id))
		.all()
		.sort((a, b) => a.startMs - b.startMs);

	const songWords = db
		.select()
		.from(words)
		.where(and(eq(words.userId, user.id), eq(words.songId, id)))
		.all();

	const trackedWords = songWords.map((w) => w.spanish.toLowerCase());

	return { song, lines, songWords, trackedWords };
};

export const actions: Actions = {
	addWord: async ({ params, request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { addError: 'Not authenticated' });

		const songId = parseInt(params.id);
		if (isNaN(songId)) return fail(400, { addError: 'Invalid song' });

		const formData = await request.formData();
		const term = String(formData.get('term') ?? '').trim();
		if (!term) return fail(400, { addError: 'Word is required' });

		const song = db.select().from(songs).where(eq(songs.id, songId)).get();
		if (!song) return fail(404, { addError: 'Song not found' });

		const existing = db
			.select()
			.from(words)
			.where(and(eq(words.userId, user.id), eq(words.songId, songId)))
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
				songId,
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
	}
};
