# Phase 4: Navigation & Interaction - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Flight controls for free-form galaxy exploration, star click interaction with info display, search bar to find songs/artists and warp to them, and hyperspace warp transitions with star-streak visual effects. Makes the galaxy interactive and explorable.

</domain>

<decisions>
## Implementation Decisions

### Flight Control Scheme
- **D-01:** Cruise flight controls — WASD/arrow keys for movement, mouse for camera look direction. Hold-to-fly, release-to-drift.
- **D-02:** Gentle drift on key release — camera decelerates over ~1-2 seconds, zero-gravity coasting feel.
- **D-03:** Scroll wheel controls speed boost/brake.
- **D-04:** Slow auto-drift resumes after ~5 seconds of idle — keeps galaxy feeling alive. Stops immediately on input.
- **D-05:** Replaces the current `AutoOrbitCamera` (OrbitControls) with a custom flight controller.

### Star Click & Info Display
- **D-06:** Click a star → camera glides close to it → floating info card appears beside the star in 3D space.
- **D-07:** Info card shows: track name, artist name, album art, genre, "Open in Spotify" link, and "Warp to Artist" button.
- **D-08:** "Warp to Artist" button triggers hyperspace warp to that artist's full constellation (all songs by that artist).
- **D-09:** Info card is an HTML overlay positioned via drei's `Html` component, neon synthwave styled.
- **D-10:** Extend `StarData` to include `albumArt` URL (from `SpotifyTrackRaw.album.images`) — requires small pipeline update.

### Search Experience
- **D-11:** Search bar at top center of viewport, hidden by default. Opens via keyboard shortcut (`/` or `Cmd+K`) or click.
- **D-12:** Client-side fuzzy search over the stars[] array — matches song names and artist names. No Spotify API calls.
- **D-13:** Dropdown results below the search input, showing matching tracks with artist name.
- **D-14:** Select a result → search closes → camera warps to that star with streak effect → info card opens on arrival.

### Warp Visual Effect
- **D-15:** Star-streak speed lines (Star Wars hyperspace style) during all warp transitions.
- **D-16:** Three-phase animation: acceleration (stars elongate, FOV widens, ~0.3s) → full hyperspace (streaks fill screen, ~0.5s) → deceleration (streaks shorten, FOV returns, ~0.4s).
- **D-17:** Same warp effect used for all warp types (star click, search result, "warp to artist" button) — consistent experience.
- **D-18:** Built as a shader pass or particle system in the 3D scene, NOT a DOM overlay like the current WarpTransition.

### Claude's Discretion
- Exact WASD movement speed and drift damping values (tune for feel)
- Raycasting implementation for star click detection on InstancedMesh
- Fuzzy search library choice (fuse.js, custom, etc.)
- Star-streak shader implementation approach (custom shader pass, particle system, or post-processing)
- Camera interpolation curve for warp travel (easing function)
- How to handle click on empty space (dismiss info card? do nothing?)
- Search result limit and ranking algorithm

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — NAV-01, NAV-02, NAV-03, NAV-04 requirements and success criteria
- `.planning/ROADMAP.md` — Phase 4 success criteria and dependencies

### Prior Phase Context
- `.planning/phases/01-auth-demo-mode/01-CONTEXT.md` — Demo galaxy auto-orbit (D-02), warp transition on auth (D-04)
- `.planning/phases/02-data-pipeline/02-CONTEXT.md` — Real-time star appearance (D-02), sphere layout for clusters (D-08)
- `.planning/phases/03-galaxy-renderer/03-CONTEXT.md` — Star appearance (glowing orbs, twinkle, additive blending), progressive animation

### Research
- `.planning/research/PITFALLS.md` — Camera state machine has no drop-in library, InstancedMesh performance patterns
- `.planning/research/ARCHITECTURE.md` — Three-tier architecture (React DOM overlay + R3F Canvas + Vercel serverless)

### Critical Source Files
- `src/components/canvas/GalaxyScene.tsx` — R3F Canvas wrapper, camera setup at [0,50,100] fov 60
- `src/components/canvas/AutoOrbitCamera.tsx` — Current OrbitControls (to be replaced)
- `src/components/canvas/RealGalaxy.tsx` — InstancedMesh renderer (raycasting target for star clicks)
- `src/components/ui/WarpTransition.tsx` — Current DOM-based fade transition (to be replaced with 3D streak effect)
- `src/lib/store.ts` — Zustand store (needs camera state, selected star, search state)
- `src/lib/spotify/types.ts` — StarData type (needs albumArt field), GenreCluster with centroids

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RealGalaxy.tsx` — InstancedMesh with shader material, pre-allocated buffers. Raycasting target for star selection.
- `store.ts` — Zustand store with `stars[]`, `genres[]`, `mode`. Extend with camera state, selected star, search query.
- `WarpTransition.tsx` — DOM overlay transition. Pattern reusable for search bar overlay, but warp effect itself moves to 3D.
- `StarData` / `GenreCluster` types — Star positions and genre centroids already computed. Centroids are natural warp targets.
- `GalaxyScene.tsx` — Canvas with `<Html>` support via drei. Info card can use drei's `Html` component.

### Established Patterns
- Zustand for global state with imperative subscriptions (store.subscribe) to avoid R3F re-renders
- InstancedMesh with custom ShaderMaterial for star rendering
- Module-scope temp objects to avoid allocations in render loops
- Motion (Framer Motion) for DOM UI animations (`WarpTransition.tsx`)
- Dynamic import with `GalaxySceneLoader` for SSR safety

### Integration Points
- `AutoOrbitCamera` → replaced by new flight controller component inside Canvas
- `RealGalaxy` InstancedMesh → raycasting target for click detection
- `store.stars[]` → search source (client-side fuzzy match)
- `GenreCluster.centroid` → warp-to-artist destination coordinates
- `StarData` type → add `albumArt: string` field, update pipeline to populate it

</code_context>

<specifics>
## Specific Ideas

- Flight should feel like drifting through space in zero gravity — gentle momentum, not snappy FPS controls
- The idle auto-drift keeps the galaxy feeling alive even when you stop to look at an info card
- Info card floating beside the star in 3D space creates an intimate "examining a star up close" feel
- Search via `/` or `Cmd+K` is the power-user shortcut — familiar from VS Code, Slack, etc.
- Star-streak hyperspace warp should be the "wow" moment — accelerate through star streaks, arrive at destination
- Consistent warp effect across all triggers (click, search, button) creates a cohesive navigation language

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-navigation-interaction*
*Context gathered: 2026-04-03*
