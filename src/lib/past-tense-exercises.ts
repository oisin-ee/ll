import { verbos } from 'verbos';

export type TenseKey = 'preterito' | 'imperfecto' | 'presentePerfecto';
export type PersonKey = 'yo' | 'tu' | 'ud' | 'nosotros' | 'vosotros' | 'uds';

export type PastTenseExercise = {
	english: string;
	displayAnswer: string;
	acceptedAnswers: string[];
	verbInfinitive: string;
	verbEnglish: string;
	tenseKey: TenseKey;
	personKey: PersonKey;
};

export type TenseFilter = 'all' | TenseKey;

const TENSE_LABELS: Record<TenseKey, string> = {
	preterito: 'I did it',
	imperfecto: 'I used to / was doing',
	presentePerfecto: 'I have done'
};

export function getTenseLabel(key: TenseKey): string {
	return TENSE_LABELS[key];
}

const PERSON_SUBJECTS: Record<PersonKey, string[]> = {
	yo: ['I'],
	tu: ['you'],
	ud: ['he', 'she'],
	nosotros: ['we'],
	vosotros: ['you all'],
	uds: ['they']
};

const PERSON_PRONOUNS: Record<PersonKey, string[]> = {
	yo: ['yo'],
	tu: ['tú'],
	ud: ['él', 'ella', 'usted'],
	nosotros: ['nosotros', 'nosotras'],
	vosotros: ['vosotros', 'vosotras'],
	uds: ['ellos', 'ellas', 'ustedes']
};

function cleanEnglish(englishFirstPerson: string): string {
	// The verbos data has comma-separated alternatives like "I was speaking, used to speak, spoke"
	// Take just the first (most natural/distinctive) form
	return englishFirstPerson.split(',')[0].trim();
}

function convertEnglishToPerson(englishFirstPerson: string, person: PersonKey): string[] {
	const cleaned = cleanEnglish(englishFirstPerson);
	const subjects = PERSON_SUBJECTS[person];
	const results: string[] = [];

	for (const subject of subjects) {
		let converted = cleaned;

		// Handle "I have ..." → "he has ...", "she has ...", etc.
		if (person === 'ud') {
			converted = converted.replace(/^I have\b/, `${subject} has`);
		} else {
			converted = converted.replace(/^I have\b/, `${subject} have`);
		}

		// Handle "I was ..." → "he/she was ...", "we were ...", etc.
		if (person === 'yo' || person === 'ud') {
			// "I was" / "he was" / "she was" — keep "was"
			converted = converted.replace(/^I\b/, subject);
		} else {
			// "we were", "they were", "you were"
			converted = converted.replace(/^I was\b/, `${subject} were`);
			converted = converted.replace(/^I\b/, subject);
		}

		// Capitalize first letter
		converted = converted.charAt(0).toUpperCase() + converted.slice(1);

		results.push(converted);
	}

	return results;
}

function buildAcceptedAnswers(conjugatedForm: string, person: PersonKey): string[] {
	const answers: string[] = [];
	const pronouns = PERSON_PRONOUNS[person];

	// Without pronoun
	answers.push(conjugatedForm);

	// With each possible pronoun
	for (const pronoun of pronouns) {
		answers.push(`${pronoun} ${conjugatedForm}`);
	}

	return answers;
}

export function normalizeAnswer(input: string): string {
	return input
		.trim()
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

export function checkAnswer(
	input: string,
	accepted: string[]
): { correct: boolean; accentWarning: boolean } {
	const normalizedInput = normalizeAnswer(input);
	const exactMatch = accepted.some(
		(a) => a.toLowerCase() === input.trim().toLowerCase()
	);
	const looseMatch = accepted.some(
		(a) => normalizeAnswer(a) === normalizedInput
	);
	return {
		correct: looseMatch,
		accentWarning: looseMatch && !exactMatch
	};
}

function shuffle<T>(arr: T[]): T[] {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

const TENSES: TenseKey[] = ['preterito', 'imperfecto', 'presentePerfecto'];
const PERSONS: PersonKey[] = ['yo', 'tu', 'ud', 'nosotros', 'vosotros', 'uds'];

export function buildExercisePool(tenseFilter: TenseFilter = 'all'): PastTenseExercise[] {
	const allVerbs = verbos();
	const pool: PastTenseExercise[] = [];
	const tenses = tenseFilter === 'all' ? TENSES : [tenseFilter];

	for (const verb of allVerbs) {
		const verbEnglish = verb.english.infinitivo;

		for (const tense of tenses) {
			const conjugations = verb.indicativo[tense];
			const englishFirstPerson = verb.english.indicativo[tense];

			if (!conjugations || !englishFirstPerson) continue;

			for (const person of PERSONS) {
				const spanishForm = conjugations[person];
				if (!spanishForm) continue;

				const englishVariants = convertEnglishToPerson(englishFirstPerson, person);
				const acceptedAnswers = buildAcceptedAnswers(spanishForm, person);

				pool.push({
					english: englishVariants[0],
					displayAnswer: spanishForm,
					acceptedAnswers,
					verbInfinitive: verb.infinitivo,
					verbEnglish,
					tenseKey: tense,
					personKey: person
				});
			}
		}
	}

	return pool;
}

export function generateExercises(
	pool: PastTenseExercise[],
	opts: { count?: number } = {}
): PastTenseExercise[] {
	if (pool.length === 0) return [];
	const count = opts.count ?? pool.length;
	return shuffle(pool).slice(0, count);
}
