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
- [ ] 02-02-PLAN.md -- Create Spotify API proxy route handlers and update OAuth scopes
- [ ] 02-03-PLAN.md -- Wire fetch orchestrator, Web Worker, and Zustand store into end-to-end pipeline

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
**Plans**: TBD
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
**Plans**: TBD
**UI hint**: yes

### Phase 5: Visual Polish & HUD
**Goal**: The galaxy looks stunning with neon synthwave post-processing, genre nebulae have atmosphere, and a mini-map helps users stay oriented
**Depends on**: Phase 4
**Requirements**: VIS-01, VIS-02, UI-01
**Success Criteria** (what must be TRUE):
  1. The galaxy has a cohesive neon synthwave aesthetic with bloom/glow effects on stars
  2. Warp transitions include visible streak particle effects that intensify the sense of speed
  3. A mini-map HUD shows the user's current position relative to the full galaxy
  4. The app maintains 60fps on modern desktop browsers with all visual effects enabled
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth & Demo Mode | 3/3 | Complete | - |
| 2. Data Pipeline | 0/3 | Planning complete | - |
| 3. Galaxy Renderer | 0/TBD | Not started | - |
| 4. Navigation & Interaction | 0/TBD | Not started | - |
| 5. Visual Polish & HUD | 0/TBD | Not started | - |
