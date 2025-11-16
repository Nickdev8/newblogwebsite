import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { mutateDB, countsFor } from '$lib/server/reactionStore';
import fs from 'fs/promises';
import path from 'path';

const TYPES_FILE = process.env.TYPES_FILE || path.resolve('src/data/reactionTypes.json');

type ReactionType = { key: string; emoji: string };

const DEFAULT_TYPES: ReactionType[] = [
  { key: 'laugh', emoji: '🤣' },
  { key: 'cry', emoji: '😢' },
  { key: 'wow', emoji: '😮' },
  { key: 'heart', emoji: '❤️' },
  { key: 'up', emoji: '👍' }
];

async function getTypes(): Promise<ReactionType[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(TYPES_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : DEFAULT_TYPES;
  } catch {
    return DEFAULT_TYPES;
  }
}

export const POST: RequestHandler = async ({ request, params }) => {
  const body = await request.json().catch(() => ({}));
  let { mode, type, anon_id, amount } = body as {
    mode?: 'toggle' | 'seed' | 'open' | 'bump';
    type?: string;
    anon_id?: string;
    amount?: number;
  };
  if (!mode) return json({ error: 'Bad body' }, { status: 400 });

  const types = await getTypes();
  const keys = types.map((type) => type.key);
  const emojiToKey = Object.fromEntries(types.map((type) => [type.emoji, type.key] as const));
  if (type && !keys.includes(type) && emojiToKey[type]) type = emojiToKey[type];

  const { event, slug } = params;
  const now = Date.now();

  const result = await mutateDB(db => {
    if (mode === 'toggle') {
      if (!anon_id || !type || !keys.includes(type)) throw json({ error: 'Bad reaction' }, { status: 400 });
      const idx = db.rows.findIndex(r =>
        r.kind === 'reaction' && r.event === event && r.slug === slug && r.anon_id === anon_id && r.type === type
      );
      if (idx === -1) db.rows.push({ kind: 'reaction', event, slug, anon_id, type, created_at: now });
      else db.rows.splice(idx, 1);
    }

    if (mode === 'seed' || mode === 'open') {
      if (!anon_id) throw json({ error: 'Missing anon_id' }, { status: 400 });
      db.rows.push({ kind: 'view', event, slug, anon_id, source: mode, created_at: now });
    }

    if (mode === 'bump') {
      const n = Number.isFinite(amount) ? Math.max(1, amount!) : 1;
      for (let i = 0; i < n; i++) {
        db.rows.push({
          kind: 'view', event, slug,
          anon_id: `bump-${now}-${Math.random()}`,
          source: 'bump', created_at: now
        });
      }
    }

    return countsFor(db, event, slug, keys, emojiToKey);
  });

  return json(result);
};


export const GET: RequestHandler = async ({ params }) => {
  const types = await getTypes();
  const keys = types.map((type) => type.key);
  const emojiToKey = Object.fromEntries(types.map((type) => [type.emoji, type.key] as const));
  const result = await mutateDB(db => countsFor(db, params.event, params.slug, keys, emojiToKey));
  return json(result);
};
