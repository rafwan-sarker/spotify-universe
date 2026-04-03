# Phase 04: Navigation & Interaction - Research

**Researched:** 2026-04-03
**Domain:** 3D camera controls, raycasting, client-side search, GLSL warp effects (Three.js + R3F)
**Confidence:** HIGH

## Summary

Phase 4 transforms the static galaxy into an interactive experience. Four main subsystems need building: (1) a custom flight controller replacing OrbitControls, (2) star click detection with info card display, (3) client-side fuzzy search with warp-to-result, and (4) a hyperspace warp streak shader effect. All four are well-understood problems in the Three.js/R3F ecosystem, but the project's specific use of billboard PlaneGeometry with a custom vertex shader creates a critical raycasting challenge that requires a proximity-based picking approach instead of standard geometry raycasting.

The existing codebase (RealGalaxy InstancedMesh, Zustand store, star shaders) provides solid integration points. The main technical risks are: (a) raycasting mismatch between GPU-billboarded geometry and CPU-side raycaster, (b) camera state machine complexity for interruptible warp transitions, and (c) ensuring the warp streak shader renders correctly in the 3D scene without conflicting with the existing additive-blending star material.

**Primary recommendation:** Build a camera state machine as the architectural backbone (IDLE/CRUISING/WARPING/INSPECTING states), then layer click detection, search, and warp effects on top of it. Use proximity-based picking (not geometry raycasting) for star selection since the billboard vertex shader moves geometry on the GPU where the CPU raycaster cannot follow.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Cruise flight controls -- WASD/arrow keys for movement, mouse for camera look direction. Hold-to-fly, release-to-drift.
- **D-02:** Gentle drift on key release -- camera decelerates over ~1-2 seconds, zero-gravity coasting feel.
- **D-03:** Scroll wheel controls speed boost/brake.
- **D-04:** Slow auto-drift resumes after ~5 seconds of idle -- keeps galaxy feeling alive. Stops immediately on input.
- **D-05:** Replaces the current `AutoOrbitCamera` (OrbitControls) with a custom flight controller.
- **D-06:** Click a star -> camera glides close to it -> floating info card appears beside the star in 3D space.
- **D-07:** Info card shows: track name, artist name, album art, genre, "Open in Spotify" link, and "Warp to Artist" button.
- **D-08:** "Warp to Artist" button triggers hyperspace warp to that artist's full constellation (all songs by that artist).
- **D-09:** Info card is an HTML overlay positioned via drei's `Html` component, neon synthwave styled.
- **D-10:** Extend `StarData` to include `albumArt` URL (from `SpotifyTrackRaw.album.images`) -- requires small pipeline update.
- **D-11:** Search bar at top center of viewport, hidden by default. Opens via keyboard shortcut (`/` or `Cmd+K`) or click.
- **D-12:** Client-side fuzzy search over the stars[] array -- matches song names and artist names. No Spotify API calls.
- **D-13:** Dropdown results below the search input, showing matching tracks with artist name.
- **D-14:** Select a result -> search closes -> camera warps to that star with streak effect -> info card opens on arrival.
- **D-15:** Star-streak speed lines (Star Wars hyperspace style) during all warp transitions.
- **D-16:** Three-phase animation: acceleration (stars elongate, FOV widens, ~0.3s) -> full hyperspace (streaks fill screen, ~0.5s) -> deceleration (streaks shorten, FOV returns, ~0.4s).
- **D-17:** Same warp effect used for all warp types (star click, search result, "warp to artist" button) -- consistent experience.
- **D-18:** Built as a shader pass or particle system in the 3D scene, NOT a DOM overlay like the current WarpTransition.

### Claude's Discretion
- Exact WASD movement speed and drift damping values (tune for feel)
- Raycasting implementation for star click detection on InstancedMesh
- Fuzzy search library choice (fuse.js, custom, etc.)
- Star-streak shader implementation approach (custom shader pass, particle system, or post-processing)
- Camera interpolation curve for warp travel (easing function)
- How to handle click on empty space (dismiss info card? do nothing?)
- Search result limit and ranking algorithm

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NAV-01 | Smooth cruise flight controls (mouse/keyboard) for free-form exploration | Flight controller architecture (Pattern 1), camera state machine (Pattern 2), input handling approach, drift/deceleration math |
| NAV-02 | Hyperspace warp jump transition (star-streak effect) when navigating | Warp streak shader approach (Pattern 4), three-phase animation design, FOV manipulation in useFrame |
| NAV-03 | Click a star to warp to that artist's constellation | Proximity-based picking on InstancedMesh (Pattern 3), info card via drei Html, StarData albumArt extension, warp target computation from GenreCluster centroids |
| NAV-04 | Search bar to find any song/artist and warp directly to it | Fuse.js fuzzy search (Standard Stack), search UI with Motion animations, warp integration via shared camera state machine |
</phase_requirements>

## Standard Stack

### Core (no new dependencies needed)
| Library | Version | Purpose | Already Installed |
|---------|---------|---------|-------------------|
| three | ^0.183.0 | Camera, Vector3 lerp/damp, Raycaster, ShaderMaterial | Yes |
| @react-three/fiber | ^9.5.0 | useFrame, useThree, R3F event system (onClick on instancedMesh) | Yes |
| @react-three/drei | ^10.7.0 | Html component (info card overlay), KeyboardControls (optional) | Yes |
| zustand | ^5.0.12 | Camera state, selected star, search state, warp target | Yes |
| motion | ^12.38.0 | Search bar open/close animations, info card transitions | Yes |
| tailwindcss | ^4.1.0 | Search bar and info card styling | Yes |

### New Dependencies
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fuse.js | ^7.2.0 | Client-side fuzzy search over stars array | Zero-dependency, 492KB unpacked (tree-shakeable), well-suited for 5K-10K item datasets with typo tolerance. No API calls needed. Used by thousands of React apps for exactly this pattern. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fuse.js | Custom filter with `String.includes()` | Faster but no fuzzy matching (typo tolerance). Users typing "artic monkys" would get zero results. Fuse.js handles this gracefully. |
| fuse.js | minisearch | Slightly faster for exact prefix matching but larger API surface, less battle-tested in React ecosystem. |
| fuse.js | microfuzz | Smaller (1.2KB) but no configurable scoring or weighted fields. Fuse.js allows weighting `name` higher than `artist`. |
| drei Html | Custom CSS transform projection | Html component handles all the 3D-to-screen math, occlusion, and z-indexing. Rolling your own is error-prone and adds no value. |

**Installation:**
```bash
npm install fuse.js
```

## Architecture Patterns

### Recommended Component Structure
```
src/
├── components/
│   ├── canvas/
│   │   ├── FlightController.tsx     # Custom camera controller (replaces AutoOrbitCamera)
│   │   ├── WarpStreaks.tsx           # 3D warp streak particle/shader effect
│   │   ├── StarInfoCard.tsx          # drei Html component for star info overlay
│   │   └── RealGalaxy.tsx            # Existing (add onClick handler)
│   └── ui/
│       ├── SearchBar.tsx             # DOM overlay search with fuse.js
│       └── WarpTransition.tsx        # Existing (deprecated, replaced by WarpStreaks)
├── lib/
│   ├── store.ts                      # Extend with camera/navigation/search state
│   ├── flight-math.ts                # Pure functions: velocity damping, drift, speed curves
│   └── star-picking.ts               # Proximity-based star picking from click position
└── shaders/
    └── warp-streaks.ts               # GLSL vertex/fragment for speed lines
```

### Pattern 1: Custom Flight Controller (Camera State Machine)

**What:** A single `FlightController` component inside Canvas that replaces `AutoOrbitCamera`. Uses `useFrame` for all per-frame updates. Reads input state and camera mode from Zustand via `getState()` (never subscriptions).

**When to use:** Always active inside the Canvas. Manages all camera behavior across 4 states.

**Camera State Machine:**
```
IDLE         -> User not touching input for ~5s. Gentle auto-drift (slow rotation).
                Transitions to: CRUISING (any input), WARPING (warp trigger)

CRUISING     -> WASD moves camera along its forward/right vectors.
                Mouse delta rotates camera (Euler angles).
                Scroll adjusts speed multiplier.
                Velocity decelerates via damping on key release (~1-2s drift).
                Transitions to: IDLE (5s no input), WARPING (warp trigger)

WARPING      -> Automated 3-phase transition to target position.
                Phase 1 (0.3s): FOV widens, stars elongate (WarpStreaks activates)
                Phase 2 (0.5s): Camera lerps toward target, full streak effect
                Phase 3 (0.4s): FOV restores, streaks fade, camera settles
                Cancellable: new warp starts from CURRENT position.
                Transitions to: INSPECTING (arrival), WARPING (new target mid-warp)

INSPECTING   -> Camera parked near a star. Slow auto-orbit around the point.
                Info card visible.
                Transitions to: CRUISING (any movement input), WARPING (warp trigger)
```

**Implementation approach:**
```typescript
// Inside FlightController.tsx useFrame callback
useFrame(({ camera, clock }, delta) => {
  const state = useAppStore.getState()

  switch (state.cameraMode) {
    case 'idle':
      handleIdleDrift(camera, delta)
      break
    case 'cruising':
      handleCruiseMovement(camera, inputState, delta)
      break
    case 'warping':
      handleWarpTransition(camera, state.warpTarget, state.warpProgress, delta)
      break
    case 'inspecting':
      handleInspectOrbit(camera, state.selectedStar, delta)
      break
  }
})
```

**Critical: input handling approach.** Store pressed keys in a `Set<string>` via `keydown`/`keyup` event listeners (registered with `useEffect`). Read the Set inside `useFrame`. Do NOT use `useState` for per-frame input -- that triggers re-renders.

```typescript
// Module-scope input state (zero re-renders)
const keysPressed = new Set<string>()
const mouseDelta = { x: 0, y: 0 }
```

### Pattern 2: Zustand Store Extension for Navigation

**What:** Extend the existing `useAppStore` with navigation-specific state slices.

**New store fields:**
```typescript
interface NavigationState {
  // Camera mode
  cameraMode: 'idle' | 'cruising' | 'warping' | 'inspecting'
  setCameraMode: (mode: NavigationState['cameraMode']) => void

  // Warp target
  warpTarget: { position: [number, number, number]; starId?: string } | null
  warpProgress: number  // 0-1, driven by useFrame
  startWarp: (target: NavigationState['warpTarget']) => void
  clearWarp: () => void

  // Selected star
  selectedStar: StarData | null
  setSelectedStar: (star: StarData | null) => void

  // Search
  searchOpen: boolean
  searchQuery: string
  setSearchOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
}
```

**Critical pattern:** `warpProgress` is updated from `useFrame` via `getState().warpProgress` and mutated via `setState({ warpProgress: newVal })`. This is one of the few cases where updating Zustand per-frame is acceptable because only the warp streak component subscribes to it, and only during active warps.

### Pattern 3: Proximity-Based Star Picking (Critical Architecture Decision)

**What:** Instead of relying on Three.js raycaster geometry intersection with the InstancedMesh, project the click position into 3D space and find the nearest star by distance.

**Why this is necessary:** The existing `RealGalaxy` uses a `PlaneGeometry` with a custom vertex shader that performs billboarding in view space (`mvPos.xy += position.xy * finalScale`). The CPU-side raycaster has NO knowledge of this GPU transformation. It will test intersection against the un-billboarded plane geometry at each instance position, which means:
- Rays will miss visually-rendered stars because the geometry on the CPU doesn't match the visual on the GPU
- The plane is only 1x1 unit but the shader scales it by `instanceSize` (up to 2.0) -- the raycaster doesn't know about this scaling
- Standard R3F `onClick` events on `<instancedMesh>` will fire but with incorrect/unreliable hit detection

**Recommended approach -- screen-space proximity picking:**

```typescript
// star-picking.ts
import * as THREE from 'three'
import type { StarData } from '@/lib/spotify/types'

const tempVec3 = new THREE.Vector3()
const tempVec2 = new THREE.Vector2()

/**
 * Find the nearest star to a screen-space click position.
 *
 * Projects each star's world position to screen space, then finds the closest
 * one within a pixel-distance threshold. This bypasses the raycaster entirely,
 * avoiding the billboard vertex shader mismatch.
 *
 * Performance: Linear scan of stars array. For 10,000 stars, this takes <1ms
 * (single pass, no allocations, just float math). Only runs on click, not per-frame.
 */
export function findNearestStar(
  ndcX: number,  // Normalized device coordinates (-1 to 1)
  ndcY: number,
  stars: StarData[],
  camera: THREE.PerspectiveCamera,
  maxScreenDistance: number = 30  // pixels, tunable
): StarData | null {
  let nearest: StarData | null = null
  let nearestDist = Infinity

  for (const star of stars) {
    tempVec3.set(star.position[0], star.position[1], star.position[2])
    tempVec3.project(camera)

    const dx = (tempVec3.x - ndcX)
    const dy = (tempVec3.y - ndcY)
    const dist = Math.sqrt(dx * dx + dy * dy)

    // Also check that star is in front of camera (z < 1 in NDC)
    if (dist < nearestDist && tempVec3.z < 1 && tempVec3.z > -1) {
      nearestDist = dist
      nearest = star
    }
  }

  // Convert NDC distance to approximate pixel distance for threshold
  // This is a simplification; exact conversion depends on viewport size
  if (nearest && nearestDist < maxScreenDistance / window.innerWidth * 2) {
    return nearest
  }

  return null
}
```

**Alternative considered:** R3F's built-in `onClick` event on `<instancedMesh>`. This DOES return `instanceId` from Three.js raycasting. However, because the instance matrices have `scale(1,1,1)` (size is applied in the vertex shader, not the matrix), the raycaster tests against a tiny 1x1 plane -- practically unhittable. To make R3F onClick work, you would need to set each instance's matrix scale to match `instanceSize`, which means keeping CPU-side scale in sync with shader-side scale. This is viable but adds complexity. The proximity approach is simpler and more robust.

### Pattern 4: Warp Streak Effect (3D Particle System)

**What:** A particle system rendered inside the R3F Canvas that creates Star Wars hyperspace-style speed lines during warp transitions.

**Why particle system over post-processing shader pass:** A particle system is self-contained (mount/unmount cleanly), doesn't interfere with the existing star rendering pipeline, and is easier to control (activate/deactivate based on Zustand `cameraMode === 'warping'`). A fullscreen shader pass would require integrating with `@react-three/postprocessing` EffectComposer which isn't set up yet (that's Phase 5).

**Implementation approach:**

```typescript
// WarpStreaks component (inside Canvas)
// Uses a Points geometry with ~500-1000 particles
// Particles are lines (elongated via vertex shader) radiating from screen center
// Activated when cameraMode === 'warping', hidden otherwise

// Vertex shader:
// - Each particle has a base position on a cylinder around the camera's forward axis
// - During warp, particles stretch along the camera forward direction
// - Stretch amount = warpProgress mapped through the 3-phase curve
// - FOV is widened by the FlightController during warp (not the streak shader)

// Fragment shader:
// - White-blue gradient along the streak length
// - Alpha fades toward tail
// - Additive blending (same as stars)
```

**Three-phase animation timing (D-16):**
```
Phase 1 - Acceleration (0-0.3s):
  - Stars begin to elongate (stretch factor 0 -> 3)
  - FOV widens from 60 -> 80 degrees
  - Streak opacity fades in 0 -> 0.8

Phase 2 - Full Hyperspace (0.3-0.8s):
  - Streaks at full length (stretch factor 3-5)
  - Camera lerps toward target (bulk of the distance)
  - FOV at 80, streaks at full opacity

Phase 3 - Deceleration (0.8-1.2s):
  - Streaks shorten (stretch factor 5 -> 0)
  - FOV returns 80 -> 60
  - Streak opacity fades 0.8 -> 0
  - Camera settles at target position
```

**Easing recommendation:** Use `THREE.MathUtils.smoothstep` for phase transitions and `THREE.MathUtils.damp` for camera position interpolation. Damp is preferred over lerp because it's frame-rate independent (accounts for delta time).

### Pattern 5: Info Card via Drei Html

**What:** A React HTML overlay positioned in 3D space next to the selected star, using Drei's `Html` component.

**Key props to use:**
- `center` -- centers the card on the anchor point
- `distanceFactor={10}` -- scales with camera distance for consistent apparent size
- `zIndexRange={[16777271, 0]}` -- ensures correct layering over canvas
- `occlude` -- NOT recommended here (performance cost, and stars are tiny billboards that won't properly occlude)

**Card positioning:** Offset the Html component slightly from the star position so the card doesn't overlap the star itself:

```tsx
<group position={[star.position[0], star.position[1], star.position[2]]}>
  <Html
    center
    distanceFactor={10}
    position={[2, 1, 0]}  // Offset to the right and up
    className="pointer-events-auto"
  >
    <StarInfoCardContent star={star} />
  </Html>
</group>
```

**Neon synthwave styling:** Tailwind classes with custom CSS for glow effects:
```css
/* Neon border glow */
border: 1px solid rgba(0, 255, 255, 0.6);
box-shadow: 0 0 10px rgba(0, 255, 255, 0.3), inset 0 0 10px rgba(0, 255, 255, 0.1);
background: rgba(0, 0, 20, 0.85);
backdrop-filter: blur(8px);
```

### Anti-Patterns to Avoid

- **useState for input tracking:** Never use `useState` for key-down/mouse-move state in the flight controller. Use module-scope mutable objects read inside `useFrame`.
- **Zustand subscriptions for per-frame camera data:** Never subscribe to `warpProgress` or camera position with React selectors. Read via `getState()` inside `useFrame`.
- **Raycaster on billboard geometry:** Do not rely on R3F's built-in onClick event for hit detection on the custom ShaderMaterial InstancedMesh. The GPU billboard transform is invisible to the CPU raycaster.
- **Multiple independent tweens for warp:** Do not use separate GSAP/spring animations for FOV, camera position, and streak intensity. They will desync. Use a single `warpProgress` (0-1) driven in `useFrame`, with all visual properties derived from it.
- **Recreating Fuse index on every keystroke:** Create the Fuse instance once (when stars array stabilizes), memoize it. Only call `fuse.search(query)` on input change.
- **DOM-based warp effect:** D-18 explicitly says the warp effect must be in the 3D scene, NOT a DOM overlay. The existing `WarpTransition.tsx` pattern (motion div) is only for the search bar/info card, not the hyperspace effect.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy text search | Custom scoring algorithm with Levenshtein distance | fuse.js | Handles typos, weighted fields, configurable threshold. Well-tested on datasets of this size. |
| 3D-to-screen projection for Html overlay | Manual matrix math for CSS positioning | drei `Html` component | Handles camera changes, viewport resize, z-indexing, transform mode. Battle-tested. |
| Keyboard shortcut handling | Custom `addEventListener` manager | Native `keydown`/`keyup` + simple Set | Drei's `KeyboardControls` could work but adds unnecessary abstraction for WASD + a few shortcuts. A simple Set is sufficient. |
| Smooth damping math | Custom exponential decay function | `THREE.MathUtils.damp(current, target, lambda, delta)` | Frame-rate independent, already in Three.js. Used by the R3F ecosystem extensively. |
| Vector interpolation | Manual x/y/z lerp | `THREE.Vector3.lerp()` and `THREE.Vector3.lerpVectors()` | Built into Three.js, handles all edge cases, zero allocation when reusing temp vectors. |

## Common Pitfalls

### Pitfall 1: Billboard Raycasting Mismatch
**What goes wrong:** Standard raycasting on the InstancedMesh hits the CPU-side PlaneGeometry (1x1, not billboarded, not scaled by shader), not the visually rendered star. Clicks appear to "miss" stars even when clicking directly on them.
**Why it happens:** The vertex shader billboards and scales the plane on the GPU. The raycaster only knows about the CPU-side geometry and instance matrices (which have scale 1,1,1).
**How to avoid:** Use proximity-based screen-space picking (Pattern 3 above). Project star positions to NDC, find nearest to click position.
**Warning signs:** Stars are clickable only from very specific angles or distances. Clicks consistently land on the wrong star.

### Pitfall 2: Warp Transition Desync on Interruption
**What goes wrong:** User clicks a new star mid-warp. FOV is stuck at 80, streaks still visible, camera heading to old target while new warp begins.
**Why it happens:** Multiple independent animations (FOV tween, position tween, streak animation) don't share a single progress variable.
**How to avoid:** Single `warpProgress` (0-1) value drives ALL warp visuals. When a new warp starts, reset `warpProgress` to 0 and update `warpTarget` to the new destination. Camera position starts from wherever it currently is (not the original start point).
**Warning signs:** Rapidly clicking stars leaves visual artifacts or stuck states.

### Pitfall 3: Pointer Lock Trapping the User
**What goes wrong:** Using `requestPointerLock()` for mouse look makes it impossible to click UI elements (search bar, info card, Spotify link). User feels "trapped" in the 3D scene.
**Why it happens:** Pointer lock captures all mouse events to the canvas.
**How to avoid:** Do NOT use pointer lock. Instead, use mouse delta from `mousemove` events only while the user is holding a mouse button (e.g., right-click drag for camera look). This keeps the cursor free for clicking stars and UI elements. The search bar and info card are DOM overlays above the canvas and need normal pointer interaction.
**Warning signs:** User cannot click "Open in Spotify" link or search bar while pointer is locked.

### Pitfall 4: Search Re-creating Fuse Index on Every Render
**What goes wrong:** Creating `new Fuse(stars, options)` inside the search component without memoization. With 10,000 stars, Fuse.js index creation takes ~50-100ms -- noticeable jank on every render.
**Why it happens:** React component re-renders when search query changes, and if the Fuse instance is created in the render path, it's rebuilt each time.
**How to avoid:** Create the Fuse instance in a `useMemo` that depends only on `stars.length` (or a hash). The Fuse instance is reused for all searches until the star array changes.
**Warning signs:** Typing in the search bar feels sluggish, especially with large libraries.

### Pitfall 5: Camera Jitter from Euler Angle Gimbal Lock
**What goes wrong:** Using Euler angles (rotation.x, rotation.y, rotation.z) for camera look direction. When looking straight up or down, the camera suddenly flips or rotates unexpectedly (gimbal lock).
**Why it happens:** Euler angles have a singularity at +/- 90 degrees pitch.
**How to avoid:** Clamp the pitch angle to avoid the singularity (e.g., -85 to +85 degrees). Apply yaw rotation around world Y axis, pitch rotation around camera's local X axis. Alternatively, use quaternion slerp for interpolation, but store separate yaw/pitch values for input accumulation.
**Warning signs:** Looking straight up causes the camera to spin wildly.

### Pitfall 6: StarData Missing albumArt for Demo Stars
**What goes wrong:** The info card tries to display `star.albumArt` but demo stars (from `demo-galaxy.json`) don't have this field. Runtime error or blank image.
**Why it happens:** D-10 adds `albumArt` to `StarData` but the demo data predates this field.
**How to avoid:** Make `albumArt` optional in `StarData` (`albumArt?: string`). In the info card, show a genre-colored placeholder when albumArt is undefined. Update demo-galaxy.json to include placeholder art URLs if desired.
**Warning signs:** Info card works for authenticated users but crashes or shows broken image in demo mode.

## Code Examples

### Flight Controller Input Handling
```typescript
// Module-scope input state (NOT React state -- zero re-renders)
const keysPressed = new Set<string>()
let mouseRightDown = false
const mouseDelta = { x: 0, y: 0 }

// Source: Established pattern from R3F community, adapted for this project
export function FlightController() {
  const { camera, gl } = useThree()

  useEffect(() => {
    const canvas = gl.domElement

    const onKeyDown = (e: KeyboardEvent) => keysPressed.add(e.code)
    const onKeyUp = (e: KeyboardEvent) => keysPressed.delete(e.code)
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) mouseRightDown = true
    }
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) mouseRightDown = false
    }
    const onMouseMove = (e: MouseEvent) => {
      if (mouseRightDown) {
        mouseDelta.x += e.movementX
        mouseDelta.y += e.movementY
      }
    }
    const onContextMenu = (e: Event) => e.preventDefault()

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('contextmenu', onContextMenu)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('contextmenu', onContextMenu)
    }
  }, [gl])

  useFrame(({ camera }, delta) => {
    // Read input, update camera -- see flight-math.ts for pure functions
  })

  return null
}
```

### Fuse.js Search Setup
```typescript
// Source: fuse.js official docs + React best practices
import Fuse from 'fuse.js'
import { useMemo } from 'react'
import type { StarData } from '@/lib/spotify/types'

const FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 0.7 },    // Track name weighted higher
    { name: 'artist', weight: 0.3 },   // Artist name secondary
  ],
  threshold: 0.4,      // 0 = exact, 1 = match anything
  includeScore: true,
  limit: 10,            // Max results to return
}

export function useStarSearch(stars: StarData[]) {
  const fuse = useMemo(
    () => new Fuse(stars, FUSE_OPTIONS),
    [stars.length]  // Only rebuild when star count changes
  )

  return (query: string) => {
    if (!query.trim()) return []
    return fuse.search(query).map((result) => result.item)
  }
}
```

### Warp Progress Driving All Visuals
```typescript
// Source: Pitfall 15 from PITFALLS.md -- single progress variable pattern
// All warp visuals derived from ONE number (0-1)

function deriveWarpVisuals(progress: number) {
  // Phase 1: 0 - 0.25 (acceleration)
  // Phase 2: 0.25 - 0.67 (full hyperspace)
  // Phase 3: 0.67 - 1.0 (deceleration)

  let streakStretch: number
  let fovOffset: number
  let streakOpacity: number

  if (progress < 0.25) {
    // Acceleration
    const t = progress / 0.25
    streakStretch = THREE.MathUtils.lerp(0, 3, t)
    fovOffset = THREE.MathUtils.lerp(0, 20, t)
    streakOpacity = THREE.MathUtils.lerp(0, 0.8, t)
  } else if (progress < 0.67) {
    // Full hyperspace
    const t = (progress - 0.25) / 0.42
    streakStretch = THREE.MathUtils.lerp(3, 5, t)
    fovOffset = 20
    streakOpacity = 0.8
  } else {
    // Deceleration
    const t = (progress - 0.67) / 0.33
    streakStretch = THREE.MathUtils.lerp(5, 0, t)
    fovOffset = THREE.MathUtils.lerp(20, 0, t)
    streakOpacity = THREE.MathUtils.lerp(0.8, 0, t)
  }

  return { streakStretch, fovOffset, streakOpacity }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Drei FlyControls for space navigation | Custom flight controller in useFrame | Ongoing best practice | FlyControls too generic for cinematic warp + cruise hybrid |
| Raycaster geometry intersection for particles | Screen-space proximity picking | Required by custom vertex shaders | Standard raycasting fails with GPU-side billboard transforms |
| GSAP tweens for camera animation | THREE.MathUtils.damp() in useFrame | R3F v9 patterns | Frame-rate independent, no external animation library needed |
| Separate DOM warp overlay (opacity fade) | 3D particle system in Canvas | This phase (D-18) | Much more immersive than a black fade overlay |

**Deprecated/outdated:**
- `AutoOrbitCamera` (OrbitControls wrapper): Being replaced by FlightController in this phase.
- `WarpTransition.tsx` (DOM overlay fade): Being replaced by 3D WarpStreaks effect. Can be removed or kept as fallback.

## Pipeline Update: albumArt Field

**D-10 requires extending StarData with albumArt.** Here's what needs changing:

1. **`src/lib/spotify/types.ts`**: Add `albumArt?: string` to `StarData` interface
2. **`src/lib/spotify/types.ts`**: Add `albumArt?: string` to `NormalizedTrack` interface (optional -- alternatively carry it through a separate lookup)
3. **`src/lib/spotify/fetch-orchestrator.ts`**: In `addTrack()`, extract `raw.artists[0]?.name` already works; also extract `raw.album?.images?.[0]?.url` (largest image) or `raw.album?.images?.[1]?.url` (300px, better for cards)
4. **`src/workers/galaxy-layout.worker.ts`**: Pass `albumArt` through from NormalizedTrack to StarData in the `stars.push()` call
5. **`src/data/demo-galaxy.json`**: NOT updated (demo stars get undefined albumArt, info card shows placeholder)

**Album image sizes from Spotify API:**
- `images[0]`: 640x640 (too large for a small card)
- `images[1]`: 300x300 (ideal for info card)
- `images[2]`: 64x64 (too small)

Use `images[1]?.url ?? images[0]?.url` for the info card.

## Open Questions

1. **Click on empty space behavior**
   - What we know: D-06 says click a star to inspect it. No decision on clicking empty space.
   - What's unclear: Should clicking empty space dismiss the info card? Or should Escape key dismiss it?
   - Recommendation: Click on empty space dismisses info card + returns camera to CRUISING. Escape key also dismisses. This is the most intuitive UX pattern.

2. **Mouse look: right-click drag vs. always-on**
   - What we know: D-01 says mouse for camera look direction. Not specified whether this requires holding a button.
   - What's unclear: Always-on mouse look makes it impossible to click stars or UI. Right-click drag is more conservative.
   - Recommendation: Right-click drag for camera look. Left-click for star picking. This preserves ability to interact with DOM overlays (search bar, info card links, Spotify button).

3. **Warp destination for "Warp to Artist"**
   - What we know: D-08 says warp to artist's "full constellation" (all songs by that artist). GenreCluster centroids exist.
   - What's unclear: If an artist has songs in multiple genres, they'll be spread across different clusters. Where exactly should the camera go?
   - Recommendation: Compute a centroid of all stars belonging to that artist (average of their positions). This naturally handles multi-genre artists. If all songs are in one cluster, it's the same as the genre centroid.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NAV-01 | Flight controller velocity/damping math | unit | `npx vitest run src/__tests__/flight-math.test.ts -t "velocity"` | Wave 0 |
| NAV-01 | Camera state transitions (idle/cruising/warping/inspecting) | unit | `npx vitest run src/__tests__/flight-math.test.ts -t "state"` | Wave 0 |
| NAV-02 | Warp visual parameter derivation from progress 0-1 | unit | `npx vitest run src/__tests__/warp-visuals.test.ts` | Wave 0 |
| NAV-03 | Screen-space proximity star picking | unit | `npx vitest run src/__tests__/star-picking.test.ts` | Wave 0 |
| NAV-03 | StarData albumArt field extension | unit | `npx vitest run src/__tests__/star-data.test.ts` | Existing (extend) |
| NAV-04 | Fuse.js search over star array | unit | `npx vitest run src/__tests__/star-search.test.ts` | Wave 0 |
| NAV-01-04 | Visual integration (flight, click, search, warp) | manual | Browser testing with dev tools | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/flight-math.test.ts` -- covers NAV-01 (velocity damping, drift, speed curves, state transitions)
- [ ] `src/__tests__/warp-visuals.test.ts` -- covers NAV-02 (three-phase progress-to-visual mapping)
- [ ] `src/__tests__/star-picking.test.ts` -- covers NAV-03 (proximity-based picking, distance thresholds, edge cases)
- [ ] `src/__tests__/star-search.test.ts` -- covers NAV-04 (fuse.js integration, weighted fields, empty query, no results)

## Project Constraints (from CLAUDE.md)

- **Tech Stack**: Three.js + TypeScript + React (R3F) -- all new components must use these
- **Performance**: Must handle 5,000+ stars at 60fps -- flight controller, search, and picking must not degrade frame rate
- **Assets**: No paid 3D assets -- warp streaks must be procedural (shader/particle generated)
- **Code style**: Clear naming, small focused functions, comments only where logic isn't self-evident
- **Git**: Feature branch, clear commit messages explaining WHY, run tests before committing
- **Security**: Never hardcode secrets, validate input at boundaries
- **Files**: Keep files small (~300 lines), group by feature (canvas/ for 3D, ui/ for DOM)

## Sources

### Primary (HIGH confidence)
- Three.js InstancedMesh docs: https://threejs.org/docs/pages/InstancedMesh.html
- Drei Html component docs: https://drei.docs.pmnd.rs/misc/html
- R3F Events API: https://r3f.docs.pmnd.rs/api/events
- Fuse.js official docs: https://www.fusejs.io/
- Three.js Raycaster docs: https://threejs.org/docs/pages/Raycaster.html
- Three.js MathUtils (damp, lerp, smoothstep): https://threejs.org/docs/#api/en/math/MathUtils

### Secondary (MEDIUM confidence)
- InstancedMesh raycasting with custom shaders (Three.js forum): https://discourse.threejs.org/t/raycaster-not-intersecting-with-custom-vertex-shader/28936
- Billboard InstancedMesh discussion: https://discourse.threejs.org/t/instancedmesh-implement-billboard/29354
- Best way to do InstancedMesh picking in 2024: https://discourse.threejs.org/t/best-way-to-do-instanced-mesh-picking-in-2024/59917
- R3F camera lerp discussion: https://discourse.threejs.org/t/useframe-with-lerp-for-camera-position-animation/63595
- Space warp effect tutorial: https://redstapler.co/space-warp-background-effect-three-js/
- High-speed light trails in Three.js (Codrops): https://tympanus.net/codrops/2019/11/13/high-speed-light-trails-in-three-js/
- Fuse.js React integration guide: https://dev.to/noclat/using-fuse-js-with-react-to-build-an-advanced-search-with-highlighting-4b93
- R3F InstancedMesh onClick behavior: https://github.com/pmndrs/react-three-fiber/issues/3289

### Tertiary (LOW confidence)
- Star Wars hyperspace CodePen: https://codepen.io/ybensira/pen/byYNBZ (visual reference, not code reference)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- fuse.js is well-established, all other libs already installed
- Architecture: HIGH -- camera state machine, proximity picking, and warp progress patterns are well-understood
- Pitfalls: HIGH -- billboard raycasting mismatch verified via Three.js forum discussions and official docs
- Warp streak shader: MEDIUM -- approach is clear but specific GLSL implementation will require iteration

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable domain, no fast-moving dependencies)
