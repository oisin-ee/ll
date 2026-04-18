import { db } from '$lib/server/db';
import { words, episodes } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { lookupCard, createCard } from '$lib/server/lingq';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const body = await request.json();
	const { term, sentence, episodeNumber } = body;

	if (!term?.trim() || !episodeNumber) {
		throw error(400, 'term and episodeNumber are required');
	}

	const episode = db.select().from(episodes).where(eq(episodes.number, episodeNumber)).get();
	if (!episode) throw error(404, 'Episode not found');

	const existing = db
		.select()
		.from(words)
		.where(and(eq(words.userId, userId), eq(words.episodeId, episode.id)))
		.all()
		.find((w) => w.spanish.toLowerCase() === term.trim().toLowerCase());

	if (existing) {
		return json({ word: existing, created: false });
	}

	let card = await lookupCard(term.trim());
	if (!card) {
		card = await createCard(term.trim(), sentence?.trim() || '');
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
			userId,
			spanish: card.term,
			english,
			example: sentence?.trim() || null,
			episodeId: episode.id,
			lingqId: card.pk,
			lingqStatus: card.status,
			createdAt: new Date().toISOString()
		})
		.returning()
		.get();

	return json({ word: result, created: true }, { status: 201 });
};
