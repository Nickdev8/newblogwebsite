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
