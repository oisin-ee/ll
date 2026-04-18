import { db } from '$lib/server/db';
import { flashcardReviews } from '$lib/server/db/schema';
import { json, error } from '@sveltejs/kit';
import { fsrs, createEmptyCard, Rating, type Card } from 'ts-fsrs';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

const f = fsrs();

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const body = await request.json();
	const { episodeNumber, spanish, rating } = body;

	if (typeof episodeNumber !== 'number' || !spanish || !rating) {
		throw error(400, 'episodeNumber, spanish, and rating are required');
	}

	const ratingValue = Rating[rating as keyof typeof Rating];
	if (ratingValue === undefined || ratingValue === Rating.Manual) {
		throw error(400, 'rating must be Again, Hard, Good, or Easy');
	}

	const existing = db
		.select()
		.from(flashcardReviews)
		.where(
			and(
				eq(flashcardReviews.userId, userId),
				eq(flashcardReviews.episodeNumber, episodeNumber),
				eq(flashcardReviews.spanish, spanish)
			)
		)
		.get();

	const now = new Date();
	let card: Card;

	if (existing) {
		card = JSON.parse(existing.cardState) as Card;
		card.due = new Date(card.due);
		if (card.last_review) card.last_review = new Date(card.last_review);
	} else {
		card = createEmptyCard(now);
	}

	const result = f.repeat(card, now);
	const updated = result[ratingValue as Exclude<typeof ratingValue, typeof Rating.Manual>];

	if (existing) {
		db.update(flashcardReviews)
			.set({ cardState: JSON.stringify(updated.card) })
			.where(eq(flashcardReviews.id, existing.id))
			.run();
	} else {
		db.insert(flashcardReviews)
			.values({
				userId,
				episodeNumber,
				spanish,
				cardState: JSON.stringify(updated.card),
				createdAt: now.toISOString()
			})
			.run();
	}

	return json({ card: updated.card, log: updated.log });
};
