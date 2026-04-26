import { db } from '../../lib/server/db';
import { media } from '../../lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const songs = db
		.select()
		.from(media)
		.where(eq(media.kind, 'song'))
		.orderBy(desc(media.createdAt))
		.all();
	return { songs };
};
