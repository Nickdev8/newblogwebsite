import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { COOKIE_NAME, computeSignature } from '$lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
	const adminPassword = env.ADMIN_PASSWORD || '';
	const expectedSignature = adminPassword ? computeSignature(adminPassword) : null;
	const cookieSignature = event.cookies.get(COOKIE_NAME);

	event.locals.isAdmin = Boolean(expectedSignature && cookieSignature === expectedSignature);

	return resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-type'
	});
};
