# Project Research Summary

**Project:** Spotify Universe
**Domain:** Personal music data visualization / 3D interactive web application
**Researched:** 2026-04-01
**Confidence:** HIGH

## Executive Summary

Spotify Universe is a personal music data visualization app that renders a user's Spotify library as a flyable 3D galaxy — genre clusters become nebulae, tracks become stars, and free-flight camera navigation through the scene is the core interaction. The product sits in a crowded but shallow competitive space (Wrapped, Receiptify, Obscurify are all 2D screenshot apps) and occupies a genuinely unoccupied niche: personal + 3D + flyable + shareable. The recommended stack is Three.js via React Three Fiber (R3F) for the 3D scene, Next.js 16 on Vercel for the application framework, Zustand for state, and TanStack Query for API caching. This combination gives a React-native development experience with a production-grade 3D scene graph, server-side auth via Vercel functions, and zero infrastructure management. The pmndrs ecosystem (R3F, Drei, Zustand) is designed to interoperate — the same team maintains all three libraries.

The single largest project constraint is Spotify's API, which has been dramatically restricted in two waves (November 2024 and February 2026). The audio features endpoint (energy, danceability, valence) permanently returns 403 for new apps — this is not a rate limit or a workaround situation. Track popularity, artist popularity, preview URLs, batch fetch endpoints, and related-artist data have also been removed or restricted. The visual mapping strategy for the galaxy must be redesigned entirely around what IS available: genre strings from artist metadata, top-track rankings from `/me/top/tracks`, and album release dates. Genre-based star coloring is actually more intuitive than energy-based coloring ("my blue cluster is electronic" beats "cool blue = calm audio energy"), and ranking-based star sizing preserves the "favorites are biggest" intent of the original concept. The app can be built; it just cannot be built as originally conceived.

The biggest execution risk is the React/Three.js performance boundary. The render loop runs at 60fps; React reconciliation does not. Any per-frame state updates (camera position, star animation, warp progress) stored in React state will drop frame rate to single digits due to reconciliation overhead and GC pressure from allocating new Vector3/Color objects every frame. The architecture must establish a strict mutation boundary on day one: refs and direct Three.js mutation inside `useFrame` for all animation, Zustand `getState()` (not hook subscriptions) for reading store data in the render loop, and React state only for discrete UI events. The secondary risk is the Spotify dev mode 5-user cap, which prevents any public sharing without Extended Quota approval (requires 250K MAU + registered business). A demo mode with mock data is non-negotiable for portfolio viability.

## Key Findings

### Recommended Stack

The stack centers on Three.js + React Three Fiber as the 3D layer, with Next.js 16 (Turbopack default, App Router) as the application framework deployed on Vercel. R3F is chosen over raw Three.js because the UI overlays (search, HUD, menus) are React components — keeping everything in one paradigm eliminates the impedance mismatch between React and imperative Three.js. Next.js is chosen over Vite+SPA because OAuth requires server-side secret storage and Vercel functions provide this with zero configuration. TypeScript 5.8 (not 6.0) is the correct version: TS 6.0 is a bridge release and Next.js 16 officially supports 5.x only.

**Core technologies:**
- `three ^0.183.0` + `@react-three/fiber ^9.5.0`: 3D rendering — R3F bridges React and Three.js lifecycle, handles cleanup/disposal, and enables composable scene components
- `@react-three/drei ^10.7.0`: Stars, orbit controls, positional audio, text — 50+ battle-tested abstractions that save weeks of custom implementation
- `@react-three/postprocessing ^3.0.4`: Bloom, chromatic aberration, vignette — required for the neon synthwave aesthetic that makes screenshots shareable
- `next ^16.2.0` + `react ^19.2.0`: Framework + UI — Turbopack default (~87% faster startup), App Router, React 19.2 built-in
- `next-auth 5.0.0-beta.30`: Spotify OAuth — built-in Spotify provider, handles token refresh and session management; 18+ months of production use despite "beta" label
- `@spotify/web-api-ts-sdk ^1.2.0`: Spotify API client — official, fully typed, handles auth token management
- `zustand ^5.0.12`: Client state — pmndrs ecosystem standard; works inside and outside React; surgical re-render control via subscriptions with selectors
- `@tanstack/react-query ^5.96.0`: Server state + caching — handles paginated library fetching, background refetch, Suspense, and per-request retry
- `motion ^12.38.0`: DOM animations — spring-physics UI transitions for search/menu overlays; do NOT use inside the canvas (that is `useFrame`)
- `tailwindcss ^4.1.0`: CSS for DOM overlays — zero-runtime, v4 Rust engine; only styles the floating UI layer outside the canvas

**Critical exclusions:** Physics engines (not needed — no rigid body dynamics), Howler.js (Web Audio API native via Drei PositionalAudio covers all needs), D3.js (2D SVG tool — wrong abstraction for 3D WebGL clustering), any database (Spotify API is the sole data source, no persistence needed), the non-scoped `babylonjs` package (monolithic, no tree-shaking; and wrong engine for data visualization — Three.js has a vastly larger shader/particle ecosystem).

### Expected Features

The Spotify API constraint is the defining filter for feature feasibility. Everything must be evaluated against what the API actually returns in April 2026.

**Must have (table stakes):**
- Spotify OAuth login — entry point for every Spotify visualization app; Authorization Code flow via Vercel functions (Implicit Grant is deprecated and blocked)
- Display top artists/tracks with time-period toggle (short/medium/long term) — the atomic unit of every Spotify visualization; still fully available
- Genre-based spatial clustering — the most intuitive way to organize music in 3D; artist genre strings are still available via `/artists/{id}`
- Progressive loading state — mandatory with per-artist individual fetches (no batch endpoint); turn the loading wait into content
- Hover/click for track and artist details — raycasting on InstancedMesh; the galaxy is useless without interactivity
- Search + warp-to-result — essential for libraries over ~100 songs; client-side text filter over loaded data
- Visually stunning, screenshot-worthy aesthetic — bloom/glow neon synthwave; if it does not screenshot well, nobody shares it
- Demo mode with mock data — the 5-user dev cap means most visitors cannot authenticate; this is a table stake for portfolio use

**Should have (differentiators):**
- 3D galaxy you fly through — the core differentiator; no existing Spotify app lets you navigate your personal library in 3D space
- Progressive "big bang" galaxy formation — transforms API latency (5-10 minutes for large libraries) into a feature; stars appear in waves as data streams in
- Hyperspace warp transitions — cinematic camera animation to artist/genre locations; the "money shot" for social sharing
- Genre nebulae as spatial regions — volumetric colored cloud regions per genre family; viscerally more engaging than genre percentages or genre lists
- Star properties derived from available data — genre=color, top-track ranking=size, recency=brightness; creative and principled use of available signals
- Shareable screenshot/export — canvas-to-image export with user overlay; optimized for Instagram Story (9:16) and Twitter (16:9) aspect ratios

**Defer to v2+:**
- Spatial audio — preview URLs deprecated for new apps; requires Web Playback SDK (Premium-only); design v1 entirely without audio, layer on later
- Mobile support — 3D fly-through touch UX is a separate UX design project; do it right or skip it
- Artist constellations (detailed) — requires extra per-artist API calls for album data; adds depth but is not the core "wow" moment
- Mini-map HUD — navigation aid only needed once the galaxy is complex enough to get lost in

**Never build (explicit anti-features):**
- Energy/valence/danceability-based star coloring — audio features endpoint returns 403 for new apps; no path to this data exists
- Play count or popularity-based star sizing — popularity field removed February 2026; unavailable at API level
- Social comparison features — out of scope; adds auth/storage complexity with minimal upside over shareable screenshots
- Full Spotify catalog exploration — completely different product category (Music Galaxy by cprimozic already does this better)
- Real-time audio-reactive visualization (Kaleidosync-style) — different product category; dilutes the "explore your galaxy" core value

### Architecture Approach

The architecture uses three-tier separation: React UI Shell (DOM overlays positioned absolutely over the canvas) + R3F 3D Scene (canvas fills the viewport) + Vercel API Layer (serverless functions proxy all Spotify API calls and manage tokens). Data flows unidirectionally: Spotify API → Vercel functions → TanStack Query cache → Zustand store → R3F scene. The render loop reads from Zustand via `getState()` (not reactive hooks) and mutates Three.js objects directly via refs — this is the critical performance boundary that must be established before any 3D code is written.

**Major components:**
1. **Vercel API Layer** — OAuth flow (Authorization Code), token management in httpOnly cookies, all Spotify endpoint proxying under `/api/*`; client secret never reaches the browser
2. **Zustand Store** — central state hub for auth, raw tracks, artist genres, computed star positions, camera state machine, and UI state; the single source of truth for both React components and the Three.js render loop
3. **Data Pipeline (Web Worker)** — genre normalization (5000+ Spotify micro-genres → 15-25 macro-groups), layout computation (genre centroids on sphere via golden-ratio spacing + gaussian scatter per cluster), outputs Float32Arrays for InstancedMesh buffer writes; runs off main thread to prevent render loop blocking
4. **Galaxy Renderer (InstancedMesh)** — one instanced mesh for all interactive stars (billboard quad geometry + custom fragment shader; NOT sphere geometry); separate Points system for background star field (50K+ non-interactive particles for depth); Points clouds per genre for nebula atmosphere
5. **Camera System (custom useFrame controller)** — state machine (IDLE / CRUISING / WARPING / ARRIVING / INSPECTING), smooth acceleration/deceleration, cancellable warp transitions that lerp from current position to new target (not from origin)
6. **Post-Processing Pipeline** — Bloom (mipmapBlur, half-resolution for performance budget), ChromaticAberration (subtle baseline, ramps during WARPING state), Vignette, ToneMapping (always last); quality toggle for low-end devices
7. **React UI Shell** — DOM overlays outside `<Canvas>`: login, search, HUD, track info panel, loading progress; Tailwind + Motion for styling and animations

**Key patterns to enforce throughout:**
- Ref-based animation: mutate Three.js objects via `ref` inside `useFrame`; never `useState` per frame
- Zustand outside React: `useStore.getState()` in render loop; hook subscriptions only in React components for discrete events
- Progressive data loading: 50-track batches; stars appear in waves; Web Worker computes layout incrementally as batches arrive
- Request queue with rate limiting: concurrency of 2-3 requests; exponential backoff on 429; artist data cached aggressively in TanStack Query (same artist appears across many tracks)
- DOM/canvas separation: React components for UI overlays live outside `<Canvas>`; never mix DOM rendering inside the canvas

### Critical Pitfalls

1. **Audio Features API is permanently blocked for new apps (403 hard block)** — Accept this as an immovable constraint on day one. Design the entire visual system around genre, top-track ranking, and recency. No workarounds exist; Extended Quota requires 250K MAU + registered business.

2. **React re-renders destroying Three.js frame rate** — Establish the React/Three.js mutation boundary before writing any 3D code. Rule: `useState`/`setState` only for discrete UI events; `useRef` + `useFrame` for all animation; `getState()` not hook subscriptions inside the render loop. This is architectural — it cannot be bolted on later.

3. **Spotify dev mode 5-user hard cap** — Build demo mode with mock data in Phase 1. No public sharing is possible during development. The app must be compelling to people who cannot authenticate. Apply for Extended Quota only after the product is polished and you can articulate the user value.

4. **Rate limiting on bulk individual artist fetches** — The batch `/artists` endpoint was removed February 2026. Each unique artist requires a separate API call. A 500-song library has ~100-200 unique artists. Implement a request queue (concurrency 2-3, exponential backoff) from the start; parallel-firing 200 requests triggers 429 within seconds.

5. **Tokens in localStorage = XSS vulnerability** — Store refresh tokens only in httpOnly cookies (set server-side by Vercel functions), access tokens only in memory (Zustand store). If tokens appear in browser DevTools → Application → Local Storage, the implementation is wrong.

6. **Bloom post-processing GPU budget** — Start with half-resolution bloom and conservative luminance threshold. UnrealBloomPass at full canvas resolution can consume 40-60% of GPU budget alone. Profile with Stats.js before tuning effects up; never add bloom before measuring baseline frame time.

7. **CORS on Spotify token exchange** — The Spotify token endpoint (`accounts.spotify.com/api/token`) does not support browser-origin CORS. A Vercel serverless function is required for the exchange on day one; this is not an optimization.

## Implications for Roadmap

Based on component dependencies and pitfall phase-mapping, a 6-phase build order is recommended.

### Phase 1: Foundation + Auth + Demo Mode
**Rationale:** Nothing works without Spotify auth, and auth requires Vercel functions to avoid CORS on token exchange. Demo mode is equally critical — the 5-user dev cap means the app must function without authentication for any visitor. These co-dependencies must be resolved before the galaxy has value. Building them together keeps the app portfolio-ready from the first working phase.
**Delivers:** Working Spotify OAuth flow with httpOnly cookie token management, all `/api/*` proxy routes scaffolded, Zustand store skeleton, basic R3F canvas with orbit controls as a proof-of-life render, and a demo mode that renders a pre-built mock galaxy without auth.
**Addresses:** Spotify OAuth login (table stakes), demo mode (anti-5-user-cap requirement)
**Avoids:** CORS on token exchange (requires Vercel function from day one), Implicit Grant deprecated flow (use Authorization Code), Token storage XSS (httpOnly cookie design from start), Vercel cold start on callback (keep function lean)
**Research flag:** Standard patterns — Auth Code flow + Vercel functions + next-auth v5 Spotify provider is extensively documented; skip research-phase

### Phase 2: Data Pipeline
**Rationale:** Every visual feature depends on normalized track data with genre classifications attached. The data pipeline is the critical path and must handle all API constraints before the visualization layer is built on top of it. Genre normalization is a design decision that must be made explicitly before layout computation can be written.
**Delivers:** Paginated saved tracks fetcher with progressive batch emission (50 per request), top-tracks fetcher (all 3 time ranges for ranking data), per-artist genre fetcher with request queue (concurrency 2-3, exponential backoff, TanStack Query caching), genre normalization taxonomy (5000+ Spotify micro-genres → 15-25 macro-groups with color assignments), and a `NormalizedTrack` data model with all star visual properties computed (genre cluster, ranking tier, recency).
**Addresses:** Genre visualization (table stakes), star properties from available data (differentiator)
**Avoids:** Audio features dependency (P1 — design pipeline without it), Rate limiting (request queue from start), Genre inconsistency (normalization taxonomy built before layout), Pagination cap at 10K (communicate limit + supplement with top-tracks)
**Research flag:** Genre normalization taxonomy requires explicit design work before coding — which Spotify micro-genres map to which macro-groups. Reference Every Noise at Once taxonomy. Pre-build the mapping table as a TypeScript constant before writing pipeline code.

### Phase 3: Galaxy Core Renderer
**Rationale:** With normalized data available, this phase builds the star field. InstancedMesh is the correct rendering primitive for 5000+ interactive stars (per-instance raycasting + 1-2 draw calls). The Web Worker for layout computation must be built in this phase, not as a later optimization — at 5000+ stars, on-main-thread layout blocks the render loop visibly.
**Delivers:** InstancedMesh star field with per-instance color (genre family), scale (ranking tier), and emissive intensity (recency); Web Worker for genre clustering layout (golden-ratio sphere centroid placement + gaussian scatter per cluster), outputting Float32Arrays; progressive galaxy formation (stars fade in per batch as data arrives); background star field (Points, 50K+ non-interactive particles for cosmic depth).
**Addresses:** 3D galaxy (core differentiator), progressive galaxy formation (differentiator + loading UX)
**Avoids:** Individual mesh per star anti-pattern (5000 draw calls tanks frame rate), Sphere geometry for stars (use billboard quads — 4 vertices vs 1000), Layout computation on main thread (Web Worker required above ~1000 tracks)
**Research flag:** Standard patterns — InstancedMesh + Web Worker for large particle systems is well-documented; skip research-phase

### Phase 4: Navigation + Interaction
**Rationale:** A galaxy you cannot navigate or interact with is a screensaver. Camera controls and star interactivity transform the visualization into a product. The camera state machine must be designed before the warp transition visual effect — the state machine is the skeleton; the visual effect is the skin on top. Getting the state machine wrong after visual effects are built creates entangled bugs.
**Delivers:** Custom camera flight controller (WASD + mouse look) with smooth damped velocity and momentum, camera state machine (IDLE/CRUISING/WARPING/ARRIVING/INSPECTING), InstancedMesh raycasting for star hover and click, track info panel on click (name, artist, album art, Spotify deep link), warp-to-target camera animation (lerp with easing, cancellable mid-transition from current position), search overlay with client-side text filtering and warp to result.
**Addresses:** Fly-through camera (core differentiator), hover/click details (table stakes), search + warp (table stakes)
**Avoids:** Using Drei FlyControls (too generic for cinematic experience — need custom state machine), Warp transition state bugs (design state machine before visual effect), React setState in useFrame (camera updates via ref only)
**Research flag:** Custom cancellable camera state machine has no standard library solution. Needs careful design of transition easing curves, input response curves, and cancellation behavior (new warp triggered mid-warp must lerp from current position, not origin). Budget iteration time.

### Phase 5: Visual Polish + Post-Processing
**Rationale:** Post-processing is separated from core rendering intentionally. The galaxy must achieve its 60fps target before effects are layered on. This ordering prevents chasing unattributable slowdowns caused by effects added before a performance baseline was measured. Genre nebulae and the hyperspace warp effect also require a working camera system to evaluate properly.
**Delivers:** Post-processing pipeline (Bloom with mipmapBlur at half-resolution, ChromaticAberration, Vignette, ToneMapping), genre nebula atmosphere (colored Points clouds per genre region, gaussian falloff shader), neon synthwave color palette and glow calibration, hyperspace warp visual effect (FOV narrowing + aberration ramp during WARPING camera state), quality settings toggle (Low/Medium/High adjusts bloom resolution and disables chromatic aberration).
**Addresses:** Neon aesthetic (table stakes for shareability), hyperspace warp (differentiator), genre nebulae (differentiator)
**Avoids:** Bloom GPU cost (start conservative, half-res, Stats.js profiling before tuning), WebGL context loss on low-end devices (quality toggle provides relief valve), Full-screen bloom on all objects (use luminance threshold to bloom only emissive stars)
**Research flag:** Standard patterns — @react-three/postprocessing with mipmapBlur bloom is the documented recommended approach; skip research-phase

### Phase 6: UI Layer, Export, and Optional Audio
**Rationale:** These are overlays on a complete working experience. Screenshot export has the highest viral potential of any feature in this phase but zero value without a polished galaxy to export. Spatial audio is explicitly optional for v1 — preview URLs are unreliable for new apps, and the Web Playback SDK requires Spotify Premium. Design the audio system as a progressive enhancement that layers on top of a complete visual-only experience.
**Delivers:** Screenshot export (canvas-to-image, 9:16 and 16:9 format presets with user name overlay), mini-map HUD (top-down galaxy miniature with camera position indicator), polished loading screen with galaxy formation progress, and optionally: Spotify Web Playback SDK integration for Premium users (full-track spatial audio via Web Audio API PannerNode, audio pool of 3-5 reusable PositionalAudio objects, "Enter Galaxy" button as the required user-gesture gate for AudioContext).
**Addresses:** Screenshot export (differentiator + viral mechanic), mini-map (navigation aid), spatial audio (v2 feature)
**Avoids:** Autoplay policy blocking audio (Web Audio API requires explicit user gesture — "Enter Galaxy" button is the gate), Audio object per star (pool of 3-5 reused PositionalAudio objects, not one per star), Building audio as a requirement (visual-only experience is complete and ships regardless)
**Research flag:** Web Playback SDK initialization flow and Premium detection details change periodically. Verify current Spotify SDK docs before starting audio implementation.

### Phase Ordering Rationale

- Auth before galaxy: Nothing renders with real data until the Spotify API layer exists; the API layer requires Vercel functions for CORS compliance
- Demo mode co-located with auth (Phase 1): The 5-user cap makes demo mode a launch requirement, not a polish item; it must exist from the first deployable state
- Data pipeline before rendering (Phase 2 before Phase 3): Star positions, colors, and sizes are computed properties derived from normalized track data; the renderer needs that data to exist before a single real star can render
- Web Worker in Phase 3 (not Phase 5): Layout computation is not an optimization to add later — at 5000+ tracks it blocks the render loop, making it an architectural decision belonging in the rendering phase
- Navigation before polish (Phase 4 before Phase 5): Warp transitions require a working camera state machine; adding visual effects on top of a broken or unfinished state machine creates tightly coupled bugs that are painful to untangle
- Post-processing as its own phase (Phase 5): Effects must be measured against a performance baseline; separating them from core rendering prevents unattributable frame time increases
- Export and audio last (Phase 6): A screenshot of an incomplete galaxy is worthless; audio on top of a broken experience serves no one; these features require a finished product to layer on

### Research Flags

Phases needing deeper research during planning:
- **Phase 2 (Data Pipeline):** Genre normalization taxonomy requires explicit design before coding. Build the micro-genre → macro-group mapping table (with color assignments per group) as a standalone design artifact before writing pipeline code. Use Every Noise at Once as the reference taxonomy.
- **Phase 4 (Camera Controller):** Custom cancellable camera state machine has no drop-in library solution. Needs detailed design of easing curves, input response curves, cancellation behavior, and transition deceleration before implementation.
- **Phase 6 (Web Playback SDK):** SDK initialization, Premium detection, and device management APIs change across SDK versions. Verify current Spotify Web Playback SDK docs before implementing audio.

Phases with standard patterns (can skip research-phase):
- **Phase 1 (Auth):** Authorization Code Flow + Vercel functions + next-auth v5 Spotify provider is extensively documented across official docs and community guides
- **Phase 3 (Galaxy Renderer):** InstancedMesh + Web Worker pattern for large instanced particle systems is well-documented in Three.js and R3F ecosystems; Galaxy Voyager validates the approach at scale
- **Phase 5 (Post-Processing):** @react-three/postprocessing with mipmapBlur bloom is the documented standard for R3F projects; bloom performance budget and threshold tuning are well-covered

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified via npm view, official release announcements, and documented compatibility matrices. TypeScript 5.8 (not 6.0) for Next.js 16 confirmed. next-auth v5 beta confirmed production-stable via Auth.js docs. |
| Features | HIGH | Spotify API constraints verified against official developer blog (Nov 2024, Feb 2026 changelogs), official migration guide, and community 403 error reports. Competitive landscape verified via direct product inspection and cprimozic.net blog post. |
| Architecture | HIGH | Component boundaries, data flow patterns, and InstancedMesh approach validated against Galaxy Voyager (similar R3F project at scale), official R3F pitfalls documentation, and Three.js forum performance threads. |
| Pitfalls | HIGH | All critical pitfalls sourced from official documentation (Spotify developer blog, R3F official pitfalls page, Chrome autoplay policy docs, OWASP token storage guidance). No critical pitfall rests on a single community source. |

**Overall confidence:** HIGH

### Gaps to Address

- **Genre normalization taxonomy (design gap):** Research confirms the problem (5000+ Spotify micro-genres, no standardization) and the solution direction (15-25 macro-groups). The actual mapping table — which specific micro-genre strings map to which macro-group, and what color palette represents each group — is a design decision that must be authored explicitly before Phase 2 pipeline code can be written. This is the highest-priority gap.

- **Actual API field availability for new apps (empirical gap):** Research documents the official restrictions (403 on audio features, null preview URLs in batch responses). Edge cases exist: single-track GET responses may still return preview URLs inconsistently. Test this empirically in Phase 1 development environment to determine whether the embed-scraping workaround is worth pursuing.

- **Extended Quota pathway (strategic gap):** Getting above the 5-user dev cap requires 250K MAU and a legally registered business — a structural Catch-22 for a new project. The realistic trajectory is that this remains a portfolio/demo piece for an extended period. Plan the product roadmap and UX copy around this reality rather than assuming public launch is achievable near-term.

- **Warp transition feel (iteration gap):** The camera state machine architecture is validated. The specific parameters (lerp speed, FOV zoom depth, chromatic aberration ramp rate, arrival deceleration curve) require tuning during Phase 4 implementation to feel cinematic rather than mechanical. Budget iteration time rather than trying to pre-specify these values.

- **Web Playback SDK current state (verification gap):** SDK initialization and Premium detection logic change between SDK versions. Confirmed that the SDK enables full-track playback and Web Audio API integration. Verify current initialization flow against live Spotify SDK docs when Phase 6 begins, not before — the docs will have changed by the time Phase 6 is reached.

## Sources

### Primary (HIGH confidence)
- Spotify developer blog (Nov 2024) — audio features deprecation, preview URL restriction, recommendations/related-artists removal
- Spotify developer blog (Feb 2026) — dev mode 5-user cap, Premium requirement, batch endpoint removal, popularity field removal, search limit reduction
- Spotify February 2026 migration guide — authoritative list of removed/deprecated endpoints with exact field names
- Three.js r183 release notes + npm — version verification
- R3F v9 official docs (r3f.docs.pmnd.rs) — React 19 compatibility, useFrame API, pitfalls page
- Next.js 16 announcement + Next.js 16.2 announcement — Turbopack default, React 19.2 built-in, compatibility matrix
- Auth.js v5 Spotify provider docs (authjs.dev) — built-in Spotify provider, Next.js App Router integration, beta production status
- Three.js InstancedMesh docs — raycasting support, buffer attribute update API
- Chrome autoplay policy docs — AudioContext state, user gesture requirements, safari additional restrictions

### Secondary (MEDIUM confidence)
- Spotify community forums — confirmed 403 on audio-features for new apps, preview URL null behavior in batch responses
- Galaxy Voyager (Three.js forum, discourse.threejs.org) — R3F at 220 star systems scale validates the architecture pattern
- Three.js forum threads — UnrealBloomPass GPU cost data (40fps on i7 with full-res bloom), InstancedMesh vs Points tradeoffs, context loss handling patterns
- TechCrunch (Feb 2026) — Spotify dev mode changes coverage corroborating official docs
- cprimozic.net Music Galaxy blog — precedent for personal Spotify visualization in 3D at scale, architecture notes

### Tertiary (MEDIUM-LOW confidence)
- Preview URL workaround (github.com/rexdotsh) — embed HTML scraping approach; fragile and likely ToS-violating; not recommended as primary path, documented for awareness
- Genre taxonomy structure — informed by everynoise.com genre organization; final mapping table requires explicit design authorship

---
*Research completed: 2026-04-01*
*Ready for roadmap: yes*
