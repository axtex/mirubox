# mirubox

Your anime and manga companion — search by vibe, track what you watch, and get recommendations that improve as your taste profile grows.

## Live demo

https://mirubox.vercel.app

## What it is

Mirubox is a discovery and tracking platform for anime and manga. Instead of scrolling endless lists or memorizing Japanese titles, you describe what you're in the mood for — "cozy slice of life with magic" — and get back series that actually match.

Every show you watch, rate, and finish feeds a personal taste profile. That profile powers recommendations that improve as you use the app, not generic trending lists everyone sees. Earn XP from everyday actions — adding to your watchlist, completing series, leaving ratings — and rank up as you explore.

## Features

### Discover

- **Hybrid semantic search** — natural language queries powered by pgvector + OpenAI embeddings. Type how you feel, not what you think the title might be.
- **Vibe-first results** — queries like "cozy slice of life with magic" surface the right anime, not just keyword matches.
- **AI-powered recommendations** — a taste vector built from your watchlist and ratings finds series similar to what you actually love.
- **Browse everything** — trending, popular, and seasonal anime and manga, always fresh from AniList.

### Track

- **Watchlist with status tracking** — watching, completed, plan to watch, dropped, on hold.
- **1–10 rating system** — score what you've finished and feed your taste profile.
- **Progress tracking** — episode and chapter counts per series, so you always know where you left off.
- **XP & badge system** — earn XP for tracking, rating, reviewing, and list-building; climb 7 ranks and unlock 49 badges. See [XP & Badge System](#xp--badge-system) below.

### Manga

- **Full browse and detail pages** — same polish as anime, built on the same AniList data layer.
- **Chapter and volume tracking** — progress that respects how you actually read.
- **Same discovery stack** — semantic search and recommendations work across both anime and manga.

## XP & Badge System

Every action on mirubox earns XP server-side — client-submitted XP values are never trusted. XP accumulates toward a rank, and separately unlocks badges for specific achievements.

### XP sources

| Action | XP | Rule |
|---|---|---|
| Add a title to your archive | +5 | Capped at 5/day (25 XP/day) |
| Start watching/reading a planned title | +5 | Once per title |
| Mark a series as completed (was in progress) | +20 | Once per title |
| Add a title directly as completed | +5 | Once per title |
| Complete a movie, OVA, special, or music video | +10 | Once per title, instead of the +20 completion XP |
| Rate a title | +10 | First rating only |
| Write a review | +20 | First review only |
| Add a title to a list | +5 | Once per title per list |
| Create a list | +15 | Requires at least 1 title |
| Daily login | +5 | Once per day |
| 7-day login streak | +5 | On the 7th consecutive login day |
| Add a friend | +5 | Community feature, not yet shipped |
| Invite a friend | +25 | Community feature, not yet shipped |
| First title you ever add | +25 | One-time bonus |
| Complete a season challenge (3 titles from a season) | +25 | Per season |
| Unlock a badge | Varies | See badge table below |

### Ranks

| Rank | XP threshold |
|---|---|
| WATCHER | 0 |
| TRACKER | 100 |
| ARCHIVIST | 500 |
| CURATOR | 1,000 |
| SCHOLAR | 2,000 |
| SAGE | 3,500 |
| LEGEND | 5,000 |

### Badges

**Completion**

| Badge | Requirement | XP |
|---|---|---|
| First Finish | Complete 1 anime | 50 |
| Series Binger | Complete 10 anime | 75 |
| Completionist | Complete 50 anime | 150 |
| Centenarian | Complete 100 anime | 300 |
| Cinephile | Complete 10 movies | 100 |
| Completionist+ | Complete every entry in a franchise | 300 |

**Demographic**

| Badge | Requirement | XP |
|---|---|---|
| Shonen Enthusiast / Shojo Enthusiast / Seinen Enthusiast / Josei Enthusiast | Complete 10 titles of that demographic | 100 |
| Shonen Veteran / Shojo Veteran / Seinen Veteran / Josei Veteran | Complete 30 titles of that demographic | 200 |

**Genre mastery**

| Badge | Requirement | XP |
|---|---|---|
| Mind Bent | Complete 10 psychological titles | 100 |
| Slice of Lifer | Complete 10 slice of life titles | 100 |
| The Romantic | Complete 10 romance titles | 100 |
| Horror Head | Complete 10 horror titles | 100 |
| Sci-Fi Fan | Complete 10 sci-fi titles | 100 |
| Fantasy Dweller | Complete 10 fantasy titles | 100 |

**Manga**

| Badge | Requirement | XP |
|---|---|---|
| Reader | Complete 5 manga | 75 |
| Bookworm | Complete 20 manga | 150 |
| Stacker | Complete 50 manga | 250 |
| One and Done | Complete 10 one-shots | 100 |
| Read Before Watch | Read a manga before watching its anime adaptation | 200 |
| Origin Seeker | Complete 5 manga with an anime adaptation | 150 |
| Up to Date | Complete a manga that's still publishing | 75 |

**Critic**

| Badge | Requirement | XP |
|---|---|---|
| First Take | Write 1 review | 50 |
| Critic | Write 10 reviews | 100 |
| Staff Writer | Write 25 reviews | 200 |
| Big Rater | Rate 50 titles | 75 |
| Discerning | Rate 100 titles | 150 |

**Streak**

| Badge | Requirement | XP |
|---|---|---|
| On a Roll | 7-day activity streak | 20 |
| Committed | 30-day activity streak (longest) | 50 |
| Devoted | 100-day activity streak (longest) | 100 |

**Seasonal**

| Badge | Requirement | XP |
|---|---|---|
| Spring/Summer/Fall/Winter Watcher | Complete that season's challenge | 25 |
| Seasoned Watcher | Earn 4 seasonal badges in a row | 100 |

**Explorer**

| Badge | Requirement | XP |
|---|---|---|
| Genre Explorer | Complete titles across 8 unique genres | 100 |
| Historian | Complete a title from before 2000 | 50 |
| Hidden Gem | Complete 10 low-popularity titles | 250 |
| All-Rounder | Complete a TV series, manga, movie, and OVA | 100 |

**Social**

| Badge | Requirement | XP |
|---|---|---|
| Recruiter *(coming soon)* | Invite 1 friend | 25 |
| Ambassador *(coming soon)* | Invite 5 friends | 100 |
| List Maker | Create 3 public lists with titles | 75 |
| Well Liked | Get 10 likes on one of your lists | 100 |

**Prestige**

| Badge | Requirement | XP |
|---|---|---|
| Top 100 | Complete 50 AniList all-time top 100 titles | 500 |
| Purist | Complete 20 titles scored 9.0+ on AniList | 300 |
| Contrarian | Rate 10 titles 3+ points away from the AniList average | 150 |

### Streaks & seasonal challenges

- **Activity streak** — consecutive days with any XP-earning action other than daily login.
- **Seasonal challenge** — 3 titles completed or in progress from a given season earns that season's named badge (e.g. Summer 2026 Watcher). Seasoned Watcher = 4 consecutive seasonal badges.

### Anti-grind rules

- Archive-add XP is capped at 5 actions (25 XP) per day.
- Completion XP (+20) only fires when a title transitions from In Progress → Completed — adding a title directly as Completed only earns the smaller +5 direct-add XP.
- Rating and review XP are awarded once per title, on the first rating/review only.
- Adding the same title to the same list twice never re-awards XP.

### List creation rule

A list must contain at least one title to be created — enforced both in the UI (create button stays disabled) and in the API (`POST /api/lists` rejects empty lists with a 400).

## Technical highlights

**Hybrid search architecture** — Semantic pgvector queries and AniList keyword search run in parallel, then merge with overlap boosting so exact title matches and vibe matches both surface.

**Taste vector recommendation engine** — A weighted average of embedding vectors from your completed and in-progress series, scored by your ratings, drives cosine-similarity recommendations via pgvector.

**AniList GraphQL + DB caching strategy** — Media fetched from AniList is upserted into PostgreSQL with a 24-hour TTL, keeping pages fast while embeddings and recommendations query local data.

## Architecture

```
AniList GraphQL API → cached in PostgreSQL
User interactions → XP events → taste profile
Taste profile → pgvector similarity → recommendations
Natural language query → OpenAI embed → pgvector search
```

## Stack

| Frontend | Backend + AI |
|---|---|
| Next.js 16 (App Router) | PostgreSQL + pgvector (Supabase) |
| TypeScript | Prisma ORM, NextAuth v5 |
| Tailwind CSS | OpenAI text-embedding-3-small |
| Anybody + Geist + Space Mono fonts | AniList GraphQL API |
| | Vercel deployment |
