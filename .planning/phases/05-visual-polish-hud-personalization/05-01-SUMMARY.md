---
phase: 05-visual-polish-hud-personalization
plan: 01
subsystem: ui
tags: [bloom, postprocessing, shaders, glsl, drei, three.js, r3f, constellation, genre-labels]

# Dependency graph
requires:
  - phase: 03-star-shaders-galaxy-buffers
    provides: star ShaderMaterial with toneMapped=false and additive blending, instanceIsTopTrack attribute, galaxy-buffers utilities
  - phase: 04-navigation-interaction
    provides: cameraMode state (idle/cruising/warping/inspecting), selectedStar store state, WarpStreaks component
provides:
  - Bloom + Vignette post-processing via EffectComposer (neon synthwave glow)
  - Tiered star brightness buffers (normal/top/beacon) with HDR beacon boost in shaders
  - Floating genre billboard labels at cluster centroids with distance-based opacity fade
  - Artist constellation lines (complete graph for small sets, hub-spoke for large) on star selection
affects: [05-02-PLAN, visual-polish, hud]

# Tech tracking
tech-stack:
  added: ["@react-three/postprocessing@3.0.4", "postprocessing@6.39.0"]
  patterns: ["tiered beacon classification via second-pass sort", "module-scope temp Vector3 for useFrame", "drei Line with segments for paired point rendering"]

key-files:
  created:
    - src/components/canvas/PostProcessing.tsx
    - src/components/canvas/GenreLabels.tsx
    - src/components/canvas/ConstellationLines.tsx
    - src/lib/constellation.ts
    - src/__tests__/constellation.test.ts
  modified:
    - src/shaders/star-shaders.ts
    - src/lib/galaxy-buffers.ts
    - src/__tests__/galaxy-buffers.test.ts
    - src/components/canvas/GalaxyScene.tsx

key-decisions:
  - "Beacon boost factor 0.75 per level (1.0x normal, 1.75x top, 2.5x beacon) for HDR bloom pickup"
  - "Complete graph for <=5 artist stars, hub-spoke from centroid capped at 15 for 6+ stars"
  - "ConstellationLines only renders in inspecting mode to avoid visual clutter during warp"
  - "Genre label opacity curve: full at <30 units, linear fade 30-80, hidden beyond 80"

patterns-established:
  - "Tiered buffer classification: second-pass sort after main buffer write loop for multi-level attributes"
  - "GLSL varying for passing per-instance classification to fragment shader (vBeaconLevel)"
  - "Module-scope THREE.Vector3 reuse pattern for useFrame distance calculations (GenreLabels._tempVec3)"

requirements-completed: [VIS-01, VIS-02, VIS-05, VIS-06, UI-07]

# Metrics
duration: 5min
completed: 2026-04-05
---

# Phase 5 Plan 1: Visual Polish Summary

**Bloom/Vignette post-processing with beacon star HDR shaders, floating genre labels at cluster centroids, and artist constellation lines on star selection**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-05T00:53:18Z
- **Completed:** 2026-04-05T00:58:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Bloom post-processing makes all stars glow with neon halos; beacon stars (top-5 by brightness) output 2.5x HDR values that bloom amplifies dramatically
- Genre names float as billboard text at each cluster centroid with distance-based fade (full opacity near, invisible far)
- Artist constellation lines appear when inspecting a selected star, connecting all same-artist stars with glowing cyan lines
- Warp streaks automatically amplified by bloom (inherited toneMapped=false)

## Task Commits

Each task was committed atomically:

1. **Task 1: Beacon shader + buffers + PostProcessing** - `0dff0b5` (test), `f963d7f` (feat)
2. **Task 2: Genre labels, constellation lines, GalaxyScene wiring** - `f839360` (feat)

## Files Created/Modified
- `src/components/canvas/PostProcessing.tsx` - EffectComposer with Bloom (mipmapBlur) + Vignette
- `src/components/canvas/GenreLabels.tsx` - Billboard Text labels at genre centroids with distance fade
- `src/components/canvas/ConstellationLines.tsx` - drei Line connecting artist stars on selection (inspecting mode)
- `src/lib/constellation.ts` - Pure constellation point computation (complete graph and hub-spoke)
- `src/__tests__/constellation.test.ts` - 8 tests for constellation logic (0/1, 2-5, 6+, 20+ stars)
- `src/shaders/star-shaders.ts` - Added vBeaconLevel varying and beaconBoost HDR multiplication
- `src/lib/galaxy-buffers.ts` - Extended isTopTracks to 3 tiers (0.0/1.0/2.0) via brightness-sorted second pass
- `src/__tests__/galaxy-buffers.test.ts` - Added 4 beacon tier tests (15 total, all passing)
- `src/components/canvas/GalaxyScene.tsx` - Wired GenreLabels, ConstellationLines, PostProcessing into Canvas

## Decisions Made
- Beacon boost multiplier: 0.75 per level (normal=1.0x, top=1.75x, beacon=2.5x) -- tuned for bloom to dramatically amplify top-5 without washing out normal stars
- Constellation algorithm: complete graph for <=5 stars (true constellation look), hub-spoke from centroid for 6+ stars (scalable, avoids visual clutter)
- Constellation lines only in inspecting mode -- prevents distracting lines during warp animation
- Genre label distance fade: 30-80 unit linear curve -- keeps labels readable near clusters but prevents galaxy-wide text clutter

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- PostProcessing, GenreLabels, ConstellationLines all wired and rendering
- All 113 tests pass across 10 test files
- Next.js build clean with no TypeScript errors
- Ready for Plan 2 (minimap HUD, galaxy stats, personality labels)

## Self-Check: PASSED

All files exist, all commits found, all key content verified.

---
*Phase: 05-visual-polish-hud-personalization*
*Completed: 2026-04-05*
