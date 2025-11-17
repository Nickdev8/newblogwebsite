import { json } from '@sveltejs/kit';
import { fetchCommitsBetween } from '$lib/server/github';

export const GET = async ({ url }) => {
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');
	const limitParam = Number(url.searchParams.get('limit'));
	const limit = Number.isNaN(limitParam) ? 15 : Math.min(Math.max(limitParam, 1), 50);

	if (!from || !to) {
		return json({ error: 'Missing date range' }, { status: 400 });
	}

	try {
		const commits = await fetchCommitsBetween(from, to, limit);
		return json({ commits });
	} catch (err) {
		console.error('Failed to fetch trip commits via API:', err);
		return json({ error: 'Unable to load trip commits right now.' }, { status: 502 });
	}
};
