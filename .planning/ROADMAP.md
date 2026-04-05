# Roadmap: Spotify Universe

## Overview

Transform a Spotify library into a flyable 3D galaxy, built in five phases. First, establish authentication and demo mode so the app works for anyone from day one (critical given the 5-user dev cap). Then build the data pipeline that normalizes Spotify's chaotic genre taxonomy into renderable star properties. With data flowing, construct the galaxy renderer -- InstancedMesh star fields with progressive formation. Add flight controls and warp navigation to make the galaxy interactive. Finally, layer on the neon synthwave visual polish and HUD that make it screenshot-worthy.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Auth & Demo Mode** - Spotify OAuth with Vercel functions plus demo galaxy for unauthenticated visitors
- [ ] **Phase 2: Data Pipeline** - Progressive library fetching, genre normalization, and 3D position computation
- [ ] **Phase 3: Galaxy Renderer** - InstancedMesh star field with genre clustering, star properties, and progressive formation
- [ ] **Phase 4: Navigation & Interaction** - Flight controls, warp transitions, star interaction, and search
- [ ] **Phase 5: Visual Polish & HUD** - Neon synthwave post-processing, warp streak effects, and mini-map

## Phase Details

### Phase 1: Auth & Demo Mode
**Goal**: Anyone can access the app -- authenticated users connect their Spotify, unauthenticated visitors explore a pre-built demo galaxy
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. User can click "Connect Spotify" and complete OAuth login without errors
  2. User can close and reopen the browser tab and remain logged in
  3. Unauthenticated visitor sees a demo galaxy rendered on screen without needing to log in
  4. Logged-in user can log out and return to the demo/landing state
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md -- Scaffold Next.js 16 project with Auth.js v5 Spotify OAuth and session persistence
- [x] 01-02-PLAN.md -- Create demo galaxy 3D scene with ~200 stars, auto-orbit camera, and background starfield
- [x] 01-03-PLAN.md -- Wire auth UI components (demo banner, profile menu, error page, warp transitions)

**UI hint**: yes

### Phase 2: Data Pipeline
**Goal**: The app transforms a user's raw Spotify library into a structured dataset where every track has a genre cluster, 3D position, color, and size assigned
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. After login, the app progressively fetches the user's full saved songs and top tracks without hitting rate limits
  2. Spotify's micro-genres are normalized into 15-25 visible macro-genre clusters with distinct assigned colors
  3. Every fetched track has a computed 3D position within its genre cluster region
  4. The data pipeline handles libraries of 5000+ songs without freezing the browser
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md -- Define data contracts, genre normalization taxonomy, and star property computation (TDD)
- [x] 02-02-PLAN.md -- Create Spotify API proxy route handlers and update OAuth scopes
- [x] 02-03-PLAN.md -- Wire fetch orchestrator, Web Worker, and Zustand store into end-to-end pipeline

### Phase 3: Galaxy Renderer
**Goal**: Users see their entire music library rendered as a living galaxy -- stars clustered by genre, sized by ranking, appearing in waves as data loads
**Depends on**: Phase 2
**Requirements**: GLXY-01, GLXY-02, GLXY-03, GLXY-04, GLXY-05
**Success Criteria** (what must be TRUE):
  1. Every song in the library appears as an individual star in the 3D scene
  2. Stars are visually grouped into distinct genre regions (electronic stars in one area, rock in another, etc.)
  3. Star color reflects the song's genre cluster (different genres have different colors)
  4. Most-listened songs appear noticeably larger than deep cuts
  5. Stars animate into existence in waves as data arrives, creating a progressive galaxy formation effect
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md -- Star shaders and galaxy buffer utilities with tests
- [x] 03-02-PLAN.md -- RealGalaxy renderer component and GalaxyScene wiring with visual verification

**UI hint**: yes

### Phase 4: Navigation & Interaction
**Goal**: Users can fly through the galaxy freely, click stars to learn about songs, search for any track or artist, and warp across the galaxy with a cinematic transition
**Depends on**: Phase 3
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):
  1. User can fly through the galaxy using keyboard and mouse with smooth, responsive controls
  2. Clicking a star warps the camera to that artist's constellation and shows track info (name, artist, album art, Spotify link)
  3. Typing in the search bar finds matching songs or artists and warping to the result moves the camera there
  4. Hyperspace warp transitions play a star-streak visual effect during camera travel
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md -- Navigation core: type contracts, store extension, flight math, star picking, warp visuals (TDD)
- [x] 04-02-PLAN.md -- FlightController camera state machine and WarpStreaks 3D particle system
- [ ] 04-03-PLAN.md -- Star info card, search bar with fuse.js, click handler, and GalaxyScene wiring

**UI hint**: yes

### Phase 5: Visual Polish, HUD & Personalization
**Goal**: The galaxy looks stunning with bloom/glow, feels personal with stats and personality labels, and helps users stay oriented with a mini-map and genre labels
**Depends on**: Phase 4
**Requirements**: VIS-01, VIS-02, VIS-05, VIS-06, UI-01, UI-05, UI-06, UI-07
**Success Criteria** (what must be TRUE):
  1. The galaxy has bloom/glow post-processing that makes stars radiate light and dense clusters glow like nebulae
  2. Top 5 most-listened stars are visibly brighter beacons that stand out in the galaxy
  3. Genre labels float in 3D space near each cluster ("Rock", "Pop", "Electronic")
  4. A galaxy stats card shows personalized data ("Your galaxy: X stars, Y genres, Z% hip-hop")
  5. A galaxy personality label appears based on genre distribution ("Eclectic Explorer", "Genre Loyalist")
  6. Clicking a star shows artist constellation lines connecting all stars by that artist
  7. A mini-map HUD shows the user's current position relative to the full galaxy
  8. The app maintains 60fps on modern desktop browsers with all visual effects enabled
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md -- Bloom post-processing, beacon star shaders, genre labels, and constellation lines (3D scene layer)
- [ ] 05-02-PLAN.md -- Galaxy stats card with personality label, mini-map HUD, and DOM overlay wiring

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth & Demo Mode | 3/3 | Complete | - |
| 2. Data Pipeline | 0/3 | Planning complete | - |
| 3. Galaxy Renderer | 0/2 | Planning complete | - |
| 4. Navigation & Interaction | 1/3 | In Progress|  |
| 5. Visual Polish & HUD | 0/2 | Planning complete | - |
