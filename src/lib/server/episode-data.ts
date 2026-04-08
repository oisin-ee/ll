const GITHUB_RAW_BASE =
	'https://raw.githubusercontent.com/oisincoveney/ll-episodes/main';

interface Teaching {
	conceptSlug: string;
	conceptName: string;
	category: string;
	role: string;
	summary: string | null;
	rule: string | null;
	examples: Array<{ spanish: string; english: string }>;
	notes: string | null;
}

interface VocabItem {
	spanish: string;
	english: string;
	derivation: string | null;
}

interface EpisodeData {
	episode: number;
	summary: string;
	teachings: Teaching[];
	vocabulary: VocabItem[];
}

export interface ConceptEntry {
	slug: string;
	name: string;
	category: string;
	episodes: Array<{
		episode: number;
		role: string;
		summary: string | null;
		rule: string | null;
		examples: Array<{ spanish: string; english: string }>;
		notes: string | null;
	}>;
}

export async function fetchEpisodeData(num: number): Promise<EpisodeData | null> {
	const padded = String(num).padStart(2, '0');
	try {
		const res = await fetch(`${GITHUB_RAW_BASE}/${padded}/episode.json`);
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}

export async function fetchConceptsIndex(): Promise<ConceptEntry[]> {
	try {
		const res = await fetch(`${GITHUB_RAW_BASE}/concepts.json`);
		if (!res.ok) return [];
		return await res.json();
	} catch {
		return [];
	}
}
