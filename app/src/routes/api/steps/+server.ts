import { redirect } from '@sveltejs/kit';
import { getLiveStatsApiUrl } from '$lib/server/liveStats';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	throw redirect(308, getLiveStatsApiUrl());
};
