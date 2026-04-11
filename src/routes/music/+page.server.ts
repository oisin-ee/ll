import { db } from '$lib/server/db';
import { songs } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allSongs = db.select().from(songs).orderBy(desc(songs.createdAt)).all();
	return { songs: allSongs };
};
