# Agent Guide

This repo contains Nick’s personal SvelteKit blog. Use it as a journal, not a commercial product. When touching the codebase, keep things small, personable and aligned with the calm, postcard-like vibe that runs through the current design.

## Quick facts

- Everything app-related lives under `app/`; all paths below assume that prefix unless stated otherwise.
- Framework: SvelteKit (Node 20). Styling lives in `app/src/app.css` via Tailwind.
- Posts are Markdown files inside `app/src/posts`. The home page pulls them through `app/src/routes/+page.server.ts` and sorts them newest-first by entry date.
- About/contact and other static pages sit under `app/src/routes/...`. The About page carousel now pulls a randomized set of media from all posts (rewritten to the CDN) and the snapshot blocks were removed for a leaner layout.
- Reactions are stored in JSON via helpers in `app/src/lib/server/reactionStore.ts`; avoid breaking that API. The `/admin` sidebar also sorts posts by most recent entry date.
- Live stats card lives at `app/src/lib/LiveStatsCard.svelte`, is fixed bottom-left on all pages, and shows the full metrics list on mobile too (closed state is a tiny steps pill).
- Fitbit integration is server-only, cached in-memory with a 10-minute throttle, and persists tokens in `app/data/fitbit/tokens.json` (bootstrap from env only if that file is missing). Tokens are refreshed and rewritten atomically; do not read tokens from `.env` after bootstrap. Service returns steps/distance/calories/active minutes/resting HR/sleep/heartRateBpm/stepsWeek/floors plus timestamps via `/api/steps`.

## Fitbit Re-Authorization Runbook (Scopes, Tokens, Recovery)

Use this whenever you add scopes, see 403s, or need fresh tokens. App details: `https://dev.fitbit.com/apps/details/23TNH3`.

### When you must re-authorize
- Scopes changed in the dashboard
- Fitbit returns 403 for metrics you expect
- `app/data/fitbit/tokens.json` is missing/corrupted
- App access revoked in Fitbit

### 1) Confirm scopes
- Ensure app has `activity`, `sleep`, `heartrate` at https://dev.fitbit.com/apps/details/23TNH3. If you change scopes, re-authorize.

### 2) Build auth URL
```
https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=23TNH3&redirect_uri=http://localhost:8080/callback&scope=activity%20sleep%20heartrate
```
- Scopes are space-separated (`%20` encoded). Redirect URI must match the dashboard.

### 3) Approve
- Log in, click Allow. You’ll land on `http://localhost:8080/callback?code=...`. Copy `code`.

### 4) Exchange code for tokens
Use Basic auth `BASE64(CLIENT_ID:CLIENT_SECRET)`:
```bash
curl -X POST https://api.fitbit.com/oauth2/token \
  -H "Authorization: Basic BASE64(CLIENT_ID:CLIENT_SECRET)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=PASTE_CODE_HERE&redirect_uri=http://localhost:8080/callback"
```
You’ll get `access_token`, `refresh_token`, `expires_in`, `scope`.

### 5) Compute expires_at
```bash
date +%s  # now
```
`expires_at = now + expires_in` (unix seconds).

### 6) Update token store
Edit `app/data/fitbit/tokens.json` and replace contents:
```json
{
  "access_token": "NEW_ACCESS_TOKEN",
  "refresh_token": "NEW_REFRESH_TOKEN",
  "expires_at": 1766907185
}
```
- This file is the only source of truth. Never reuse old refresh tokens. Do not commit it.

### 7) Restart server
```
npm run dev   # or pnpm dev
```

### 8) Verify
```bash
curl -s http://localhost:5173/api/steps
```
- Expect populated steps/activity; heart rate may be immediate; sleep/resting HR appear after overnight processing; no 401/403.

### 9) Nulls that are normal
- `restingHeartRate`: until next morning
- `sleepDurationMinutes`/`sleepScore`: until you sleep/process
- `activeMinutes`: until thresholds met

### 10) What you never need to do
- Re-authorize on restart or after token refresh
- Edit `.env` for tokens
- Manually refresh tokens

Mental model: dashboard sets allowed scopes; auth URL grants permission; `tokens.json` is permanent identity; refresh tokens rotate; null often means “no data yet,” not broken.

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
- Respect existing Markdown frontmatter fields (`title`, `description`, `coverImage`, `live`, `lat/lng`, `sort_order`), as they drive the landing page cards. Relative `/blogimages/...` paths are rewritten to `https://cdn.nickesselman.nl/blogimages/...` automatically on post pages and the About carousel, so keep using the short paths in content.

## Deployment notes

- Production runs inside Docker (see `docker-compose.yml`). Rebuild and restart with `docker compose up -d --build` from the repo root.
- The container runs as the unprivileged `nodeuser` and bind-mounts `app/src/posts`, so make sure host permissions allow read access for that directory.
- Secrets (GitHub token, email creds, Immich URL) live in `.env`; never log or commit them.
- Stick to the existing Node/Tailwind stack. If you add dependencies, update `package.json` and mention them in `README.md`.

## Markdown admin

- `/admin` is a custom, password-protected editor. Set `ADMIN_PASSWORD` in `.env` (and Docker/PM2) so logins work.
- Auth is cookie-based—no GitHub/Decap—so keep the password long and rotate if it leaks.
- The editor only lists files from `app/src/posts` and lets you edit the raw markdown. It does **not** create slugs or upload media.
- All writes happen directly on disk, so ensure bind mounts/storage permissions let the Node process write to `app/src/posts`.

## Checklist before submitting changes

1. `npm run check`
2. Verify pages in both light & dark themes
3. Ensure new assets are referenced from `static/` or remote URLs
4. Keep copy short and readable

That’s it—ship small, thoughtful updates. :)
