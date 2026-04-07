import { error, redirect } from '@sveltejs/kit';

const GITHUB_RELEASE_BASE =
	'https://github.com/oisincoveney/ll-audio/releases/download/v1';

export async function GET({ params }) {
	const num = parseInt(params.number);
	if (isNaN(num) || num < 1 || num > 90) throw error(404, 'Episode not found');

	const padded = String(num).padStart(2, '0');
	const url = `${GITHUB_RELEASE_BASE}/${padded}.mp3`;

	throw redirect(302, url);
}
