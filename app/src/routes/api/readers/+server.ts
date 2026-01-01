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

const isNonEmpty = (value?: string) => typeof value === 'string' && value.trim().length > 0;

export const POST: RequestHandler = async ({ request }) => {
	let payload: IncomingPayload = {};
	try {
		payload = (await request.json()) as IncomingPayload;
	} catch {
		return json({ ok: false }, { status: 400 });
	}

	if (!isNonEmpty(payload.anonId) || !payload.kind) {
		return json({ ok: false }, { status: 400 });
	}

	const created_at = Date.now();
	const anon_id = payload.anonId.trim();
	const base = { anon_id, created_at } as const;

	let row: ReaderRow | null = null;

	switch (payload.kind) {
		case 'visit':
			if (!isNonEmpty(payload.path) || !isNonEmpty(payload.referrer) || !payload.device) break;
			row = {
				kind: 'visit',
				...base,
				path: payload.path.trim(),
				referrer: payload.referrer.trim(),
				device: payload.device
			};
			break;
		case 'post_view':
			if (!isNonEmpty(payload.event) || !isNonEmpty(payload.path)) break;
			row = {
				kind: 'post_view',
				...base,
				event: payload.event.trim(),
				path: payload.path.trim()
			};
			break;
		case 'name':
			if (!isNonEmpty(payload.name)) break;
			row = {
				kind: 'name',
				...base,
				name: payload.name.trim().slice(0, 80)
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
			if (!isNonEmpty(payload.event) || !isNonEmpty(payload.path)) break;
			if (typeof payload.percent !== 'number' || Number.isNaN(payload.percent)) break;
			row = {
				kind: 'scroll',
				...base,
				event: payload.event.trim(),
				path: payload.path.trim(),
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
