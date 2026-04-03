---
phase: 02-data-pipeline
plan: 01
subsystem: data
tags: [typescript, vitest, tdd, genre-normalization, fibonacci-sphere, spotify]

# Dependency graph
requires:
  - phase: 01-auth-demo-mode
    provides: demo-galaxy.json data shape contract, Zustand store structure
provides:
  - StarData, GenreCluster, GalaxyData type contracts matching demo-galaxy.json
  - Genre normalization (5000+ micro-genres to 12 macro-clusters)
  - Star property computation (size, brightness, position)
  - Fibonacci sphere layout for cluster centroids
affects: [02-data-pipeline, 03-galaxy-renderer]

# Tech tracking
tech-stack:
  added: []
  patterns: [tdd-red-green-refactor, keyword-first-match-genre-mapping, fibonacci-sphere-distribution, golden-angle-star-placement]

key-files:
  created:
    - src/lib/spotify/types.ts
    - src/lib/spotify/genre-map.ts
    - src/lib/spotify/star-data.ts
    - src/__tests__/genre-map.test.ts
    - src/__tests__/star-data.test.ts
  modified: []

key-decisions:
  - "Lowercase genre IDs as canonical keys (pop, hip-hop, rnb) matching GENRE_COLORS and demo-galaxy.json"
  - "Specificity-ordered keyword matching for genre classification to prevent misclassification (latin trap -> Latin, not Hip-Hop)"
  - "Time range weighting clamped within tier bounds to keep star sizes in documented ranges"
  - "Deterministic jitter using sin(index * prime) instead of Math.random for reproducible star placement"

patterns-established:
  - "Genre mapping: ordered [keyword, macroGenreId] pairs with first-match semantics"
  - "Star data contract: StarData interface as the single data shape between pipeline and renderer"
  - "Pure functions for all star property computation (no side effects, fully testable)"

requirements-completed: [DATA-02, DATA-03]

# Metrics
duration: 3min
completed: 2026-04-03
---

# Phase 2 Plan 1: Data Contracts and Pure Functions Summary

**Genre taxonomy mapping 5000+ micro-genres to 12 macro-clusters with star size/brightness/position computation via TDD pure functions**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-03T00:04:48Z
- **Completed:** 2026-04-03T00:08:42Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Type contracts (StarData, GenreCluster, GalaxyData, NormalizedTrack) matching demo-galaxy.json shape exactly
- Genre normalization with 80+ keyword mappings covering 11 macro-clusters plus Mystery fallback
- Star property computation with 3-tier sizing, source-based brightness, and golden-angle position distribution
- 44 new tests (20 genre-map + 24 star-data) all passing, full suite of 54 tests green

## Task Commits

Each task was committed atomically:

1. **Task 1: Define data contracts and genre normalization with tests** - `56a359a` (test: RED), `4f254dc` (feat: GREEN)
2. **Task 2: Star property computation and Fibonacci sphere layout with tests** - `44c910a` (test: RED), `ce8e899` (feat: GREEN)

_TDD tasks have separate RED and GREEN commits_

## Files Created/Modified
- `src/lib/spotify/types.ts` - StarData, GenreCluster, GalaxyData, SpotifyTrackRaw, SpotifyArtistRaw, NormalizedTrack, TopTrackRanking types + GENRE_COLORS + GENRE_CONFIG
- `src/lib/spotify/genre-map.ts` - classifyGenre, classifyArtistGenres, GENRE_KEYWORDS (80+ keyword-to-macro mappings)
- `src/lib/spotify/star-data.ts` - computeStarSize, computeStarBrightness, fibonacciSphere, computeStarPosition
- `src/__tests__/genre-map.test.ts` - 20 tests covering genre classification, artist genre fallback, keyword coverage
- `src/__tests__/star-data.test.ts` - 24 tests covering size tiers, brightness sources, sphere distribution, position placement

## Decisions Made
- Lowercase genre IDs as canonical keys (pop, hip-hop, rnb) to match GENRE_COLORS and demo-galaxy.json
- Specificity-ordered keyword matching prevents misclassification (e.g., "latin trap" -> Latin before "trap" -> Hip-Hop)
- Time range weighting clamped within tier bounds (short_term gets slight boost but never exceeds tier max)
- Deterministic jitter using sin(index * prime) for reproducible star placement instead of Math.random

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Clamped star size to tier bounds**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** Time range boost for position 0 short_term pushed size to 2.05, exceeding the 1.5-2.0 tier max
- **Fix:** Changed time boost from additive constant to weighted factor with Math.min clamp
- **Files modified:** src/lib/spotify/star-data.ts
- **Verification:** All 24 star-data tests pass, position 0 short_term returns exactly 2.0
- **Committed in:** ce8e899 (Task 2 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential correctness fix to keep star sizes within documented ranges. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All type contracts ready for Plan 02-02 (API route handlers and fetch orchestrator)
- Genre normalization functions ready for the Web Worker to import
- Star property computation ready for position/size/brightness assignment
- Full test suite green (54 tests) with no regressions

## Self-Check: PASSED

All 6 files exist. All 4 commits verified in git log.

---
*Phase: 02-data-pipeline*
*Completed: 2026-04-03*
