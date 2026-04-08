import { db } from '$lib/server/db';
import { userConcepts } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fetchConceptsIndex } from '$lib/server/episode-data';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;

	const allConcepts = await fetchConceptsIndex();

	const userConceptRows = db
		.select()
		.from(userConcepts)
		.where(eq(userConcepts.userId, userId))
		.all();

	const masteryMap = new Map(userConceptRows.map((uc) => [uc.conceptId, uc.mastery]));

	const categories = new Map<string, { total: number; mastered: number; concepts: number; slug: string; episodeLinkCount: number }>();

	for (const c of allConcepts) {
		const cat = c.category || 'Uncategorized';
		const slug = cat.toLowerCase().replace(/\s+/g, '-');
		const existing = categories.get(cat) ?? { total: 0, mastered: 0, concepts: 0, slug, episodeLinkCount: 0 };
		existing.total++;
		existing.concepts++;
		existing.episodeLinkCount += c.episodes.length;
		// mastery uses slug-based ID since concepts aren't in DB
		if ((masteryMap.get(allConcepts.indexOf(c) + 1) ?? 0) >= 3) existing.mastered++;
		categories.set(cat, existing);
	}

	return {
		categories: [...categories.entries()].map(([name, data]) => ({
			name,
			slug: data.slug,
			conceptCount: data.concepts,
			masteredCount: data.mastered,
			episodeLinkCount: data.episodeLinkCount
		})),
		totalConcepts: allConcepts.length,
		totalMastered: 0
	};
};
