export type ExerciseItem = {
	type: 'translate' | 'multiple-choice';
	spanish: string;
	english: string;
	conceptName: string;
	rule?: string;
	options?: string[];
};

export type ExampleInput = {
	spanish: string;
	english: string;
	conceptName: string;
	rule?: string;
};

function shuffle<T>(arr: T[]): T[] {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

export function generateExercises(
	examples: ExampleInput[],
	opts: { count?: number } = {}
): ExerciseItem[] {
	if (examples.length === 0) return [];

	const count = opts.count ?? examples.length;
	const shuffled = shuffle(examples).slice(0, count);
	const canDoMC = examples.length >= 4;

	return shuffled.map((ex, i) => {
		const doMC = canDoMC && i % 2 === 0;

		if (doMC) {
			const distractors = shuffle(
				examples.filter((d) => d.english !== ex.english)
			)
				.slice(0, 3)
				.map((d) => d.english);

			const options = shuffle([ex.english, ...distractors]);

			return {
				type: 'multiple-choice',
				spanish: ex.spanish,
				english: ex.english,
				conceptName: ex.conceptName,
				rule: ex.rule,
				options
			};
		}

		return {
			type: 'translate',
			spanish: ex.spanish,
			english: ex.english,
			conceptName: ex.conceptName,
			rule: ex.rule
		};
	});
}
