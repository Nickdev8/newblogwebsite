import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/server/db';

type Counts = Record<string, number>;

const countReactionsStmt = db.prepare(`
  SELECT type, COUNT(*) as c
  FROM reactions
  WHERE event = ? AND slug = ?
  GROUP BY type
`);

const countViewsStmt = db.prepare(`
  SELECT COUNT(*) as c
  FROM views
  WHERE event = ? AND slug = ?
`);

const insertReactionStmt = db.prepare(`
  INSERT OR REPLACE INTO reactions (event, slug, anon_id, type, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const deleteReactionStmt = db.prepare(`
  DELETE FROM reactions
  WHERE event = ? AND slug = ? AND anon_id = ? AND type = ?
`);

const insertViewStmt = db.prepare(`
  INSERT INTO views (event, slug, anon_id, source, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

function getCounts(event: string, slug: string) {
	const counts: Counts = {};
	for (const row of countReactionsStmt.all(event, slug) as { type: string; c: number }[]) {
		counts[row.type] = row.c;
	}
	const v = countViewsStmt.get(event, slug) as { c: number } | undefined;
	return { counts, views: v?.c ?? 0 };
}

/** GET -> { counts:{...}, views:number } */
export const GET: RequestHandler = ({ params }) => {
	const { event, slug } = params;
	return json(getCounts(event, slug));
};

/**
 * POST body:
 *  - { mode:'toggle', type:string, anon_id:string }
 *  - { mode:'seed'|'open', anon_id:string }
 *  - { mode:'bump', amount?:number }
 */
export const POST: RequestHandler = async ({ request, params }) => {
	const { event, slug } = params;
	const body = await request.json().catch(() => ({}));
	const { mode, type, anon_id, amount } = body as {
		mode?: 'toggle' | 'seed' | 'open' | 'bump';
		type?: string;
		anon_id?: string;
		amount?: number;
	};

	if (!mode) return json({ error: 'Bad body' }, { status: 400 });

	const now = Date.now();

	if (mode === 'toggle') {
		if (!anon_id || !type) return json({ error: 'Bad reaction' }, { status: 400 });

		// Try to delete first; if nothing deleted, insert.
		const info = deleteReactionStmt.run(event, slug, anon_id, type);
		if (info.changes === 0) {
			insertReactionStmt.run(event, slug, anon_id, type, now);
		}
	}

	if (mode === 'seed' || mode === 'open') {
		if (!anon_id) return json({ error: 'Missing anon_id' }, { status: 400 });
		insertViewStmt.run(event, slug, anon_id, mode, now);
	}

	if (mode === 'bump') {
		const n = Number.isFinite(amount) ? Math.max(1, amount!) : 1;
		const stmt = db.prepare(
			`INSERT INTO views (event, slug, anon_id, source, created_at)
       VALUES (?, ?, ?, 'bump', ?)`
		);
		const tx = db.transaction((count: number) => {
			for (let i = 0; i < count; i++) {
				stmt.run(event, slug, `bump-${now}-${Math.random()}`, now);
			}
		});
		tx(n);
	}

	return json(getCounts(event, slug));
};
