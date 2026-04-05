# Phase 5: Visual Polish, HUD & Personalization - Research

**Researched:** 2026-04-03
**Domain:** Post-processing effects (bloom/glow), 3D text rendering, 2D minimap HUD, constellation line geometry, galaxy stats computation
**Confidence:** HIGH

## Summary

This phase transforms a functional galaxy into a visually stunning, personally meaningful experience. The core technical domains are: (1) bloom post-processing on top of existing custom ShaderMaterial with additive blending, (2) drei Text + Billboard for floating genre labels in 3D space, (3) drei Line for artist constellation connections, (4) a 2D Canvas minimap overlay, and (5) derived statistics/personality computation from existing store data.

The project is well-positioned for this phase. The star ShaderMaterial already has `toneMapped={false}` and uses additive blending -- both prerequisites for bloom to work. The `instanceIsTopTrack` shader attribute already exists and can be extended to differentiate top-5 beacon stars with a stronger brightness multiplier. `@react-three/postprocessing` is in the project's dependency list but NOT yet installed -- it must be installed as the first task. All genre cluster centroids and color mappings are already computed and available in the store.

**Primary recommendation:** Install `@react-three/postprocessing`, add EffectComposer with Bloom + Vignette to GalaxyScene.tsx, then build each visual feature as an independent component that reads from the existing Zustand store. The minimap should be a 2D Canvas overlay (DOM layer, not inside R3F Canvas) for performance isolation. Stats and personality are pure computed derivations from `store.stars[]` and `store.genres[]`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Dramatic neon glow bloom -- strong bloom that makes stars radiate light halos. Dense clusters glow like nebulae. Synthwave music visualizer intensity.
- **D-02:** Use `@react-three/postprocessing` EffectComposer with Bloom effect. Already in the project's recommended stack.
- **D-03:** Bloom should amplify the existing additive blending on stars (Phase 3 D-04) -- the two effects compound.
- **D-04:** Top 5 most-listened stars are 2-3x brighter with a wider glow radius. Visible from across the galaxy. Unmissable beacons.
- **D-05:** Leverage existing `instanceIsTopTrack` shader attribute -- extend it to differentiate top-5 from other top tracks with a stronger brightness multiplier.
- **D-06:** Glowing genre text at each `GenreCluster.centroid` position in 3D space. Billboard (always face camera). Neon-colored matching the genre color.
- **D-07:** Labels fade based on distance -- fully visible when near, semi-transparent when far, hidden when very far. Prevents clutter at galaxy-wide zoom.
- **D-08:** Use drei `Text` or `Html` component for rendering at cluster centroids.
- **D-09:** Stats card fades in after galaxy finishes building. Shows for ~5 seconds, auto-hides. User can toggle it back with a hotkey.
- **D-10:** Positioned in bottom-left corner. Doesn't conflict with search (top-center), profile (top-right), or mini-map (top-right).
- **D-11:** Shows: total star count, genre count, dominant genre percentage, galaxy personality label.
- **D-12:** Galaxy personality types: "Eclectic Explorer" (balanced genres), "Genre Loyalist" (>50% one genre), "Deep Diver" (lots of obscure/small tracks), "Mainstream Voyager" (mostly popular/top tracks), "Time Traveler" (spans many decades via addedAt dates).
- **D-13:** Lines appear when you click a star and the info card opens. Connect all stars by that same artist. Disappear when info card dismisses.
- **D-14:** Thin glowing cyan lines (#00f0ff) matching the synthwave accent color. Fade in/out with animation.
- **D-15:** Use Three.js `Line` or `LineSegments` with a custom material for glow effect.
- **D-16:** Small ~150px box in top-right corner. Always visible during exploration.
- **D-17:** Shows all genre clusters as colored dots (matching genre colors) with a white triangle for camera position/direction.
- **D-18:** Dark semi-transparent background (`rgba(0, 0, 20, 0.85)`) matching established glassy aesthetic.
- **D-19:** 2D top-down projection of the 3D galaxy -- flatten Y axis, show X/Z positions.

### Claude's Discretion
- Bloom intensity value and threshold tuning
- How to determine "top 5" beacon stars (from topRanking field or store sort)
- Genre label font size and opacity curves for distance fading
- Stats card toggle hotkey (suggestion: `i` for info)
- Constellation line geometry approach (BufferGeometry lines vs drei Line)
- Mini-map update frequency and rendering approach (Canvas 2D overlay vs mini R3F scene)
- Performance optimization if bloom + 5000 stars causes frame drops

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-01 | Neon synthwave aesthetic with bloom/glow post-processing on all stars | `@react-three/postprocessing` Bloom with mipmapBlur, low luminance threshold. Star shader already has toneMapped={false} and additive blending -- bloom will pick up bright star output naturally. Boost beacon stars above 1.0 in shader for selective extra glow. |
| VIS-02 | Warp streak particle effects during hyperspace jumps | Already implemented in Phase 4 (`WarpStreaks.tsx`). Bloom will automatically amplify the existing warp streaks since their material has `toneMapped={false}`. No additional work needed for this requirement. |
| VIS-05 | Top 5 most-listened stars glow as bright beacons (unmissable in the galaxy) | Extend existing `instanceIsTopTrack` buffer to a float (0.0 = normal, 1.0 = top track, 2.0 = top-5 beacon). Shader multiplies color output by 2-3x for beacon stars, producing HDR values that bloom amplifies dramatically. Top 5 determined by sorting stars with highest brightness (short_term top tracks, positions 0-4). |
| VIS-06 | Genre labels floating in 3D space near each cluster | drei `Text` component wrapped in drei `Billboard` at each GenreCluster.centroid. Distance-based opacity via useFrame checking camera distance. troika-3d-text provides SDF rendering for sharp labels at any distance. |
| UI-01 | Mini-map HUD showing current position in the galaxy | 2D Canvas overlay in DOM layer (not inside R3F Canvas). Renders colored dots for genre centroids and a white triangle for camera. Updates via requestAnimationFrame reading camera position from store/ref. 150px box in top-right corner. |
| UI-05 | Galaxy stats card ("Your galaxy: X stars, Y genres, Z% dominant genre") | DOM overlay in bottom-left corner using Motion for fade animation. Stats derived from store.stars[] and store.genres[]. Reuses ControlsHint auto-dismiss pattern (5s timeout, toggle with 'i' key). |
| UI-06 | Galaxy personality label based on genre distribution | Pure computation from genre distribution data in store. Algorithm classifies into personality types based on distribution entropy, dominant genre percentage, and star source/ranking patterns. |
| UI-07 | Artist constellation lines connecting stars by the same artist on star selection | drei `Line` component (wraps THREE.Line2 with LineMaterial for pixel-width control). Points are positions of all stars matching selectedStar.artist. Rendered conditionally when selectedStar is set. Cyan color (#00f0ff) with toneMapped={false} for bloom glow. |
</phase_requirements>

## Standard Stack

### Core (Phase 5 additions)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-three/postprocessing | 3.0.4 | Bloom, Vignette, ToneMapping effects | Only R3F-compatible postprocessing wrapper. Merges effects into minimal render passes automatically. Peer deps: R3F >=9.0.0, React >=19.0, Three >= 0.156 -- all satisfied by project. |
| postprocessing | 6.39.0 | Underlying postprocessing engine | Auto-installed as dependency of @react-three/postprocessing. Provides BloomEffect, EffectComposer, etc. |

### Already Installed (used in this phase)
| Library | Version | Purpose | Phase 5 Usage |
|---------|---------|---------|---------------|
| @react-three/drei | 10.7.7 | Text, Billboard, Line components | Genre labels (Text+Billboard), constellation lines (Line) |
| motion | 12.38.0+ | DOM animations | Stats card fade-in/out, minimap mount animation |
| zustand | 5.0.12+ | State management | Galaxy stats derivation, selectedStar for constellation lines |
| three | 0.183.2 | 3D engine | ShaderMaterial modifications for beacon stars |

### NOT needed
- No new libraries for minimap (use native Canvas 2D API)
- No new libraries for stats computation (pure TypeScript)
- No new libraries for personality classification (pure TypeScript)

**Installation:**
```bash
npm install @react-three/postprocessing
```

**Version verification:** `@react-three/postprocessing@3.0.4` confirmed via npm registry (published 2025-02-20). Peer dependencies satisfied: `@react-three/fiber >=9.0.0` (have 9.5.0), `react >=19.0` (have 19.2.0), `three >= 0.156` (have 0.183.2).

## Architecture Patterns

### Integration Points in Existing Code

```
src/
├── components/
│   ├── canvas/
│   │   ├── GalaxyScene.tsx        # ADD: EffectComposer, GenreLabels, ConstellationLines
│   │   ├── RealGalaxy.tsx         # MODIFY: nothing (shaders handle beacon boost)
│   │   ├── StarInfoCard.tsx       # EXTEND: trigger constellation lines on selectedStar
│   │   └── [new] GenreLabels.tsx  # NEW: Billboard Text at cluster centroids
│   │   └── [new] ConstellationLines.tsx  # NEW: drei Line for artist connections
│   │   └── [new] PostProcessing.tsx  # NEW: EffectComposer + Bloom + Vignette
│   └── ui/
│       ├── [new] GalaxyStats.tsx  # NEW: DOM overlay, stats card + personality
│       └── [new] MiniMap.tsx      # NEW: 2D Canvas overlay, camera position HUD
├── shaders/
│   └── star-shaders.ts           # MODIFY: add beacon brightness boost for top-5
├── lib/
│   ├── store.ts                  # EXTEND: add galaxyStats computed state
│   ├── galaxy-buffers.ts         # MODIFY: extend isTopTracks to differentiate top-5
│   └── [new] galaxy-stats.ts    # NEW: stats + personality computation
└── app/
    └── page.tsx                  # ADD: GalaxyStats, MiniMap to DOM overlay layer
```

### Pattern 1: Bloom + Custom ShaderMaterial Interaction
**What:** The existing star ShaderMaterial uses `toneMapped={false}` and additive blending. Bloom works by detecting pixel luminance above a threshold. Stars already output values approaching 1.0 for bright stars. For beacon stars (top-5), the shader boosts output above 1.0 (HDR), which bloom amplifies dramatically.

**Critical detail:** `@react-three/postprocessing`'s Bloom is selective by default -- it only blooms materials that output above the `luminanceThreshold`. With `toneMapped={false}`, our star colors are NOT clamped, so they CAN exceed 1.0 if we multiply them in the shader.

**How to control bloom per-star:**
- Normal stars: shader outputs colors in 0.0-1.0 range. Bloom picks them up if luminanceThreshold is low enough (recommended: 0.2-0.4 for "everything glows" synthwave look).
- Top-5 beacon stars: shader multiplies final color by 2.0-3.0, producing HDR values (e.g., cyan star with base color [0.1, 0.8, 0.9] becomes [0.2, 1.6, 1.8]). Bloom amplifies these dramatically, creating visible light halos.

**Example shader modification for beacons:**
```glsl
// In star fragment shader -- add beacon boost
uniform float uBeaconMultiplier; // or derive from instanceIsTopTrack level

// After computing base color:
float beaconBoost = 1.0 + instanceIsTopTrack * 1.5; // 1.0x for normal, 2.5x for top-5
vec3 finalColor = color * alpha * beaconBoost;
gl_FragColor = vec4(finalColor, alpha);
```

**Source:** [Bloom docs](https://react-postprocessing.docs.pmnd.rs/effects/bloom), verified via codebase analysis of existing toneMapped={false} materials.

### Pattern 2: Billboard Text for Genre Labels (drei)
**What:** drei's `Text` component (wraps troika-3d-text) renders SDF text in 3D space. Wrapped in drei's `Billboard` component, labels always face the camera.

**When to use:** Floating genre labels at each GenreCluster.centroid.

**Performance consideration:** With 12 genre clusters (current GENRE_CONFIG count), this creates 12 Text + 12 Billboard components. Troika renders text as a single draw call per Text component using SDF texture atlas. 12 draw calls is negligible.

**Distance-based opacity:** Use `useFrame` to compute camera distance to each label position, then set material opacity accordingly. Use `useThree()` to get camera, and compute distance per frame.

**Example:**
```typescript
function GenreLabel({ position, name, color }: { position: [number, number, number]; name: string; color: [number, number, number] }) {
  const textRef = useRef<any>(null)

  useFrame(({ camera }) => {
    if (!textRef.current) return
    const d = camera.position.distanceTo(new THREE.Vector3(...position))
    // Near: full opacity, Far: fade out, Very far: hidden
    const opacity = d < 30 ? 1.0 : d < 80 ? 1.0 - (d - 30) / 50 : 0.0
    textRef.current.material.opacity = opacity
  })

  return (
    <Billboard position={position}>
      <Text
        ref={textRef}
        fontSize={2}
        color={new THREE.Color(...color)}
        anchorX="center"
        anchorY="middle"
        material-transparent={true}
        material-toneMapped={false}
      >
        {name}
      </Text>
    </Billboard>
  )
}
```

**Source:** [drei Text docs](https://drei.docs.pmnd.rs/abstractions/text), [drei Billboard docs](https://drei.docs.pmnd.rs/abstractions/billboard)

### Pattern 3: Artist Constellation Lines (drei Line)
**What:** drei's `Line` component wraps THREE.Line2 + LineMaterial, providing pixel-width lines that look consistent at any zoom level. When a star is selected, compute all star positions matching that artist and render connecting lines.

**Implementation approach:** Use drei `Line` with `lineWidth`, `color`, and `toneMapped={false}` to make lines glow with bloom.

**Dynamic point generation:** When `selectedStar` changes, filter `store.stars` by artist name, collect their positions into an array. If the artist has N stars, connect them center-out (hub and spoke from centroid) rather than daisy-chain (A-B-C-D), because scattered stars connected in sequence look chaotic.

**Alternative: star-to-star segments.** For small artist collections (2-5 stars), connect all pairs (complete graph) for a constellation pattern. For larger collections (6+), connect to centroid (hub-spoke) to avoid visual clutter.

**Example:**
```typescript
function ConstellationLines() {
  const selectedStar = useAppStore((s) => s.selectedStar)
  const stars = useAppStore((s) => s.stars)

  if (!selectedStar) return null

  const artistStars = stars.filter((s) => s.artist === selectedStar.artist)
  if (artistStars.length < 2) return null

  // For small collections: connect as complete graph
  // For large: hub-spoke from centroid
  const points = computeConstellationPoints(artistStars)

  return (
    <Line
      points={points}
      color="#00f0ff"
      lineWidth={1.5}
      transparent
      opacity={0.7}
      toneMapped={false}
    />
  )
}
```

**Source:** [drei Line docs](https://drei.docs.pmnd.rs/shapes/line)

### Pattern 4: 2D Canvas Minimap (DOM overlay, NOT R3F)
**What:** A 2D `<canvas>` element positioned absolutely over the R3F Canvas. Renders a top-down projection (X/Z axes) of genre cluster positions as colored dots and camera position as a white triangle.

**Why NOT inside R3F Canvas:**
1. Performance isolation -- the minimap runs its own simple draw loop, independent of the main render pipeline.
2. Bloom and other post-processing effects would distort minimap content if rendered inside the same Canvas.
3. The minimap is purely 2D data visualization -- no 3D rendering needed.

**Update strategy:** Use `requestAnimationFrame` in a useEffect to poll camera position. Alternatively, subscribe to store changes imperatively (Zustand subscribe pattern used extensively in RealGalaxy.tsx). Update at ~30fps (every other frame) for efficiency.

**Projection math:**
```typescript
// Project 3D galaxy to 2D minimap coordinates
function projectToMinimap(worldPos: [number, number, number], bounds: { minX: number; maxX: number; minZ: number; maxZ: number }, mapSize: number): { x: number; y: number } {
  const x = ((worldPos[0] - bounds.minX) / (bounds.maxX - bounds.minX)) * mapSize
  const y = ((worldPos[2] - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * mapSize
  return { x, y }
}
```

### Pattern 5: Stats Derivation from Store (pure computation)
**What:** Galaxy stats (total stars, genre count, dominant genre %, personality label) are derived purely from `store.stars[]` and `store.genres[]`. No new data fetching needed.

**When to compute:** After `store.isComplete === true` (all data loaded). Cache result in store to avoid recomputation.

**Personality algorithm:**
```typescript
function computePersonality(stars: StarData[], genres: GenreCluster[]): string {
  const genreCounts: Record<string, number> = {}
  for (const star of stars) {
    genreCounts[star.genre] = (genreCounts[star.genre] || 0) + 1
  }

  const total = stars.length
  const maxGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]
  const dominantPct = maxGenre[1] / total

  // Genre Loyalist: >50% in one genre
  if (dominantPct > 0.5) return "Genre Loyalist"

  // Eclectic Explorer: no genre > 30% and >= 6 genres represented
  const activeGenres = Object.keys(genreCounts).length
  if (dominantPct < 0.3 && activeGenres >= 6) return "Eclectic Explorer"

  // Mainstream Voyager: >60% of stars are top-ranked (brightness > 0.6)
  const topStarCount = stars.filter(s => s.brightness > 0.6).length
  if (topStarCount / total > 0.6) return "Mainstream Voyager"

  // Deep Diver: <30% top-ranked (mostly obscure tracks)
  if (topStarCount / total < 0.3) return "Deep Diver"

  // Time Traveler: default fallback (could check addedAt date spread if available)
  return "Time Traveler"
}
```

### Anti-Patterns to Avoid
- **Bloom on entire scene at full resolution:** Use `mipmapBlur={true}` for efficient bloom. Never use kernel-based bloom at canvas resolution for 5000+ stars -- it halves frame rate.
- **React state for minimap camera position:** The minimap needs camera position every frame. Read via ref or getState(), never via useState subscription.
- **Separate R3F Canvas for minimap:** Creating a second Canvas creates a second WebGL context. Browsers limit total WebGL contexts (usually 8-16). Use 2D Canvas API instead.
- **Conditional rendering for constellation lines:** Use `visible` prop or null return, but ensure the Line component is properly disposed when selectedStar becomes null (R3F handles this via component unmount).
- **Computing stats on every store change:** Stats only need to compute once when `isComplete` becomes true. Use a Zustand `subscribe` listener, not a reactive selector that recomputes on every star batch.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Post-processing bloom | Custom multi-pass blur pipeline | `@react-three/postprocessing` Bloom with mipmapBlur | Merges effects into minimal passes, handles render targets, resizing, and disposal. 10+ edge cases in manual bloom setup. |
| 3D text rendering | Custom SDF texture atlas + shader | drei `Text` (troika-3d-text) | SDF rendering, proper kerning, Unicode support, font loading, all handled. |
| Billboard behavior | Manual lookAt() in useFrame per label | drei `Billboard` wrapper | Handles the quaternion math for all locked axes, integrates with R3F lifecycle. |
| Pixel-width lines in 3D | Custom Line2 + LineGeometry + LineMaterial setup | drei `Line` component | Abstracts LineMaterial resolution updates on resize, supports dashing, flexible point formats. |
| Effect merging/ordering | Manual EffectComposer pass management | `@react-three/postprocessing` EffectComposer | Auto-merges compatible effects, handles render order, disposal on unmount. |

**Key insight:** All 3D rendering primitives needed for this phase (bloom, text, billboard, lines) have battle-tested abstractions in the pmndrs ecosystem (drei + react-postprocessing). The custom work is in the integration logic (which stars are beacons, how stats are derived, minimap projection math), not the rendering primitives.

## Common Pitfalls

### Pitfall 1: Bloom Makes Everything Washed Out
**What goes wrong:** Setting bloom intensity too high or luminance threshold too low turns the entire scene into a white haze. Stars lose their distinct colors. The galaxy looks foggy instead of glowing.
**Why it happens:** With `toneMapped={false}` on star materials AND additive blending, star colors can already be bright. Adding aggressive bloom on top compounds the brightness.
**How to avoid:** Start with conservative bloom settings: `intensity={1.0}`, `luminanceThreshold={0.4}`, `luminanceSmoothing={0.1}`, `mipmapBlur={true}`. Tune UP from there. Use Leva debug panel for real-time adjustment. The beacon stars (top-5) should bloom more by outputting HDR values in the shader, not by lowering the global threshold.
**Warning signs:** Star colors become indistinguishable (all look white). Background near dense clusters becomes bright. FPS drops below 50.

### Pitfall 2: Bloom + Additive Blending Double-Brightness
**What goes wrong:** Stars use additive blending (`THREE.AdditiveBlending`). Bloom adds its own additive pass on top. Dense cluster areas where many stars overlap (additive accumulation) become overwhelmingly bright after bloom -- the two effects compound exponentially.
**Why it happens:** Additive blending sums overlapping star colors. Bloom detects the sum as a high-luminance region and adds even more glow. The result is non-linear brightness escalation in dense areas.
**How to avoid:** Use `mipmapBlur={true}` (softer, more distributed bloom). Consider reducing star opacity slightly when bloom is enabled (reduce base `instanceBrightness` by ~20%). Test specifically with dense cluster views (zoom into a large genre cluster). Vignette effect can also help by darkening screen edges.
**Warning signs:** Cluster centers become solid white circles. Individual stars in clusters are invisible.

### Pitfall 3: Genre Label Performance with Distance Check
**What goes wrong:** Computing `camera.position.distanceTo()` for each of 12 genre labels every frame creates 12 Vector3 distance calculations. While individually cheap, allocating new Vector3 objects inside useFrame triggers GC pressure.
**Why it happens:** `new THREE.Vector3(...position)` creates a new object each frame per label.
**How to avoid:** Pre-allocate a module-scope `_tempVec3` and reuse it via `.set()`. This is the same pattern used throughout the codebase (FlightController, StarClickHandler). With only 12 labels, the performance impact is minimal, but it sets a bad precedent if not done correctly.
**Warning signs:** GC spikes in Chrome DevTools performance panel correlated with label count.

### Pitfall 4: Minimap Canvas Not Cleaning Up
**What goes wrong:** A 2D Canvas overlay with its own requestAnimationFrame loop continues running even when the component unmounts (e.g., navigating away from the galaxy page). The RAF callback holds a reference to the canvas context, preventing garbage collection.
**Why it happens:** `requestAnimationFrame` returns an ID that must be cancelled in cleanup. Missing the cleanup in useEffect return function causes a memory leak.
**How to avoid:** Store the RAF ID in a ref. Cancel it in the useEffect cleanup. Pattern:
```typescript
useEffect(() => {
  let rafId: number
  function draw() { /* ... */ rafId = requestAnimationFrame(draw) }
  rafId = requestAnimationFrame(draw)
  return () => cancelAnimationFrame(rafId)
}, [])
```

### Pitfall 5: Constellation Lines Flickering During Warp
**What goes wrong:** When the user clicks a star, a warp begins AND a constellation line is drawn. During the warp, the camera rapidly moves, causing the Line component to flicker or z-fight with nearby stars.
**Why it happens:** Line rendering during rapid camera movement can cause sub-pixel jitter. The Line's z-depth competes with star billboards.
**How to avoid:** Only show constellation lines AFTER the warp completes (when cameraMode transitions to 'inspecting'). The selectedStar state is already set at warp completion. Lines should render with `depthWrite={false}` to avoid z-fighting with stars.

## Code Examples

### EffectComposer Setup (verified pattern from official docs)
```typescript
// src/components/canvas/PostProcessing.tsx
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

export function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.5}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.1}
        mipmapBlur={true}
      />
      <Vignette
        darkness={0.6}
        offset={0.3}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
```
**Source:** [react-postprocessing Bloom docs](https://react-postprocessing.docs.pmnd.rs/effects/bloom), [Architecture research Pattern 6](../../research/ARCHITECTURE.md)

### Beacon Star Shader Modification
```glsl
// Modified star fragment shader with beacon boost
// instanceIsTopTrack: 0.0 = normal, 1.0 = top track, 2.0 = top-5 beacon

varying float vBeaconLevel; // passed from vertex shader

void main() {
  vec2 center = vec2(0.5);
  float d = distance(vUv, center);
  if (d > 0.5) discard;

  float glow = smoothstep(0.5, 0.0, d);
  float coreMix = smoothstep(0.25, 0.0, d);
  vec3 color = mix(vColor, vec3(1.0, 1.0, 1.0), coreMix * 0.6);

  float alpha = glow * vAlpha;

  // Beacon boost: push color above 1.0 for HDR bloom pickup
  float beaconBoost = 1.0 + vBeaconLevel * 1.5; // 1.0x normal, 2.5x for top-5
  vec3 finalColor = color * alpha * beaconBoost;

  gl_FragColor = vec4(finalColor, alpha);
}
```

### Drei Line for Constellation
```typescript
import { Line } from '@react-three/drei'

// Hub-spoke pattern: all artist stars connect to their centroid
function buildConstellationPoints(artistStars: StarData[]): [number, number, number][] {
  const centroid: [number, number, number] = [0, 0, 0]
  for (const s of artistStars) {
    centroid[0] += s.position[0]
    centroid[1] += s.position[1]
    centroid[2] += s.position[2]
  }
  centroid[0] /= artistStars.length
  centroid[1] /= artistStars.length
  centroid[2] /= artistStars.length

  // For each star: centroid -> star position (creates hub-spoke)
  const points: [number, number, number][] = []
  for (const s of artistStars) {
    points.push(centroid, s.position)
  }
  return points
}

// Usage:
// <Line points={points} segments color="#00f0ff" lineWidth={1.5}
//   transparent opacity={0.6} toneMapped={false} depthWrite={false} />
// Note: segments=true renders LineSegments2 (pairs of points as separate lines)
```

### 2D Canvas Minimap
```typescript
// Key drawing logic (inside requestAnimationFrame loop)
function drawMinimap(ctx: CanvasRenderingContext2D, genres: GenreCluster[], cameraPos: THREE.Vector3, bounds: Bounds, size: number) {
  ctx.clearRect(0, 0, size, size)

  // Background
  ctx.fillStyle = 'rgba(0, 0, 20, 0.85)'
  ctx.fillRect(0, 0, size, size)

  // Border
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, size, size)

  // Genre cluster dots
  for (const genre of genres) {
    const { x, y } = projectToMinimap(genre.centroid, bounds, size)
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    const [r, g, b] = genre.color
    ctx.fillStyle = `rgb(${r * 255}, ${g * 255}, ${b * 255})`
    ctx.fill()
  }

  // Camera position triangle
  const cam = projectToMinimap([cameraPos.x, cameraPos.y, cameraPos.z], bounds, size)
  ctx.beginPath()
  ctx.moveTo(cam.x, cam.y - 5)
  ctx.lineTo(cam.x - 3, cam.y + 3)
  ctx.lineTo(cam.x + 3, cam.y + 3)
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.fill()
}
```

## Discretion Recommendations

Based on research, here are my recommendations for the Claude's Discretion areas:

| Area | Recommendation | Rationale |
|------|---------------|-----------|
| Bloom intensity/threshold | intensity=1.5, luminanceThreshold=0.3, luminanceSmoothing=0.1, mipmapBlur=true | Low threshold ensures all stars glow (synthwave aesthetic). mipmapBlur is 3-5x faster than kernel bloom. Tune via Leva in dev. |
| Top-5 detection | Sort stars by brightness descending. Stars with brightness >= 0.8 AND short_term ranking position 0-4 are beacons. | `computeStarBrightness` returns 0.8-1.0 for short_term top tracks. Position 0-4 gives top 5. Falls back to sorting by brightness if fewer than 5 short_term tracks. |
| Genre label font size | fontSize=2.0 (world units), with opacity curve: 1.0 at <30 units, linear fade 30-80 units, 0.0 at >80 units | Genre clusters have ~30-unit radius (from star positioning code). Font size 2.0 is readable from cluster edge. Fade distance prevents clutter when zoomed out. |
| Stats card hotkey | 'i' for info | Intuitive, doesn't conflict with WASD flight controls, not used by search (/ or Cmd+K), not used by Escape (dismiss). |
| Constellation geometry | drei `Line` with `segments={true}` for hub-spoke pattern | `segments` prop renders LineSegments2, which draws pairs of points as separate line segments. Perfect for hub-spoke (centroid-star, centroid-star, ...) without connecting all stars in sequence. |
| Minimap approach | 2D Canvas overlay (DOM layer) updating at ~30fps | Avoids second WebGL context, bloom doesn't affect minimap, performance-isolated. Read camera via ref (not store subscription) for smooth updates. |
| Performance optimization | Add Leva controls for bloom intensity, threshold, and enable/disable toggle. If FPS < 50, reduce bloom resolution via resolutionX/resolutionY props. | mipmapBlur is already efficient. Half-res bloom (resolutionX=480) is visually indistinguishable but 2x faster. Project already has Leva in dev dependencies. |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Three.js UnrealBloomPass | postprocessing library Bloom with mipmapBlur | 2023 | mipmapBlur is 3-5x faster. pmndrs postprocessing library merges effects into fewer passes. |
| Separate SelectiveBloom pass | HDR material output (toneMapped=false, values > 1.0) | 2024 | SelectiveBloom has layer management complexity. Controlling bloom via material output is simpler and more performant. |
| Manually extending three.js Line | drei Line component (wraps Line2/LineMaterial) | drei v10+ | Handles resolution updates, flexible point formats, integrates with R3F lifecycle. |
| HTML overlays for 3D text | troika-3d-text via drei Text | drei v9+ | SDF rendering, proper 3D depth, no DOM overhead per label. |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.1.0+ |
| Config file | vitest.config.ts |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-01 | Bloom post-processing renders without errors | manual | Browser-based visual verification | N/A (3D visual) |
| VIS-02 | Warp streaks already work (Phase 4) | manual | Visual verification during warp | N/A (already done) |
| VIS-05 | Top-5 beacon detection correct | unit | `npx vitest run src/__tests__/galaxy-stats.test.ts -t "beacon"` | Wave 0 |
| VIS-06 | Genre labels positioned at centroids | manual | Browser-based visual verification | N/A (3D visual) |
| UI-01 | Minimap projection math correct | unit | `npx vitest run src/__tests__/minimap.test.ts` | Wave 0 |
| UI-05 | Galaxy stats computation correct | unit | `npx vitest run src/__tests__/galaxy-stats.test.ts -t "stats"` | Wave 0 |
| UI-06 | Personality classification correct | unit | `npx vitest run src/__tests__/galaxy-stats.test.ts -t "personality"` | Wave 0 |
| UI-07 | Constellation line points computed correctly | unit | `npx vitest run src/__tests__/constellation.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/galaxy-stats.test.ts` -- covers VIS-05, UI-05, UI-06 (beacon detection, stats computation, personality classification)
- [ ] `src/__tests__/minimap.test.ts` -- covers UI-01 (projection math, bounds computation)
- [ ] `src/__tests__/constellation.test.ts` -- covers UI-07 (constellation point generation, hub-spoke pattern)
- Framework and fixtures already exist -- no additional setup needed.

## Open Questions

1. **ToneMapping interaction with existing scene**
   - What we know: Adding ToneMapping as the last effect in EffectComposer will affect the entire scene's color rendering. The star shader outputs premultiplied alpha with values potentially > 1.0 for beacons. ToneMapping compresses these back.
   - What's unclear: Whether ACES filmic tone mapping will alter the carefully tuned genre colors (e.g., will cyan stars shift to a different hue?).
   - Recommendation: Start WITHOUT ToneMapping in the EffectComposer. Add it only if colors look washed out from bloom. If needed, use ACES_FILMIC at low exposure.

2. **Camera direction indicator on minimap**
   - What we know: D-17 specifies a white triangle for camera position/direction.
   - What's unclear: How to represent camera pitch (vertical look angle) on a 2D top-down projection. The minimap shows X/Z but camera may be looking up or down.
   - Recommendation: Show camera yaw (horizontal direction) as triangle rotation. Ignore pitch. Users understand minimap as a floor plan.

3. **Constellation lines for artists with many stars**
   - What we know: Some artists may have 20+ stars spread across multiple genre clusters (if their genres span multiple macro-genres). Hub-spoke from centroid could create very long lines across the galaxy.
   - What's unclear: Whether the visual is confusing for 20+ star artists vs. 3-star artists.
   - Recommendation: Cap at 15 lines (closest 15 stars to centroid). For 2-5 stars, use complete graph (all-to-all) for a proper constellation look. For 6+, use hub-spoke.

## Sources

### Primary (HIGH confidence)
- [@react-three/postprocessing npm](https://www.npmjs.com/package/@react-three/postprocessing) - version 3.0.4, peer deps, publish date
- [Bloom component docs](https://react-postprocessing.docs.pmnd.rs/effects/bloom) - full API, selective bloom behavior, toneMapped interaction
- [drei Text docs](https://drei.docs.pmnd.rs/abstractions/text) - troika-3d-text wrapper, SDF rendering, font loading
- [drei Billboard docs](https://drei.docs.pmnd.rs/abstractions/billboard) - camera-facing behavior, axis locking
- [drei Line docs](https://drei.docs.pmnd.rs/shapes/line) - Line2/LineSegments2 wrapper, pixel-width, segments prop
- Codebase analysis: `star-shaders.ts`, `RealGalaxy.tsx`, `galaxy-buffers.ts`, `store.ts`, `types.ts` - existing patterns, toneMapped settings, buffer architecture

### Secondary (MEDIUM confidence)
- [Three.js forum on ShaderMaterial + bloom](https://discourse.threejs.org/t/shadermaterial-and-colormanagement/78130) - HDR values above 1.0 for bloom
- [Three.js performance tips 2026](https://www.utsubo.com/blog/threejs-best-practices-100-tips) - mipmapBlur recommendation
- [R3F scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) - general R3F performance patterns

### Tertiary (LOW confidence)
- 2D Canvas minimap approach derived from general Three.js forum discussions and React architecture patterns (no single authoritative source)

## Project Constraints (from CLAUDE.md)

- **Tech Stack**: Three.js + TypeScript + React (R3F). No alternative rendering libraries.
- **Performance**: Must handle 5,000+ stars at 60fps on modern desktop browsers. Bloom must not break this.
- **Assets**: All procedural/shader-generated visuals. No paid 3D assets. Genre labels use system fonts via troika.
- **Git workflow**: Feature branch per phase. Commits explain WHY not WHAT. Tests before commits.
- **Code style**: Small focused functions. Comments only where logic isn't self-evident. kebab-case files, PascalCase components, camelCase functions.
- **Security**: No hardcoded secrets. Environment variables for any keys.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @react-three/postprocessing is the established solution, version verified against npm registry, peer deps confirmed compatible
- Architecture: HIGH - all integration points verified against existing codebase, shader modification path is clear from reading existing star-shaders.ts
- Pitfalls: HIGH - bloom performance concerns documented in project's own PITFALLS.md (Pitfall 6), additive blending interaction verified by reading existing shader code
- Stats/personality computation: HIGH - pure TypeScript derivation from existing store data, no external dependencies

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable domain, no rapidly changing dependencies)
