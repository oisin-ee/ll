import { db } from '$lib/server/db';
import { userConcepts } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { fetchConceptsIndex } from '$lib/server/episode-data';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = locals.user!.id;
	const categorySlug = params.category;

	const allConcepts = await fetchConceptsIndex();
	const categoryConcepts = allConcepts.filter(
		(c) => (c.category || 'Uncategorized').toLowerCase().replace(/\s+/g, '-') === categorySlug
	);

	if (categoryConcepts.length === 0) throw error(404, 'Category not found');

	const categoryName = categoryConcepts[0].category || 'Uncategorized';

	const userConceptRows = db
		.select()
		.from(userConcepts)
		.where(eq(userConcepts.userId, userId))
		.all();

	const masteryMap = new Map(userConceptRows.map((uc) => [uc.conceptId, uc.mastery]));

	const allCategories = [...new Set(allConcepts.map((c) => c.category || 'Uncategorized'))].sort();
	const currentIndex = allCategories.indexOf(categoryName);
	const prevCategory = currentIndex > 0 ? allCategories[currentIndex - 1] : null;
	const nextCategory = currentIndex < allCategories.length - 1 ? allCategories[currentIndex + 1] : null;

	function toSlug(name: string) {
		return name.toLowerCase().replace(/\s+/g, '-');
	}

	return {
		categoryName,
		categorySlug,
		concepts: categoryConcepts.map((c, i) => ({
			id: allConcepts.indexOf(c) + 1,
			slug: c.slug,
			name: c.name,
			description: null,
			category: c.category,
			mastery: masteryMap.get(allConcepts.indexOf(c) + 1) ?? 0,
			episodes: c.episodes.map((ep) => ({
				conceptId: allConcepts.indexOf(c) + 1,
				episodeNumber: ep.episode,
				episodeTitle: `Lesson ${String(ep.episode).padStart(2, '0')}`,
				role: ep.role,
				summary: ep.summary,
				rule: ep.rule,
				examples: ep.examples,
				notes: ep.notes
			}))
		})),
		prevCategory: prevCategory ? { name: prevCategory, slug: toSlug(prevCategory) } : null,
		nextCategory: nextCategory ? { name: nextCategory, slug: toSlug(nextCategory) } : null
	};
};

export const actions: Actions = {
	updateMastery: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();
		const conceptId = Number(formData.get('id'));
		const mastery = Number(formData.get('mastery'));

		const existing = db
			.select()
			.from(userConcepts)
			.where(and(eq(userConcepts.userId, userId), eq(userConcepts.conceptId, conceptId)))
			.get();

		if (existing) {
			db.update(userConcepts).set({ mastery }).where(eq(userConcepts.id, existing.id)).run();
		} else {
			db.insert(userConcepts).values({ userId, conceptId, mastery }).run();
		}
	}
};
