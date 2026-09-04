# MIRUBOX — Claude Code Rules

## Model / AI APIs

- This app has no Anthropic API. Embeddings use OpenAI `text-embedding-3-small`, server-side only (`lib/embeddings.ts`).
- Never call AI APIs from the client, on file save, or auto-reload.
- If adding a Claude API later, use `claude-haiku-4-5-20251001`.

## TypeScript

- Strict mode — no `any` types
- Prefer explicit return types on exported functions

## Design System

- Mobile-first: write mobile styles first, then `md:` / `lg:` for desktop
- All components use CSS variables — no raw color/hex values in JSX/TSX
- Design tokens live in `app/globals.css` (spec: `DESIGN.md`)
- Product brief: `PRODUCT.md`. Public stack/features: `README.md`.

## Component Conventions

- Server components by default; add `"use client"` only when needed
- Use `next/image` for all images with proper `sizes` prop
- Use `lucide-react` for all icons

## API / Data

- AniList GraphQL: `https://graphql.anilist.co` — free, no key required
- Cache catalogue in DB via `lib/anilist-cache.ts` before returning to the client
- Never call AniList, MangaDex, OpenAI, or ANN from client components
- Home / `/anime` / `/manga` shelves come from `BrowseShelf` + `Anime`. Empty shelves schedule `syncBrowseShelves()` via `after()` — do not block the request on live GraphQL.
- Cron is cron-job.org hitting `/api/cron/*` with `Authorization: Bearer $CRON_SECRET` in every environment, including `next dev`. Shared helper: `lib/cron-auth.ts`. Not Vercel Cron.
- Do not invent a personal rec engine. Detail-page recs are AniList; home is editorial shelves; search is hybrid (`lib/hybrid-search.ts`).

## XP / ranks / badges

Source of truth: `lib/xp.ts` (`XP_VALUES`), `lib/ranks.ts`, `lib/badges.ts`. Award XP only through `awardXP()`.

Ranks from total XP: Watcher 0, Tracker 100, Archivist 500, Curator 1000, Scholar 2000, Sage 3500, Legend 5000.

| Action | XP |
|---|---|
| Add to tracker | 5 (capped at 5 titles/day) |
| Start watching (Planned → In Progress) | 5 |
| Complete a series from In Progress | 20 |
| Mark completed directly | 5 |
| Complete a film or OVA | 10 |
| Rate a title | 10 (once per title) |
| Write a review | 20 (once per title) |
| Add to a list | 5 |
| Create a list | 15 |
| Daily login | 5 |
| 7-day login streak | 5 |
| Follow someone | 5 |
| First title | 25 |
| Season challenge | 25 |
| Badge unlocked | varies (passed as override) |

`INVITE_FRIEND` is in the ledger but has no invite flow yet. Forum is not shipped.

## After Each Task

Document:

1. What was built
2. What to check / test
3. What's next
