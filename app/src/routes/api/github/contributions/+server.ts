import { json } from '@sveltejs/kit';
import { fetchContributionCalendar } from '$lib/server/githubContributions';

export const GET = async ({ url }) => {
	const now = new Date();
	const defaultFrom = new Date(now);
	defaultFrom.setFullYear(defaultFrom.getFullYear() - 2);

	const from = url.searchParams.get('from') || defaultFrom.toISOString();
	const to = url.searchParams.get('to') || now.toISOString();

	try {
		const contributions = await fetchContributionCalendar({ from, to });
		return json({ contributions });
	} catch (err) {
		console.error('Failed to fetch contribution calendar via API:', err);
		return json({ error: 'Unable to fetch contributions right now.' }, { status: 502 });
	}
};
