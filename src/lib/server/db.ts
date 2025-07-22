import Database from 'better-sqlite3';
import { dev } from '$app/environment';

declare global {
	// eslint-disable-next-line no-var
	var __db: Database | undefined;
}

// Reuse connection during HMR in dev
const db = global.__db ?? new Database('data/reactions.sqlite');
if (dev) global.__db = db;

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS reactions (
  event      TEXT NOT NULL,
  slug       TEXT NOT NULL,
  anon_id    TEXT NOT NULL,
  type       TEXT NOT NULL,         -- emoji key
  created_at INTEGER NOT NULL,
  PRIMARY KEY (event, slug, anon_id, type)  -- allow multiple emojis per user, but one of each
);

CREATE TABLE IF NOT EXISTS views (
  event      TEXT NOT NULL,
  slug       TEXT NOT NULL,
  anon_id    TEXT NOT NULL,
  source     TEXT NOT NULL,          -- 'seed' | 'open' | 'bump'
  created_at INTEGER NOT NULL
);
`);

export default db;
