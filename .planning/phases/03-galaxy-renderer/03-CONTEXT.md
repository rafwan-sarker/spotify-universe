# Phase 3: Galaxy Renderer - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Render every song from the user's Spotify library as a star in the 3D galaxy. Stars are clustered by genre, colored by genre, sized by top-track ranking, and animate into existence progressively as data loads from Phase 2's pipeline. The existing DemoGalaxy from Phase 1 uses InstancedMesh — this phase replaces/extends it to render real user data from the Zustand store.

</domain>

<decisions>
## Implementation Decisions

### Star Appearance
- **D-01:** Stars rendered as glowing orbs — small spheres with additive blending so dense clusters become luminous regions.
- **D-02:** Stars have a twinkle animation — subtle brightness pulsing on individual stars to feel alive.
- **D-03:** Top tracks have a size pulse effect — gently pulse larger/smaller to draw attention to favorites.
- **D-04:** Additive blending enabled — overlapping stars glow brighter, creating natural luminosity in dense areas.

### Progressive Animation
- **D-05:** Stars fade + scale up into existence — start invisible and tiny, then smoothly grow and brighten to final position.
- **D-06:** Stars appear as a smooth continuous stream — constant trickle as data arrives, not in discrete bursts.

### Cluster Visibility
- **D-07:** Genre clusters have blended gradient edges — regions blend into each other smoothly, no hard boundaries between musical styles.
- **D-08:** Cluster sizes are proportional to song count — more songs = bigger cluster. User's main genre dominates the galaxy.

### Claude's Discretion
- InstancedMesh vs Points vs custom shader approach for 5000+ stars
- Animation implementation (per-instance uniforms, shader-based, or frame-by-frame)
- Performance optimization strategy for maintaining 60fps
- How to transition from demo galaxy to real galaxy on login
- Exact fade/scale animation curve and duration

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Core value, constraints
- `.planning/REQUIREMENTS.md` — GLXY-01 through GLXY-05 requirements
- `.planning/ROADMAP.md` — Phase 3 success criteria

### Prior Phase Code (reuse/extend)
- `src/components/canvas/DemoGalaxy.tsx` — Existing InstancedMesh renderer for demo stars (extend pattern)
- `src/components/canvas/GalaxyScene.tsx` — R3F Canvas wrapper (extend for real data)
- `src/components/canvas/BackgroundStars.tsx` — Background starfield (keep as-is)
- `src/components/canvas/AutoOrbitCamera.tsx` — Camera controller (keep as-is)
- `src/lib/store.ts` — Zustand store with stars[], genres[], addStarBatch (data source)
- `src/lib/spotify/types.ts` — StarData, GenreCluster, GENRE_COLORS types

### Research
- `.planning/research/PITFALLS.md` — InstancedMesh performance, React/Three.js boundary
- `.planning/research/ARCHITECTURE.md` — Three-tier architecture pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DemoGalaxy.tsx` — Already uses InstancedMesh with genre-based vertex colors. This pattern scales to 5000+ with per-instance attributes.
- `store.ts` — `stars` array and `addStarBatch` action already in place from Phase 2. Renderer subscribes to store changes.
- `types.ts` — `StarData` has position (x,y,z), color (r,g,b), size, brightness — all pre-computed by Phase 2's worker.

### Established Patterns
- R3F Canvas with dynamic import (ssr: false) via GalaxySceneLoader
- Zustand for state management
- InstancedMesh for efficient star rendering

### Integration Points
- Zustand store `stars[]` → renderer reads and renders each star
- `addStarBatch` triggers re-render → new stars animate in
- `GalaxyScene` already accepts `isAuthenticated` prop → switch between demo and real galaxy

</code_context>

<specifics>
## Specific Ideas

- The transition from demo galaxy (200 static stars) to real galaxy (5000+ streaming in) should feel like the universe expanding
- Additive blending on dense clusters should create a natural "nebula glow" effect without needing actual nebula geometry
- Twinkle animation should be subtle — like real stars, not Christmas lights
- The proportional cluster sizing means if someone listens to mostly hip-hop, the hip-hop cluster should be the dominant visual feature

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-galaxy-renderer*
*Context gathered: 2026-04-03*
