import { json } from '@sveltejs/kit';
import { fetchLiveStats } from '$lib/server/liveStats';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch }) => {
	const stats = await fetchLiveStats(fetch);

	return json(stats, {
		headers: {
			'cache-control': 'no-store'
		}
	});
};
