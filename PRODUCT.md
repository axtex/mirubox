# Product

## Register

product

## Users

Anime and manga fans who treat what they watch as a personal canon, not a disposable feed. They browse late at night, often on phone or laptop, deciding what to start next or logging what they finished. They know titles by vibe and memory, not always by exact spelling. They want discovery and a profile that reflect *their* taste, not whatever is trending globally.

## Product Purpose

Mirubox is a personal archive for anime and manga. Users search by mood, vibe, or misspelled title; track status and progress; rate and review; and build a public profile, passport, and lists from that record.

Discovery is hybrid search plus editorial shelves — not a personal taste-vector rec engine. Ratings and tracker history feed the profile, passport, genre taste, and taste compatibility with friends.

Success looks like: a user finds a next title in under a minute, logs progress without friction, and sees their archive (rank, badges, passport, lists) get more specific over time.

Live at [mirubox.vercel.app](https://mirubox.vercel.app). Independent, source-available, in active development.

## Shipped

- Track anime and manga (status, episode/chapter progress, ratings). Import from AniList or MyAnimeList.
- Hybrid search: mood/vibe embeddings, typo-tolerant titles, `similar to {title}`. Browse filters (genre, season, format, year).
- Home: editorial shelves, continue strip, season challenge.
- Reviews with spoiler flag. Curated lists (create, share, like).
- Public profiles: activity, stats, reviews, lists, top-3 favourites, genre taste.
- Passport: shareable card from rank, XP, taste, favourites.
- Community: follows, taste compatibility, friend activity, ANN news. Forum tab is a placeholder.
- XP ledger and ranks (Watcher → Legend). Badges (completion, genre, streaks, seasonal, prestige).
- Season challenges. Schedule for airing episodes (AniList) and chapters (MangaDex).
- In-app notifications: episodes/chapters, follows, list likes, rank-ups, badges.
- Auth: Google + Resend magic link; same-email accounts are linked.

## Not shipped

- Forum
- Invite-a-friend XP (action exists in the ledger; no invite flow)
- Personal recommendation ranker / taste vector that picks titles for you
- Native push (schema stub only)

## Brand Personality

**Cinematic · Obsessive · Personal**

Voice is confident and editorial, not cute or corporate. The product should feel like a private screening room and archive: yours, curated, serious about taste. UI stays task-focused (Letterboxd energy, not mascot-driven fandom UI).

## Anti-references

- **Generic anime sites**: MyAnimeList-style clutter, busy sidebars, ad-heavy list UIs, rainbow tag soup.
- **AI slop**: Indigo/violet gradients, glassmorphism everywhere, purple chat bubbles, interchangeable SaaS dark mode.
- **Kawaii overload**: Pastels, bubbly rounded UI, mascot-first chrome that undermines the archive feel.
- **Streaming clone patterns**: Endless identical carousels with no sense of personal curation.

## Design Principles

1. **Taste is the product.** Watchlist state, ratings, and discovery are first-class, not decorative next to a trending grid.
2. **Archive, not feed.** Discovery rows are curated shelves, not infinite scroll noise. Prefer one strong row over many repetitive grids.
3. **Cinematic moments, tool UI.** Hero and section headers can be bold and editorial; forms, filters, and tracking controls stay restrained and familiar.
4. **Show the work.** Scores, status, match %, XP: surface meaningful data in monospace labels. Avoid empty marketing copy on task screens.

## Accessibility & Inclusion

- **Target:** WCAG 2.1 AA as the standard bar; fix gaps incrementally as features ship.
- **Keyboard:** All interactive flows must be reachable without a mouse; no hover-only affordances for core actions.
- **Motion:** Respect `prefers-reduced-motion` for shimmer, scale, and transition effects.
- **Contrast:** Muted text tokens must meet 4.5:1 on body backgrounds; crimson accent used for emphasis, not large text blocks.
- **Touch:** Minimum 44px touch targets on mobile for primary actions and navigation.
