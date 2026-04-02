---
phase: 01-auth-demo-mode
plan: 02
subsystem: canvas
tags: [r3f, three-js, instanced-mesh, demo-galaxy, orbit-controls, drei, next-dynamic]

# Dependency graph
requires:
  - phase: 01-auth-demo-mode plan 01
    provides: Next.js 16 scaffold, Auth.js v5 config, Vitest test infrastructure, demo data test contract
provides:
  - Static demo galaxy data with 200 curated real songs across 6 genres
  - InstancedMesh rendering of genre-colored stars via R3F
  - Auto-orbit cinematic camera with user override
  - Background starfield for depth
  - SSR-safe dynamic import of R3F Canvas into Next.js App Router
affects: [01-03, 02-data-pipeline, 03-galaxy-rendering]

# Tech tracking
tech-stack:
  added: []
  patterns: [instanced-mesh-with-vertex-colors, dynamic-import-ssr-false-client-wrapper, module-scope-temp-objects, genre-centroid-clustering]

key-files:
  created: [src/data/demo-galaxy.json, src/components/canvas/DemoGalaxy.tsx, src/components/canvas/BackgroundStars.tsx, src/components/canvas/AutoOrbitCamera.tsx, src/components/canvas/GalaxyScene.tsx, src/components/canvas/GalaxySceneLoader.tsx, scripts/generate-demo-data.cjs]
  modified: [src/app/page.tsx]

key-decisions:
  - "Client wrapper GalaxySceneLoader for dynamic import because Next.js 16 disallows ssr:false in server components"
  - "InstancedMesh over Points for demo stars to match real galaxy architecture from Phase 3"
  - "Module-scope THREE.Object3D and THREE.Color to avoid per-frame allocations (Pitfall 3)"
  - "Seeded random for reproducible star positions in demo data generator"

patterns-established:
  - "R3F Canvas in Next.js 16: server page -> client GalaxySceneLoader (dynamic ssr:false) -> GalaxyScene (Canvas)"
  - "InstancedMesh with vertex colors via instancedBufferAttribute for genre-colored stars"
  - "Module-scope temp objects (tempObject, tempColor) for THREE.js performance"
  - "useEffect (not useMemo) for setting InstancedMesh matrices after ref is available"

requirements-completed: [AUTH-03]

# Metrics
duration: 3min
completed: 2026-04-02
---

# Phase 01 Plan 02: Demo Galaxy 3D Scene Summary

**R3F InstancedMesh demo galaxy with 200 real songs across 6 genre clusters, auto-orbit camera, and SSR-safe dynamic import into Next.js 16 landing page**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T21:03:21Z
- **Completed:** 2026-04-02T21:07:10Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- 200 curated real songs (Pop, Rock, Hip-Hop, Electronic, R&B, Indie) with pre-computed 3D positions clustered by genre centroids
- InstancedMesh renders all 200 stars at once with genre-based vertex colors (no progressive loading per D-13)
- Auto-orbit camera at speed 0.3 creates cinematic drift; user can override via mouse (per D-02)
- Background starfield (3000 points) creates depth behind the galaxy
- Full-viewport dark canvas loads instantly with no white flash (per D-01, D-12)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create demo galaxy data and all 3D canvas components** - `2895526` (feat)
2. **Task 2: Wire GalaxyScene into page.tsx with dynamic import** - `1c7196f` (feat)

## Files Created/Modified
- `src/data/demo-galaxy.json` - Static demo data: 200 songs, 6 genres, pre-computed 3D positions
- `src/components/canvas/DemoGalaxy.tsx` - InstancedMesh rendering with genre-based vertex colors
- `src/components/canvas/BackgroundStars.tsx` - Distant starfield background using Drei Stars
- `src/components/canvas/AutoOrbitCamera.tsx` - Cinematic auto-orbit with user override via OrbitControls
- `src/components/canvas/GalaxyScene.tsx` - R3F Canvas wrapper with camera config and dark background
- `src/components/canvas/GalaxySceneLoader.tsx` - Client wrapper for dynamic import with ssr:false
- `scripts/generate-demo-data.cjs` - Reproducible demo data generator with seeded random positions
- `src/app/page.tsx` - Landing page: server auth check, renders galaxy as full-viewport canvas

## Decisions Made
- Created GalaxySceneLoader client wrapper because Next.js 16 does not allow `ssr: false` with `next/dynamic` in server components. The page.tsx stays a server component for auth, and delegates the dynamic import to a "use client" wrapper.
- Used InstancedMesh (not Points) for demo stars to establish the same rendering pattern the real galaxy will use in Phase 3, avoiding code divergence later.
- Used seeded pseudo-random with Box-Muller gaussian for star positions so the demo data is reproducible and clusters look natural.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Next.js 16 disallows ssr:false in server components**
- **Found during:** Task 2 (wiring GalaxyScene into page.tsx)
- **Issue:** The plan specified `dynamic(() => import(...), { ssr: false })` directly in page.tsx, but Next.js 16 Turbopack rejects `ssr: false` in server components with a build error.
- **Fix:** Created `GalaxySceneLoader.tsx` as a "use client" wrapper that performs the dynamic import with ssr:false. page.tsx imports and renders this client wrapper instead.
- **Files modified:** src/app/page.tsx, src/components/canvas/GalaxySceneLoader.tsx (new)
- **Verification:** `npm run build` succeeds
- **Committed in:** 1c7196f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor architectural adjustment required by Next.js 16 runtime constraint. Same end result (SSR-safe Canvas loading) achieved through a thin client wrapper.

## Issues Encountered
None beyond the Next.js 16 ssr:false restriction noted above.

## Known Stubs
None. All files contain complete implementations for their scope.

## Next Phase Readiness
- Demo galaxy 3D scene complete -- Plan 03 can add DOM overlays (demo banner, profile menu, connect button)
- GalaxyScene accepts `isAuthenticated` prop ready for conditional rendering of user galaxy in Phase 2+
- Auto-orbit camera and background stars will carry through to the authenticated experience

## Self-Check: PASSED

All 8 created/modified files verified present. Both task commits (2895526, 1c7196f) verified in git log.

---
*Phase: 01-auth-demo-mode*
*Completed: 2026-04-02*
