---
name: mirubox
description: Obsidian cinematic anime & manga archive — personal taste, crimson accent, editorial type.
colors:
  bg: "#0f0f12"
  bg-surface: "#131316"
  bg-elevated: "#1b1b1e"
  bg-card: "#1f1f22"
  bg-card-high: "#2a2a2d"
  fg: "#e4e1e6"
  fg-muted: "#9e9ea8"
  fg-subtle: "#5a5a65"
  primary: "#e61e2a"
  primary-dim: "#ffb3ad"
  primary-hover: "#cc1824"
  accent-bright: "#ff3040"
  secondary: "#00dbe9"
  tertiary: "#bb10fd"
  score-high: "#4ade80"
  score-mid: "#fbbf24"
  score-low: "#f87171"
  status-watching: "#3b82f6"
  status-completed: "#4ade80"
  status-plan: "#e4e1e6"
  status-dropped: "#e61e2a"
  status-hold: "#fbbf24"
typography:
  display:
    fontFamily: "var(--font-anybody), system-ui, sans-serif"
    fontSize: "clamp(40px, 7vw, 72px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  headline-lg:
    fontFamily: "var(--font-anybody), system-ui, sans-serif"
    fontSize: "clamp(24px, 3.5vw, 40px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline-md:
    fontFamily: "var(--font-anybody), system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "var(--font-geist), system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "var(--font-space-mono), ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.1em"
rounded:
  sm: "2px"
  md: "4px"
spacing:
  sm: "8px"
  md: "12px"
  lg: "20px"
  section: "72px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
    height: "44px"
  card-base:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: "0"
  badge:
    backgroundColor: "rgba(255,255,255,0.05)"
    textColor: "{colors.fg-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 7px"
  genre-chip:
    backgroundColor: "rgba(255,255,255,0.07)"
    textColor: "{colors.fg-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "3px 10px"
---

# Design System: mirubox

## Overview

**Creative North Star: "The Personal Archive"**

Mirubox looks like a private screening room meets a taste ledger: near-black obsidian surfaces, poster art doing the heavy lifting, crimson reserved for decisive actions and scores. The UI is product-first (Letterboxd discipline) with cinematic punctuation on discovery surfaces, not streaming-app carousel overload.

Density is moderate: mobile horizontal shelves, desktop seven-column poster grids, monospace labels for metadata. Motion is short (200ms), purposeful (hover glow on posters, shimmer skeletons), never choreographed page loads.

**Key Characteristics:**
- Dark-only obsidian palette with crimson primary
- Three-font stack: Anybody (display), Geist (body), Space Mono (labels/data)
- Sharp 2–4px radii; no bubbly corners
- Tonal layering over heavy shadows
- Uppercase mono labels for metadata, not body copy

Explicitly rejects: AI slop palettes, kawaii pastels, generic anime list UIs, glass-everywhere chrome.

## Colors

Obsidian neutrals tinted cool; crimson is the sole warm accent for primary actions and score pills.

### Primary
- **Archive Crimson** (`#e61e2a`): Primary buttons, score pills, section underlines, active nav. The accent of commitment.
- **Crimson Bright** (`#ff3040`): Hover emphasis, bright accent states.
- **Crimson Hover** (`#cc1824`): Primary button hover fill.

### Secondary
- **Signal Cyan** (`#00dbe9`): Rare secondary accent; data highlights, not decoration.

### Tertiary
- **Arcane Violet** (`#bb10fd`): Character-specific accents only (e.g. Frieren), not global UI.

### Neutral
- **Obsidian Base** (`#0f0f12`): Page background.
- **Surface** (`#131316`): Footer, elevated panels.
- **Elevated** (`#1b1b1e`): Inputs, inset surfaces.
- **Card** (`#1f1f22` / `#2a2a2d`): Cards, skeleton mid-tone.
- **Fog** (`#e4e1e6`): Primary text.
- **Ash** (`#9e9ea8`): Secondary text.
- **Stone** (`#5a5a65`): Tertiary labels; lighten if contrast fails AA on small text.

### Semantic
- **Score High / Mid / Low**: Green, amber, red for rating badges.
- **Status dots**: Blue (watching), green (completed), white (plan), crimson (dropped), amber (hold).

### Named Rules
**The Crimson Sparingly Rule.** Crimson appears on primary CTAs, scores, and one underline per section header. It is not a background wash.

**The Token-Only Rule.** Components use `var(--*)` from `app/globals.css`. No raw hex in JSX except third-party brand assets (Google sign-in).

## Typography

**Display Font:** Anybody (geometric, bold, editorial)
**Body Font:** Geist (clean sans for reading and UI)
**Label Font:** Space Mono (metadata, buttons, filters)

**Character:** Editorial headlines over utilitarian body. Feels like a film catalog, not a chat app.

### Hierarchy
- **Display** (800, clamp 40–72px, tight tracking): Hero titles on homepage and featured media.
- **Headline LG** (700, clamp 24–40px): Page titles (watchlist, profile).
- **Headline MD** (600, 22px): Section headers (TRENDING, FOR YOU).
- **Body** (400, 14px, 1.5): Descriptions, form text; cap prose at 65–75ch.
- **Label** (500, 11px, uppercase, 0.1em tracking): Buttons, nav, metadata, filters.

### Named Rules
**The Display Boundary Rule.** Anybody is for headings and hero moments only. Buttons and data use Space Mono; body copy uses Geist.

## Elevation

Flat-by-default obsidian surfaces. Depth comes from tonal steps (`bg` → `bg-card` → `bg-card-high`), 1px hairline borders (`--border`, `--border-bright`), and rare crimson glow on poster hover.

### Shadow Vocabulary
- **Primary glow** (`0 0 20px var(--primary-glow)`): Button hover only.
- **Poster glow** (`0 0 24px var(--primary-glow)`): Anime card hover.
- **Dropdown** (`0 8px 32px rgba(0,0,0,0.5)`): Menus and overlay panels.

No default drop shadows on static cards.

### Named Rules
**The Flat-By-Default Rule.** Surfaces rest flat. Glow and shadow respond to hover or overlay state only.

## Components

### Buttons (`.btn-primary`, `.btn-ghost`)
Tactile, uppercase mono labels, 44px min height. Primary: crimson fill, white text. Ghost: hairline border, transparent fill. Focus ring: `var(--accent-bright)` 2px outline (to be applied globally).

### Anime Card (`.anime-card`)
Poster-forward link; 2–4px radius; score pill top-right in crimson. Title visible on hover/focus-within overlay (target state). Desktop: fills grid cell at 100% width.

### Section Row (`.section-header`, `.section-cards`)
Header: headline-md + 40px crimson underline + optional VIEW ALL link. Cards: one row, max 7 items; mobile horizontal scroll, desktop 7-column grid.

### Badges & Chips (`.badge`, `.genre-chip`)
Small uppercase mono tags. Genre chips: subtle fill, minimal blur (prefer removing blur over time). Used for genres, format, status.

### Forms
Dark card inputs, 2px radius, border brightens to primary on focus. Always pair with visible or screen-reader labels.

### Navigation
Desktop: sticky top bar, 60px, solid near-black (avoid decorative blur). Mobile: bottom tab bar, 64px + safe area, icon + label when active.

### Skeleton (`.shimmer`)
Horizontal gradient animation on card-shaped placeholders; respect reduced motion.

## Do's and Don'ts

**Do**
- Use CSS variables from `globals.css` for all colors in components
- Limit homepage sections to one poster row each (7 cards max)
- Use Space Mono for scores, status, filters, and button labels
- Keep hero cinematic; keep forms and tables restrained
- Deduplicate anime across homepage sections

**Don't**
- Use indigo, violet, or purple as global accents
- Rely on hover-only UI for titles or actions
- Add glassmorphism to nav, chips, or cards by default
- Use display font on buttons, inputs, or dense data tables
- Ship placeholder UI (fake email capture, unimplemented shortcuts)
- Use em dashes in product copy
