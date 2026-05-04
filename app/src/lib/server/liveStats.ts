import { env } from '$env/dynamic/private';
import { EMPTY_LIVE_STATS, type LiveStatsPayload } from '$lib/liveStats';

const DEFAULT_LIVE_STATS_API_URL = 'https://api.nickesselman.nl/fitbit';
const FALLBACK_LIVE_STATS_API_URL = 'https://api.nickesselman.nl/stats';
const LIVE_STATS_TIMEOUT_MS = 3000;

export const getLiveStatsApiUrl = () => env.LIVE_STATS_API_URL?.trim() || DEFAULT_LIVE_STATS_API_URL;

const getLiveStatsApiUrls = () => {
	const primaryUrl = getLiveStatsApiUrl();
	return Array.from(new Set([primaryUrl, DEFAULT_LIVE_STATS_API_URL, FALLBACK_LIVE_STATS_API_URL]));
};

const asNumber = (value: unknown) => (typeof value === 'number' ? value : null);

const parseLiveStats = (data: Record<string, unknown>): LiveStatsPayload => ({
	steps: asNumber(data.steps),
	lastUpdated: asNumber(data.lastUpdated),
	nextRefresh: asNumber(data.nextRefresh),
	distanceKm: asNumber(data.distanceKm),
	activeMinutes: asNumber(data.activeMinutes),
	caloriesOut: asNumber(data.caloriesOut),
	restingHeartRate: asNumber(data.restingHeartRate),
	sleepDurationMinutes: asNumber(data.sleepDurationMinutes),
	sleepScore: asNumber(data.sleepScore),
	heartRateBpm: asNumber(data.heartRateBpm),
	stepsWeek: asNumber(data.stepsWeek),
	floors: asNumber(data.floors),
	errorMessage: typeof data.errorMessage === 'string' ? data.errorMessage : null
});

const fetchWithTimeout = async (fetcher: typeof fetch, url: string) => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), LIVE_STATS_TIMEOUT_MS);

	try {
		return await fetcher(url, {
			headers: {
				accept: 'application/json'
			},
			signal: controller.signal
		});
	} finally {
		clearTimeout(timeout);
	}
};

export const fetchLiveStats = async (fetcher: typeof fetch): Promise<LiveStatsPayload> => {
	const errors: unknown[] = [];

	try {
		for (const url of getLiveStatsApiUrls()) {
			try {
				const response = await fetchWithTimeout(fetcher, url);

				if (!response.ok) {
					errors.push(new Error(`Live stats request failed for ${url} with ${response.status}`));
					continue;
				}

				const data = (await response.json()) as Record<string, unknown>;
				return parseLiveStats(data);
			} catch (error) {
				errors.push(error);
			}
		}
	} catch (error) {
		errors.push(error);
	}

	console.error('Error fetching live stats', errors);
	return { ...EMPTY_LIVE_STATS };
};
