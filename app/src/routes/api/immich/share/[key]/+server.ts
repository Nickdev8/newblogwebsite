import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

const IMMICH_BASE = env.IMMICH_API_URL || 'https://photos.nickesselman.nl';
const IMMICH_API_KEY = env.IMMICH_API_KEY || '';

export const GET: RequestHandler = async ({ params, fetch }) => {
	const key = params.key;
	if (!IMMICH_API_KEY) {
		throw error(500, 'IMMICH_API_KEY is not configured');
	}

	if (!key) {
		throw error(400, 'Missing share key');
	}

	const shareRes = await fetch(`${IMMICH_BASE}/api/shared-link/${key}`, {
		headers: { accept: 'application/json' }
	});

	if (!shareRes.ok) {
		throw error(shareRes.status === 404 ? 404 : 502, 'Unable to resolve Immich share link');
	}

	const json = await shareRes.json();
	const asset = json?.assets?.[0];
	const assetId = asset?.id || asset?.assetId;

	if (!assetId) {
		throw error(404, 'No assets found for this share link');
	}

	const assetRes = await fetch(`${IMMICH_BASE}/api/assets/${assetId}/original`, {
		headers: {
			accept: '*/*',
			Authorization: `Bearer ${IMMICH_API_KEY}`,
			'x-api-key': IMMICH_API_KEY
		}
	});

	if (!assetRes.ok) {
		throw error(assetRes.status === 404 ? 404 : 502, 'Unable to fetch Immich asset');
	}

	return new Response(assetRes.body, {
		status: assetRes.status,
		headers: {
			'content-type': assetRes.headers.get('content-type') || 'application/octet-stream',
			'cache-control': 'public, max-age=600'
		}
	});
};
