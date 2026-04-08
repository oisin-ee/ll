import { db } from '$lib/server/db';
import { episodes, words, concepts, episodeConcepts, episodeSummaries, userEpisodes } from '$lib/server/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { lookupCard, createCard } from '$lib/server/lingq';
import type { PageServerLoad, Actions } from './$types';

interface TranscriptWord {
	display: string;
	clean: string;
}

interface TranscriptTurn {
	speaker: 'T' | 'S' | null;
	words: TranscriptWord[];
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.user!.id;
	const num = parseInt(params.number);
	if (isNaN(num) || num < 1 || num > 90) throw error(404, 'Episode not found');

	const episode = db.select().from(episodes).where(eq(episodes.number, num)).get();
	if (!episode) throw error(404, 'Episode not found');

	const userEpisode = db
		.select()
		.from(userEpisodes)
		.where(and(eq(userEpisodes.userId, userId), eq(userEpisodes.episodeId, episode.id)))
		.get();

	const episodeWords = db
		.select()
		.from(words)
		.where(and(eq(words.userId, userId), eq(words.episodeId, episode.id)))
		.all();

	const linkedConcepts = db
		.select({
			id: concepts.id,
			slug: concepts.slug,
			name: concepts.name,
			category: concepts.category,
			role: episodeConcepts.role,
			summary: episodeConcepts.summary,
			rule: episodeConcepts.rule,
			examples: episodeConcepts.examples,
			notes: episodeConcepts.notes,
			sortOrder: episodeConcepts.sortOrder
		})
		.from(episodeConcepts)
		.innerJoin(concepts, eq(episodeConcepts.conceptId, concepts.id))
		.where(eq(episodeConcepts.episodeId, episode.id))
		.orderBy(asc(episodeConcepts.sortOrder))
		.all()
		.map((c) => ({
			...c,
			examples: c.examples ? JSON.parse(c.examples) as Array<{ spanish: string; english: string }> : []
		}));

	const epSummary = db
		.select()
		.from(episodeSummaries)
		.where(eq(episodeSummaries.episodeId, episode.id))
		.get();

	const vocabulary = epSummary?.vocabularyJson
		? JSON.parse(epSummary.vocabularyJson) as Array<{ spanish: string; english: string; derivation: string | null }>
		: [];

	const savedWords = new Set(episodeWords.map((w) => w.spanish.toLowerCase()));

	let transcript: TranscriptTurn[] = [];
	const padded = String(num).padStart(2, '0');
	try {
		const res = await fetch(`https://raw.githubusercontent.com/oisincoveney/ll-episodes/main/${padded}/transcript.json`);
		if (res.ok) {
			transcript = await res.json();
		}
	} catch {
		// transcript stays empty
	}

	const prevEpisode = num > 1
		? db.select({ number: episodes.number, title: episodes.title }).from(episodes).where(eq(episodes.number, num - 1)).get()
		: null;
	const nextEpisode = num < 90
		? db.select({ number: episodes.number, title: episodes.title }).from(episodes).where(eq(episodes.number, num + 1)).get()
		: null;

	return {
		episode: {
			...episode,
			listened: userEpisode?.listened ?? false,
			listenedAt: userEpisode?.listenedAt ?? null,
			playbackPosition: userEpisode?.playbackPosition ?? 0
		},
		words: episodeWords,
		concepts: linkedConcepts,
		episodeSummary: epSummary?.summary ?? null,
		vocabulary,
		savedWords: [...savedWords],
		transcript,
		prevEpisode: prevEpisode ?? null,
		nextEpisode: nextEpisode ?? null
	};
};

export const actions: Actions = {
	toggleListened: async ({ request, locals }) => {
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
	},

	addWord: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();
		const term = String(formData.get('term') ?? '').trim();
		const episodeNumber = Number(formData.get('episodeNumber'));

		if (!term) return fail(400, { addError: 'Word is required' });

		const episode = db.select().from(episodes).where(eq(episodes.number, episodeNumber)).get();
		if (!episode) return fail(404, { addError: 'Episode not found' });

		const existing = db
			.select()
			.from(words)
			.where(and(eq(words.userId, userId), eq(words.episodeId, episode.id)))
			.all()
			.find((w) => w.spanish.toLowerCase() === term.toLowerCase());

		if (existing) {
			return { added: false, word: existing };
		}

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
				userId,
				spanish: card.term,
				english,
				example: null,
				episodeId: episode.id,
				lingqId: card.pk,
				lingqStatus: card.status,
				createdAt: new Date().toISOString()
			})
			.returning()
			.get();

		return { added: true, word: result };
	},

	deleteWord: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		// Ensure ownership
		db.delete(words)
			.where(and(eq(words.id, id), eq(words.userId, userId)))
			.run();
	}
};
