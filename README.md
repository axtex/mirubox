# mirubox

**Track what you watch. Discover what to watch next.**

**Live at:** [mirubox.vercel.app](https://mirubox.vercel.app)

---

## Why it exists

Most anime trackers are either a cluttered database or a trending feed. Neither is built around *your* taste — and neither lets you search the way you actually remember titles: by mood, vibe, or a misspelled name.

mirubox is a personal archive. Everything you add, rate, and review lives on your profile and passport — rank, genre taste, favourites — as a record of what actually moved you. Taste is worth taking seriously, not as a stat to optimise.

---

## Stack

- [Next.js 16](https://nextjs.org/) — App Router, React 19, server components by default
- [TypeScript](https://www.typescriptlang.org/) — strict mode
- [Tailwind CSS](https://tailwindcss.com/) — design tokens in `app/globals.css`
- [Prisma](https://www.prisma.io/) — ORM over PostgreSQL
- [Supabase](https://supabase.com/) — Postgres + [pgvector](https://github.com/pgvector/pgvector) + `pg_trgm`
- [NextAuth v5](https://authjs.dev/) — Google + Resend magic link
- [AniList GraphQL](https://anilist.gitbook.io/anilist-apiv2-docs/) — anime and manga catalogue
- [MangaDex](https://api.mangadex.org/docs/) — chapter airing for the schedule
- [OpenAI](https://openai.com/) — `text-embedding-3-small` for semantic search
- [Vercel](https://vercel.com/) — hosting and ISR

---

## What it does

- **Track** — Add anime and manga with status, episode/chapter progress, and ratings. Import from AniList or MyAnimeList. Home continues whatever is in progress.
- **Discover** — Search by mood or vibe (`"something lonely and beautiful"`), by title (typos included), or by `"similar to {title}"`. Browse by genre, season, format, and year. Home is editorial shelves.
- **Review** — Write reviews, mark spoilers, keep a critical record.
- **Lists** — Curate, share, and like lists of titles.
- **Profile and passport** — Public profile with activity, stats, reviews, lists, and top-3 favourites. Passport is a shareable card from rank, XP, genre taste, and favourites.
- **Community** — Follows, taste compatibility, friend activity, and news.
- **XP, ranks, and badges** — Earn XP through tracking, reviews, lists, and daily use; climb from Watcher to Legend. Badges for completion, genre, streaks, and prestige.
- **Season challenges** — Watch or complete current-season titles for seasonal badges and bonus XP.
- **Schedule** — Upcoming episodes and chapters for titles you're tracking.
- **Notifications** — In-app for new episodes/chapters, follows, list likes, rank-ups, and badges.

---

## Technical highlights

**Hybrid search, not a chatbot.** Queries are classified, then run through the pipelines that actually help: pgvector cosine similarity on title embeddings (mood/vibe), `pg_trgm` fuzzy match (typos like `naurto`), AniList keyword search (exact titles), and a similar-to path that ranks by embedding distance from a reference title. Results merge with semantic hits first. Embeddings are `text-embedding-3-small` (1536-dim) stored as pgvector; missing vectors are generated lazily on detail views so the catalogue fills itself.

**AniList is a backend dependency, never a client one.** Catalogue data is cached in Postgres (`lib/anilist-cache.ts`, 24h TTL) before anything is returned to the browser. Home, `/anime`, and `/manga` rows are served from `BrowseShelf` + `Anime` — not live GraphQL on every request. Cold visits fall back to AniList once and schedule a background sync via `after()`. [cron-job.org](https://cron-job.org) hits `/api/cron/*` with `Authorization: Bearer $CRON_SECRET` to refresh shelves, check airing episodes (AniList) and chapters (MangaDex), and fetch news.

**Taste and XP are first-class data, not overlays.** Ratings, tracker status, and reviews feed the profile, passport, and taste compatibility. XP is a ledger (`XPTransaction`) with a single source of truth for action values; ranks derive from total XP; badges are a separate achievement track. Completing a series you were watching pays more than dumping it straight into Completed — the journey is the product.

**Auth that doesn't split your archive.** NextAuth v5 with JWT sessions, Google OAuth, and Resend magic links. Same-email Google and magic-link accounts are linked so phone and desktop don't become two trackers.

---

## Design decisions

- **Taste is the product.** Watchlist state, ratings, and discovery are first-class — not decorative next to a trending grid.
- **Archive, not feed.** Discovery is curated shelves (one strong row, seven posters) instead of infinite identical carousels.
- **Letterboxd discipline, not MAL clutter.** Editorial headlines, restrained forms, no ad-heavy list UI, no kawaii chrome, no AI-slop palettes.
- **Show the work.** Scores, status, match %, XP live in monospace labels. Task screens don't get marketing copy.
- **Server-first.** Server components by default; `"use client"` only when interactivity requires it. No AniList from the browser.
- **Tokens only.** All colour in CSS variables (`app/globals.css`). Mobile-first, then `md:` / `lg:`. Dark-only obsidian with crimson used sparingly.

---

## Architecture

```
Browser
  └── Next.js App Router (server components + route handlers)
        ├── Prisma ──► Supabase Postgres
        │                 ├── Anime cache + embeddings (pgvector)
        │                 ├── BrowseShelf rows
        │                 ├── Tracker, ratings, reviews, lists, XP, badges
        │                 └── Users / NextAuth adapter
        ├── AniList GraphQL (server-only; cache-then-return)
        ├── MangaDex (chapter airing; server-only)
        ├── ANN RSS (news; server-only)
        ├── OpenAI embeddings (on cache miss / populate jobs)
        ├── Resend (magic-link email)
        └── /api/cron/*  ◄── cron-job.org (Bearer $CRON_SECRET)
              ├── browse-sync
              ├── episode-check
              ├── chapter-check
              └── news-fetch
```

---

## License

mirubox is source-available under the
[Business Source License 1.1](./LICENSE).

The source code is publicly visible for transparency
and learning. Commercial use requires explicit written
permission from the author.

Non-commercial and personal use is permitted.

© 2026 Avneet Thind

---
