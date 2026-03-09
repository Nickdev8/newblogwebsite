import { env } from '$env/dynamic/private';

export type LiveStatsPayload = {
	steps: number | null;
	lastUpdated: number | null;
	nextRefresh: number | null;
	distanceKm: number | null;
	activeMinutes: number | null;
	caloriesOut: number | null;
	restingHeartRate: number | null;
	sleepDurationMinutes: number | null;
	sleepScore: number | null;
	heartRateBpm: number | null;
	stepsWeek: number | null;
	floors: number | null;
	errorMessage: string | null;
};

const DEFAULT_LIVE_STATS_API_URL = 'https://api.nickesselman.nl/stats';

export const EMPTY_LIVE_STATS: LiveStatsPayload = {
	steps: null,
	lastUpdated: null,
	nextRefresh: null,
	distanceKm: null,
	activeMinutes: null,
	caloriesOut: null,
	restingHeartRate: null,
	sleepDurationMinutes: null,
	sleepScore: null,
	heartRateBpm: null,
	stepsWeek: null,
	floors: null,
	errorMessage: null
};

export const getLiveStatsApiUrl = () => env.LIVE_STATS_API_URL?.trim() || DEFAULT_LIVE_STATS_API_URL;

const asNumber = (value: unknown) => (typeof value === 'number' ? value : null);

export const fetchLiveStats = async (fetcher: typeof fetch): Promise<LiveStatsPayload> => {
	try {
		const response = await fetcher(getLiveStatsApiUrl(), {
			headers: {
				accept: 'application/json'
			}
		});

		if (!response.ok) {
			return { ...EMPTY_LIVE_STATS };
		}

		const data = (await response.json()) as Record<string, unknown>;

		return {
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
		};
	} catch (error) {
		console.error('Error fetching live stats', error);
		return { ...EMPTY_LIVE_STATS };
	}
};
