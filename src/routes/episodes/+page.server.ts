import { db } from '$lib/server/db';
import { words, userEpisodes } from '$lib/server/db/schema';
import { eq, count, and } from 'drizzle-orm';
import { fetchConceptsIndex } from '$lib/server/episode-data';
import { allEpisodes, isValidEpisodeNumber } from '../../lib/server/episodes';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const catalog = allEpisodes();

	const userEpisodeRows = db
		.select()
		.from(userEpisodes)
		.where(eq(userEpisodes.userId, userId))
		.all();

	const listenedMap = new Map(
		userEpisodeRows.map((ue) => [ue.episodeNumber, { listened: ue.listened, listenedAt: ue.listenedAt }])
	);

	const wordCounts = db
		.select({ episodeNumber: words.episodeNumber, wordCount: count() })
		.from(words)
		.where(eq(words.userId, userId))
		.groupBy(words.episodeNumber)
		.all();

	const conceptsIndex = await fetchConceptsIndex();

	// Build per-episode concept counts and names from the concepts index
	const episodeConceptMap = new Map<number, { count: number; names: string[] }>();
	for (const concept of conceptsIndex) {
		for (const ep of concept.episodes) {
			const existing = episodeConceptMap.get(ep.episode) ?? { count: 0, names: [] };
			existing.count++;
			existing.names.push(concept.name);
			episodeConceptMap.set(ep.episode, existing);
		}
	}

	const wordMap = new Map(wordCounts.map((w) => [w.episodeNumber, w.wordCount]));

	const listenedCount = catalog.filter((ep) => listenedMap.get(ep.number)?.listened).length;

	return {
		totalEpisodes: catalog.length,
		listenedCount,
		episodes: catalog.map((ep) => ({
			number: ep.number,
			title: ep.title,
			listened: listenedMap.get(ep.number)?.listened ?? false,
			listenedAt: listenedMap.get(ep.number)?.listenedAt ?? null,
			wordCount: wordMap.get(ep.number) ?? 0,
			conceptCount: episodeConceptMap.get(ep.number)?.count ?? 0,
			conceptNames: (episodeConceptMap.get(ep.number)?.names ?? []).slice(0, 3)
		}))
	};
};

export const actions: Actions = {
	toggle: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();
		const num = Number(formData.get('number'));
		const listened = formData.get('listened') === 'true';

		if (!isValidEpisodeNumber(num)) return;

		const existing = db
			.select()
			.from(userEpisodes)
			.where(and(eq(userEpisodes.userId, userId), eq(userEpisodes.episodeNumber, num)))
			.get();

		if (existing) {
			db.update(userEpisodes)
				.set({ listened, listenedAt: listened ? new Date().toISOString() : null })
				.where(eq(userEpisodes.id, existing.id))
				.run();
		} else {
			db.insert(userEpisodes)
				.values({
					userId,
					episodeNumber: num,
					listened,
					listenedAt: listened ? new Date().toISOString() : null,
					playbackPosition: 0
				})
				.run();
		}
	}
};
