import { db } from '$lib/server/db';
import { words, lingqSyncLog, userEpisodes } from '$lib/server/db/schema';
import { count, eq, desc, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { fetchAllCards } from '$lib/server/lingq';
import { fetchConceptsIndex } from '$lib/server/episode-data';
import { allEpisodes, episodeTitle } from '../lib/server/episodes';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const [{ listenedCount }] = db
		.select({ listenedCount: count() })
		.from(userEpisodes)
		.where(and(eq(userEpisodes.userId, userId), eq(userEpisodes.listened, true)))
		.all();

	const [{ wordCount }] = db
		.select({ wordCount: count() })
		.from(words)
		.where(eq(words.userId, userId))
		.all();

	const conceptsIndex = await fetchConceptsIndex();
	const conceptCount = conceptsIndex.length;

	const recentEpisodeRows = db
		.select({
			episodeNumber: userEpisodes.episodeNumber,
			listenedAt: userEpisodes.listenedAt
		})
		.from(userEpisodes)
		.where(and(eq(userEpisodes.userId, userId), eq(userEpisodes.listened, true)))
		.orderBy(desc(userEpisodes.listenedAt))
		.limit(5)
		.all();

	const recentEpisodes = recentEpisodeRows.map((r) => ({
		number: r.episodeNumber,
		title: episodeTitle(r.episodeNumber),
		listenedAt: r.listenedAt
	}));

	const listenedNumbers = db
		.select({ episodeNumber: userEpisodes.episodeNumber })
		.from(userEpisodes)
		.where(and(eq(userEpisodes.userId, userId), eq(userEpisodes.listened, true)))
		.all()
		.map((r) => r.episodeNumber);

	const catalog = allEpisodes();
	const nextEpisode = catalog.find((ep) => !listenedNumbers.includes(ep.number)) ?? null;

	return {
		totalEpisodes: catalog.length,
		listenedCount,
		wordCount,
		conceptCount,
		recentEpisodes,
		nextEpisode
	};
};

export const actions: Actions = {
	sync: async ({ locals }) => {
		const userId = locals.user!.id;
		try {
			const cards = await fetchAllCards();
			const localWords = db.select().from(words).where(eq(words.userId, userId)).all();

			let matched = 0;
			for (const word of localWords) {
				const card = cards.find(
					(c) => c.term.toLowerCase() === word.spanish.toLowerCase()
				);
				if (card) {
					db.update(words)
						.set({ lingqId: card.pk, lingqStatus: card.status })
						.where(eq(words.id, word.id))
						.run();
					matched++;
				}
			}

			db.insert(lingqSyncLog)
				.values({
					userId,
					syncedAt: new Date().toISOString(),
					cardsProcessed: cards.length,
					cardsMatched: matched,
					status: 'success'
				})
				.run();

			return { synced: true, cardsProcessed: cards.length, cardsMatched: matched };
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : 'Unknown error';
			db.insert(lingqSyncLog)
				.values({
					userId,
					syncedAt: new Date().toISOString(),
					cardsProcessed: 0,
					cardsMatched: 0,
					status: 'error',
					error: errorMsg
				})
				.run();

			return fail(500, { error: errorMsg });
		}
	}
};
