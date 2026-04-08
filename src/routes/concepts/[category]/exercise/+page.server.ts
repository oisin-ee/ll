import { error } from '@sveltejs/kit';
import { fetchConceptsIndex } from '$lib/server/episode-data';
import type { ExampleInput } from '$lib/exercises';

export async function load({ params }) {
	const categorySlug = params.category;

	const allConcepts = await fetchConceptsIndex();
	const categoryConcepts = allConcepts.filter(
		(c) => (c.category || 'Uncategorized').toLowerCase().replace(/\s+/g, '-') === categorySlug
	);

	if (categoryConcepts.length === 0) throw error(404, 'Category not found');

	const categoryName = categoryConcepts[0].category || 'Uncategorized';

	const pool: ExampleInput[] = [];
	for (const concept of categoryConcepts) {
		for (const ep of concept.episodes) {
			for (const ex of ep.examples) {
				if (ex.spanish && ex.english) {
					pool.push({
						spanish: ex.spanish,
						english: ex.english,
						conceptName: concept.name,
						rule: ep.rule ?? undefined
					});
				}
			}
		}
	}

	return {
		categoryName,
		categorySlug,
		pool
	};
}
