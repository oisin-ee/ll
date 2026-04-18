import { db } from '$lib/server/db';
import { words, episodes } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const allWords = db
		.select({
			id: words.id,
			spanish: words.spanish,
			english: words.english,
			example: words.example,
			episodeNumber: episodes.number,
			episodeTitle: episodes.title,
			lingqStatus: words.lingqStatus
		})
		.from(words)
		.innerJoin(episodes, eq(words.episodeId, episodes.id))
		.where(eq(words.userId, userId))
		.orderBy(episodes.number)
		.all();

	return { words: allWords };
};
