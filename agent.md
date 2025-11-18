# Agent Guide

This repo contains Nick’s personal SvelteKit blog. Use it as a journal, not a commercial product. When touching the codebase, keep things small, personable and aligned with the calm, postcard-like vibe that runs through the current design.

## Quick facts

- Everything app-related lives under `app/`; all paths below assume that prefix unless stated otherwise.
- Framework: SvelteKit (Node 20). Styling lives in `app/src/app.css` via Tailwind.
- Posts are Markdown files inside `app/src/posts`. The home page pulls them through `app/src/routes/+page.server.ts`.
- About/contact and other static pages sit under `app/src/routes/...`.
- Reactions are stored in JSON via helpers in `app/src/lib/server/reactionStore.ts`; avoid breaking that API.

## Local workflow

```bash
cd app
npm ci
npm run dev   # localhost:5173
```

Before handing work back, run:

```bash
npm run check   # type + a11y lint (currently warns if there are legacy issues)
```

## Design tone

- Keep layouts minimal, breathable, and text-forward. It’s a personal blog, so prefer small sections over dashboard grids.
- Dark/light modes already exist; reuse the “glass panel” utility and Space Grotesk typeface for consistency.
- Only use cinematic map/hero flourishes if they support the story; otherwise keep pages grounded.

## When editing content

- Short, human copy beats long explanations.
- Link out to the main site (`https://nickesselman.nl`) for deep dives.
- Respect existing Markdown frontmatter fields (`title`, `description`, `coverImage`, `live`, `lat/lng`), as they drive the landing page cards.

## Deployment notes

- Production runs inside Docker (see `docker-compose.yml`). Rebuild and restart with `docker compose up -d --build` from the repo root.
- The container runs as the unprivileged `nodeuser` and bind-mounts `app/src/posts`, so make sure host permissions allow read access for that directory.
- Secrets (GitHub token, email creds, Immich URL) live in `.env`; never log or commit them.
- Stick to the existing Node/Tailwind stack. If you add dependencies, update `package.json` and mention them in `README.md`.

## Editing via Decap CMS

- `/admin` hosts Decap CMS; `static/admin/index.html` bootstraps it and `static/admin/config.yml` controls collections/media paths.
- The config is served through `src/routes/admin/config.yml/+server.ts` (and `/config.yml` re-exports it). Keep those endpoints in sync with the static file.
- GitHub is the configured backend, so any commit-impacting change must keep the repo public paths (`app/src/posts`, `app/static/blogimages`) accurate.
- For local testing, run `npx decap-server` from the repo root alongside `npm run dev` so `/admin` can authenticate without GitHub.

## Checklist before submitting changes

1. `npm run check`
2. Verify pages in both light & dark themes
3. Ensure new assets are referenced from `static/` or remote URLs
4. Keep copy short and readable

That’s it—ship small, thoughtful updates. :)
