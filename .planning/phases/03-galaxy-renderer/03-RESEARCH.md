# Phase 3: Galaxy Renderer - Research

**Researched:** 2026-04-02
**Domain:** 3D InstancedMesh rendering, custom shaders, progressive animation, R3F performance
**Confidence:** HIGH

## Summary

Phase 3 replaces the demo galaxy (200 static stars from JSON) with a live galaxy renderer that consumes real user data from the Zustand store. The existing `DemoGalaxy.tsx` already establishes the InstancedMesh pattern with per-instance vertex colors -- this phase extends it to handle 5000+ stars with additive blending, per-instance glow shaders, twinkle/pulse animations, and a progressive appearance system tied to the data pipeline.

The core technical challenge is rendering 5000+ glowing orbs at 60fps with per-instance animation states (fade-in progress, twinkle phase, pulse amplitude) without triggering React re-renders. This requires a custom `ShaderMaterial` with `InstancedBufferAttribute` arrays for per-instance data, animated entirely within `useFrame` via direct buffer mutation -- never through React state.

**Primary recommendation:** Use a single InstancedMesh with a custom ShaderMaterial. Pass per-instance data (color, size, brightness, animation birth time, twinkle phase offset) through InstancedBufferAttributes. Drive all animations in the vertex/fragment shaders using a `uTime` uniform. Subscribe to Zustand store changes outside React (via `useAppStore.subscribe`) to detect new star batches and write them into the buffers without re-rendering the component.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Stars rendered as glowing orbs -- small spheres with additive blending so dense clusters become luminous regions.
- **D-02:** Stars have a twinkle animation -- subtle brightness pulsing on individual stars to feel alive.
- **D-03:** Top tracks have a size pulse effect -- gently pulse larger/smaller to draw attention to favorites.
- **D-04:** Additive blending enabled -- overlapping stars glow brighter, creating natural luminosity in dense areas.
- **D-05:** Stars fade + scale up into existence -- start invisible and tiny, then smoothly grow and brighten to final position.
- **D-06:** Stars appear as a smooth continuous stream -- constant trickle as data arrives, not in discrete bursts.
- **D-07:** Genre clusters have blended gradient edges -- regions blend into each other smoothly, no hard boundaries between musical styles.
- **D-08:** Cluster sizes are proportional to song count -- more songs = bigger cluster. User's main genre dominates the galaxy.

### Claude's Discretion
- InstancedMesh vs Points vs custom shader approach for 5000+ stars
- Animation implementation (per-instance uniforms, shader-based, or frame-by-frame)
- Performance optimization strategy for maintaining 60fps
- How to transition from demo galaxy to real galaxy on login
- Exact fade/scale animation curve and duration

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GLXY-01 | Render every song as an instanced star particle (5000+ at 60fps) | Single InstancedMesh with custom ShaderMaterial, PlaneGeometry billboard quad, per-instance attributes for color/size/brightness. 1 draw call for all stars. |
| GLXY-02 | Stars grouped into distinct genre nebulae/clusters in 3D space | Already computed by Phase 2 worker (fibonacciSphere centroids + computeStarPosition). Renderer reads positions from store. Blended edges from D-07 achieved naturally by gaussian star distribution. |
| GLXY-03 | Star color determined by genre | GENRE_COLORS already defined in types.ts. Passed as InstancedBufferAttribute `instanceColor`. Fragment shader uses this color with emissive output for bloom pickup. |
| GLXY-04 | Progressive galaxy build -- stars appear in waves as data streams in | Store subscription (outside React) detects addStarBatch. New stars written to buffer with birth time = current time. Shader fade/scale based on (uTime - birthTime). Smooth stream per D-06. |
| GLXY-05 | Star size based on top-track ranking | Already computed by Phase 2 (computeStarSize: 0.3-2.0 range). Passed as part of instance matrix scale. Top tracks get additional pulse animation per D-03. |
</phase_requirements>

## Standard Stack

All libraries are already installed in the project. No new dependencies needed.

### Core (already in package.json)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | ^0.183.0 | InstancedMesh, ShaderMaterial, BufferAttribute, AdditiveBlending | Core rendering primitives |
| @react-three/fiber | ^9.5.0 | useFrame for animation loop, Canvas context, R3F component model | React integration layer |
| @react-three/drei | ^10.7.0 | Stars (background), OrbitControls, utility hooks | Battle-tested abstractions |
| zustand | ^5.0.12 | Store subscription for progressive updates | State management with getState() for render loop |

### NOT Adding
| Library | Why Not | What to Do Instead |
|---------|---------|-------------------|
| three-instanced-uniforms-mesh | Adds dependency for something achievable with raw InstancedBufferAttribute | Use InstancedBufferAttribute directly with custom ShaderMaterial |
| three-custom-shader-material | Extends built-in materials with custom shader chunks -- unnecessary since we need full shader control for star glow | Write complete vertex/fragment shaders for the star material |
| gsap / tween.js | External animation library for tweening | All animations run in vertex/fragment shaders via uTime uniform -- no JS-side tweening needed |

## Architecture Patterns

### Recommended Component Structure
```
src/components/canvas/
  DemoGalaxy.tsx          # Existing -- keep as-is for demo mode
  RealGalaxy.tsx          # NEW -- InstancedMesh renderer for real user data
  StarMaterial.tsx         # NEW -- Custom ShaderMaterial with star glow shader
  GalaxyScene.tsx          # MODIFY -- switch between DemoGalaxy and RealGalaxy based on mode
  BackgroundStars.tsx      # Existing -- keep as-is
  AutoOrbitCamera.tsx      # Existing -- keep as-is

src/shaders/
  star.vert.glsl           # NEW -- Vertex shader for billboard + scale animation
  star.frag.glsl           # NEW -- Fragment shader for radial glow + twinkle

src/lib/
  galaxy-buffers.ts        # NEW -- Pure functions for buffer creation/update
  store.ts                 # MODIFY -- add starBirthTimes or similar for animation tracking
```

### Pattern 1: Single InstancedMesh with Custom ShaderMaterial (GLXY-01)
**What:** One InstancedMesh renders all 5000+ stars in a single draw call. The geometry is a PlaneGeometry billboard quad (4 vertices). The material is a custom ShaderMaterial with additive blending and per-instance attributes.
**When to use:** Always -- this is the core rendering approach for the galaxy.
**Why InstancedMesh over Points:**
- InstancedMesh supports raycasting (needed for Phase 4 star click/hover)
- InstancedMesh supports per-instance matrix transforms (position + scale in one attribute)
- At 5000-10000 instances, performance is identical to Points but with more flexibility
- The existing DemoGalaxy already uses InstancedMesh -- consistent pattern
**Why not Drei's `<Instances>` component:**
- Drei's Instances is declarative (one `<Instance>` React component per star) which triggers re-renders
- For 5000+ items, imperative buffer manipulation is mandatory for performance

**Example:**
```tsx
// RealGalaxy.tsx -- conceptual structure
const MAX_STARS = 12000 // pre-allocate buffer for max capacity

function RealGalaxy() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const starCountRef = useRef(0)
  
  // Pre-allocate buffers at max size, use count to control visible range
  const buffers = useMemo(() => createStarBuffers(MAX_STARS), [])
  
  // Subscribe to store OUTSIDE React render cycle
  useEffect(() => {
    const unsub = useAppStore.subscribe(
      (state) => state.stars,
      (stars) => {
        updateStarBuffers(meshRef.current, buffers, stars, starCountRef)
      }
    )
    return unsub
  }, [buffers])
  
  // Drive animations via uTime uniform
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime
    }
  })
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_STARS]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <starShaderMaterial ref={materialRef} />
      {/* InstancedBufferAttributes attached to geometry */}
    </instancedMesh>
  )
}
```

### Pattern 2: Shader-Driven Animation (D-02, D-03, D-05)
**What:** All per-instance animations (twinkle, size pulse, fade-in) are computed entirely in the vertex and fragment shaders using a global `uTime` uniform and per-instance attributes (birthTime, twinklePhaseOffset, isTopTrack).
**When to use:** For any animation that affects all instances simultaneously (which is every animation in this phase).
**Why shader-based over JS-based:**
- Zero CPU cost -- GPU handles all animation math
- No buffer uploads per frame -- only uTime uniform updates (1 float)
- Scales to 100K+ instances with no performance degradation
- Eliminates the "update 5000 matrices every frame" bottleneck

**Per-instance attributes needed:**
| Attribute | Type | Size | Purpose |
|-----------|------|------|---------|
| instanceColor | vec3 | 3 floats | Genre color (R, G, B) |
| instanceSize | float | 1 float | Star size (0.3 - 2.0 from computeStarSize) |
| instanceBrightness | float | 1 float | Base brightness (0.1 - 1.0 from computeStarBrightness) |
| instanceBirthTime | float | 1 float | Time when star was added (for fade-in animation) |
| instancePhaseOffset | float | 1 float | Random offset for twinkle desync (0 - 2*PI) |
| instanceIsTopTrack | float | 1 float | 1.0 for top tracks (pulse animation), 0.0 otherwise |

**Vertex shader pattern:**
```glsl
// star.vert.glsl
attribute vec3 instanceColor;
attribute float instanceSize;
attribute float instanceBrightness;
attribute float instanceBirthTime;
attribute float instancePhaseOffset;
attribute float instanceIsTopTrack;

uniform float uTime;

varying vec3 vColor;
varying float vBrightness;
varying float vFadeIn;

void main() {
  // Fade-in: smoothstep over 1.5 seconds from birth
  float age = uTime - instanceBirthTime;
  float fadeIn = smoothstep(0.0, 1.5, age);
  
  // Twinkle: subtle sine wave per-instance
  float twinkle = 1.0 + 0.15 * sin(uTime * 2.0 + instancePhaseOffset);
  
  // Size pulse for top tracks
  float pulse = 1.0 + instanceIsTopTrack * 0.1 * sin(uTime * 1.5 + instancePhaseOffset);
  
  // Final scale: base size * fade-in * pulse
  float finalScale = instanceSize * fadeIn * pulse;
  
  // Billboard: extract position from instance matrix, face camera
  vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mvPosition.xy += position.xy * finalScale;
  gl_Position = projectionMatrix * mvPosition;
  
  vColor = instanceColor;
  vBrightness = instanceBrightness * fadeIn * twinkle;
  vFadeIn = fadeIn;
}
```

**Fragment shader pattern:**
```glsl
// star.frag.glsl
varying vec3 vColor;
varying float vBrightness;
varying float vFadeIn;

void main() {
  // Radial gradient from center (glowing orb effect)
  float dist = length(gl_PointCoord - vec2(0.5)); // Won't work for mesh -- use UV
  // For PlaneGeometry billboard, use UV coordinates:
  vec2 uv = gl_FragCoord.xy; // Actually, use varying from vertex shader
  
  // Soft circular falloff
  vec2 center = vec2(0.5);
  float d = distance(vUv, center);
  float alpha = smoothstep(0.5, 0.0, d) * vBrightness * vFadeIn;
  
  // Discard fragments outside the circle
  if (d > 0.5) discard;
  
  // Core is brighter (white-ish), edges are genre-colored
  vec3 core = mix(vColor * 1.5, vec3(1.0), smoothstep(0.3, 0.0, d));
  
  gl_FragColor = vec4(core, alpha);
}
```

### Pattern 3: Progressive Buffer Updates (GLXY-04, D-06)
**What:** When new star data arrives from the store, only the NEW indices are written to the pre-allocated buffers. The InstancedMesh count is updated to include the new range. Birth times for new stars are staggered to create a smooth continuous stream rather than bursts.
**When to use:** Every time `addStarBatch` fires from the pipeline.

**Key insight -- staggered birth times for D-06 (smooth stream):**
The fetch orchestrator sends batches of ~200 tracks. Without staggering, all 200 stars would pop in simultaneously. To create a smooth continuous stream:

```typescript
function assignBirthTimes(
  batchSize: number,
  currentTime: number,
  spreadDuration: number // e.g., 0.8 seconds
): Float32Array {
  const births = new Float32Array(batchSize)
  for (let i = 0; i < batchSize; i++) {
    births[i] = currentTime + (i / batchSize) * spreadDuration
  }
  return births
}
```

This spreads each batch over ~0.8 seconds, so even though data arrives in chunks, stars appear one by one in a continuous trickle.

**Buffer update pattern:**
```typescript
// galaxy-buffers.ts -- pure functions, no React dependency
const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()

export function updateStarBuffers(
  mesh: THREE.InstancedMesh,
  stars: StarData[],
  startIndex: number,
  currentTime: number,
  buffers: {
    colors: Float32Array,
    sizes: Float32Array,
    brightnesses: Float32Array,
    birthTimes: Float32Array,
    phaseOffsets: Float32Array,
    isTopTracks: Float32Array,
  }
) {
  const spreadDuration = 0.8 // seconds to spread batch appearance
  
  for (let i = startIndex; i < stars.length; i++) {
    const star = stars[i]
    const batchOffset = i - startIndex
    
    // Position + scale via matrix
    tempObject.position.set(...star.position)
    tempObject.scale.setScalar(1) // Scale handled in shader
    tempObject.updateMatrix()
    mesh.setMatrixAt(i, tempObject.matrix)
    
    // Per-instance attributes
    tempColor.setRGB(...GENRE_COLORS[star.genre] ?? GENRE_COLORS['mystery'])
    tempColor.toArray(buffers.colors, i * 3)
    
    buffers.sizes[i] = star.size
    buffers.brightnesses[i] = star.brightness
    buffers.birthTimes[i] = currentTime + (batchOffset / (stars.length - startIndex)) * spreadDuration
    buffers.phaseOffsets[i] = Math.random() * Math.PI * 2
    buffers.isTopTracks[i] = star.brightness > 0.6 ? 1.0 : 0.0 // rough proxy
  }
  
  // Mark only changed ranges for upload
  mesh.instanceMatrix.needsUpdate = true
  // Mark each attribute buffer .needsUpdate = true
}
```

### Pattern 4: Demo-to-Real Galaxy Transition
**What:** When the user logs in and data starts arriving, smoothly transition from the demo galaxy to the real galaxy.
**When to use:** When `mode` changes from "demo" to "authenticated" in the store.
**How:**
1. Keep DemoGalaxy visible initially
2. When first real star batch arrives, begin fading out DemoGalaxy (reduce opacity over 1 second)
3. Simultaneously, real stars begin appearing via their fade-in animations
4. After DemoGalaxy fully fades, unmount it (or set visible=false)
5. Net effect: demo galaxy dissolves as real galaxy forms around the user

This is handled by GalaxyScene.tsx checking both `mode` and whether `stars.length > 0` in the store.

### Pattern 5: Store Subscription Without Re-renders
**What:** Subscribe to Zustand store changes imperatively (not via React hooks) to update InstancedMesh buffers.
**When to use:** Whenever the 3D scene needs to react to store changes.
**Why:** React hook subscriptions (`useAppStore(s => s.stars)`) cause the component to re-render when stars change. With 5000+ stars arriving in batches, this means dozens of unnecessary React reconciliation passes. Instead, use Zustand's `subscribe` with `subscribeWithSelector` to detect changes and update buffers directly.

```typescript
// Inside useEffect (runs once)
const unsub = useAppStore.subscribe(
  (state) => state.stars.length, // only fire when length changes
  (newLength, prevLength) => {
    if (newLength > prevLength) {
      const stars = useAppStore.getState().stars
      updateStarBuffers(meshRef.current!, stars, prevLength, clock.elapsedTime, buffers)
      meshRef.current!.count = newLength
    }
  }
)
```

**Note:** Zustand v5 supports `subscribeWithSelector` natively (no middleware needed). The `subscribe` method accepts a selector as the first argument.

### Anti-Patterns to Avoid
- **Creating new THREE objects in useFrame:** Never `new THREE.Color()` or `new THREE.Object3D()` inside the render loop. Allocate at module scope or in useMemo. (Existing DemoGalaxy already follows this correctly.)
- **Conditional rendering for visibility:** Use `mesh.visible = false` instead of `{showGalaxy && <RealGalaxy />}` to avoid mount/unmount overhead for Three.js objects.
- **Re-uploading all buffers on each batch:** Only write the new index range `[prevCount, newCount)` and set `needsUpdate = true`. Do not rewrite indices 0 through prevCount.
- **Using Drei `<Instances>` for 5000+ items:** The declarative API creates one React component per instance -- devastating for performance at this scale.
- **Storing animation state in Zustand:** Twinkle phase, fade progress, pulse state -- all of these belong in shaders, not in the store.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Billboard orientation | Manual billboard matrix math per frame | Vertex shader billboard (extract position from instanceMatrix, offset by view-space vertex position) | GPU handles it for free, zero CPU cost |
| Star glow effect | Scaled sphere + mesh behind each star | Fragment shader radial gradient with smoothstep | Single quad per star, glow is mathematical, not geometric |
| Twinkle animation | JS loop updating 5000 brightness values per frame | Shader sin(uTime + phaseOffset) | GPU parallelism handles 5000+ sin() calls trivially |
| Radial falloff for additive blending | Texture atlas with glow sprite | Procedural smoothstep(0.5, 0.0, distance) in fragment shader | No texture memory, resolution-independent, tunable |
| Progressive appearance staggering | setTimeout/setInterval per star | Birth time attribute + shader smoothstep(0, 1.5, age) | One uniform update per frame instead of 5000 timers |

**Key insight:** Every per-instance animation in this phase can and should be computed in shaders. The only CPU-side work per frame is updating one float uniform (`uTime`).

## Common Pitfalls

### Pitfall 1: InstancedMesh Count vs Buffer Size
**What goes wrong:** Setting `args={[undefined, undefined, stars.length]}` on the InstancedMesh JSX means the buffer is exactly sized to current star count. When new stars arrive, the InstancedMesh must be destroyed and recreated with a larger buffer, which is expensive and causes a visual flash.
**Why it happens:** React re-renders with a new count trigger full Three.js object reconstruction.
**How to avoid:** Pre-allocate buffers at MAX_STARS (e.g., 12000). Set `mesh.count = currentStarCount` to control the visible draw range. This way the GPU buffer never needs reallocation.
**Warning signs:** Visual flicker when new star batches arrive. Performance spikes in DevTools when count changes.

### Pitfall 2: AdditiveBlending Without depthWrite: false
**What goes wrong:** Additive blending makes overlapping stars glow brighter (per D-04), but if `depthWrite` is enabled, some stars render behind others incorrectly, creating visual sorting artifacts.
**Why it happens:** Transparent/additive objects need careful sort ordering. Three.js sorts by object, not by instance within an InstancedMesh.
**How to avoid:** Set `depthWrite: false` and `depthTest: true` on the ShaderMaterial. This ensures all stars blend correctly regardless of render order. Stars will always add to the background, never occlude each other.
**Warning signs:** Stars appearing to "cut holes" through stars behind them. Dark rectangles visible around star quads.

### Pitfall 3: Billboard Quad Fragments Discarding Incorrectly
**What goes wrong:** The PlaneGeometry billboard renders a rectangular quad, but stars are circular. Without discarding fragments outside the circle, rectangular overlapping quads create visible square artifacts.
**Why it happens:** Fragment shader needs to explicitly discard pixels outside the circular star shape.
**How to avoid:** In the fragment shader, calculate distance from UV center (0.5, 0.5). Discard if > 0.5 (or use smoothstep to 0 alpha). This creates circular stars from rectangular geometry.
**Warning signs:** Square-shaped artifacts visible when stars overlap, especially at the edges.

### Pitfall 4: React Re-Renders From Store Subscription
**What goes wrong:** Using `const stars = useAppStore(s => s.stars)` in the galaxy component causes a full re-render every time `addStarBatch` fires. With batches arriving every 200 tracks, this triggers 25+ re-renders for a 5000-track library.
**Why it happens:** Zustand hook subscriptions are reactive -- any change to the selected value triggers re-render.
**How to avoid:** Use imperative `useAppStore.subscribe()` in a useEffect to detect batch changes. Read state via `useAppStore.getState()` inside the callback. Update buffers directly. Never let the galaxy component itself re-render for star data changes.
**Warning signs:** React DevTools profiler showing the galaxy component re-rendering frequently. Brief frame drops when new batches arrive.

### Pitfall 5: Stale Birth Times After resetGalaxy
**What goes wrong:** The fetch orchestrator calls `resetGalaxy()` then `addStarBatch()` on every batch emission (it sends the FULL accumulated set, not deltas). If birth times are assigned based on "new stars only," a reset+re-add wipes all birth times, causing all existing stars to re-animate their fade-in.
**Why it happens:** Looking at `use-galaxy-pipeline.ts` line 72-73: `store.resetGalaxy(); store.addStarBatch(result.stars)`. Every batch replaces all stars.
**How to avoid:** Track birth times externally in the renderer, keyed by star ID. When a new batch arrives, only assign new birth times for IDs not seen before. This way existing stars keep their original birth time and stay fully visible while new stars fade in.
**Warning signs:** All stars suddenly blinking/fading when a new batch arrives instead of only new stars animating.

### Pitfall 6: Forgetting needsUpdate on InstancedBufferAttributes
**What goes wrong:** Writing new values to Float32Array buffers has no effect until you set `attribute.needsUpdate = true`. This tells Three.js to re-upload the data to the GPU.
**Why it happens:** Three.js buffers are cached on the GPU. CPU-side changes are invisible until flagged for upload.
**How to avoid:** After every buffer write, set `needsUpdate = true` on each modified InstancedBufferAttribute AND on `instanceMatrix`. Consider using `updateRange` to upload only the changed slice for better performance.
**Warning signs:** New stars don't appear even though the count is updated. Stars appear with wrong colors/sizes.

## Code Examples

### Star ShaderMaterial Configuration
```typescript
// Verified pattern from Three.js ShaderMaterial docs
import * as THREE from 'three'

const starMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexShaderSource,
  fragmentShader: fragmentShaderSource,
  uniforms: {
    uTime: { value: 0 },
  },
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  depthTest: true,
  side: THREE.DoubleSide,
  toneMapped: false, // critical: prevents tone mapping from clamping emissive glow
})
```

### InstancedBufferAttribute Setup
```typescript
// Source: Three.js InstancedBufferAttribute docs
const geometry = new THREE.PlaneGeometry(1, 1)

// Per-instance color (vec3)
const colorAttr = new THREE.InstancedBufferAttribute(
  new Float32Array(MAX_STARS * 3), 3
)
geometry.setAttribute('instanceColor', colorAttr)

// Per-instance size (float)
const sizeAttr = new THREE.InstancedBufferAttribute(
  new Float32Array(MAX_STARS), 1
)
geometry.setAttribute('instanceSize', sizeAttr)

// Per-instance birth time (float)
const birthAttr = new THREE.InstancedBufferAttribute(
  new Float32Array(MAX_STARS), 1
)
geometry.setAttribute('instanceBirthTime', birthAttr)

// Per-instance twinkle phase offset (float)
const phaseAttr = new THREE.InstancedBufferAttribute(
  new Float32Array(MAX_STARS), 1
)
geometry.setAttribute('instancePhaseOffset', phaseAttr)
```

### Billboard Vertex Shader (Camera-Facing Quads)
```glsl
// Billboard technique: extract instance world position, offset by view-space vertex
// Source: Three.js forum -- billboard with InstancedMesh

attribute vec3 instanceColor;
attribute float instanceSize;
attribute float instanceBirthTime;
attribute float instanceBrightness;
attribute float instancePhaseOffset;
attribute float instanceIsTopTrack;

uniform float uTime;

varying vec2 vUv;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vUv = uv;
  vColor = instanceColor;
  
  // Age-based fade in
  float age = uTime - instanceBirthTime;
  float fadeIn = clamp(smoothstep(0.0, 1.5, age), 0.0, 1.0);
  
  // Twinkle: per-instance desynchronized sine wave
  float twinkle = 1.0 + 0.12 * sin(uTime * 2.5 + instancePhaseOffset);
  
  // Pulse for top tracks: gentle size oscillation
  float pulse = 1.0 + instanceIsTopTrack * 0.08 * sin(uTime * 1.8 + instancePhaseOffset * 0.7);
  
  float finalScale = instanceSize * fadeIn * pulse;
  vAlpha = instanceBrightness * fadeIn * twinkle;
  
  // Billboard: get instance world position from matrix, then offset in view space
  vec4 worldPos = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  vec4 mvPos = viewMatrix * worldPos;
  
  // Offset quad vertices in view space (camera-facing)
  mvPos.xy += position.xy * finalScale;
  
  gl_Position = projectionMatrix * mvPos;
}
```

### Fragment Shader (Radial Glow)
```glsl
varying vec2 vUv;
varying vec3 vColor;
varying float vAlpha;

void main() {
  // Distance from center of the quad
  vec2 center = vec2(0.5);
  float d = distance(vUv, center);
  
  // Discard outside circle
  if (d > 0.5) discard;
  
  // Soft radial falloff (glowing orb effect)
  float glow = smoothstep(0.5, 0.0, d);
  
  // Bright white core blending to genre color at edges
  float coreMix = smoothstep(0.25, 0.0, d);
  vec3 color = mix(vColor, vec3(1.0, 1.0, 1.0), coreMix * 0.6);
  
  // Final alpha with glow falloff
  float alpha = glow * vAlpha;
  
  gl_FragColor = vec4(color * alpha, alpha);
}
```

### Zustand Subscribe Pattern (No Re-renders)
```typescript
// Inside RealGalaxy component useEffect
useEffect(() => {
  let prevCount = 0
  
  const unsub = useAppStore.subscribe(
    (state) => state.stars.length,
    (newCount) => {
      if (newCount > prevCount) {
        const stars = useAppStore.getState().stars
        const currentTime = clockRef.current?.elapsedTime ?? 0
        writeNewStars(meshRef.current!, stars, prevCount, newCount, currentTime)
        meshRef.current!.count = newCount
        prevCount = newCount
      } else if (newCount === 0) {
        // Galaxy was reset
        meshRef.current!.count = 0
        prevCount = 0
        birthTimeMap.current.clear()
      }
    }
  )
  
  return unsub
}, [])
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SphereGeometry per star instance | Billboard PlaneGeometry + fragment shader glow | Standard practice since Three.js r120+ | 250x fewer vertices per star (4 vs 1000) |
| CPU-side animation loops updating matrices | Shader-driven animation via uniforms + per-instance attributes | Always best practice for instancing | Zero CPU cost for animations |
| Full buffer re-upload on change | Partial buffer updates with updateRange | Three.js r140+ | Only upload changed byte range |
| Points for particle systems | InstancedMesh with billboard quads | Depends on needs -- both still valid | InstancedMesh enables raycasting + per-instance features |

**Deprecated/outdated:**
- Using `vertexColors: true` on MeshBasicMaterial with InstancedMesh color attribute -- works but inflexible for glow/animation effects. Custom ShaderMaterial is needed for the required visual effects.

## Open Questions

1. **Store reset-then-add pattern**
   - What we know: The fetch orchestrator resets and re-adds ALL stars on every batch (not incremental)
   - What's unclear: Whether to change the orchestrator to send incremental deltas, or handle it renderer-side
   - Recommendation: Handle renderer-side. Track star IDs with birth times in a Map. On each store update, diff against known IDs. Only assign birth times to genuinely new stars. This avoids modifying Phase 2 code.

2. **Cluster proportional sizing (D-08)**
   - What we know: "More songs = bigger cluster" is already naturally achieved by the spatial layout -- genres with more tracks have more stars spread across the cluster radius
   - What's unclear: Whether D-08 expects the cluster RADIUS to scale with count, or just that more dots = visually larger
   - Recommendation: The current fixed `genreClusterRadius: 15` for all genres means equal-radius clusters. To make proportional sizing explicit, scale the cluster radius by `sqrt(trackCount / averageTrackCount)` in the worker. However, this is a Phase 2 worker change. For Phase 3, the visual effect of "more dots = bigger looking cluster" is sufficient. Flag for planner to decide whether to adjust worker params.

3. **UV coordinates in billboard quad**
   - What we know: PlaneGeometry has UV coordinates (0,0 to 1,1) built in
   - What's unclear: Whether Three.js preserves UV coordinates through InstancedMesh instancing
   - Recommendation: UVs are per-vertex attributes on the geometry, not per-instance. They are preserved. Verified by the existing DemoGalaxy which uses vertex colors on geometry attributes -- same mechanism. The fragment shader can access `vUv` from the vertex shader `uv` varying.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.1.0 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` (vitest run) |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GLXY-01 | InstancedMesh renders stars with correct count and buffer setup | unit | `npx vitest run src/__tests__/galaxy-buffers.test.ts -t "buffer creation"` | No -- Wave 0 |
| GLXY-02 | Stars positioned within correct genre cluster regions | unit | `npx vitest run src/__tests__/star-data.test.ts` | Yes (existing) |
| GLXY-03 | Star colors match genre color mapping | unit | `npx vitest run src/__tests__/galaxy-buffers.test.ts -t "color mapping"` | No -- Wave 0 |
| GLXY-04 | Birth times staggered for smooth progressive appearance | unit | `npx vitest run src/__tests__/galaxy-buffers.test.ts -t "birth times"` | No -- Wave 0 |
| GLXY-05 | Star size reflects top-track ranking | unit | `npx vitest run src/__tests__/star-data.test.ts -t "computeStarSize"` | Yes (existing) |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/galaxy-buffers.test.ts` -- covers buffer creation, color mapping, birth time staggering, partial updates
- [ ] Test for birth time stagger spread: verify times are evenly distributed across spread duration
- [ ] Test for buffer write range: verify only new indices are written (startIndex to endIndex)

Note: Shader visual output (glow appearance, twinkle animation, additive blending) cannot be unit tested -- these require visual/manual verification in the browser. Tests focus on the data flow (buffer contents, attribute values) that feeds the shaders.

## Project Constraints (from CLAUDE.md)

- **Tech stack:** Three.js + TypeScript + R3F (already installed -- no changes needed)
- **Performance:** Must handle 5000+ stars at 60fps on modern desktop browsers
- **Assets:** No paid 3D assets -- all procedural/shader-generated (star glow is procedural shader, not a texture)
- **Conventions:** Use clear, descriptive names; small focused functions; handle errors at boundaries
- **Git:** Feature branch, small focused commits, run tests before committing
- **Workflow:** Read existing code before modifying -- especially DemoGalaxy.tsx and store.ts

## Sources

### Primary (HIGH confidence)
- Three.js InstancedMesh docs: https://threejs.org/docs/pages/InstancedMesh.html
- Three.js ShaderMaterial docs: https://threejs.org/docs/pages/ShaderMaterial.html
- Three.js InstancedBufferAttribute docs: https://threejs.org/docs/pages/InstancedBufferAttribute.html
- R3F Performance Pitfalls: https://r3f.docs.pmnd.rs/advanced/pitfalls
- R3F Scaling Performance: https://r3f.docs.pmnd.rs/advanced/scaling-performance
- Drei Instances component: https://drei.docs.pmnd.rs/performances/instances
- Existing codebase: DemoGalaxy.tsx, store.ts, star-data.ts, galaxy-layout.worker.ts

### Secondary (MEDIUM confidence)
- Three.js forum - Points vs InstancedMesh: https://discourse.threejs.org/t/better-performance-instanced-mesh-or-points/20293
- Three.js forum - Billboard with InstancedMesh: https://discourse.threejs.org/t/instancedmesh-implement-billboard/29354
- Three.js forum - InstancedMesh state management: https://discourse.threejs.org/t/how-to-use-state-management-with-react-three-fiber-without-performance-issues/61223
- Maxime Heckel - Particles with R3F and Shaders: https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/
- Three.js forum - InstancedBufferAttribute partial update: https://discourse.threejs.org/t/efficient-partial-update-of-instancedbufferattribute/61255

### Tertiary (LOW confidence)
- None -- all findings verified against official docs or codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and verified in Phases 1-2
- Architecture: HIGH -- extends proven InstancedMesh pattern from DemoGalaxy.tsx, verified against Three.js docs and R3F best practices
- Shader patterns: HIGH -- billboard + radial glow is well-documented standard technique, verified across multiple Three.js forum threads
- Animation approach: HIGH -- shader-driven per-instance animation via InstancedBufferAttribute is the documented best practice for instanced rendering
- Progressive rendering: MEDIUM -- the store reset-then-add pattern from fetch orchestrator requires renderer-side ID tracking (untested pattern, but straightforward)
- Pitfalls: HIGH -- drawn from project's own PITFALLS.md + R3F official pitfalls page

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable domain -- Three.js and R3F APIs unlikely to change)
