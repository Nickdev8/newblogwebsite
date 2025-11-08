# Agent Guide

This repo contains Nick’s personal SvelteKit blog. Use it as a journal, not a commercial product. When touching the codebase, keep things small, personable and aligned with the calm, postcard-like vibe that runs through the current design.

## Quick facts

- Framework: SvelteKit (Node 20). Styling lives in `src/app.css` via Tailwind.
- Posts are Markdown files inside `src/posts`. The home page pulls them through `src/routes/+page.server.ts`.
- About/contact and other static pages sit under `src/routes/...`.
- Reactions are stored in JSON via helpers in `src/lib/server/reactionStore.ts`; avoid breaking that API.

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

This project usually runs on a Raspberry Pi with PM2 and nginx. Don’t assume global services are available; stick to the existing Node/Tailwind stack. If you add dependencies, update `package.json` and document them in `README.md`.

## Checklist before submitting changes

1. `npm run check`
2. Verify pages in both light & dark themes
3. Ensure new assets are referenced from `static/` or remote URLs
4. Keep copy short and readable

That’s it—ship small, thoughtful updates. :)
