import { db } from '$lib/server/db';
import { concepts, episodeConcepts, episodes } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { ExampleInput } from '$lib/exercises';

export async function load({ params }) {
	const categorySlug = params.category;

	const allConcepts = db.select().from(concepts).orderBy(concepts.name).all();
	const categoryConcepts = allConcepts.filter(
		(c) => (c.category || 'Uncategorized').toLowerCase().replace(/\s+/g, '-') === categorySlug
	);

	if (categoryConcepts.length === 0) throw error(404, 'Category not found');

	const categoryName = categoryConcepts[0].category || 'Uncategorized';
	const conceptIds = categoryConcepts.map((c) => c.id);
	const conceptNameMap = new Map(categoryConcepts.map((c) => [c.id, c.name]));

	const links = db
		.select({
			conceptId: episodeConcepts.conceptId,
			rule: episodeConcepts.rule,
			examples: episodeConcepts.examples
		})
		.from(episodeConcepts)
		.innerJoin(episodes, eq(episodeConcepts.episodeId, episodes.id))
		.orderBy(asc(episodes.number))
		.all()
		.filter((l) => conceptIds.includes(l.conceptId));

	const pool: ExampleInput[] = [];
	for (const link of links) {
		if (!link.examples) continue;
		const parsed = JSON.parse(link.examples) as Array<{ spanish: string; english: string }>;
		const conceptName = conceptNameMap.get(link.conceptId) ?? 'Unknown';
		for (const ex of parsed) {
			if (ex.spanish && ex.english) {
				pool.push({
					spanish: ex.spanish,
					english: ex.english,
					conceptName,
					rule: link.rule ?? undefined
				});
			}
		}
	}

	return {
		categoryName,
		categorySlug,
		pool
	};
}
