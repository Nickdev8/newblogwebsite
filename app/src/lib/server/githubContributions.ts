import { env } from '$env/dynamic/private';

export type ContributionDay = {
	date: string;
	color: string;
	count: number;
};

export type ContributionWeek = {
	contributionDays: ContributionDay[];
};

export type ContributionCalendar = {
	weeks: ContributionWeek[];
	totalContributions: number;
};

const owner = env.GITHUB_OWNER || env.VITE_GITHUB_OWNER;
const token = env.GITHUB_TOKEN || env.VITE_GITHUB_TOKEN;
const endpoint = 'https://api.github.com/graphql';
const fallbackEndpoint = 'https://github-contributions-api.jogruber.de/v4';

const levelColors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

const buildHeaders = () => {
	if (!token) return null;
	return {
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json'
	};
};

const normalizeCalendar = (calendar: any): ContributionCalendar | null => {
	if (!calendar || !Array.isArray(calendar.weeks)) return null;
	return {
		weeks: calendar.weeks.map((week: any) => ({
			contributionDays: Array.isArray(week.contributionDays)
				? week.contributionDays.map((day: any) => ({
					date: day.date,
					color: day.color || '#ebedf0',
					count: day.contributionCount ?? 0
				}))
				: []
		})),
		totalContributions: calendar.totalContributions ?? 0
	};
};

const formatISO = (value?: string | null) => {
	if (!value) return undefined;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString();
};

const buildWeeksFromDays = (days: ContributionDay[]): ContributionWeek[] => {
	const weeks: ContributionWeek[] = [];
	for (let i = 0; i < days.length; i += 7) {
		weeks.push({ contributionDays: days.slice(i, i + 7) });
	}
	return weeks;
};

const fallbackCache = new Map<string, { data: ContributionCalendar; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

const fetchFallbackCalendar = async ({ from, to }: { from?: string; to?: string }): Promise<ContributionCalendar | null> => {
	if (!owner || !from || !to) return null;
	const cacheKey = `fallback_${from}_${to}`;
	const cached = fallbackCache.get(cacheKey);
	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		return cached.data;
	}
	const start = new Date(from);
	const end = new Date(to);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

	const startYear = start.getFullYear();
	const endYear = end.getFullYear();
	const requests = [];
	for (let year = startYear; year <= endYear; year++) {
		requests.push(fetch(`${fallbackEndpoint}/${owner}?y=${year}`));
	}

	const contributions: ContributionDay[] = [];
	const responses = await Promise.all(requests);
	for (const response of responses) {
		if (!response.ok) continue;
		const json = await response.json();
		const days = Array.isArray(json.contributions) ? json.contributions : [];
		for (const day of days) {
			const dayDate = new Date(day.date);
			if (dayDate < start || dayDate > end) continue;
			const count = Number(day.count) || 0;
			const level = Math.min(Number(day.level) || 0, levelColors.length - 1);
			contributions.push({
				date: day.date,
				count,
				color: levelColors[level]
			});
		}
	}

	if (!contributions.length) return null;
	const total = contributions.reduce((sum, day) => sum + day.count, 0);
	const calendar = {
		weeks: buildWeeksFromDays(contributions),
		totalContributions: total
	};
	fallbackCache.set(cacheKey, { data: calendar, timestamp: Date.now() });
	return calendar;
};

const graphCache = new Map<string, { data: ContributionCalendar; timestamp: number }>();

const fetchGraphCalendar = async ({ from, to }: { from?: string; to?: string }): Promise<ContributionCalendar | null> => {
	if (!owner || !token) return null;
	const headers = buildHeaders();
	if (!headers) return null;
	const cacheKey = `graph_${from}_${to}`;
	const cached = graphCache.get(cacheKey);
	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		return cached.data;
	}

	const query = `
		query($login: String!, $from: DateTime, $to: DateTime) {
			user(login: $login) {
				contributionsCollection(from: $from, to: $to) {
					contributionCalendar {
						weeks {
							contributionDays {
								date
								color
								contributionCount
							}
						}
						totalContributions
					}
				}
			}
		}
	`;

	const body = JSON.stringify({
		query,
		variables: {
			login: owner,
			from: formatISO(from),
			to: formatISO(to)
		}
	});

	const response = await fetch(endpoint, { method: 'POST', headers, body });
	if (!response.ok) {
		console.error('Failed to fetch contribution calendar', response.status, await response.text());
		return null;
	}
	const json = await response.json();
	const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar;
	const normalized = normalizeCalendar(calendar);
	if (normalized) {
		graphCache.set(cacheKey, { data: normalized, timestamp: Date.now() });
	}
	return normalized;
};

export async function fetchContributionCalendar(range: { from?: string; to?: string }): Promise<ContributionCalendar | null> {
	const graph = await fetchGraphCalendar(range);
	if (graph) return graph;
	return fetchFallbackCalendar(range);
}
