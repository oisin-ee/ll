import { db } from '$lib/server/db';
import { videos } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allVideos = db.select().from(videos).orderBy(desc(videos.createdAt)).all();
	return { videos: allVideos };
};
