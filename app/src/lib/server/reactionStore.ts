import fs from 'fs/promises';
import path from 'path';

export type Row =
  | { kind: 'reaction'; event: string; slug: string; anon_id: string; type: string; created_at: number }
  | { kind: 'view'; event: string; slug: string; anon_id: string; source: 'seed'|'open'|'bump'; created_at: number };
export type DB = { rows: Row[] };

const FILE = process.env.REACTIONS_FILE || path.resolve('data/reactions.json');

// serialize all mutations
let queue: Promise<void> = Promise.resolve();

async function readSafe(): Promise<DB> {
  try { return JSON.parse(await fs.readFile(FILE, 'utf8')); }
  catch { return { rows: [] }; }
}
async function writeSafe(db: DB) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(db), 'utf8');
  await fs.rename(tmp, FILE);
}

export function mutateDB<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const next = queue.then(async () => {
    const db = await readSafe();
    const result = await fn(db);
    await writeSafe(db);
    return result;
  });
  queue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export function countsFor(db: DB, event: string, slug: string, keys: string[], emojiToKey: Record<string,string>) {
  const counts: Record<string, number> = Object.fromEntries(keys.map(k => [k, 0]));
  let views = 0;
  for (const r of db.rows) {
    if (r.event !== event || r.slug !== slug) continue;
    if (r.kind === 'reaction') {
      const k = keys.includes(r.type) ? r.type : emojiToKey[r.type] ?? null;
      if (k) counts[k] = (counts[k] ?? 0) + 1;
    } else if (r.kind === 'view') views++;
  }
  return { counts, views };
}
