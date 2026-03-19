import type { RequestHandler } from './$types';
import { SITE_URL } from '$lib/seo';

export const GET: RequestHandler = () => {
	const body = [
		'User-agent: *',
		'Allow: /',
		'Disallow: /admin',
		'Disallow: /api',
		`Sitemap: ${SITE_URL}/sitemap.xml`
	].join('\n');

	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
