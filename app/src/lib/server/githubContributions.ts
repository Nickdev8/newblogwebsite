import fs from 'fs/promises';
import path from 'path';
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

const endpoint = 'https://api.github.com/graphql';
const fallbackEndpoint = 'https://github-contributions-api.jogruber.de/v4';
const CONTRIBUTIONS_CACHE_FILE =
	process.env.CONTRIBUTIONS_CACHE_FILE || path.resolve('data/github-contributions-cache.json');
const REQUEST_TIMEOUT_MS = 3000;

const levelColors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

const getOwner = () => env.GITHUB_OWNER || env.VITE_GITHUB_OWNER;
const getToken = () => env.GITHUB_TOKEN || env.VITE_GITHUB_TOKEN;

const buildHeaders = () => {
	const token = getToken();
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
const CACHE_DURATION = 1000 * 60 * 30;
const STALE_CACHE_DURATION = 1000 * 60 * 60 * 24;

type CacheEntry = { data: ContributionCalendar; timestamp: number };
type ContributionCacheFile = Record<string, CacheEntry>;

const readFileCache = async (): Promise<ContributionCacheFile> => {
	try {
		return JSON.parse(await fs.readFile(CONTRIBUTIONS_CACHE_FILE, 'utf8'));
	} catch {
		return {};
	}
};

const writeFileCacheEntry = async (cacheKey: string, entry: CacheEntry) => {
	try {
		const existing = await readFileCache();
		existing[cacheKey] = entry;
		await fs.mkdir(path.dirname(CONTRIBUTIONS_CACHE_FILE), { recursive: true });
		const tmp = `${CONTRIBUTIONS_CACHE_FILE}.tmp`;
		await fs.writeFile(tmp, JSON.stringify(existing), 'utf8');
		await fs.rename(tmp, CONTRIBUTIONS_CACHE_FILE);
	} catch (error) {
		console.error('Failed to persist contribution cache', error);
	}
};

const readStaleCacheEntry = async (cacheKey: string): Promise<ContributionCalendar | null> => {
	const entry = (await readFileCache())[cacheKey];
	if (!entry) return null;
	if (Date.now() - entry.timestamp > STALE_CACHE_DURATION) return null;
	return entry.data;
};

const storeCacheEntry = async (
	cache: Map<string, CacheEntry>,
	cacheKey: string,
	data: ContributionCalendar
) => {
	const entry = { data, timestamp: Date.now() };
	cache.set(cacheKey, entry);
	await writeFileCacheEntry(cacheKey, entry);
};

const fetchWithTimeout = async (input: string, init?: RequestInit) => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		return await fetch(input, {
			...init,
			signal: controller.signal
		});
	} finally {
		clearTimeout(timeout);
	}
};

const fetchFallbackCalendar = async ({ from, to }: { from?: string; to?: string }): Promise<ContributionCalendar | null> => {
	const owner = getOwner();
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
		requests.push(fetchWithTimeout(`${fallbackEndpoint}/${owner}?y=${year}`));
	}

	const contributions: ContributionDay[] = [];
	const responses = await Promise.allSettled(requests);
	for (const result of responses) {
		if (result.status !== 'fulfilled') {
			continue;
		}
		const response = result.value;
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
	await storeCacheEntry(fallbackCache, cacheKey, calendar);
	return calendar;
};

const graphCache = new Map<string, { data: ContributionCalendar; timestamp: number }>();

const fetchGraphCalendar = async ({ from, to }: { from?: string; to?: string }): Promise<ContributionCalendar | null> => {
	const owner = getOwner();
	const token = getToken();
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

	try {
		const response = await fetchWithTimeout(endpoint, { method: 'POST', headers, body });
		if (!response.ok) {
			console.error('Failed to fetch contribution calendar', response.status, await response.text());
			return null;
		}
		const json = await response.json();
		const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar;
		const normalized = normalizeCalendar(calendar);
		if (normalized) {
			await storeCacheEntry(graphCache, cacheKey, normalized);
		}
		return normalized;
	} catch (error) {
		console.error('Failed to fetch contribution calendar', error);
		return null;
	}
};

export async function fetchContributionCalendar(range: { from?: string; to?: string }): Promise<ContributionCalendar | null> {
	const graphCacheKey = `graph_${range.from}_${range.to}`;
	const fallbackCacheKey = `fallback_${range.from}_${range.to}`;

	const graph = await fetchGraphCalendar(range);
	if (graph) return graph;

	const fallback = await fetchFallbackCalendar(range);
	if (fallback) return fallback;

	return (await readStaleCacheEntry(graphCacheKey)) || (await readStaleCacheEntry(fallbackCacheKey));
}
