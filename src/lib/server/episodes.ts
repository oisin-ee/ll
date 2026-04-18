// Language Transfer lessons are a fixed catalog. There's no reason to store
// them in the DB — the number is the natural key and the title is derivable.
// Transcript content is fetched at request time from oisincoveney/ll-episodes.

export const EPISODE_COUNT = 90;

export function episodeTitle(episodeNumber: number): string {
	return `Lesson ${String(episodeNumber).padStart(2, '0')}`;
}

export function isValidEpisodeNumber(n: number): boolean {
	return Number.isInteger(n) && n >= 1 && n <= EPISODE_COUNT;
}

export function allEpisodes(): { number: number; title: string }[] {
	return Array.from({ length: EPISODE_COUNT }, (_, i) => {
		const number = i + 1;
		return { number, title: episodeTitle(number) };
	});
}
