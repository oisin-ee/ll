import { db } from '$lib/server/db';
import { episodes, words, userEpisodes } from '$lib/server/db/schema';
import { eq, count, and } from 'drizzle-orm';
import { fetchConceptsIndex } from '$lib/server/episode-data';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const allEpisodes = db
		.select({
			id: episodes.id,
			number: episodes.number,
			title: episodes.title
		})
		.from(episodes)
		.orderBy(episodes.number)
		.all();

	const userEpisodeRows = db
		.select()
		.from(userEpisodes)
		.where(eq(userEpisodes.userId, userId))
		.all();

	const listenedMap = new Map(
		userEpisodeRows.map((ue) => [ue.episodeId, { listened: ue.listened, listenedAt: ue.listenedAt }])
	);

	const wordCounts = db
		.select({ episodeId: words.episodeId, wordCount: count() })
		.from(words)
		.where(eq(words.userId, userId))
		.groupBy(words.episodeId)
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

	const wordMap = new Map(wordCounts.map((w) => [w.episodeId, w.wordCount]));

	const listenedCount = allEpisodes.filter((ep) => listenedMap.get(ep.id)?.listened).length;

	return {
		totalEpisodes: allEpisodes.length,
		listenedCount,
		episodes: allEpisodes.map((ep) => ({
			...ep,
			listened: listenedMap.get(ep.id)?.listened ?? false,
			listenedAt: listenedMap.get(ep.id)?.listenedAt ?? null,
			wordCount: wordMap.get(ep.id) ?? 0,
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

		const episode = db.select().from(episodes).where(eq(episodes.number, num)).get();
		if (!episode) return;

		const existing = db
			.select()
			.from(userEpisodes)
			.where(and(eq(userEpisodes.userId, userId), eq(userEpisodes.episodeId, episode.id)))
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
					episodeId: episode.id,
					listened,
					listenedAt: listened ? new Date().toISOString() : null,
					playbackPosition: 0
				})
				.run();
		}
	}
};
