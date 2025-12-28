import { json } from '@sveltejs/kit';
import { getSteps } from '$lib/server/fitbit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const data = await getSteps();
	return json(data);
};
