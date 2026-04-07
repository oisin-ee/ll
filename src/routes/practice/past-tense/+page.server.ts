import { buildExercisePool, type TenseFilter } from '$lib/past-tense-exercises';

export function load({ url }) {
	const tenseFilter = (url.searchParams.get('tense') as TenseFilter) || 'all';
	const pool = buildExercisePool(tenseFilter);

	return {
		pool,
		tenseFilter
	};
}
