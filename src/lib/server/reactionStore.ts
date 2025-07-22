import fs from 'fs/promises';
import path from 'path';

export type Row =
	| { kind: 'reaction'; event: string; slug: string; anon_id: string; type: string; created_at: number }
	| { kind: 'view';      event: string; slug: string; anon_id: string; source: 'seed'|'open'|'bump'; created_at: number };

export type DB = { rows: Row[] };

const FILE = process.env.REACTIONS_FILE || path.resolve('data/reactions.json');
let writeQueue = Promise.resolve();

export async function readDB(): Promise<DB> {
	try { return JSON.parse(await fs.readFile(FILE, 'utf8')); }
	catch { return { rows: [] }; }
}

export function writeDB(db: DB) {
	writeQueue = writeQueue.then(async () => {
		await fs.mkdir(path.dirname(FILE), { recursive: true });
		await fs.writeFile(FILE, JSON.stringify(db), 'utf8');
	});
	return writeQueue;
}

export function countsFor(
	db: DB,
	event: string,
	slug: string,
	keys: string[],
	emojiToKey: Record<string, string>
) {
	const counts: Record<string, number> = Object.fromEntries(keys.map(k => [k, 0]));
	let views = 0;

	for (const r of db.rows) {
		if (r.event !== event || r.slug !== slug) continue;
		if (r.kind === 'reaction') {
			// normalize old emoji rows
			const k = keys.includes(r.type) ? r.type : emojiToKey[r.type] ?? null;
			if (k) counts[k] = (counts[k] ?? 0) + 1;
		} else if (r.kind === 'view') {
			views++;
		}
	}
	return { counts, views };
}
