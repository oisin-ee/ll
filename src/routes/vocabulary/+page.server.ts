import { db } from '$lib/server/db';
import { words } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { episodeTitle } from '../../lib/server/episodes';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const rawWords = db
		.select({
			id: words.id,
			spanish: words.spanish,
			english: words.english,
			example: words.example,
			episodeNumber: words.episodeNumber,
			lingqStatus: words.lingqStatus
		})
		.from(words)
		.where(eq(words.userId, userId))
		.all();

	const allWords = rawWords
		.filter((w) => w.episodeNumber !== null)
		.map((w) => ({
			...w,
			episodeNumber: w.episodeNumber as number,
			episodeTitle: episodeTitle(w.episodeNumber as number)
		}))
		.sort((a, b) => a.episodeNumber - b.episodeNumber);

	return { words: allWords };
};
