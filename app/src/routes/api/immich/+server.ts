import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

type ImmichAsset = {
	id: string;
	type: 'IMAGE' | 'VIDEO' | string;
	originalFileName?: string;
	exifInfo?: {
		exifImageWidth?: number;
		exifImageHeight?: number;
		description?: string;
	};
};

type ImmichSharedLinkResponse = {
	key?: string;
	slug?: string | null;
	type: 'ALBUM' | 'INDIVIDUAL' | string;
	album?: { id: string } | null;
	assets?: ImmichAsset[];
};

type ImmichAlbumResponse = {
	assets?: ImmichAsset[];
};

const invalidResponse = () => json({ error: 'Unable to load Immich data.' }, { status: 502 });

const extractShareParams = (shareUrl: string) => {
	const parsed = new URL(shareUrl);
	const segments = parsed.pathname.split('/').filter(Boolean);

	let slug: string | undefined;
	let key: string | undefined;

	if (segments.length >= 2 && segments[0] === 's') {
		slug = decodeURIComponent(segments[1]);
	} else if (segments.length >= 2 && segments[0] === 'share') {
		key = decodeURIComponent(segments[1]);
	} else if (segments.length >= 1) {
		key = decodeURIComponent(segments[segments.length - 1]);
	}

	return {
		origin: parsed.origin,
		slug,
		key,
	};
};

const buildAssetPayload = (origin: string, key: string, assets: ImmichAsset[]) => {
	return assets.map((asset) => {
		const query = `key=${encodeURIComponent(key)}`;
		const previewUrl = `${origin}/api/assets/${asset.id}/thumbnail?${query}&size=preview`;
		const originalUrl = `${origin}/api/assets/${asset.id}/original?${query}`;

		return {
			id: asset.id,
			type: asset.type,
			isVideo: asset.type === 'VIDEO',
			alt: asset.exifInfo?.description || asset.originalFileName || 'Immich media',
			width: asset.exifInfo?.exifImageWidth ?? null,
			height: asset.exifInfo?.exifImageHeight ?? null,
			previewUrl,
			originalUrl
		};
	});
};

export const GET: RequestHandler = async ({ url, fetch }) => {
	const shareUrl = url.searchParams.get('shareUrl');

	if (!shareUrl) {
		return json({ error: 'Missing shareUrl parameter.' }, { status: 400 });
	}

	let parsedShare: ReturnType<typeof extractShareParams>;
	try {
		parsedShare = extractShareParams(shareUrl);
	} catch (error) {
		return json({ error: 'Invalid share URL provided.' }, { status: 400 });
	}

	const { origin, slug, key: keyFromPath } = parsedShare;
	const params = new URLSearchParams();

	if (slug) {
		params.set('slug', slug);
	} else if (keyFromPath) {
		params.set('key', keyFromPath);
	} else {
		return json({ error: 'Unable to determine share identifier.' }, { status: 400 });
	}

	try {
		const sharedLinkResponse = await fetch(`${origin}/api/shared-links/me?${params.toString()}`);
		if (!sharedLinkResponse.ok) {
			return invalidResponse();
		}

		const sharedLink: ImmichSharedLinkResponse = await sharedLinkResponse.json();
		const shareKey = sharedLink.key || keyFromPath;

		if (!shareKey) {
			return invalidResponse();
		}

		let assets: ImmichAsset[] = sharedLink.assets || [];

		if ((!assets || assets.length === 0) && sharedLink.type === 'ALBUM' && sharedLink.album?.id) {
			const albumResponse = await fetch(
				`${origin}/api/albums/${sharedLink.album.id}?key=${encodeURIComponent(shareKey)}`
			);

			if (!albumResponse.ok) {
				return invalidResponse();
			}

			const album: ImmichAlbumResponse = await albumResponse.json();
			assets = album.assets || [];
		}

		const payload = buildAssetPayload(origin, shareKey, assets);

		return json({ assets: payload });
	} catch (error) {
		console.error('Immich proxy error:', error);
		return invalidResponse();
	}
};
