import { db } from '$lib/server/db';
import { episodeSummaries, userEpisodes, flashcardReviews } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

interface VocabItem {
	spanish: string;
	english: string;
	derivation: string | null;
}

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const now = new Date();

	const listenedEpisodeNumbers = db
		.select({ episodeNumber: userEpisodes.episodeNumber })
		.from(userEpisodes)
		.where(and(eq(userEpisodes.userId, userId), eq(userEpisodes.listened, true)))
		.all()
		.map((r) => r.episodeNumber);

	if (listenedEpisodeNumbers.length === 0) {
		return { cards: [], stats: { total: 0, due: 0, newCards: 0 } };
	}

	const summaries = db
		.select({
			episodeNumber: episodeSummaries.episodeNumber,
			vocabularyJson: episodeSummaries.vocabularyJson
		})
		.from(episodeSummaries)
		.all()
		.filter((s) => listenedEpisodeNumbers.includes(s.episodeNumber));

	const reviews = db
		.select()
		.from(flashcardReviews)
		.where(eq(flashcardReviews.userId, userId))
		.all();

	const reviewMap = new Map(
		reviews.map((r) => [`${r.episodeNumber}:${r.spanish}`, r])
	);

	type FlashCard = {
		episodeNumber: number;
		spanish: string;
		english: string;
		derivation: string | null;
		isNew: boolean;
	};

	const dueCards: FlashCard[] = [];
	let totalCards = 0;
	let newCount = 0;

	for (const summary of summaries) {
		if (!summary.vocabularyJson) continue;
		const vocab = JSON.parse(summary.vocabularyJson) as VocabItem[];

		for (const item of vocab) {
			totalCards++;
			const key = `${summary.episodeNumber}:${item.spanish}`;
			const review = reviewMap.get(key);

			if (!review) {
				newCount++;
				dueCards.push({
					episodeNumber: summary.episodeNumber,
					spanish: item.spanish,
					english: item.english,
					derivation: item.derivation,
					isNew: true
				});
			} else {
				const cardState = JSON.parse(review.cardState);
				const due = new Date(cardState.due);
				if (due <= now) {
					dueCards.push({
						episodeNumber: summary.episodeNumber,
						spanish: item.spanish,
						english: item.english,
						derivation: item.derivation,
						isNew: false
					});
				}
			}
		}
	}

	// Shuffle due cards
	for (let i = dueCards.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[dueCards[i], dueCards[j]] = [dueCards[j], dueCards[i]];
	}

	return {
		cards: dueCards,
		stats: {
			total: totalCards,
			due: dueCards.length,
			newCards: newCount
		}
	};
};
