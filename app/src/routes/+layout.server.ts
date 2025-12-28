import type { LayoutServerLoad } from './$types';

export const prerender = false;

export const load: LayoutServerLoad = async ({ fetch }) => {
	try {
		const response = await fetch('/api/steps');
		if (!response.ok) {
			return {
				steps: null,
				lastUpdated: null,
				nextRefresh: null,
				distanceKm: null,
				activeMinutes: null,
				caloriesOut: null,
				restingHeartRate: null,
				sleepDurationMinutes: null,
				sleepScore: null
			};
		}

		const data = (await response.json()) as {
			steps?: number | null;
			lastUpdated?: number | null;
			nextRefresh?: number | null;
			distanceKm?: number | null;
			activeMinutes?: number | null;
			caloriesOut?: number | null;
			restingHeartRate?: number | null;
			sleepDurationMinutes?: number | null;
			sleepScore?: number | null;
			heartRateBpm?: number | null;
			stepsWeek?: number | null;
			floors?: number | null;
		};

		return {
			steps: typeof data.steps === 'number' ? data.steps : null,
			lastUpdated: typeof data.lastUpdated === 'number' ? data.lastUpdated : null,
			nextRefresh: typeof data.nextRefresh === 'number' ? data.nextRefresh : null,
			distanceKm: typeof data.distanceKm === 'number' ? data.distanceKm : null,
			activeMinutes: typeof data.activeMinutes === 'number' ? data.activeMinutes : null,
			caloriesOut: typeof data.caloriesOut === 'number' ? data.caloriesOut : null,
			restingHeartRate:
				typeof data.restingHeartRate === 'number' ? data.restingHeartRate : null,
			sleepDurationMinutes:
				typeof data.sleepDurationMinutes === 'number' ? data.sleepDurationMinutes : null,
			sleepScore: typeof data.sleepScore === 'number' ? data.sleepScore : null,
			heartRateBpm: typeof data.heartRateBpm === 'number' ? data.heartRateBpm : null,
			stepsWeek: typeof data.stepsWeek === 'number' ? data.stepsWeek : null,
			floors: typeof data.floors === 'number' ? data.floors : null
		};
	} catch (error) {
		console.error('Error fetching steps', error);
		return {
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
			floors: null
		};
	}
};
