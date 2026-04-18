import { db } from '$lib/server/db';
import { episodes, userEpisodes } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

async function handleUpdate({ params, request, locals }: Parameters<RequestHandler>[0]) {
	const userId = locals.user?.id;
	if (!userId) throw error(401, 'Unauthorized');

	const num = parseInt(params.number);
	if (isNaN(num)) throw error(400, 'Invalid episode number');

	const episode = db.select().from(episodes).where(eq(episodes.number, num)).get();
	if (!episode) throw error(404, 'Episode not found');

	const body = await request.json();
	const updates: Record<string, unknown> = {};

	if ('listened' in body) {
		updates.listened = Boolean(body.listened);
		updates.listenedAt = updates.listened ? new Date().toISOString() : null;
	}

	if ('playbackPosition' in body) {
		updates.playbackPosition = Math.floor(Number(body.playbackPosition));
	}

	if (Object.keys(updates).length === 0) throw error(400, 'No valid fields');

	const existing = db
		.select()
		.from(userEpisodes)
		.where(and(eq(userEpisodes.userId, userId), eq(userEpisodes.episodeId, episode.id)))
		.get();

	if (existing) {
		db.update(userEpisodes).set(updates).where(eq(userEpisodes.id, existing.id)).run();
	} else {
		db.insert(userEpisodes)
			.values({
				userId,
				episodeId: episode.id,
				listened: Boolean(updates.listened ?? false),
				listenedAt: (updates.listenedAt as string) ?? null,
				playbackPosition: Number(updates.playbackPosition ?? 0)
			})
			.run();
	}

	return json({ ok: true });
}

export const PATCH: RequestHandler = handleUpdate;
export const POST: RequestHandler = handleUpdate;
