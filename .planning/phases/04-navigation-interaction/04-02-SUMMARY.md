---
phase: 04-navigation-interaction
plan: 02
subsystem: canvas
tags: [three.js, r3f, camera, shaders, glsl, warp, flight-controller, instanced-geometry]

# Dependency graph
requires:
  - phase: 04-navigation-interaction/plan-01
    provides: "CameraMode type, flight-math pure functions, warp-visuals derivation, navigation store fields"
  - phase: 03-star-shaders-galaxy-buffers
    provides: "RealGalaxy InstancedMesh, star shaders, galaxy-buffers, BackgroundStars"
provides:
  - "FlightController component with 4-state camera machine (idle/cruising/warping/inspecting)"
  - "WarpStreaks 3D particle system for hyperspace star-streak effect"
  - "Warp streak GLSL shaders (vertex + fragment)"
  - "GalaxyScene wired with FlightController and WarpStreaks (AutoOrbitCamera removed)"
affects: [04-navigation-interaction/plan-03, spatial-audio, star-interaction]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-scope input state for zero-rerender keyboard/mouse capture in R3F useFrame"
    - "InstancedBufferGeometry with per-instance GLSL attributes for 3D particle effects"
    - "Camera state machine pattern: read store imperatively with getState() in useFrame"
    - "Separate state domains: AppMode (auth transitions) vs CameraMode (navigation) to prevent visual conflicts"

key-files:
  created:
    - src/components/canvas/FlightController.tsx
    - src/components/canvas/WarpStreaks.tsx
    - src/shaders/warp-streaks.ts
  modified:
    - src/components/canvas/GalaxyScene.tsx

key-decisions:
  - "Used e.key.toLowerCase() instead of e.code for key capture to match flight-math.ts expectations (lowercase 'w', 'arrowup')"
  - "Confirmed WarpTransition (DOM overlay) and WarpStreaks (3D particles) use separate state domains (AppMode vs CameraMode) -- no modification needed"

patterns-established:
  - "Module-scope input: keysPressed Set, mouseDelta, scrollDelta for zero-rerender input in useFrame"
  - "Camera state machine: idle/cruising/warping/inspecting with transitions driven by input timeouts and store actions"
  - "Warp streak rendering: InstancedBufferGeometry with random per-instance attributes (angle, radius, speed)"

requirements-completed: [NAV-01, NAV-02]

# Metrics
duration: 5min
completed: 2026-04-03
---

# Phase 04 Plan 02: Flight Controller & Warp Streaks Summary

**Custom 4-state camera flight controller with WASD cruise, mouse look, drift damping, and 800-streak hyperspace warp particle system using instanced GLSL shaders**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-03T21:39:49Z
- **Completed:** 2026-04-03T21:45:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- FlightController replaces AutoOrbitCamera with full camera state machine: idle auto-drift, WASD cruising with right-click mouse look and scroll speed, cinematic warp interpolation, and inspecting orbit
- WarpStreaks renders 800 instanced thin planes as hyperspace star-streak particles with cyan-to-white gradient and three-phase animation (acceleration/hyperspace/deceleration)
- GalaxyScene wired with FlightController and WarpStreaks, AutoOrbitCamera fully removed
- Confirmed DOM WarpTransition (auth flow) and 3D WarpStreaks (navigation) use separate state domains with no visual conflict

## Task Commits

Each task was committed atomically:

1. **Task 1: FlightController component with camera state machine** - `cbab542` (feat)
2. **Task 2: WarpStreaks 3D particle system and GalaxyScene wiring** - `285a86a` (feat)

## Files Created/Modified
- `src/components/canvas/FlightController.tsx` - Custom camera controller with 4-state machine (idle/cruising/warping/inspecting), module-scope input capture, WASD movement, mouse look, drift damping, warp interpolation
- `src/components/canvas/WarpStreaks.tsx` - 800-streak instanced particle system for hyperspace effect, driven by warp-visuals derivation, additive blending
- `src/shaders/warp-streaks.ts` - GLSL vertex/fragment shaders for warp streaks with cylindrical placement, Z-axis stretch, and cyan-to-white gradient
- `src/components/canvas/GalaxyScene.tsx` - Replaced AutoOrbitCamera with FlightController, added WarpStreaks

## Decisions Made
- Used `e.key.toLowerCase()` for key capture instead of `e.code` (plan suggested `e.code`). Reason: `computeCruiseVelocity()` in flight-math.ts checks for lowercase keys like "w", "arrowup" -- using `e.code` would produce "KeyW", "ArrowUp" which would never match. This was a deviation Rule 1 auto-fix (bug prevention).
- Confirmed WarpTransition.tsx checks `mode === "transitioning"` (AppMode for auth flow) and does not respond to `cameraMode === "warping"` (CameraMode for navigation). No modification needed -- separate state domains prevent conflict.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used e.key.toLowerCase() instead of e.code for key capture**
- **Found during:** Task 1 (FlightController implementation)
- **Issue:** Plan specified `e.code` for key events (produces "KeyW", "ArrowUp"), but `computeCruiseVelocity()` in flight-math.ts checks for lowercase strings ("w", "arrowup"). Using e.code would produce no movement.
- **Fix:** Used `e.key.toLowerCase()` to produce lowercase key names matching flight-math.ts expectations
- **Files modified:** src/components/canvas/FlightController.tsx
- **Verification:** TypeScript compiles, key names match flight-math.ts expectations
- **Committed in:** cbab542 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug prevention)
**Impact on plan:** Essential for correct keyboard input handling. No scope creep.

## Issues Encountered
- Pre-existing TypeScript error in `src/lib/star-search.ts` (fuse.js package not installed) -- out of scope for this plan, from Plan 01's output. Does not affect FlightController or WarpStreaks code.
- Pre-existing test failure in `star-search.test.ts` for same reason. All 93 actual tests pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Flight controller is the architectural backbone for all subsequent interaction (star clicking, search warp, warp-to-artist)
- Camera state machine supports warp transitions triggered by store.startWarp() -- ready for Plan 03 to wire star click and search
- WarpStreaks self-activates when cameraMode enters "warping" -- zero integration needed from downstream consumers
- AutoOrbitCamera.tsx file remains in codebase (not deleted) but is no longer imported by GalaxyScene

## Self-Check: PASSED

All created files verified on disk. All commit hashes found in git log.

---
*Phase: 04-navigation-interaction*
*Completed: 2026-04-03*
