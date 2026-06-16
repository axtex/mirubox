# Product

## Register

product

## Users

Anime and manga fans who treat what they watch as a personal canon, not a disposable feed. They browse late at night, often on phone or laptop, deciding what to start next or logging what they finished. They know titles by vibe and memory, not always by exact spelling. They want recommendations that reflect *their* taste, not whatever is trending globally.

## Product Purpose

Mirubox is a discovery and tracking companion for anime and manga. Users search by mood and semantic vibe, maintain a watchlist with status and ratings, and receive recommendations powered by a personal taste vector. A character assistant (Gojo, Frieren, more to unlock) answers questions in voice, not as a generic chatbot.

Success looks like: a user finds their next show in under a minute, tracks progress without friction, and trusts recommendations more over time as their profile grows.

## Brand Personality

**Cinematic · Obsessive · Personal**

Voice is confident and editorial, not cute or corporate. The product should feel like a private screening room and archive: yours, curated, serious about taste. Character chat adds personality, but the core app UI stays task-focused (Letterboxd energy, not mascot-driven fandom UI).

## Anti-references

- **Generic anime sites**: MyAnimeList-style clutter, busy sidebars, ad-heavy list UIs, rainbow tag soup.
- **AI slop**: Indigo/violet gradients, glassmorphism everywhere, purple chat bubbles, interchangeable SaaS dark mode.
- **Kawaii overload**: Pastels, bubbly rounded UI, mascot-first chrome that undermines the archive feel.
- **Streaming clone patterns**: Endless identical carousels with no sense of personal curation.

## Design Principles

1. **Taste is the product.** Every screen should reinforce that mirubox knows what *you* like, not what's popular. Recommendations, watchlist state, and ratings are first-class, not decorative.
2. **Archive, not feed.** Discovery rows are curated shelves, not infinite scroll noise. Prefer one strong row over many repetitive grids.
3. **Cinematic moments, tool UI.** Hero and section headers can be bold and editorial; forms, filters, and tracking controls stay restrained and familiar.
4. **Characters earn their place.** The assistant is a delight layer on top of a competent tracker, not the whole identity of the app.
5. **Show the work.** Scores, status, match %, XP: surface meaningful data in monospace labels. Avoid empty marketing copy on task screens.

## Accessibility & Inclusion

- **Target:** WCAG 2.1 AA as the standard bar; fix gaps incrementally as features ship.
- **Keyboard:** All interactive flows must be reachable without a mouse; no hover-only affordances for core actions.
- **Motion:** Respect `prefers-reduced-motion` for shimmer, scale, and transition effects.
- **Contrast:** Muted text tokens must meet 4.5:1 on body backgrounds; crimson accent used for emphasis, not large text blocks.
- **Touch:** Minimum 44px touch targets on mobile for primary actions and navigation.
