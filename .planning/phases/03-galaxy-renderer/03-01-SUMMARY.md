---
phase: 03-galaxy-renderer
plan: 01
subsystem: rendering
tags: [glsl, shaders, three.js, instanced-mesh, float32array, billboard, galaxy]

# Dependency graph
requires:
  - phase: 02-data-pipeline
    provides: StarData type, GENRE_COLORS mapping, star-data computation functions
provides:
  - GLSL vertex shader for billboard star rendering with fade-in, twinkle, and pulse animations
  - GLSL fragment shader for radial glow with circular discard and white-hot core
  - Pure TypeScript buffer utilities for creating and updating InstancedMesh attribute arrays
  - Unit tests covering buffer creation, color mapping, birth-time stagger, and partial writes
affects: [03-galaxy-renderer, 04-camera-interaction]

# Tech tracking
tech-stack:
  added: []
  patterns: [shader-driven per-instance animation via uTime uniform, pre-allocated Float32Array buffers for InstancedMesh, deterministic phase offsets from string hash]

key-files:
  created:
    - src/shaders/star.vert.glsl
    - src/shaders/star.frag.glsl
    - src/lib/galaxy-buffers.ts
    - src/__tests__/galaxy-buffers.test.ts
  modified: []

key-decisions:
  - "Deterministic phase offsets via char code sum hash instead of Math.random for testability"
  - "Float32Array toBeCloseTo assertions to handle 32-bit float precision in tests"
  - "Birth time stagger formula: currentTime + (i / batchSize) * spreadDuration for smooth stream"

patterns-established:
  - "Pure buffer utilities: galaxy-buffers.ts has zero React/Three.js imports, enabling unit testing without GPU context"
  - "Shader attribute contract: 6 per-instance attributes (instanceColor, instanceSize, instanceBrightness, instanceBirthTime, instancePhaseOffset, instanceIsTopTrack) shared between vert shader and buffer utilities"
  - "Billboard technique: extract world position from instanceMatrix, offset by view-space vertex position for camera-facing quads"

requirements-completed: [GLXY-01, GLXY-03, GLXY-04, GLXY-05]

# Metrics
duration: 3min
completed: 2026-04-03
---

# Phase 3 Plan 1: Star Shaders and Galaxy Buffers Summary

**Billboard GLSL shaders with per-instance fade-in/twinkle/pulse animations and pure TypeScript buffer utilities for 12000-star InstancedMesh rendering**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-03T03:40:33Z
- **Completed:** 2026-04-03T03:44:08Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 4

## Accomplishments
- Billboard vertex shader with 6 per-instance attributes, uTime uniform, and three animation systems (fade-in via smoothstep, twinkle via sin wave, top-track size pulse)
- Radial glow fragment shader with circular discard, soft falloff, white-hot core brightening, and premultiplied alpha output for additive blending
- Pure TypeScript buffer utilities (createStarBuffers, updateStarBuffers) with zero React/Three.js dependencies -- fully unit testable
- 12 unit tests covering buffer creation, genre color mapping, birth-time staggering, partial writes, top-track detection, unknown genre fallback, and deterministic phase offsets

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests for galaxy buffers** - `a8d4cca` (test)
2. **Task 1 (GREEN): Star shaders and buffer implementation** - `07bcd40` (feat)

_TDD task: test-first then implementation_

## Files Created/Modified
- `src/shaders/star.vert.glsl` - Billboard vertex shader with per-instance fade-in, twinkle, and size pulse animations
- `src/shaders/star.frag.glsl` - Radial glow fragment shader with circular discard and white-hot core brightening
- `src/lib/galaxy-buffers.ts` - Pure functions: createStarBuffers (pre-allocate), updateStarBuffers (write genre colors, sizes, birth times, phase offsets)
- `src/__tests__/galaxy-buffers.test.ts` - 12 unit tests for buffer creation and update behavior

## Decisions Made
- Used sum of char codes modulo 2*PI for deterministic phase offsets instead of Math.random -- ensures testability and consistency across store resets
- Fixed Float32Array precision in tests using toBeCloseTo instead of toBe -- Float32 stores values at 32-bit precision, causing small deltas from JavaScript 64-bit floats
- Birth time stagger formula uses `currentTime + (i / batchSize) * spreadDuration` -- evenly distributes star appearance across the spread window

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Float32Array precision in test assertions**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Tests used `toBe(1.2)` but Float32Array stores 1.2 as 1.2000000476837158 due to 32-bit float precision
- **Fix:** Changed size and brightness assertions from `toBe` to `toBeCloseTo` with 5-digit precision
- **Files modified:** `src/__tests__/galaxy-buffers.test.ts`
- **Verification:** All 12 tests pass
- **Committed in:** `07bcd40` (part of GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Test precision fix necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Shader files ready for import into ShaderMaterial in RealGalaxy component (Plan 02)
- Buffer utilities ready for consumption via `createStarBuffers(MAX_STARS)` and `updateStarBuffers(buffers, stars, startIndex, currentTime)`
- Attribute names in shaders match buffer field names in galaxy-buffers.ts (contract verified)
- Plan 02 will wire these into the R3F InstancedMesh with store subscription

## Self-Check: PASSED

All files exist. All commits verified in git log.

---
*Phase: 03-galaxy-renderer*
*Completed: 2026-04-03*
