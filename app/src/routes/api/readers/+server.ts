import { json } from '@sveltejs/kit';
import { mutateReaderDB, type ReaderRow } from '$lib/server/readerStore';
import type { RequestHandler } from './$types';

type IncomingPayload = {
	anonId?: string;
	kind?: ReaderRow['kind'];
	path?: string;
	referrer?: string;
	device?: 'mobile' | 'desktop';
	event?: string;
	name?: string;
	language?: 'en' | 'nl';
	percent?: number;
};

const isNonEmpty = (value: unknown): value is string =>
	typeof value === 'string' && value.trim().length > 0;

export const POST: RequestHandler = async ({ request }) => {
	let payload: IncomingPayload = {};
	try {
		payload = (await request.json()) as IncomingPayload;
	} catch {
		return json({ ok: false }, { status: 400 });
	}

	const anonId = payload.anonId;
	if (!isNonEmpty(anonId) || !payload.kind) {
		return json({ ok: false }, { status: 400 });
	}

	const created_at = Date.now();
	const anon_id = anonId.trim();
	const base = { anon_id, created_at } as const;

	let row: ReaderRow | null = null;

	switch (payload.kind) {
		case 'visit':
			const visitPath = payload.path;
			const visitReferrer = payload.referrer;
			if (!isNonEmpty(visitPath) || !isNonEmpty(visitReferrer) || !payload.device) break;
			row = {
				kind: 'visit',
				...base,
				path: visitPath,
				referrer: visitReferrer,
				device: payload.device
			};
			break;
		case 'post_view':
			const postEvent = payload.event;
			const postPath = payload.path;
			if (!isNonEmpty(postEvent) || !isNonEmpty(postPath)) break;
			row = {
				kind: 'post_view',
				...base,
				event: postEvent,
				path: postPath
			};
			break;
		case 'name':
			const readerName = payload.name;
			if (!isNonEmpty(readerName)) break;
			row = {
				kind: 'name',
				...base,
				name: readerName.slice(0, 80)
			};
			break;
		case 'language':
			if (payload.language !== 'en' && payload.language !== 'nl') break;
			row = {
				kind: 'language',
				...base,
				language: payload.language
			};
			break;
		case 'scroll':
			const scrollEvent = payload.event;
			const scrollPath = payload.path;
			if (!isNonEmpty(scrollEvent) || !isNonEmpty(scrollPath)) break;
			if (typeof payload.percent !== 'number' || Number.isNaN(payload.percent)) break;
			row = {
				kind: 'scroll',
				...base,
				event: scrollEvent,
				path: scrollPath,
				percent: Math.max(0, Math.min(100, Math.round(payload.percent)))
			};
			break;
		default:
			break;
	}

	if (!row) {
		return json({ ok: false }, { status: 400 });
	}

	await mutateReaderDB((db) => {
		db.rows.push(row);
	});

	return json({ ok: true });
};
