# Astra

ASTRA is an atmospheric music discovery platform that takes listeners beyond their usual listening habits, connecting them with new artists, genres and sounds. It should feel like a premium, independent discovery experience — never a generic streaming clone.

**Tagline:** Every sound opens a new universe.
**Strapline:** Discovering the soundtrack to your inner world
**Personality:** Atmospheric · Curious · Expressive · Exploratory · Contemporary

The full brief is in [docs/brief.md](docs/brief.md). Read it before starting a new stage.
Early ideation (identity definitions with genres, quiz questions, feature names like "Your orbit", "Constellations", "Your daily alignment", the orbiting-moods interaction) is in [docs/mindmap-notes.md](docs/mindmap-notes.md). Where it conflicts with the brief or Figma, the brief and Figma win (e.g. its Cormorant/DM Sans typography is superseded).

## Stack

- **Frontend:** React + JavaScript + plain CSS, built with Vite. Lives at the repo root (`index.html`, `src/`).
- **Backend:** Python + FastAPI in `backend/` (see backend/README.md). Holds Spotify credentials, converts Spotify JSON to frontend shapes (`app/mappers.py`). Deps: fastapi, uvicorn, httpx, python-dotenv only.
- No extra frameworks or dependencies (no Tailwind, UI kits, CSS-in-JS, router libraries etc.) without asking.
- Use realistic, clearly labelled sample data. Never fake a working API integration. Always label where data came from (`source: 'spotify' | 'sample'`).

Run (two terminals, always use 127.0.0.1, not localhost — cookies and the Spotify redirect URI depend on it):
- Frontend: `npm run dev` → http://127.0.0.1:5173 (proxies `/api` to the backend)
- Backend: `cd backend; .venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000` (docs at /docs; restart after editing `.env`)
Build check: `npm run build`.

## Spotify (Development Mode, 2026 rules)

- Secrets only in `backend/.env` (git-ignored). Never put them in frontend code or `VITE_*` variables.
- App-only token (no login): search, artist, album, track, artist's albums. User login (max 5 allowlisted users, owner needs Premium): library, playlists, top items, recently played, playback.
- **Unavailable**: recommendations, related artists, audio features/analysis, preview clips, new releases, browse categories, artist top tracks, popularity/followers, batch lookups. Search max 10 per type. Design features around this; Frequency recommendations are ASTRA's own logic.
- The frontend falls back to sample data whenever the API is unavailable, so the portfolio works for visitors who can't log in.
- Follow Spotify's attribution/branding rules where Spotify content is shown (attribution, link back, unaltered artwork).

## Project structure

```
design/              design system reference images — check before any visual decision
  brand-identity.png   concept and visual direction
  colour-palette.png   approved colours
  typography.png       typefaces
  ui-components.png    buttons, search bar, music card, navigation
docs/brief.md        full project brief
src/
  main.jsx           entry point
  App.jsx            picks the page for the current route
  routes.js          route table (add/rename pages here); paths.js = link helpers
  styles/tokens.css  ALL design tokens (colours, type, radii, spacing)
  styles/global.css  reset, base typography, utilities
  components/
    layout/          AppShell, Header, Navigation, CosmicBackground, PageIntro, StagePlaceholder
    ui/              Button/IconButton, Icon, Avatar, Artwork, SearchBar
    cards/           MusicCard (row | tile), ArtistCard
  pages/             one file per route; KitPage = living UI kit at #/kit
  data/sampleData.js FICTIONAL sample data — only read via services/
  services/          catalogue.js: calls /api, falls back to sample data
                     account.js: optional Spotify login (Connect Spotify in the header)
  hooks/             useHashRoute (hash routing, no router dependency)
  utils/             formatting helpers
```

Patterns to keep:
- Each component has a co-located `.css` file using BEM-style class names (`.music-card__title`).
- Components never import `data/` directly — go through `services/` (KitPage is the one exception).
- Icons are inline SVG in `ui/Icon.jsx`; add new icons there.
- Placeholder artwork is generated from an item's id (`ui/Artwork.jsx`) until real artwork URLs exist.

## Build stages

1. ✅ Project structure, design tokens, global styling, background
2. ✅ Reusable components and navigation
3. Discover page
4. Explore page
5. Your Frequency quiz and results
6. Music player
7. My Universe
8. Responsive refinements and testing

Build one stage at a time. After each stage: explain what was created, list the files changed, explain how to run/test it, and list what's still to do.

## Visual direction

Atmospheric Cosmic: modern, gender-neutral, cinematic, sophisticated. Deep charcoal and smoky violet foundations with copper and terracotta accents. Cosmic imagery stays subtle — radial gradients, soft blurred orbs, orbital rings, atmospheric lighting, abstract sound visualisations. Dark theme only.

**Avoid:** overly feminine styling, excess pink/pastel, cartoon planets, glitter or stars everywhere, neon futurism, generic streaming layouts.

## Colours

Defined once in `src/styles/tokens.css`. Always reference the tokens; never hard-code hex values in components. Don't add brand colours without asking.

| Token | Name | Hex | Use |
|---|---|---|---|
| `--cosmic-charcoal` | Cosmic Charcoal | `#19191F` | Main background |
| `--deep-graphite` | Deep Graphite | `#292730` | Surfaces, cards |
| `--smoky-plum` | Smoky Plum | `#403647` | Raised surfaces, cards, orb glow |
| `--nebula-violet` | Nebula Violet | `#695879` | Secondary accent |
| `--atmospheric-lilac` | Atmospheric Lilac | `#A493B5` | Secondary accent, secondary button borders, icons |
| `--burnt-copper` | Burnt Copper | `#9A664B` | Warm highlight (deep) |
| `--clay-copper` | Clay Copper | `#BF8062` | Primary buttons (dark text) |
| `--dusty-terracotta` | Dusty Terracotta | `#E2AC91` | Warm highlight, active states, labels |
| `--starlight-ivory` | Starlight Ivory | `#E7E0D5` | Main text |
| `--ash-grey` | Ash Grey | `#A9A5AC` | Secondary text |

Borders use translucent ivory (`--border-subtle`, `--border-soft`).

## Typography

| Font | Use |
|---|---|
| Space Grotesk | Brand name, main headings, feature titles |
| Inter | Body text, buttons, navigation, interface labels |
| DM Mono | Track info, metadata, small technical labels (often uppercase, letter-spaced) |

Scale: Display 48 · H1 32 · H2 24 · H3 18 · Body 14 · Small 12 · Metadata 11 (px). Weights: Regular / Medium.

## Shape

Card 18px · feature card 22px · button 10–12px · search field 14px. Restrained glass (blur + translucent surface), soft borders, clear spacing.

## Components (from `design/ui-components.png`)

- **Primary button** — Clay Copper fill, dark text. **Secondary** — transparent, lilac border.
- **Search bar** — graphite field, search icon left, clear (×) right; results list with round lilac avatar, artist and track.
- **Music card** — avatar, artist + subhead left, square artwork right.
- **Navigation** — Discover, Explore, Frequency, My Universe; icon above label, active item in a Dusty Terracotta pill. Bottom bar on mobile; adapt for larger screens.

## Musical identities

The Dreamer, The Soul, The Explorer, The Rebel, The Observer, The Pulse, The Nostalgic, The Alchemist — each defined with genres in docs/mindmap-notes.md. Treat them as recommendation categories based on musical taste (not personality tests). Users get a dominant identity plus secondary influences.
Decided: the Frequency experience mixes standard questions with a visual "orbiting moods" interaction. No astrology features.

## Responsive

Mobile-first. Reference widths: 390 (mobile), 768 (tablet), 1440 (desktop). Breakpoints: `min-width: 768px`, `min-width: 1200px`.

## Conventions

- British English in all copy and docs ("colour", "visualisation", "favourite").
- Accessibility first: contrast, visible focus states, semantic HTML, respect `prefers-reduced-motion`.
- Don't overwrite working code unnecessarily; keep components small and reusable.
