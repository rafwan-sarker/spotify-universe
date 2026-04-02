# Phase 2: Data Pipeline - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Progressive fetching of the user's full Spotify library (saved songs, top tracks, playlists, recently played), normalization of Spotify's 5000+ micro-genres into ~10 macro-genre clusters, and computation of 3D positions, colors, and sizes for every track. Data flows to the galaxy renderer in real-time as it's fetched — stars appear live.

</domain>

<decisions>
## Implementation Decisions

### Fetching Strategy
- **D-01:** Fetch ALL available data sources: saved songs, top tracks (3 time ranges), playlists, and recently played. Maximize galaxy size.
- **D-02:** Stars appear in the galaxy in real-time as songs are fetched — the loading IS the experience. No separate loading screen.
- **D-03:** Fetching begins immediately on OAuth completion (during/after warp transition) — fastest time to galaxy.
- **D-04:** Research flagged: no batch endpoints for new Spotify apps. Must use individual paginated requests with rate limit handling.

### Genre Mapping
- **D-05:** Normalize Spotify's micro-genres into ~10 macro-genre clusters (Pop, Rock, Hip-Hop, Electronic, R&B, Indie, Jazz, Classical, Latin, Metal or similar).
- **D-06:** Songs with no genre data or unmappable genres go into a dedicated "Mystery" / "Unknown" cluster — honest about gaps, not hidden.
- **D-07:** Each cluster gets a distinct assigned color for star rendering (consistent with the 6 demo genres from Phase 1).

### 3D Positioning
- **D-08:** Genre clusters arranged in a sphere layout — evenly distributed around a central point, no genre is "more central" than another.
- **D-09:** Within each cluster, songs are arranged in ranked layers — top/most-listened tracks near the cluster center, deep cuts at the edges. Favorites are the "core" of each nebula.
- **D-10:** Star size based on top-track ranking (carried from project requirements GLXY-05).

### Data Flow & Threading
- **D-11:** Genre normalization and 3D position computation offloaded to a Web Worker — keeps the UI/3D renderer responsive during processing.
- **D-12:** Data flows from: Spotify API → fetch queue (main thread) → Web Worker (normalize + position) → Zustand store → R3F renderer.
- **D-13:** Must handle libraries of 5000+ songs without freezing the browser (success criterion #4).

### Claude's Discretion
- Exact rate limiting strategy (concurrency, backoff, retry)
- Genre taxonomy mapping table (which micro-genres map to which macro-cluster)
- Cluster sphere radius and spacing parameters
- Web Worker communication protocol (message format, batching)
- TanStack Query vs custom fetch queue decision
- Deduplication strategy (same song in saved + playlist)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Core value, constraints, key decisions (genre-based coloring, ranking-based sizing)
- `.planning/REQUIREMENTS.md` — DATA-01, DATA-02, DATA-03 requirements
- `.planning/ROADMAP.md` — Phase 2 success criteria and dependencies

### Research
- `.planning/research/STACK.md` — Zustand v5, TanStack Query v5, recommended stack
- `.planning/research/PITFALLS.md` — Spotify API rate limits, no batch endpoints, genre normalization challenge
- `.planning/research/ARCHITECTURE.md` — Three-tier architecture, data flow patterns

### Phase 1 Code (reuse patterns)
- `src/data/demo-galaxy.json` — Reference data shape for star entries (genre, position, color, size)
- `src/lib/store.ts` — Zustand store structure (extend for galaxy data)
- `src/lib/spotify-scopes.ts` — OAuth scopes already requesting library + top-read access
- `src/auth.ts` — Token available via Auth.js JWT session

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `demo-galaxy.json` — Defines the star data shape that Phase 3's renderer expects. Pipeline output MUST match this shape.
- `store.ts` — Zustand store with mode management. Extend with galaxy data (stars array, loading progress).
- `spotify-scopes.ts` — Already requests `user-library-read` and `user-top-read` scopes.

### Established Patterns
- Zustand for global state (mode, user)
- Auth.js JWT session with access token available server-side
- Next.js App Router with server components

### Integration Points
- Auth token from `auth()` server function → pass to API route or client fetch
- Zustand store → galaxy renderer reads star data from store
- Web Worker → posts processed star batches back to main thread → store update → R3F re-renders

</code_context>

<specifics>
## Specific Ideas

- Stars appearing live in the galaxy as data streams in is THE moment — this must feel magical, like watching a universe being born
- The demo-galaxy.json data shape is the contract — pipeline output must produce the same structure so Phase 3's renderer works identically with real and demo data
- "Mystery" cluster for unknown genres should still look cool — maybe a distinct color like white or silver

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-data-pipeline*
*Context gathered: 2026-04-02*
