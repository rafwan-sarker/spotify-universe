---
phase: 04-navigation-interaction
plan: 01
subsystem: navigation
tags: [zustand, fuse.js, tdd, vitest, flight-controls, warp, search, star-picking]

# Dependency graph
requires:
  - phase: 03-galaxy-renderer
    provides: StarData interface, Zustand store with galaxy state, InstancedMesh rendering
provides:
  - CameraMode type and navigation state in Zustand store
  - Pure flight math functions (velocity damping, cruise velocity, idle transition)
  - NDC proximity-based star picking (bypasses raycaster for billboard geometry)
  - Warp visual parameter derivation from single progress value
  - Fuse.js fuzzy search over StarData array
  - albumArt field propagated from Spotify API through pipeline to StarData
affects: [04-02-flight-controller-warp-streaks, 04-03-search-info-card-ui]

# Tech tracking
tech-stack:
  added: [fuse.js]
  patterns: [pure-function-modules-with-tdd, ndc-proximity-picking, single-source-warp-progress]

key-files:
  created:
    - src/lib/flight-math.ts
    - src/lib/star-picking.ts
    - src/lib/warp-visuals.ts
    - src/lib/star-search.ts
    - src/__tests__/flight-math.test.ts
    - src/__tests__/star-picking.test.ts
    - src/__tests__/warp-visuals.test.ts
    - src/__tests__/star-search.test.ts
  modified:
    - src/lib/spotify/types.ts
    - src/lib/store.ts
    - src/lib/spotify/fetch-orchestrator.ts
    - src/workers/galaxy-layout.worker.ts

key-decisions:
  - "Exponential decay (exp(-damping*delta)) for velocity damping gives smooth zero-gravity coasting feel"
  - "NDC proximity picking instead of raycaster because billboard vertex shader moves geometry on GPU"
  - "Three-phase warp derivation from single progress value prevents multi-parameter desync"
  - "Fuse.js with weighted fields (name 0.7, artist 0.3) for typo-tolerant star search"

patterns-established:
  - "Pure function modules: zero React/Three.js imports, tested in isolation with vitest"
  - "Injected projectFn for star picking: testable without real THREE.Camera"
  - "CameraMode union type shared between store and flight-math"

requirements-completed: [NAV-01, NAV-02, NAV-03, NAV-04]

# Metrics
duration: 4min
completed: 2026-04-03
---

# Phase 04 Plan 01: Navigation Core Summary

**TDD-tested pure functions for flight math, NDC star picking, 3-phase warp visuals, and fuse.js search with Zustand navigation state and albumArt pipeline**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-03T21:32:03Z
- **Completed:** 2026-04-03T21:36:40Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Extended StarData and NormalizedTrack with albumArt field, Zustand store with full navigation state (CameraMode, warpTarget, warpProgress, selectedStar, search state)
- Built and TDD-tested 4 pure function modules: flight-math (velocity damping, cruise velocity, idle transition), star-picking (NDC proximity), warp-visuals (3-phase derivation), star-search (fuse.js fuzzy)
- Propagated albumArt from Spotify API through fetch-orchestrator and galaxy-layout worker into StarData
- All 33 new tests pass, 101 total tests green, TypeScript compiles clean

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests** - `c037c78` (test)
2. **Task 1 (GREEN): Type contracts, store extension, pure function modules** - `02305da` (feat)
3. **Task 2: Pipeline albumArt propagation** - `5683e0c` (feat)

_TDD task had separate RED and GREEN commits._

## Files Created/Modified
- `src/lib/flight-math.ts` - Pure functions for velocity damping, cruise velocity, idle transition detection
- `src/lib/star-picking.ts` - NDC proximity-based star picking for billboard InstancedMesh
- `src/lib/warp-visuals.ts` - Single progress (0-1) to warp visual parameter derivation (3 phases)
- `src/lib/star-search.ts` - Fuse.js search index creation and search function over StarData
- `src/__tests__/flight-math.test.ts` - 11 tests covering damping, cruise velocity, idle transition
- `src/__tests__/star-picking.test.ts` - 6 tests covering empty, nearest, threshold, behind-camera
- `src/__tests__/warp-visuals.test.ts` - 8 tests covering all 3 warp phases plus clamping
- `src/__tests__/star-search.test.ts` - 8 tests covering fuzzy match, weights, caps, empty queries
- `src/lib/spotify/types.ts` - Added albumArt optional field to StarData and NormalizedTrack
- `src/lib/store.ts` - Added CameraMode type and navigation state (10 new fields/actions)
- `src/lib/spotify/fetch-orchestrator.ts` - Extract albumArt URL from Spotify album images
- `src/workers/galaxy-layout.worker.ts` - Pass albumArt through to StarData in worker output

## Decisions Made
- Exponential decay `exp(-damping*delta)` for velocity damping with 0.001 snap-to-zero threshold
- Injected projectFn in star-picking instead of depending on THREE.Camera directly (testability)
- Three-phase warp derivation (0-0.25 acceleration, 0.25-0.67 hyperspace, 0.67-1.0 deceleration) from single progress value
- Fuse.js with IFuseOptions typed options and weighted fields (name 0.7, artist 0.3, threshold 0.4)
- Album art picks 300x300 image (index 1) with fallback to 640x640 (index 0)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript error with Fuse.js options type**
- **Found during:** Task 1 (GREEN phase, TypeScript verification)
- **Issue:** `as const` on SEARCH_OPTIONS made keys readonly, incompatible with Fuse constructor
- **Fix:** Used `IFuseOptions<StarData>` type annotation instead of `as const`
- **Files modified:** src/lib/star-search.ts
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** 02305da (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor type annotation change. No scope creep.

## Issues Encountered
None beyond the TypeScript typing issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All pure logic modules tested and ready for Plan 02 (FlightController, WarpStreaks 3D components)
- CameraMode type and store navigation state ready for Plan 02 to wire into useFrame
- Star search functions ready for Plan 03 (SearchBar UI)
- albumArt field flowing through pipeline, ready for Plan 03 (StarInfoCard)

## Self-Check: PASSED

All 8 created files verified present. All 3 commits (c037c78, 02305da, 5683e0c) verified in git log. 101 tests passing, TypeScript clean.

---
*Phase: 04-navigation-interaction*
*Completed: 2026-04-03*
