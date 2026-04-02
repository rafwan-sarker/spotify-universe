# Architecture Patterns

**Domain:** 3D music data visualization (Spotify library as interactive galaxy)
**Researched:** 2026-04-01

## Recommended Architecture

Three-tier separation: **React UI Shell** (DOM overlay) + **R3F 3D Scene** (canvas) + **Vercel API Layer** (serverless). Data flows unidirectionally: Spotify API -> Vercel functions -> Zustand store -> R3F scene.

```
+------------------------------------------------------------------+
|  Browser                                                          |
|                                                                   |
|  +---------------------------+  +------------------------------+  |
|  |  React UI Shell (DOM)     |  |  R3F 3D Scene (Canvas)       |  |
|  |                           |  |                              |  |
|  |  - Login/Auth screen      |  |  - Galaxy renderer           |  |
|  |  - Search overlay         |  |  - Star instances (5000+)    |  |
|  |  - Mini-map HUD           |  |  - Genre nebulae             |  |
|  |  - Track info panel       |  |  - Camera/flight controls    |  |
|  |  - Loading progress       |  |  - Post-processing pipeline  |  |
|  |                           |  |  - Spatial audio system      |  |
|  +-------------|-------------+  +---------|--------------------+  |
|                |                          |                       |
|                +----------+---------------+                       |
|                           |                                       |
|                    Zustand Store                                   |
|                    (shared state)                                  |
|                           |                                       |
+---------------------------|---------------------------------------+
                            |
                     Vercel API Layer
                     (serverless functions)
                            |
                    +-------+-------+
                    |               |
              Spotify API     Token Storage
              (OAuth 2.0)     (httpOnly cookies)
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Vercel API Layer** | OAuth flow, token management, Spotify data fetching, token refresh | Spotify API, browser (via httpOnly cookies) |
| **Zustand Store** | All application state: auth status, track data, galaxy layout, camera target, UI state | Every other component reads from / writes to the store |
| **React UI Shell** | DOM-based overlays: login, search, HUD, track info, loading screens | Zustand store (reads state, dispatches actions) |
| **Galaxy Renderer** | InstancedMesh star field, genre nebula particles, background skybox | Zustand store (reads track data), post-processing pipeline |
| **Camera System** | Flight controls, warp transitions, smooth interpolation | Zustand store (reads warp targets), Galaxy Renderer (position in scene) |
| **Spatial Audio** | Positional audio from nearby stars using Three.js AudioListener/PositionalAudio | Galaxy Renderer (star positions), Zustand store (active previews) |
| **Data Pipeline** | Transforms raw Spotify data into galaxy layout (positions, colors, sizes) | Zustand store (input: raw tracks, output: positioned stars) |
| **Post-Processing** | Bloom, chromatic aberration, vignette, tone mapping | Galaxy Renderer (renders into effect pipeline) |

### Data Flow

**Authentication Flow:**
```
User clicks "Connect Spotify"
  -> Browser redirects to Spotify OAuth (Authorization Code Flow)
  -> Spotify redirects to /api/auth/callback with authorization code
  -> Vercel function exchanges code for tokens (server-side, client secret safe)
  -> Tokens stored in httpOnly cookies (NOT localStorage, NOT in-memory)
  -> Function redirects to app with auth cookie set
  -> App calls /api/me to confirm auth status
```

**Data Loading Flow:**
```
App authenticated
  -> Calls /api/tracks?offset=0 (Vercel function)
  -> Vercel function reads token from httpOnly cookie
  -> Fetches /me/tracks from Spotify (paginated, 50 per request)
  -> Returns tracks to browser
  -> Also fetches /me/top/tracks for all 3 time ranges (ranking data)
  -> Zustand store receives batch
  -> Extracts unique artist IDs from tracks
  -> Calls /api/artists/:id for each unique artist (genre data)
  -> Sends normalized data to Web Worker for layout computation
  -> Worker computes star positions (genre clustering) and returns Float32Arrays
  -> Store updates with positioned stars
  -> R3F scene reads store, updates InstancedMesh matrices
  -> Progressive: repeat with offset+=50 until all tracks loaded (max 10,000)
```

**Render Loop (per frame):**
```
useFrame callback fires at 60fps
  -> Camera system reads input, updates position via ref (NO setState)
  -> Galaxy renderer reads camera position
  -> Spatial audio system checks nearby stars, manages preview playback
  -> Post-processing pipeline renders final frame
  -> Mini-map reads camera position via Zustand (throttled, not every frame)
```

**Warp Transition Flow:**
```
User selects artist from search or clicks star
  -> Zustand store sets warpTarget = {position, artist}
  -> Camera system detects warpTarget change
  -> Initiates warp animation (cancellable state machine):
     1. IDLE -> WARPING: zoom camera FOV (tunnel vision)
     2. Lerp position toward target over 60-90 frames
     3. Post-processing ramps up chromatic aberration + bloom
     4. WARPING -> ARRIVING: decelerate, restore FOV
     5. ARRIVING -> IDLE: settle at target, resume normal controls
  -> If user triggers new warp mid-transition: cancel current, lerp from
     CURRENT position (not origin) to new target
```

## Component Deep Dives

### 1. Vercel API Layer (serverless functions)

**Why serverless functions instead of client-side API calls:**
- Spotify client secret must never reach the browser
- Token refresh logic runs server-side
- httpOnly cookies prevent XSS token theft
- Rate limiting and request queuing can be applied at the proxy level

**Route structure:**
```
/api/auth/login      - Initiates Spotify OAuth (Authorization Code Flow)
/api/auth/callback   - Handles OAuth redirect, sets httpOnly cookies
/api/auth/refresh    - Refreshes expired access token using refresh token
/api/auth/logout     - Clears auth cookies
/api/me              - Proxies GET /v1/me (current user profile)
/api/tracks          - Proxies GET /v1/me/tracks (paginated, 50/page, max offset 10000)
/api/top-tracks      - Proxies GET /v1/me/top/tracks (short/medium/long term)
/api/artist/:id      - Proxies GET /v1/artists/:id (for genre data)
/api/search          - Proxies GET /v1/search (limit=10 per new restrictions)
/api/track/:id       - Proxies GET /v1/tracks/:id (single track metadata)
```

**CRITICAL API CONSTRAINTS (shape the entire architecture):**

1. **Audio Features endpoint is GONE.** `GET /v1/audio-features/{id}` returns 403 for all apps created after November 27, 2024. Energy, danceability, valence, and tempo data is NOT available. The architecture MUST NOT depend on it.

2. **Track popularity field is GONE.** The `popularity` field was removed from track objects in the February 2026 API changes. Cannot use it to size stars.

3. **Artist popularity and followers fields are GONE.** Also removed in February 2026.

4. **Preview URLs are unreliable.** The `preview_url` field returns null in batch/multi-get responses for new apps. Single-track fetches may still return it inconsistently.

5. **Batch endpoints are GONE.** `GET /v1/tracks` (multiple IDs) and `GET /v1/artists` (multiple IDs) removed in February 2026. Must fetch individually.

6. **Pagination cap at 10,000.** `GET /v1/me/tracks` returns 404 when offset exceeds 10,000. Users with larger libraries will have incomplete data.

7. **Search limit reduced.** Max 10 results per query (was 50), default 5 (was 20).

8. **5-user dev mode limit.** Only 5 allowlisted users. Extended Quota requires registered business + 250K MAU.

**What IS available for star visual properties:**
- **Genre** (from artist endpoint): Primary clustering dimension. Available.
- **Top track ranking**: `GET /me/top/tracks` returns tracks in ranked order across 3 time ranges. Position = importance.
- **Track presence in top items**: A track appearing in short_term top is "hotter" than one only in long_term.
- **Album release date**: Available in track metadata. Newer = brighter glow.
- **Genre-to-energy mapping**: A local lookup table (e.g., "death metal" = 0.95, "ambient" = 0.15) provides approximate energy for color mapping.
- **Number of saved tracks per artist**: Derived from library data. More tracks = bigger artist constellation.

### 2. Zustand Store (state management)

**Why Zustand over Redux/Context/Jotai:**
- Zustand is the pmndrs ecosystem standard (same team as R3F, Drei, react-spring)
- Zero boilerplate, no providers needed
- Supports reading state outside React (critical for useFrame loops)
- Subscriptions with selectors prevent unnecessary re-renders

**Store slices:**
```typescript
// Conceptual store shape -- NOT final implementation
interface SpotifyUniverseStore {
  // Auth
  auth: { isLoggedIn: boolean; user: SpotifyUser | null }

  // Raw Data
  tracks: NormalizedTrack[]        // Tracks with resolved genres
  topTracks: {                     // Ranked tracks by time range
    shortTerm: string[]            // Track IDs in rank order
    mediumTerm: string[]
    longTerm: string[]
  }
  artistGenres: Map<string, string[]>  // Artist ID -> genre strings

  // Computed Galaxy Data
  stars: StarData[]                // Positioned/colored stars
  genres: GenreCluster[]           // Genre groupings with centroid positions
  isLoading: boolean
  loadProgress: number             // 0-1, tracks loaded / total

  // Camera
  cameraState: 'idle' | 'cruising' | 'warping' | 'inspecting'
  warpTarget: WarpTarget | null
  warpProgress: number             // 0-1 for transition animation

  // Audio
  activePreview: string | null
  audioVolume: number

  // UI
  selectedStar: StarData | null
  searchQuery: string
  searchResults: NormalizedTrack[]
  showMiniMap: boolean
}
```

**Performance pattern:** The 3D scene reads state via `useStore.getState()` inside `useFrame` -- never via React subscriptions for per-frame data. React components use selectors: `useStore(s => s.selectedStar)` to minimize re-renders.

### 3. Galaxy Renderer (InstancedMesh architecture)

**Why InstancedMesh over Points:**
- Points are faster for raw particle count but have limited per-particle interactivity (no raycasting, no individual materials)
- InstancedMesh renders 5,000+ stars in 1-2 draw calls while supporting per-instance color, scale, and raycasting for click/hover
- At 5,000-10,000 objects, InstancedMesh is well within performance budget (forums report smooth 60fps up to 100,000 instances)

**Star rendering strategy:**
```
1. One InstancedMesh for all interactive stars
   - Geometry: Billboard quad (PlaneGeometry, 4 vertices) with custom
     fragment shader rendering a star/glow shape
   - Material: Custom ShaderMaterial with emissive output (for bloom pickup)
   - Instance count = track count (grows as data loads)
   - Raycasting enabled for click/hover detection

2. Per-instance attributes:
   - Matrix4: position + scale (scale = f(top track ranking))
   - instanceColor: RGB mapped from genre family color palette

3. Background star field:
   - Separate Points system (BufferGeometry, 50,000-100,000 particles)
   - Custom ShaderMaterial: tiny white dots, slight twinkle animation
   - NOT interactive (no raycasting needed)
   - Creates depth and cosmic atmosphere

4. Genre nebula clouds:
   - Separate Points systems per genre region
   - 5,000-10,000 particles per nebula, tinted to genre color
   - Custom ShaderMaterial with soft gaussian falloff
   - Positioned around genre centroids with large spread
```

**Star visual property mapping (without audio features or popularity):**

| Visual Property | Data Source | Mapping |
|----------------|------------|---------|
| **Position** | Artist genre -> genre cluster centroid + gaussian offset | Genre clustering algorithm in Web Worker |
| **Color** | Genre family (rock=red, electronic=cyan, hip-hop=purple, etc.) | 15-25 macro-genre color palette |
| **Size** | Top track ranking (short_term > medium_term > long_term) | Top 10 = supergiant, Top 50 = large, library = standard |
| **Brightness/glow** | Recency: presence in short_term top = hot, long_term only = cool | Emissive intensity mapped to time range |
| **Pulse animation** | Whether track is in user's top items at all | Top tracks gently pulse, library tracks are static |

**Genre clustering algorithm:**
Use a deterministic spatial layout computed OFF the main thread:
1. Assign each track to its primary genre (from artist data)
2. Map micro-genres to 15-25 macro-genre groups
3. Place macro-genre centroids on a sphere (golden-ratio spacing for even distribution)
4. Within each genre, position tracks in a nebula-like cluster around the centroid
5. Add controlled randomness (seeded by track ID for determinism)
6. Separate genres by angular distance proportional to "dissimilarity" (rock far from classical, close to metal)

Computed in a Web Worker. As new track batches arrive, run incremental layout (add new stars to existing clusters, don't recompute everything).

### 4. Camera System

**Recommended approach:** Custom camera controller built on `useFrame`, NOT Drei's FlyControls.

**Why custom over FlyControls:**
- FlyControls is designed for generic 3D navigation, not cinematic space flight
- Need smooth acceleration/deceleration curves for "cruise" feeling
- Need to support both free flight AND automated warp transitions
- Need speed scaling based on galaxy zoom level

**Camera state machine:**
```
IDLE        -> User not interacting, gentle drift animation
                Transitions to: CRUISING (on input)
CRUISING    -> WASD/arrow keys move, mouse controls look direction
                Smooth damped velocity with momentum
                Transitions to: IDLE (on input timeout), WARPING (on warp trigger)
WARPING     -> Automated transition to target
                Camera lerps position with easing
                FOV narrows, then restores
                Post-processing ramps up
                Cancellable: new warp starts from current position
                Transitions to: ARRIVING (on position threshold)
ARRIVING    -> Deceleration near target
                Post-processing returns to normal
                Transitions to: INSPECTING (on stop)
INSPECTING  -> Locked near a star/artist, slow auto-orbit
                Transitions to: CRUISING (on input), WARPING (on new warp)
```

**Implementation:** Store camera state enum in Zustand. In `useFrame`, read input + state, compute new position/rotation via ref mutations. Never setState per frame. Only update Zustand on state transitions (discrete events).

### 5. Spatial Audio System

**STATUS: Partially blocked by API changes. Design as optional enhancement.**

Preview URLs (`preview_url`) are unreliable for new apps. Architecture must work perfectly without audio.

**Two-tier approach:**

**Tier 1 (no audio, always available):**
- Visual-only feedback: stars glow brighter / pulse when camera is near
- "Play on Spotify" deep link on star click (opens in Spotify app/web player)
- This IS the v1 experience for most users

**Tier 2 (Premium users, Web Playback SDK):**
- Spotify Web Playback SDK creates a playback device in the browser
- When user clicks a star, play the full track via SDK
- Spatial positioning via Web Audio API PannerNode
- Requires Spotify Premium subscription

**Audio pool architecture (for Tier 2):**
```
AudioListener (attached to camera)
  |
  +-- AudioPool (3-5 reusable PositionalAudio objects)
       |
       +-- Each attached to a "virtual" position near camera
       +-- Volume attenuates with distance (inverse rolloff)
       +-- Crossfade on source reassignment
```

**Browser constraint:** Audio cannot auto-play until user interaction. Gate audio activation behind an explicit "Enter Galaxy" button.

### 6. Post-Processing Pipeline

**Stack:** `@react-three/postprocessing` (wraps `postprocessing` library by vanruesc).

**Effect chain (order matters):**
```jsx
<EffectComposer>
  <Bloom
    intensity={1.5}
    luminanceThreshold={0.6}
    mipmapBlur           // Much cheaper than kernel-based bloom
  />
  <ChromaticAberration
    offset={[0.002, 0.002]}  // Subtle default, ramps up during warp
  />
  <Vignette
    darkness={0.7}
    offset={0.3}
  />
  <ToneMapping />  // ALWAYS last in the chain
</EffectComposer>
```

**Performance:** The postprocessing library merges effects into minimal render passes automatically. Bloom with mipmapBlur is the most expensive effect -- keep resolution at half-res if needed. Start conservative, tune up.

**Warp effect:** During warp transitions, dynamically increase:
- Chromatic aberration offset (0.002 -> 0.01)
- Bloom intensity (1.5 -> 3.0)
- Consider adding radial blur for hyperspace tunnel effect

**Quality toggle:** Provide a simple Low/Medium/High quality setting that adjusts bloom resolution and disables chromatic aberration on Low.

### 7. Data Pipeline (Spotify -> Stars)

**Transformation stages:**
```
Raw Spotify Data (from API)
  |
  v
Multi-Source Aggregation
  - GET /me/tracks (paginated, up to 10,000)
  - GET /me/top/tracks?time_range=short_term (50 tracks)
  - GET /me/top/tracks?time_range=medium_term (50 tracks)
  - GET /me/top/tracks?time_range=long_term (50 tracks)
  - Extract unique artist IDs from all tracks
  - GET /artists/{id} for each unique artist (genre data, cached)
  |
  v
Track Normalization
  - Merge: track ID, name, artist, album, album art, release date
  - Attach: artist genres (from artist lookup)
  - Attach: top ranking (position in short/medium/long term lists, or null)
  - Attach: preview_url (may be null for new apps)
  - NOTE: No popularity, no audio features
  |
  v
Genre Classification
  - Map each track's artist genres to canonical macro-genre groups
  - E.g., "alternative metal" + "nu metal" -> "Metal"
  - Maintain a taxonomy of 15-25 groups + "Other/Undiscovered"
  - Tracks from artists with NO genre tags -> "Undiscovered" cluster
  |
  v
Star Property Computation
  - Position: genre cluster centroid + gaussian offset (computed in Worker)
  - Color: genre family -> color palette (rock=warm red, electronic=cyan, etc.)
  - Size: based on top track ranking (top 10 = supergiant, top 50 = large, default = small)
  - Brightness: based on recency (short_term top = bright, long_term = dim, library = baseline)
  - Pulse: boolean, true if track appears in any top list
  |
  v
Layout Computation (Web Worker)
  - Input: normalized tracks with genre classifications
  - Compute genre centroids on a sphere (golden ratio spacing)
  - Distribute stars within clusters (gaussian around centroid)
  - Output: Float32Array of positions, Float32Array of colors, Float32Array of scales
  |
  v
InstancedMesh Update
  - Write matrices (position + scale) to instanceMatrix buffer
  - Write colors to instanceColor buffer
  - Mark .needsUpdate = true on both buffers
  - For progressive loading: write only new indices [oldCount, newCount)
```

## Patterns to Follow

### Pattern 1: Ref-Based Animation (Critical for Performance)
**What:** Mutate Three.js objects directly via refs inside useFrame, bypassing React's reconciler.
**When:** Any per-frame update (camera movement, star pulsing, audio volume).
**Why:** React re-renders at 60fps would destroy performance. Direct ref mutation is O(1) with no GC pressure.
**Example:**
```typescript
function AnimatedStar({ position }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    // GOOD: Direct mutation via ref
    meshRef.current!.rotation.y += delta * 0.5
  })

  return <mesh ref={meshRef} position={position} />
}
```

### Pattern 2: Zustand Outside React
**What:** Read Zustand state inside useFrame via `getState()` instead of hook subscriptions.
**When:** Any time the 3D scene needs store data in the render loop.
**Why:** Hook subscriptions trigger React re-renders. getState() is a plain function call.
**Example:**
```typescript
useFrame(() => {
  const { warpTarget, cameraState } = useStore.getState()
  if (cameraState === 'warping' && warpTarget) {
    camera.position.lerp(warpTarget.position, 0.02)
  }
})
```

### Pattern 3: Progressive Data Loading
**What:** Load Spotify tracks in batches, update the galaxy incrementally.
**When:** Initial data fetch (user may have 5,000-10,000 saved tracks).
**Why:** Waiting for all data blocks the experience. Progressive loading turns loading INTO content.
**Example flow:**
```
Batch 1 (50 tracks) -> 50 stars appear with fade-in -> layout computes
Batch 2 (50 tracks) -> 100 stars total -> new stars fade in to existing clusters
...
Batch N (or offset 10000 cap) -> galaxy formation complete
```

### Pattern 4: Separation of DOM and Canvas
**What:** React components for UI overlays live OUTSIDE the `<Canvas>`. The Canvas contains only R3F components.
**When:** Always. Never mix DOM rendering inside Canvas.
**Why:** DOM and WebGL have different render cycles. Mixing them causes layout thrashing and z-index problems.
**Structure:**
```jsx
<div className="app">
  {/* DOM layer: absolute positioned overlays */}
  <SearchOverlay />
  <MiniMap />
  <TrackInfoPanel />
  <LoadingProgress />

  {/* WebGL layer: fills viewport */}
  <Canvas>
    <GalaxyScene />
    <CameraController />
    <EffectComposer>...</EffectComposer>
  </Canvas>
</div>
```

### Pattern 5: Instanced Buffer Partial Updates
**What:** When track data changes, update only the new instances in the InstancedMesh buffer.
**When:** Progressive loading adds new batches.
**Why:** Rewriting all 10,000 instance matrices each batch is wasteful. Write only indices [oldCount, newCount).

### Pattern 6: Request Queue with Rate Limiting
**What:** Queue Spotify API calls through a controlled concurrency limiter.
**When:** Fetching artist data individually (batch endpoints are gone).
**Why:** Firing 500 artist requests in parallel will trigger 429 rate limits instantly.
**Implementation:** Concurrency of 2-3 requests with 100ms spacing. Exponential backoff on 429. Cache artist data (same artist appears on many tracks).

## Anti-Patterns to Avoid

### Anti-Pattern 1: setState in useFrame
**What:** Calling React's setState, Zustand's set(), or any state update inside the render loop.
**Why bad:** Triggers React reconciliation 60 times per second. GC pressure, dropped frames.
**Instead:** Use refs for per-frame mutations. Only update Zustand for discrete events (user clicks, warp starts/ends).

### Anti-Pattern 2: Individual Mesh per Star
**What:** Rendering each star as a separate `<mesh>` React component.
**Why bad:** 5,000+ React components = 5,000+ draw calls. Frame rate craters to <10fps.
**Instead:** One `<instancedMesh>` with `count={trackCount}`. Update via buffer attributes.

### Anti-Pattern 3: Storing Tokens in localStorage
**What:** Saving Spotify access/refresh tokens in localStorage or sessionStorage.
**Why bad:** Any XSS vulnerability exposes tokens. localStorage is accessible to any script on the domain.
**Instead:** httpOnly, secure, sameSite cookies managed by Vercel serverless functions. Client never sees raw tokens.

### Anti-Pattern 4: Direct Client-Side Spotify API Calls
**What:** Making API calls to api.spotify.com directly from browser JavaScript.
**Why bad:** Exposes client secret. CORS issues on token exchange. No httpOnly cookie support.
**Instead:** All Spotify API calls proxy through Vercel serverless functions (/api/*).

### Anti-Pattern 5: Computing Layout on Main Thread
**What:** Running genre clustering for 5,000+ tracks on the main thread.
**Why bad:** 100-500ms computation blocks render loop, causing visible jank.
**Instead:** Web Worker. Post track data, receive Float32Arrays back.

### Anti-Pattern 6: Creating Audio Objects Per Star
**What:** Instantiating a PositionalAudio for every star.
**Why bad:** Thousands of Audio objects exhaust Web Audio API limits and memory.
**Instead:** Audio pool of 3-5 PositionalAudio instances, assigned to nearest audible stars.

### Anti-Pattern 7: Depending on Deprecated API Fields
**What:** Building features around audio features, popularity, or preview URLs as if they're reliably available.
**Why bad:** Returns 403 or null for new apps. Entire features break at runtime.
**Instead:** Build on what IS available (genres, top track ranking, release date). Layer deprecated fields as optional enhancements only if they happen to return data.

## Scalability Considerations

| Concern | At 100 tracks | At 1,000 tracks | At 5,000-10,000 tracks |
|---------|---------------|-----------------|------------------------|
| Star rendering | InstancedMesh trivial | InstancedMesh trivial | 1-2 draw calls, still trivial |
| Genre clustering | Instant on main thread | ~10ms, main thread OK | Web Worker required (100-500ms) |
| Data loading | 2 API calls + ~5 artists, <2s | 20 calls + ~100 artists, ~15s | 200+ calls + ~500 artists, 60-120s |
| Memory | ~500KB | ~5MB | ~25-50MB (track data + buffers) |
| Spatial audio | Pool of 3 sufficient | Pool of 3-5 sufficient | Pool of 5, distance culling |
| Search | In-memory filter, instant | In-memory filter, instant | In-memory filter, debounce input |
| Post-processing | No issues | No issues | Half-res bloom if needed |
| Artist fetching | ~5 individual requests | ~100 requests (rate limited) | ~500 requests (needs queue + cache) |

## Suggested Build Order

Based on component dependencies, here is the recommended build sequence:

```
Phase 1: Foundation
  |- Project setup (framework + TypeScript + R3F)
  |- Basic Canvas with camera + orbit controls (proof of life)
  |- Vercel project setup with API route scaffolding
  |- Zustand store skeleton
  |- Demo mode with mock data (works without Spotify auth)
  DEPENDENCY: None. This is the starting point.

Phase 2: Auth + Data Pipeline
  |- Spotify OAuth flow (login/callback/refresh via Vercel functions)
  |- httpOnly cookie token management
  |- Track fetching endpoint (/api/tracks with pagination)
  |- Top tracks fetching (/api/top-tracks, all 3 time ranges)
  |- Artist genre fetching (/api/artist/:id with request queue + caching)
  |- Genre taxonomy: micro-genre -> macro-genre mapping
  |- Data normalization pipeline
  DEPENDENCY: Must work before any real visualization.
  NOTE: Test API access immediately. If audio-features or popularity
        return 403/null, the architecture is already designed for this.

Phase 3: Galaxy Core
  |- Star property computation (color from genre, size from ranking, brightness from recency)
  |- Web Worker for layout computation (genre clustering on sphere)
  |- InstancedMesh galaxy renderer with per-instance color/scale
  |- Progressive loading (stars appear in waves as data streams in)
  |- Background star field (Points, 50K+ non-interactive particles)
  DEPENDENCY: Requires normalized track data from Phase 2.

Phase 4: Navigation + Interaction
  |- Custom camera flight controller (WASD + mouse look)
  |- Camera state machine (idle/cruising/warping/inspecting)
  |- Star click/hover detection (InstancedMesh raycasting)
  |- Track info panel on star click
  |- Warp-to-artist transition (basic lerp + easing)
  DEPENDENCY: Requires galaxy to exist (Phase 3).

Phase 5: Visual Polish
  |- Post-processing pipeline (bloom, chromatic aberration, vignette)
  |- Genre nebula background particles (colored Points clouds)
  |- Neon synthwave aesthetic refinement (color palette, glow tuning)
  |- Warp transition visual effects (FOV zoom, aberration ramp)
  |- Quality settings toggle (low/medium/high)
  DEPENDENCY: Requires navigation working (Phase 4) for warp effects.

Phase 6: UI + Search + Audio
  |- Search overlay (calls /api/search, warps to result)
  |- Mini-map HUD
  |- Loading screen with galaxy formation progress
  |- Spatial audio (Tier 2, Web Playback SDK for Premium) -- optional
  |- Screenshot export -- optional
  DEPENDENCY: Requires polished core experience (Phases 3-5).
```

**Phase ordering rationale:**
- Foundation includes demo mode so the app can render without Spotify auth (portfolio-ready)
- Auth and data MUST come second because everything depends on Spotify data
- Galaxy rendering depends on the data pipeline completing
- Navigation depends on having a galaxy to fly through
- Visual polish is separate from core rendering so the galaxy works before it's pretty
- UI/search/audio are overlays on a working experience, lowest dependency priority

## Key Architecture Decisions

| Decision | Rationale | Confidence |
|----------|-----------|------------|
| React Three Fiber over raw Three.js | Declarative components, ecosystem (Drei, postprocessing), React integration for UI. Galaxy Voyager validates R3F at this scale. | HIGH |
| Zustand for state | pmndrs ecosystem standard, works inside/outside React, minimal boilerplate, selectors prevent re-renders | HIGH |
| httpOnly cookies for tokens | Security best practice. XSS cannot read httpOnly cookies. Vercel functions manage token lifecycle. | HIGH |
| InstancedMesh over Points for stars | Need per-star raycasting (click/hover). 5,000-10,000 instances is well within budget. | HIGH |
| Custom camera over Drei FlyControls | Need cinematic warp transitions, speed curves, multiple camera modes. FlyControls too generic. | MEDIUM |
| Web Worker for layout | 5,000+ star layout takes 100-500ms. Cannot block render loop. | HIGH |
| Audio pool, not per-star audio | Web Audio API cannot handle thousands of sources. Pool of 3-5 covers all audible stars. | HIGH |
| Genre-based coloring, not energy-based | Audio features endpoint DEAD. Genre provides equally intuitive visual grouping. | HIGH |
| Top-track ranking for star size, not popularity | Popularity field REMOVED. Ranking from /me/top/tracks provides meaningful size differentiation. | HIGH |
| Demo mode with mock data | 5-user dev mode limit means most visitors can't authenticate. Demo mode makes the app portfolio-worthy. | HIGH |
| Two-tier audio: visual-only + Web Playback SDK | Preview URLs unreliable. Design works without audio. Premium users get spatial playback via SDK. | MEDIUM |

## Spotify API Constraints (Architecture-Critical)

Complete list of API constraints as of April 2026 that shape every architectural decision:

| Constraint | Impact | Mitigation |
|-----------|--------|------------|
| Audio Features returns 403 | No energy/danceability/valence/tempo data | Genre-based coloring + genre-to-energy lookup table |
| Track popularity field removed | No popularity-based star sizing | Top track ranking from /me/top/tracks |
| Artist popularity + followers removed | No artist prominence data | Track count per artist (derived from library) |
| Preview URLs unreliable | Spatial audio feature blocked | Two-tier: visual-only v1, Web Playback SDK v2 |
| Batch endpoints removed | Cannot fetch multiple artists/tracks in one call | Request queue with rate limiting + caching |
| Pagination cap at 10,000 | Large libraries truncated | Communicate limit in UI, supplement with top tracks/playlists |
| Search limit 10 (was 50) | Smaller search results | UI accommodates fewer results, client-side search for loaded data |
| 5-user dev mode limit | Cannot share publicly | Demo mode with mock data, apply for Extended Quota when ready |
| Premium required for app owner | Developer needs Spotify Premium | Acceptable for personal project |
| Implicit Grant flow deprecated | Cannot use simple client-side auth | Authorization Code Flow via Vercel serverless functions |

## Sources

- Galaxy Voyager (similar R3F project): https://discourse.threejs.org/t/galaxy-voyager-a-procedural-galaxy-explorer-with-220-star-systems-built-with-react-three-fiber-post-processing/86659
- R3F performance pitfalls: https://r3f.docs.pmnd.rs/advanced/pitfalls
- R3F state management: https://discourse.threejs.org/t/how-to-use-state-management-with-react-three-fiber-without-performance-issues/61223
- Three.js InstancedMesh docs: https://threejs.org/docs/pages/InstancedMesh.html
- Three.js PositionalAudio docs: https://threejs.org/docs/pages/PositionalAudio.html
- Drei controls: https://drei.docs.pmnd.rs/controls/introduction
- Spotify OAuth docs: https://developer.spotify.com/documentation/web-api/concepts/authorization
- Spotify February 2026 migration: https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide
- Spotify February 2026 changelog: https://developer.spotify.com/documentation/web-api/references/changes/february-2026
- Spotify March 2026 changelog: https://developer.spotify.com/documentation/web-api/references/changes/march-2026
- Spotify November 2024 API changes: https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api
- Spotify quota modes: https://developer.spotify.com/documentation/web-api/concepts/quota-modes
- Spotify audio features 403 (community): https://community.spotify.com/t5/Spotify-for-Developers/Web-API-Get-Track-s-Audio-Features-403-error/td-p/6654507
- Spotify dev mode changes (TechCrunch): https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/
- @react-three/postprocessing bloom: https://react-postprocessing.docs.pmnd.rs/effects/bloom
- Web Audio spatialization: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics
- 3D force-directed graph (Three.js): https://github.com/vasturiano/3d-force-graph
- Vercel serverless functions: https://vercel.com/docs/functions
