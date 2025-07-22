// node scripts/migrate-json-to-sqlite.cjs
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const JSON_FILE = path.resolve('src/data/reactions.json');
const DB_FILE = 'data/reactions.sqlite';

if (!fs.existsSync(JSON_FILE)) {
	console.log('No JSON file found. Abort.');
	process.exit(0);
}

const raw = fs.readFileSync(JSON_FILE, 'utf8');
const { rows } = JSON.parse(raw);

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS reactions (
  event TEXT, slug TEXT, anon_id TEXT, type TEXT, created_at INTEGER,
  PRIMARY KEY (event, slug, anon_id, type)
);
CREATE TABLE IF NOT EXISTS views (
  event TEXT, slug TEXT, anon_id TEXT, source TEXT, created_at INTEGER
);
`);

const insReaction = db.prepare(`
  INSERT OR IGNORE INTO reactions (event, slug, anon_id, type, created_at)
  VALUES (?, ?, ?, ?, ?)
`);
const insView = db.prepare(`
  INSERT INTO views (event, slug, anon_id, source, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const tx = db.transaction(() => {
	for (const r of rows) {
		if (r.kind === 'reaction') {
			insReaction.run(r.event, r.slug, r.anon_id, r.type, r.created_at);
		} else if (r.kind === 'view') {
			insView.run(r.event, r.slug, r.anon_id, r.source, r.created_at);
		}
	}
});
tx();

console.log('Migration done.');
