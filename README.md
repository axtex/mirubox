# mirubox

Your anime and manga companion — search by vibe, track what you watch, and get recommendations from an AI assistant who actually stays in character.

## Live demo

https://mirubox.vercel.app

## What it is

Mirubox is a discovery and tracking platform for anime and manga. Instead of scrolling endless lists or memorizing Japanese titles, you describe what you're in the mood for — "cozy slice of life with magic" — and get back series that actually match.

Every show you watch, rate, and finish feeds a personal taste profile. That profile powers recommendations that improve as you use the app, not generic trending lists everyone sees.

The character assistant is the other half of the story. Pick Gojo or Frieren as your guide — each one responds in their own voice, powered by Claude, with personality rules tight enough that they never break character. Earn XP from everyday actions, unlock new assistants, and level up as you explore.

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
- **XP system** — earn points for every action (+5 watchlist, +10 completed, +10 rating). Every 100 XP is a level up.

### Character Assistant

- **Choose your guide** — Gojo or Frieren as your AI assistant, each with a distinct personality.
- **In-character responses** — Claude Haiku with hand-crafted system prompts; they stay in voice, always.
- **Unlock more characters** — Frieren unlocks at 100 XP; more assistants coming as you level up.
- **50 messages per day** — enough room to ask for recs, explain a plot twist, or settle a "should I watch this?" debate.

### Manga

- **Full browse and detail pages** — same polish as anime, built on the same AniList data layer.
- **Chapter and volume tracking** — progress that respects how you actually read.
- **Same discovery stack** — semantic search and recommendations work across both anime and manga.

## Technical highlights

**Hybrid search architecture** — Semantic pgvector queries and AniList keyword search run in parallel, then merge with overlap boosting so exact title matches and vibe matches both surface.

**Taste vector recommendation engine** — A weighted average of embedding vectors from your completed and in-progress series, scored by your ratings, drives cosine-similarity recommendations via pgvector.

**Two-model AI approach** — OpenAI `text-embedding-3-small` handles all embedding and search work; Anthropic Claude Haiku handles conversational character responses — right model for each job.

**Character system prompt engineering** — Each assistant ships with a detailed persona spec (speech patterns, boundaries, help scope) so responses feel like the character, not a generic chatbot with a skin.

**AniList GraphQL + DB caching strategy** — Media fetched from AniList is upserted into PostgreSQL with a 24-hour TTL, keeping pages fast while embeddings and recommendations query local data.

## Architecture

```
AniList GraphQL API → cached in PostgreSQL
User interactions → XP events → taste profile
Taste profile → pgvector similarity → recommendations
Natural language query → OpenAI embed → pgvector search
Character selection → Claude Haiku (character prompt) → response
```

## Stack

| Frontend | Backend + AI |
|---|---|
| Next.js 16 (App Router) | PostgreSQL + pgvector (Supabase) |
| TypeScript | Prisma ORM, NextAuth v5 |
| Tailwind CSS | OpenAI text-embedding-3-small |
| Anybody + Geist + Space Mono fonts | Anthropic Claude Haiku |
| | AniList GraphQL API |
| | Vercel deployment |
