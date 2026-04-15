import { json } from '@sveltejs/kit';
import { checkSpanishSubs } from '../../../lib/server/youtube-search.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id') ?? '';
	const hasSpanishSubs = await checkSpanishSubs(id);
	return json({ hasSpanishSubs });
};
