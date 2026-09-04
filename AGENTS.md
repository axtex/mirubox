<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# mirubox — agent context

Live product: [mirubox.vercel.app](https://mirubox.vercel.app). Next.js 16 App Router, React 19, TypeScript strict, Prisma + Supabase Postgres (pgvector, pg_trgm), NextAuth v5 (Google + Resend).

Read before changing product or UI:

- `README.md` — shipped features, stack, architecture
- `PRODUCT.md` — who it's for, what's shipped vs not, brand
- `DESIGN.md` — visual system; tokens in `app/globals.css`
- `CLAUDE.md` — TypeScript, data, XP rules

## Do

- Server components by default. `"use client"` only for interactivity.
- CSS variables from `app/globals.css` — no raw hex in JSX/TSX.
- Cache AniList in Postgres (`lib/anilist-cache.ts`) before returning catalogue data.
- Award XP only via `awardXP()` in `lib/xp.ts`. Ranks: `lib/ranks.ts`. Badges: `lib/badges.ts`.
- Cron jobs are scheduled on cron-job.org, authenticated with `CRON_SECRET` on `/api/cron/*`.

## Don't

- Call AniList, MangaDex, OpenAI, or ANN from the browser.
- Call AI APIs on save or auto-reload. OpenAI is embeddings-only, server-side.
- Add a personal taste-vector recommendation engine. Discovery is hybrid search + editorial shelves; detail recs come from AniList.
- Ship or advertise Forum. The community tab is a placeholder.
- Use Vercel Cron. Do not add `vercel.json` cron config unless asked.
