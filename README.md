<div align="center">

# Nick Esselman Blog

*SvelteKit blog • JSON reactions/views • Runs on a Raspberry Pi*

<img alt="SvelteKit" src="https://img.shields.io/badge/SvelteKit-ff3e00?logo=svelte&logoColor=white" />
<img alt="TailwindCSS" src="https://img.shields.io/badge/TailwindCSS-38B2AC?logo=tailwind-css&logoColor=white" />
<img alt="Raspberry Pi" src="https://img.shields.io/badge/Runs%20on-Raspberry%20Pi-C51A4A?logo=raspberry-pi&logoColor=white" />
<img alt="PM2" src="https://img.shields.io/badge/PM2-2C3E50" />
<img alt="nginx" src="https://img.shields.io/badge/nginx-009639?logo=nginx&logoColor=white" />
<img alt="MIT License" src="https://img.shields.io/badge/License-MIT-blue" />

<a href="https://shipwrecked.hackclub.com/?t=ghrm" target="_blank">
  <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/739361f1d440b17fc9e2f74e49fc185d86cbec14_badge.png" alt="Shipwrecked badge" width="240" />
</a>

</div>

---

This repository contains the source code for my personal blog, built with SvelteKit. It features a lightweight JSON-based backend for managing reactions and view counts, eliminating the need for external databases like PostgreSQL or Firebase. The application is designed to run efficiently on a Raspberry Pi, leveraging nginx as a reverse proxy and PM2 for process management.

For local development or deployment to a Raspberry Pi/VPS, please refer to the **Quick Start** and **Deployment** sections below.

## Quick Start

```bash
# requirements: Node 20+, npm (or pnpm/yarn if you tweak scripts)
npm ci
npm run dev  # http://localhost:5173
```

Build/preview the production bundle:

```bash
npm run build    # -> ./build
npm run preview  # http://localhost:3000
```

## What You Get

* Markdown posts (frontmatter via `gray-matter`, HTML via `marked`).
* LocalStorage to remember what you expanded/read.
* Reactions + views via `/api/reactions/...` endpoints, with a more prominent view counter that only displays when views are present.
* Clearer language duration data on the experiences page.
* Zero external DBs, just JSON files with atomic writes.
* Simple deploy script with rsync + PM2 reloads.

## Stack

* **Frontend/SSR:** SvelteKit (adapter-node)
* **Styling:** Tailwind CSS + `@tailwindcss/typography`
* **Runtime:** Node 20+
* **Process manager:** PM2
* **Reverse proxy:** nginx
* **Storage:** JSON files (`reactions.json`, `reaction-types.json`)

## Project Layout

```
.
├── src/
│   ├── lib/
│   │   └── ReactionBar.svelte
│   │   └── server/reactionStore.ts        # JSON helpers
│   ├── routes/
│   │   ├── api/reactions/[event]/[slug]/+server.ts
│   │   ├── api/reactions/types/+server.ts
│   │   └── [event]/+page.svelte           # blog post UI
│   │   └── experiences/+page.svelte       # experiences page
│   └── posts/                             # markdown posts
├── data/
│   ├── reaction-types.json
│   └── reactions.json                     # stays on server, not overwritten
├── static/
├── deploy.sh                              # rsync deploy script
├── package.json
└── README.md
```

## Env Vars

```text
REACTIONS_FILE=/srv/blog-data/reactions.json
TYPES_FILE=/srv/blog-data/reaction-types.json
PORT=3000
```

Set these in PM2 (see below) so the server knows where to read/write.

## Reactions / Views API

**GET** `/api/reactions/:event/:slug` → `{ counts, views }`

**POST** `/api/reactions/:event/:slug` body:

```json
{
  "mode": "toggle" | "seed" | "open" | "bump",
  "type": "heart" | "laugh" | "wow" | ...,   // required for toggle
  "anon_id": "uuid-or-random",
  "amount": 5                                     // only for bump
}
```

**Modes:**

* `toggle` — add/remove a reaction for an anon\_id
* `seed` / `open` — count a view
* `bump` — add N synthetic views (testing/seeding)

### Data Files

`reaction-types.json`:

```json
[
  { "key": "laugh", "emoji": "🤣" },
  { "key": "cry",   "emoji": "😢" },
  { "key": "wow",   "emoji": "😮" },
  { "key": "heart", "emoji": "❤️" },
  { "key": "up",    "emoji": "👍" }
]
```

`reactions.json`:

```json
{
  "rows": [
    { "kind": "reaction", "event": "neighborhood", "slug": "neighborhood-0.5", "anon_id": "abc", "type": "heart", "created_at": 1690000000000 },
    { "kind": "view",     "event": "neighborhood", "slug": "neighborhood-0.5", "anon_id": "seed-xyz", "source": "seed", "created_at": 1690000000500 }
  ]
}
```

### Concurrency Tips

* All read→mutate→write ops are funneled through a queue (`mutateDB`) so two requests don’t stomp each other.
* Writes go to a temp file, then `rename()` for atomic replace.
* Only one PM2 instance (`pm2 scale blog 1`).

## Deployment (Raspberry Pi or any Linux box)

### One-time setup

```bash
sudo mkdir -p /srv/blog /srv/blog-data
sudo chown -R $USER:$USER /srv/blog /srv/blog-data
npm i -g pm2
sudo apt-get update && sudo apt-get install -y build-essential python3 pkg-config
```

### PM2 config (`/srv/blog/ecosystem.config.cjs`)

```js
module.exports = {
  apps: [{
    name: 'blog',
    cwd: '/srv/blog',
    script: 'build/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      REACTIONS_FILE: '/srv/blog-data/reactions.json',
      TYPES_FILE: '/srv/blog-data/reaction-types.json'
    }
  }]
};
```

```bash
cd /srv/blog
pm2 start ecosystem.config.cjs --only blog
pm2 save
```

### nginx reverse proxy

```nginx
server {
    server_name blog.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable & reload:

```bash
sudo ln -s /etc/nginx/sites-available/blog.example.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Deploy script (excerpt)

```bash
#!/usr/bin/env bash
set -euo pipefail
USER="pi"; HOST="example.com"; SSH_TARGET="$USER@$HOST"
REMOTE_DIR="/srv/blog"; DATA_DIR="/srv/blog/data"; PM2_NAME="blog"; BUILD_DIR="build"

npm ci && npm run build

ssh "$SSH_TARGET" "mkdir -p '$REMOTE_DIR/$BUILD_DIR' '$DATA_DIR'"
rsync -az --delete ./build/  "$SSH_TARGET:$REMOTE_DIR/build/"
rsync -az --exclude 'reactions.json' ./data/ "$SSH_TARGET:$DATA_DIR/"
rsync -az package.json package-lock.json "$SSH_TARGET:$REMOTE_DIR/"
rsync -az ecosystem.config.cjs "$SSH_TARGET:$REMOTE_DIR/"

ssh "$SSH_TARGET" "bash -lc '
  set -euo pipefail
  cd $REMOTE_DIR
  npm ci --omit=dev
  if pm2 describe $PM2_NAME >/dev/null 2>&1; then
    pm2 reload $PM2_NAME --update-env
  else
    pm2 start ecosystem.config.cjs --only $PM2_NAME
  fi
  pm2 save || true
'"
```

Manual deploy TL;DR:

1. `npm run build`
2. `scp -r build package*.json pi@host:/srv/blog/`
3. `cd /srv/blog && npm ci --omit=dev && pm2 reload blog`

## Backups

Before each deploy, snapshot the reactions file:

```bash
cp /srv/blog-data/reactions.json \
   /srv/blog-data/reactions.$(date +%F-%H%M%S).bak
```

Stick it in cron or do it inside `deploy.sh`.

## Troubleshooting Cheatsheet

| Symptom                 | Probably This                      | Try This                                        |
| ----------------------- | ---------------------------------- | ----------------------------------------------- |
| Counts reset to 1       | Parallel writes / race condition   | Use the queue + single PM2 instance             |
| File never updates      | Wrong path / missing env           | Check `REACTIONS_FILE`, `pm2 show blog`         |
| Data wiped on deploy    | rsync `--delete` nuked your JSON   | Exclude `reactions.json`, keep it in `/srv/...` |
| PM2 "module not found"  | Wrong cwd or missing `npm ci`      | `cd /srv/blog && npm ci --omit=dev`             |
| PM2 "File malformatted" | Using ESM config                   | Switch to `.cjs` or run with `--esm`            |
| nginx 502               | App down / wrong port              | `pm2 logs blog`, verify `proxy_pass`            |
| A11y warnings in dev    | Click handlers on non-interactives | Use `<button>`/`<a>` or add roles + key events  |

## Accessibility Note

SvelteKit’s a11y linter will complain about click handlers on non-interactive elements. Either make them buttons/links or add `role="button"` + key handlers (`on:keydown`). More: [https://svelte.dev/docs/accessibility-warnings#a11y-click-events-have-key-events](https://svelte.dev/docs/accessibility-warnings#a11y-click-events-have-key-events)

---

Happy blogging!
