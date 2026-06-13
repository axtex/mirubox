# MIRUBOX — Claude Code Rules

## Model
- Use `claude-haiku-4-5-20251001` for all Claude API calls
- Never call AI APIs on file save or auto-reload

## TypeScript
- Strict mode — no `any` types
- Prefer explicit return types on exported functions

## Design System
- Mobile-first: write mobile styles first, then `md:` / `lg:` for desktop
- All components use CSS variables — no raw color/hex values in JSX/TSX
- Design tokens live in `app/globals.css`

## Component Conventions
- Server components by default; add `"use client"` only when needed
- Use `next/image` for all images with proper `sizes` prop
- Use `lucide-react` for all icons

## API / Data
- AniList GraphQL: `https://graphql.anilist.co` — free, no key required
- Cache anime in DB via `lib/anilist-cache.ts` before returning to client
- Never call AniList directly from client components

## After Each Task
Document:
1. What was built
2. What to check / test
3. What's next

## XP System
- +5 XP for adding to watchlist
- +10 XP for marking completed
- +10 XP for rating
- Every 100 XP = 1 level up
