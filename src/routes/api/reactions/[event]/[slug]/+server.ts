import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import type { RequestHandler } from './$types';

type ReactionType = { key: string; emoji: string; label?: string };

// -------- paths & defaults --------
const DATA_FILE  = path.resolve('src/data/reactions.json');
const TYPES_FILE = path.resolve('src/data/reaction-types.json');
const DEFAULT_TYPES: ReactionType[] = [
  { key: 'laugh', emoji: '🤣' },
  { key: 'cry',   emoji: '😢' },
  { key: 'wow',   emoji: '😮' },
  { key: 'heart', emoji: '❤️' },
  { key: 'up',    emoji: '👍' }
];

// -------- tiny “db” layer --------
type Row =
  | { kind: 'reaction'; event: string; slug: string; anon_id: string; type: string; created_at: number }
  | { kind: 'view';     event: string; slug: string; anon_id: string; source: 'seed'|'open'|'bump'; created_at: number };

type DB = { rows: Row[] };

async function readDB(): Promise<DB> {
  try { return JSON.parse(await fs.readFile(DATA_FILE, 'utf8')); }
  catch { return { rows: [] }; }
}
async function writeDB(db: DB) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(db), 'utf8');
}

// -------- helpers --------
let _types: ReactionType[] | null = null;
async function loadTypes(): Promise<ReactionType[]> {
  if (_types) return _types;
  try {
    const raw = await fs.readFile(TYPES_FILE, 'utf8');
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.length) {
      _types = arr;
      return _types;
    }
  } catch {}
  _types = DEFAULT_TYPES;
  return _types;
}

function emptyCounts(keys: string[]) {
  return keys.reduce((acc, k) => { acc[k] = 0; return acc; }, {} as Record<string, number>);
}

function countsFor(db: DB, event: string, slug: string, keys: string[]) {
  const counts = emptyCounts(keys);
  let views = 0;
  for (const r of db.rows) {
    if (r.event !== event || r.slug !== slug) continue;
    if (r.kind === 'reaction') {
      if (r.type in counts) counts[r.type]++;     // ignore unknown keys safely
    } else if (r.kind === 'view') {
      views++;
    }
  }
  return { counts, views };
}

// -------- handlers --------
export const GET: RequestHandler = async ({ params }) => {
  const types = await loadTypes();
  const db = await readDB();
  return json(countsFor(db, params.event, params.slug, types.map(t => t.key)));
};

export const POST: RequestHandler = async ({ params, request }) => {
  const body = await request.json().catch(() => ({}));
  const { mode, type, anon_id, amount } = body as {
    mode?: 'toggle' | 'seed' | 'open' | 'bump';
    type?: string;
    anon_id?: string;
    amount?: number;
  };

  if (!mode) return json({ error: 'Bad body' }, { status: 400 });

  const types = await loadTypes();
  const valid = new Set(types.map(t => t.key));
  const { event, slug } = params;
  const db = await readDB();
  const now = Date.now();

  if (mode === 'toggle') {
    if (!anon_id || !type || !valid.has(type)) {
      return json({ error: 'Bad reaction' }, { status: 400 });
    }
    const idx = db.rows.findIndex(
      (r) =>
        r.kind === 'reaction' &&
        r.event === event &&
        r.slug === slug &&
        r.anon_id === anon_id &&
        r.type === type
    );

    if (idx === -1) {
      db.rows.push({ kind: 'reaction', event, slug, anon_id, type, created_at: now });
    } else {
      db.rows.splice(idx, 1);
    }
  }

  if (mode === 'seed' || mode === 'open') {
    if (!anon_id) return json({ error: 'Missing anon_id' }, { status: 400 });
    db.rows.push({ kind: 'view', event, slug, anon_id, source: mode, created_at: now });
  }

  if (mode === 'bump') {
    const n = Number.isFinite(amount) ? Math.max(1, amount!) : 1;
    for (let i = 0; i < n; i++) {
      db.rows.push({
        kind: 'view',
        event,
        slug,
        anon_id: `bump-${now}-${Math.random()}`,
        source: 'bump',
        created_at: now
      });
    }
  }

  await writeDB(db);
  return json(countsFor(db, event, slug, types.map(t => t.key)));
};
