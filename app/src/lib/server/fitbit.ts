import { env } from '$env/dynamic/private';
import { existsSync } from 'fs';
import { mkdir, readFile, writeFile, rename } from 'fs/promises';
import path from 'path';

type StatsCache = {
	steps: number | null;
	distanceKm: number | null;
	activeMinutes: number | null;
	caloriesOut: number | null;
	restingHeartRate: number | null;
	sleepDurationMinutes: number | null;
	sleepScore: number | null;
	heartRateBpm: number | null;
	stepsWeek: number | null;
	floors: number | null;
	lastUpdated: number | null; // unix seconds
	nextRefresh: number | null; // unix seconds
};

type TokenState = {
	accessToken: string | null;
	refreshToken: string | null;
	expiresAt: number; // unix seconds
};

type StoredTokens = {
	access_token: string;
	refresh_token: string;
	expires_at: number;
};

const MIN_REFRESH_SECONDS = 10 * 60;
const FITBIT_API_BASE = 'https://api.fitbit.com';
// Store tokens inside the project workspace for durability across restarts
const resolveTokenDir = () => {
	if (env.FITBIT_TOKEN_DIR) {
		return path.resolve(env.FITBIT_TOKEN_DIR);
	}

	// Support running from either /app or the repo root containing /app
	const cwd = process.cwd();
	const candidates = [path.resolve(cwd, 'data/fitbit'), path.resolve(cwd, 'app/data/fitbit')];
	const existing = candidates.find((dir) => existsSync(dir) || existsSync(path.dirname(dir)));
	return existing ?? candidates[0];
};

const TOKEN_DIR = resolveTokenDir();
const TOKEN_FILE = path.join(TOKEN_DIR, 'tokens.json');

let cache: StatsCache = {
	steps: null,
	distanceKm: null,
	activeMinutes: null,
	caloriesOut: null,
	restingHeartRate: null,
	sleepDurationMinutes: null,
	sleepScore: null,
	heartRateBpm: null,
	stepsWeek: null,
	floors: null,
	lastUpdated: null,
	nextRefresh: null
};

let tokenState: TokenState = {
	accessToken: null,
	refreshToken: null,
	expiresAt: 0
};

let inflight: Promise<StatsCache> | null = null;
let tokenInitPromise: Promise<void> | null = null;

const nowSeconds = () => Math.floor(Date.now() / 1000);

const ensureTokenDir = async () => {
	try {
		await mkdir(TOKEN_DIR, { recursive: true });
	} catch {
		// ignore if already exists or cannot create; downstream read/write will surface errors
	}
};

const loadTokensFromFile = async (): Promise<StoredTokens | null> => {
	try {
		const file = await readFile(TOKEN_FILE, 'utf-8');
		const parsed = JSON.parse(file) as StoredTokens;
		if (!parsed.access_token || !parsed.refresh_token) return null;
		const expires_at = Number(parsed.expires_at);
		if (!Number.isFinite(expires_at)) return null;
		return { access_token: parsed.access_token, refresh_token: parsed.refresh_token, expires_at };
	} catch {
		return null;
	}
};

const bootstrapTokensFromEnv = (): StoredTokens | null => {
	if (!env.FITBIT_ACCESS_TOKEN || !env.FITBIT_REFRESH_TOKEN || !env.FITBIT_EXPIRES_AT) {
		return null;
	}
	const expires_at = Number(env.FITBIT_EXPIRES_AT);
	if (!Number.isFinite(expires_at)) return null;
	return {
		access_token: env.FITBIT_ACCESS_TOKEN,
		refresh_token: env.FITBIT_REFRESH_TOKEN,
		expires_at
	};
};

const writeTokensToFile = async (tokens: StoredTokens) => {
	await ensureTokenDir();
	const payload = JSON.stringify(tokens, null, 2);
	const tmpPath = `${TOKEN_FILE}.tmp`;
	await writeFile(tmpPath, payload, { encoding: 'utf-8' });
	await rename(tmpPath, TOKEN_FILE);
};

const initTokens = async () => {
	if (tokenInitPromise) {
		return tokenInitPromise;
	}

	tokenInitPromise = (async () => {
		await ensureTokenDir();

		let tokens = await loadTokensFromFile();
		if (!tokens) {
			tokens = bootstrapTokensFromEnv();
			if (!tokens) {
				throw new Error('Fitbit tokens are missing; provide env vars for initial bootstrap.');
			}
			await writeTokensToFile(tokens);
		}

		tokenState = {
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			expiresAt: tokens.expires_at
		};
	})();

	return tokenInitPromise;
};

const setTokens = (accessToken: string, refreshToken: string | null, expiresInSeconds: number) => {
	const expiration = nowSeconds() + (Number(expiresInSeconds) || 0);
	tokenState = {
		accessToken,
		refreshToken: refreshToken || tokenState.refreshToken,
		expiresAt: expiration
	};

	const stored: StoredTokens = {
		access_token: tokenState.accessToken || '',
		refresh_token: tokenState.refreshToken || '',
		expires_at: tokenState.expiresAt
	};

	writeTokensToFile(stored).catch((error) => {
		console.error('Failed to persist Fitbit tokens', error);
	});
};

const refreshAccessToken = async () => {
	await initTokens();

	if (!env.FITBIT_CLIENT_ID || !env.FITBIT_CLIENT_SECRET || !tokenState.refreshToken) {
		throw new Error('Fitbit credentials are missing');
	}

	const basicAuth = Buffer.from(`${env.FITBIT_CLIENT_ID}:${env.FITBIT_CLIENT_SECRET}`).toString('base64');
	const body = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: tokenState.refreshToken
	});

	const response = await fetch(`${FITBIT_API_BASE}/oauth2/token`, {
		method: 'POST',
		headers: {
			Authorization: `Basic ${basicAuth}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: body.toString()
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Failed to refresh Fitbit token: ${response.status} ${text}`);
	}

	const data = await response.json();
	setTokens(data.access_token, data.refresh_token, data.expires_in);
};

const ensureValidAccessToken = async () => {
	await initTokens();

	const now = nowSeconds();

	if (!tokenState.accessToken) {
		await refreshAccessToken();
		return;
	}

	// Refresh a little early to avoid edge expiry
	if (now >= tokenState.expiresAt - 30) {
		await refreshAccessToken();
	}
};

const fetchActivity = async (): Promise<
	Pick<
		StatsCache,
		'steps' | 'distanceKm' | 'activeMinutes' | 'caloriesOut' | 'restingHeartRate'
	>
> => {
	await ensureValidAccessToken();

	if (!tokenState.accessToken) {
		return {
			steps: null,
			distanceKm: null,
			activeMinutes: null,
			caloriesOut: null,
			restingHeartRate: null
		};
	}

	const today = new Date().toISOString().slice(0, 10);
	const response = await fetch(`${FITBIT_API_BASE}/1/user/-/activities/date/${today}.json`, {
		headers: {
			Authorization: `Bearer ${tokenState.accessToken}`
		}
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Failed to fetch activity: ${response.status} ${text}`);
	}

	const payload = (await response.json()) as {
		summary?: {
			steps?: number;
			caloriesOut?: number;
			restingHeartRate?: number;
			fairlyActiveMinutes?: number;
			veryActiveMinutes?: number;
			lightlyActiveMinutes?: number;
		};
		distances?: { activity?: string; distance?: number }[];
	};

	const summary = payload.summary || {};
	const activeMinutes =
		(summary.fairlyActiveMinutes || 0) + (summary.veryActiveMinutes || 0) || null;

	const distances: { activity?: string; distance?: number }[] =
		Array.isArray(payload.distances)
			? payload.distances
			: Array.isArray((payload as any).summary?.distances)
				? (payload as any).summary.distances
				: [];
	const totalDistance =
		distances.find((d) => d.activity === 'total')?.distance ??
		(distances.length ? distances[0]?.distance : null);

	return {
		steps: typeof summary.steps === 'number' ? summary.steps : null,
		distanceKm: typeof totalDistance === 'number' ? totalDistance : null,
		activeMinutes,
		caloriesOut: typeof summary.caloriesOut === 'number' ? summary.caloriesOut : null,
		restingHeartRate:
			typeof summary.restingHeartRate === 'number' ? summary.restingHeartRate : null
	};
};

const fetchSleep = async (): Promise<Pick<StatsCache, 'sleepDurationMinutes' | 'sleepScore'>> => {
	await ensureValidAccessToken();

	if (!tokenState.accessToken) {
		return { sleepDurationMinutes: null, sleepScore: null };
	}

	const today = new Date().toISOString().slice(0, 10);
	const response = await fetch(`${FITBIT_API_BASE}/1.2/user/-/sleep/date/${today}.json`, {
		headers: {
			Authorization: `Bearer ${tokenState.accessToken}`
		}
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Failed to fetch sleep: ${response.status} ${text}`);
	}

	const payload = (await response.json()) as {
		sleep?: { isMainSleep?: boolean; duration?: number; score?: number }[];
	};

	const sleeps = Array.isArray(payload.sleep) ? payload.sleep : [];
	const primary =
		sleeps.find((entry) => entry.isMainSleep) || (sleeps.length ? sleeps[0] : undefined);

	const durationMinutes =
		typeof primary?.duration === 'number'
			? Math.round(primary.duration / (1000 * 60))
			: null;

	return {
		sleepDurationMinutes: durationMinutes,
		sleepScore: typeof primary?.score === 'number' ? primary.score : null
	};
};

const fetchHeartRate = async (): Promise<number | null> => {
	await ensureValidAccessToken();

	if (!tokenState.accessToken) return null;

	const today = new Date().toISOString().slice(0, 10);

	// Try intraday first (requires intraday scope)
	try {
		const response = await fetch(
			`${FITBIT_API_BASE}/1/user/-/activities/heart/date/${today}/1d/1min.json`,
			{
				headers: {
					Authorization: `Bearer ${tokenState.accessToken}`
				}
			}
		);

		if (response.ok) {
			const payload = (await response.json()) as {
				'activities-heart-intraday'?: { dataset?: { value?: number }[] };
			};
			const dataset = payload['activities-heart-intraday']?.dataset || [];
			const latest = dataset[dataset.length - 1]?.value;
			if (typeof latest === 'number' && Number.isFinite(latest)) return latest;
		}
	} catch (error) {
		console.error('Fitbit heart intraday fetch error:', error);
	}

	// Fallback to summary
	try {
		const response = await fetch(`${FITBIT_API_BASE}/1/user/-/activities/heart/date/${today}/1d.json`, {
			headers: { Authorization: `Bearer ${tokenState.accessToken}` }
		});

		if (!response.ok) {
			const text = await response.text();
			throw new Error(`Failed to fetch heart summary: ${response.status} ${text}`);
		}

		const payload = (await response.json()) as {
			'activities-heart'?: { value?: { restingHeartRate?: number } }[];
		};
		const first = payload['activities-heart']?.[0];
		const hr = first?.value?.restingHeartRate;
		if (typeof hr === 'number' && Number.isFinite(hr)) return hr;
	} catch (error) {
		console.error('Fitbit heart summary fetch error:', error);
	}

	return null;
};

const fetchStepsWeek = async (): Promise<number | null> => {
	await ensureValidAccessToken();
	if (!tokenState.accessToken) return null;

	const response = await fetch(
		`${FITBIT_API_BASE}/1/user/-/activities/steps/date/today/7d.json`,
		{
			headers: { Authorization: `Bearer ${tokenState.accessToken}` }
		}
	);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Failed to fetch weekly steps: ${response.status} ${text}`);
	}

	const payload = (await response.json()) as {
		'activities-steps'?: { value?: string | number }[];
	};
	const series = payload['activities-steps'] || [];
	const total = series.reduce((sum, entry) => {
		const val = typeof entry?.value === 'string' ? Number.parseInt(entry.value, 10) : entry?.value;
		return sum + (Number.isFinite(val as number) ? Number(val) : 0);
	}, 0);
	return Number.isFinite(total) ? total : null;
};

const fetchFloors = async (): Promise<number | null> => {
	await ensureValidAccessToken();
	if (!tokenState.accessToken) return null;

	const today = new Date().toISOString().slice(0, 10);
	const response = await fetch(
		`${FITBIT_API_BASE}/1/user/-/activities/floors/date/${today}/1d.json`,
		{
			headers: { Authorization: `Bearer ${tokenState.accessToken}` }
		}
	);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Failed to fetch floors: ${response.status} ${text}`);
	}

	const payload = (await response.json()) as {
		'activities-floors'?: { value?: string | number }[];
	};

	const todayEntry = payload['activities-floors']?.[0];
	if (!todayEntry?.value) return null;
	const val = typeof todayEntry.value === 'string' ? Number.parseInt(todayEntry.value, 10) : todayEntry.value;
	return Number.isFinite(val) ? val : null;
};

export const getSteps = async (): Promise<StatsCache> => {
	const now = nowSeconds();

	if (cache.lastUpdated && cache.nextRefresh && now < cache.nextRefresh) {
		return cache;
	}

	if (inflight) {
		return inflight;
	}

	inflight = (async () => {
		const previous = cache;
		let activity: Awaited<ReturnType<typeof fetchActivity>> | null = null;
		let sleep: Awaited<ReturnType<typeof fetchSleep>> | null = null;
		let heartRate: number | null = null;
		let stepsWeek: number | null = null;
		let floors: number | null = null;

		try {
			try {
				activity = await fetchActivity();
			} catch (error) {
				console.error('Fitbit activity fetch error:', error);
			}

			try {
				sleep = await fetchSleep();
			} catch (error) {
				console.error('Fitbit sleep fetch error:', error);
			}

			try {
				heartRate = await fetchHeartRate();
			} catch (error) {
				console.error('Fitbit heart rate fetch error:', error);
			}

			try {
				stepsWeek = await fetchStepsWeek();
			} catch (error) {
				console.error('Fitbit weekly steps fetch error:', error);
			}

			try {
				floors = await fetchFloors();
			} catch (error) {
				console.error('Fitbit floors fetch error:', error);
			}

			const timestamp = nowSeconds();
			const hasUpdate =
				(activity &&
					(Object.values(activity).some((v) => v !== null && v !== undefined))) ||
				heartRate !== null ||
				stepsWeek !== null ||
				floors !== null ||
				(sleep &&
					(sleep.sleepDurationMinutes !== null || sleep.sleepScore !== null));
			const lastUpdated = hasUpdate ? timestamp : previous.lastUpdated;

			cache = {
				steps: activity?.steps ?? previous.steps,
				distanceKm: activity?.distanceKm ?? previous.distanceKm,
				activeMinutes: activity?.activeMinutes ?? previous.activeMinutes,
				caloriesOut: activity?.caloriesOut ?? previous.caloriesOut,
				restingHeartRate: activity?.restingHeartRate ?? previous.restingHeartRate,
				sleepDurationMinutes: sleep?.sleepDurationMinutes ?? previous.sleepDurationMinutes,
				sleepScore: sleep?.sleepScore ?? previous.sleepScore,
				heartRateBpm: heartRate ?? previous.heartRateBpm,
				stepsWeek: stepsWeek ?? previous.stepsWeek,
				floors: floors ?? previous.floors,
				lastUpdated,
				nextRefresh: timestamp + MIN_REFRESH_SECONDS
			};

			return cache;
		} finally {
			inflight = null;
		}
	})();

	return inflight;
};
