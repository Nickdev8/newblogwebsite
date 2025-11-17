import { json } from '@sveltejs/kit';
import { fetchRecentCommits } from '$lib/server/github';

export const GET = async ({ url }) => {
	const limitParam = Number(url.searchParams.get('limit'));
	const limit = Number.isNaN(limitParam) ? 5 : Math.min(Math.max(limitParam, 1), 20);

	try {
		const commits = await fetchRecentCommits(limit);
		return json({ commits });
	} catch (err) {
		console.error('Failed to fetch recent commits via API:', err);
		return json({ error: 'Unable to fetch commits right now.' }, { status: 502 });
	}
};
