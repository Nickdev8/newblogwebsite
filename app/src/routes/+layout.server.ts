import { fetchLiveStats } from '$lib/server/liveStats';
import type { LayoutServerLoad } from './$types';

export const prerender = false;

export const load: LayoutServerLoad = async ({ fetch }) => fetchLiveStats(fetch);
