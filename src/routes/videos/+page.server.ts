import { db } from '../../lib/server/db';
import { media } from '../../lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const videos = db
		.select()
		.from(media)
		.where(eq(media.kind, 'video'))
		.orderBy(desc(media.createdAt))
		.all();
	return { videos };
};
