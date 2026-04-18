import { db } from '$lib/server/db';
import { words } from '$lib/server/db/schema';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const body = await request.json();
	if (!body.spanish?.trim() || !body.english?.trim() || !body.episodeId) {
		throw error(400, 'spanish, english, and episodeId are required');
	}

	const result = db
		.insert(words)
		.values({
			userId,
			spanish: body.spanish.trim(),
			english: body.english.trim(),
			example: body.example?.trim() || null,
			episodeId: body.episodeId,
			createdAt: new Date().toISOString()
		})
		.returning()
		.get();

	return json(result, { status: 201 });
};
