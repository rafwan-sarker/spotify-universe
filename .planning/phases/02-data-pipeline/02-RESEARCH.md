# Phase 2: Data Pipeline - Research

**Researched:** 2026-04-02
**Domain:** Spotify API data fetching, genre normalization, 3D position computation, Web Workers in Next.js
**Confidence:** HIGH

## Summary

Phase 2 transforms a user's Spotify library into a structured dataset where every track has a genre cluster, 3D position, color, and size assigned. The pipeline spans four distinct subsystems: (1) a multi-source Spotify fetch queue that progressively retrieves saved songs, top tracks, playlists, and recently played; (2) artist genre resolution via individual artist lookups (batch endpoints are gone); (3) genre normalization mapping 5000+ Spotify micro-genres into ~10 macro-genre clusters; and (4) a Web Worker that computes 3D positions within a sphere layout.

The critical architectural insight is that the access token lives in the next-auth JWT on the server, not in the client session. All Spotify API calls MUST proxy through Next.js API route handlers that read the token via `auth()` and forward requests. The client never touches the raw access token. Additionally, the current `spotify-scopes.ts` only requests `user-library-read` and `user-top-read` -- playlists and recently-played data require adding `playlist-read-private` and `user-read-recently-played` scopes.

The data must output the exact same shape as `demo-galaxy.json` (the contract from Phase 1): each star has `id`, `name`, `artist`, `genre`, `position: [x, y, z]`, `size`, and `brightness`. Genre clusters have `id`, `name`, `color: [r, g, b]`, and `centroid: [x, y, z]`. This contract ensures Phase 3's renderer works identically with demo and real data.

**Primary recommendation:** Build server-side API route handlers as the data proxy layer, a client-side fetch orchestrator (NOT TanStack Query -- see rationale below), a pure-function genre normalization module, and a Web Worker for position computation. Use Comlink for clean Worker communication with Transferable ArrayBuffers for zero-copy star position data.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Fetch ALL available data sources: saved songs, top tracks (3 time ranges), playlists, and recently played. Maximize galaxy size.
- **D-02:** Stars appear in the galaxy in real-time as songs are fetched -- the loading IS the experience. No separate loading screen.
- **D-03:** Fetching begins immediately on OAuth completion (during/after warp transition) -- fastest time to galaxy.
- **D-04:** Research flagged: no batch endpoints for new Spotify apps. Must use individual paginated requests with rate limit handling.
- **D-05:** Normalize Spotify's micro-genres into ~10 macro-genre clusters (Pop, Rock, Hip-Hop, Electronic, R&B, Indie, Jazz, Classical, Latin, Metal or similar).
- **D-06:** Songs with no genre data or unmappable genres go into a dedicated "Mystery" / "Unknown" cluster -- honest about gaps, not hidden.
- **D-07:** Each cluster gets a distinct assigned color for star rendering (consistent with the 6 demo genres from Phase 1).
- **D-08:** Genre clusters arranged in a sphere layout -- evenly distributed around a central point, no genre is "more central" than another.
- **D-09:** Within each cluster, songs are arranged in ranked layers -- top/most-listened tracks near the cluster center, deep cuts at the edges. Favorites are the "core" of each nebula.
- **D-10:** Star size based on top-track ranking (carried from project requirements GLXY-05).
- **D-11:** Genre normalization and 3D position computation offloaded to a Web Worker -- keeps the UI/3D renderer responsive during processing.
- **D-12:** Data flows from: Spotify API -> fetch queue (main thread) -> Web Worker (normalize + position) -> Zustand store -> R3F renderer.
- **D-13:** Must handle libraries of 5000+ songs without freezing the browser (success criterion #4).

### Claude's Discretion
- Exact rate limiting strategy (concurrency, backoff, retry)
- Genre taxonomy mapping table (which micro-genres map to which macro-cluster)
- Cluster sphere radius and spacing parameters
- Web Worker communication protocol (message format, batching)
- TanStack Query vs custom fetch queue decision
- Deduplication strategy (same song in saved + playlist)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | Progressively fetch user's full Spotify library (saved songs + top tracks) | Multi-source fetch queue with rate limiting, API route proxy layer, pagination handling for each endpoint. Top tracks capped at 50/time_range. Saved songs paginated up to 10,000 offset cap. |
| DATA-02 | Normalize 5000+ Spotify micro-genres into 15-25 macro-genre clusters | Genre taxonomy mapping module with keyword/substring matching against ~10 macro-clusters. Genres come from artist objects, not tracks. Must handle the "no genres" case (Mystery cluster). |
| DATA-03 | Map each song to a 3D position based on genre cluster membership | Web Worker computes sphere layout for cluster centroids (golden-ratio spacing), then distributes stars within clusters using ranked layers. Output as Float32Arrays transferred back to main thread. |
</phase_requirements>

## Standard Stack

### Core (New Dependencies for Phase 2)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| comlink | ^4.4.2 | Web Worker RPC | Eliminates raw postMessage boilerplate. Provides typed function calls across worker boundary. Supports Comlink.transfer() for zero-copy Float32Array transfer. 1.1KB gzipped. Verified current npm version: 4.4.2. |

### Already Installed (Phase 1)

| Library | Version | Purpose | Phase 2 Role |
|---------|---------|---------|-------------|
| zustand | ^5.0.12 | Client state | Extends store with galaxy data slices (stars array, genres, loading progress, fetch status) |
| next-auth | 5.0.0-beta.30 | OAuth/session | Server-side `auth()` provides access token for API route handlers |
| next | ^16.2.0 | Framework | API route handlers proxy Spotify calls; Turbopack bundles Web Worker files via `new URL()` pattern |

### NOT Installing

| Library | Why Not | Alternative |
|---------|---------|-------------|
| @tanstack/react-query | The fetch pattern here is a one-time progressive pipeline, not server-state cache. We fetch ALL data once after login, stream it through a worker, and store the result. TanStack Query's caching, refetching, and stale-while-revalidate model adds complexity without benefit. A simple fetch queue with async generators is more natural for this "drain the firehose once" pattern. | Custom fetch orchestrator with rate limiting and retry logic |
| @spotify/web-api-ts-sdk | Adds SDK abstraction layer that fights the API route proxy pattern. The SDK wants to manage auth tokens itself; we already handle tokens via next-auth JWT. Raw fetch calls in API routes are simpler and more transparent. The SDK's main benefit (type definitions) can be replicated with a small types file. | Raw fetch in API route handlers + custom TypeScript types |
| p-queue | Popular concurrency limiter, but only 3KB and we need a custom rate limiter that respects Spotify's Retry-After header and integrates with the progress callback. Rolling our own is ~50 lines. | Custom rate-limited fetch queue |

### Installation

```bash
npm install comlink
```

## Architecture Patterns

### Recommended Project Structure

```
src/
  app/
    api/
      spotify/
        tracks/route.ts          # GET /api/spotify/tracks?offset=0&limit=50
        top-tracks/route.ts      # GET /api/spotify/top-tracks?time_range=short_term
        playlists/route.ts       # GET /api/spotify/playlists
        playlists/[id]/route.ts  # GET /api/spotify/playlists/:id/tracks
        recently-played/route.ts # GET /api/spotify/recently-played
        artists/[id]/route.ts    # GET /api/spotify/artists/:id
  lib/
    spotify-scopes.ts            # MODIFY: add 2 new scopes
    store.ts                     # MODIFY: add galaxy data slices
    spotify/
      types.ts                   # Spotify API response types + star data types
      genre-map.ts               # Micro-genre -> macro-genre taxonomy (pure function)
      fetch-orchestrator.ts      # Client-side fetch queue with rate limiting
      star-data.ts               # Star property computation (color, size, brightness)
  workers/
    galaxy-layout.worker.ts      # Web Worker: genre normalization + 3D positioning
    galaxy-layout.types.ts       # Shared types between main thread and worker
  hooks/
    use-galaxy-pipeline.ts       # React hook orchestrating the full pipeline
```

### Pattern 1: API Route Proxy (Server-Side Token Forwarding)

**What:** Every Spotify API call goes through a Next.js API route handler that reads the access token from the server-side session and forwards the request.

**When to use:** Every Spotify data fetch.

**Why:** The access token lives in the next-auth JWT and is NOT exposed to the client session (by design -- see auth.ts session callback). Server-side proxy keeps the token secure and handles transparent refresh.

```typescript
// src/app/api/spotify/tracks/route.ts
import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Access token is in the JWT, available server-side via auth()
  const token = session as any // JWT contains accessToken
  const jwt = await getToken({ req: request }) // alternative: use getToken

  const { searchParams } = new URL(request.url)
  const offset = searchParams.get("offset") ?? "0"
  const limit = searchParams.get("limit") ?? "50"

  const response = await fetch(
    `https://api.spotify.com/v1/me/tracks?offset=${offset}&limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${jwt.accessToken}` },
    }
  )

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After") ?? "5"
    return NextResponse.json(
      { error: "Rate limited", retryAfter: parseInt(retryAfter) },
      { status: 429, headers: { "Retry-After": retryAfter } }
    )
  }

  const data = await response.json()
  return NextResponse.json(data)
}
```

**Important:** To read the JWT with the access token in an API route, use `getToken()` from `next-auth/jwt` (not `auth()`), because `auth()` returns the sanitized session which does NOT include the access token per the current session callback.

### Pattern 2: Client-Side Fetch Orchestrator with Rate Limiting

**What:** A class that manages concurrent API requests with configurable parallelism, Retry-After respect, and progress callbacks.

**When to use:** Orchestrating the multi-source fetch pipeline from the client.

**Why:** Must coordinate 100+ requests across 6 endpoints without triggering 429 rate limits.

```typescript
// Conceptual pattern -- not final implementation
interface FetchTask {
  url: string
  onSuccess: (data: any) => void
}

class SpotifyFetchQueue {
  private concurrency = 2
  private active = 0
  private queue: FetchTask[] = []
  private retryAfterMs = 0

  async enqueue(task: FetchTask): Promise<void> {
    this.queue.push(task)
    this.drain()
  }

  private async drain(): Promise<void> {
    while (this.queue.length > 0 && this.active < this.concurrency) {
      if (this.retryAfterMs > 0) {
        await sleep(this.retryAfterMs)
        this.retryAfterMs = 0
      }
      this.active++
      const task = this.queue.shift()!
      try {
        const res = await fetch(task.url)
        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get("Retry-After") ?? "5")
          this.retryAfterMs = retryAfter * 1000
          this.queue.unshift(task) // re-queue
        } else {
          task.onSuccess(await res.json())
        }
      } finally {
        this.active--
        this.drain() // continue draining
      }
    }
  }
}
```

### Pattern 3: Web Worker with Comlink in Next.js App Router

**What:** A dedicated Web Worker for CPU-intensive genre normalization and 3D position computation, accessed via Comlink's typed RPC interface.

**When to use:** Processing batches of tracks into positioned star data.

**Why:** 5000+ track layout computation takes 100-500ms, which would freeze the main thread and drop frames in the R3F renderer. Web Worker keeps UI responsive.

```typescript
// src/workers/galaxy-layout.worker.ts
import * as Comlink from "comlink"

interface ProcessedBatch {
  positions: Float32Array   // [x,y,z, x,y,z, ...] flattened
  colors: Float32Array      // [r,g,b, r,g,b, ...] flattened
  sizes: Float32Array       // [s, s, s, ...] per star
  genres: string[]          // genre ID per star
  starIds: string[]         // track ID per star
}

function processBatch(tracks: NormalizedTrack[], genreMap: GenreConfig): ProcessedBatch {
  // ... compute positions, colors, sizes
  const positions = new Float32Array(tracks.length * 3)
  const colors = new Float32Array(tracks.length * 3)
  const sizes = new Float32Array(tracks.length)
  // ... fill arrays
  return Comlink.transfer(
    { positions, colors, sizes, genres, starIds },
    [positions.buffer, colors.buffer, sizes.buffer]
  )
}

Comlink.expose({ processBatch })
```

```typescript
// src/hooks/use-galaxy-pipeline.ts (client component)
"use client"
import { useEffect, useRef } from "react"
import * as Comlink from "comlink"

type WorkerApi = {
  processBatch: (tracks: NormalizedTrack[], config: GenreConfig) => Promise<ProcessedBatch>
}

export function useGalaxyPipeline() {
  const workerRef = useRef<Comlink.Remote<WorkerApi> | null>(null)

  useEffect(() => {
    const worker = new Worker(
      new URL("@/workers/galaxy-layout.worker.ts", import.meta.url),
      { type: "module" }
    )
    workerRef.current = Comlink.wrap<WorkerApi>(worker)
    return () => worker.terminate()
  }, [])

  // ... use workerRef.current.processBatch() in the fetch pipeline
}
```

**Next.js Turbopack compatibility:** The `new URL("...", import.meta.url)` pattern is supported by Turbopack in Next.js 16. Turbopack also supports `{ type: "module" }` workers. Worker files should use `.ts` extension and import as needed -- Turbopack bundles them separately.

### Pattern 4: Progressive Store Updates

**What:** Zustand store receives star batches incrementally as they stream from the Worker, appending to existing arrays.

**When to use:** Every time a batch of tracks is processed by the Worker.

**Why:** D-02 requires stars to appear live. Store updates trigger R3F re-renders that add new InstancedMesh instances.

```typescript
// Zustand store galaxy slice
interface GalaxySlice {
  stars: StarData[]
  genres: GenreCluster[]
  fetchProgress: { loaded: number; total: number; phase: string }
  isComplete: boolean
  addStarBatch: (batch: StarData[]) => void
  setGenres: (genres: GenreCluster[]) => void
  setFetchProgress: (progress: Partial<GalaxySlice["fetchProgress"]>) => void
}
```

### Anti-Patterns to Avoid

- **Exposing access token to the client:** The current auth.ts correctly withholds it from the session. Do NOT modify the session callback to pass the token. Use API route handlers instead.
- **Following the `next` URL from paginated responses:** The GET /me/playlists `next` URL is broken (Feb 2026 bug -- points to removed endpoint). Always construct pagination URLs manually using offset arithmetic.
- **Fetching artists in parallel without rate limiting:** 500 unique artist fetches at once will trigger immediate 429. Use the fetch queue with concurrency of 2-3.
- **Computing layout on main thread:** Even 500 tracks can cause a noticeable frame drop. Always use the Web Worker.
- **Storing raw Spotify response data in Zustand:** Transform into the compact star data shape before storing. Raw SavedTrack objects are large (nested album, artist objects) and would waste memory at scale.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Worker RPC communication | Raw postMessage/onmessage with manual serialization | Comlink | Type-safe function calls, automatic serialization, Comlink.transfer() for zero-copy ArrayBuffer transfer |
| Sphere point distribution | Custom random distribution | Golden-ratio sphere distribution (Fibonacci sphere) | Produces visually even spacing without clustering artifacts. Well-known algorithm, ~15 lines of code but tricky to get right from scratch. Use the standard formula. |
| Genre taxonomy from scratch | Manually reviewing 5000+ Spotify genres | Keyword/substring matching with curated prefix/suffix patterns | The Every Noise at Once dataset (6000+ genres) provides the reference. Most micro-genres contain their parent as a substring ("indie rock" contains "rock", "latin pop" contains both "latin" and "pop"). A ~100-entry keyword map covers 90%+ of genres. |

**Key insight:** The genre normalization problem looks deceptively simple but has a long tail. The keyword-matching approach (check if genre string contains "rock", "metal", "pop", etc.) handles the majority. The remaining edge cases (e.g., "trap" could be electronic or hip-hop) need explicit overrides in the mapping table. Do NOT attempt ML-based classification -- it's massive overkill for ~10 output categories.

## Common Pitfalls

### Pitfall 1: Access Token Not Available in API Routes

**What goes wrong:** Calling `auth()` in an API route returns the session object, but the session callback in the current auth.ts strips the access token. The API route gets `{ user: { id, name, email, image } }` with no token.

**Why it happens:** The session callback deliberately does not expose `accessToken` to the client for security (anti-pattern 3 from PITFALLS.md). But API route handlers run on the server and need it.

**How to avoid:** Use `getToken()` from `next-auth/jwt` in API route handlers. This reads the raw JWT from the request cookies and returns the full token including `accessToken` and `refreshToken`. This is the standard pattern for next-auth v5 server-side token access.

```typescript
import { getToken } from "next-auth/jwt"

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request })
  if (!token?.accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // Use token.accessToken for Spotify API calls
}
```

**Warning signs:** 401 errors from Spotify when the user is clearly logged in.

### Pitfall 2: Missing OAuth Scopes for Playlists and Recently Played

**What goes wrong:** CONTEXT.md D-01 requires fetching playlists and recently played, but the current `spotify-scopes.ts` only requests `user-library-read` and `user-top-read`. API calls to `/me/playlists` and `/me/player/recently-played` will return 403 Forbidden.

**Why it happens:** Phase 1 only needed saved songs and top tracks. The scopes were set for those endpoints.

**How to avoid:** Add `playlist-read-private` and `user-read-recently-played` to `SPOTIFY_SCOPES`. This WILL force existing users to re-authorize (scopes changed). For the 5-user dev mode cap, this is fine -- just re-login.

**Warning signs:** 403 errors on playlist/recently-played endpoints despite successful authentication.

### Pitfall 3: Spotify Playlists Pagination Bug (Feb 2026)

**What goes wrong:** The `next` URL in GET /me/playlists responses points to the removed `GET /users/{id}/playlists` endpoint, causing 403 errors on the second page. Users with 50+ playlists get incomplete data.

**Why it happens:** Spotify broke this in the February 2026 API changes. The bug is acknowledged but not yet fixed as of April 2026.

**How to avoid:** Never follow the `next` URL from playlist responses. Manually construct pagination: `GET /me/playlists?offset=${currentOffset + limit}&limit=50`.

**Warning signs:** First page of playlists loads fine, second page returns 403.

### Pitfall 4: Top Tracks Hard Cap at 50 Per Time Range

**What goes wrong:** Developers assume `/me/top/tracks` can paginate indefinitely like `/me/tracks`. In reality, only 50 items exist per time range. Offset > 49 returns empty results.

**Why it happens:** Spotify only exposes the top 50 tracks per time range. This is a data limitation, not a pagination bug.

**How to avoid:** Fetch each time range with `limit=50&offset=0` (one request each, 3 total). Do not attempt pagination. Total top tracks: max 150 across all 3 ranges (with potential overlap).

**Warning signs:** Second page of top tracks returning empty items array.

### Pitfall 5: Genres Live on Artists, Not Tracks

**What goes wrong:** Developer looks for genre field on track objects and finds nothing. Spotify tracks have no genre data.

**Why it happens:** Spotify assigns genre tags to artist profiles, not individual tracks. A track's genres must be inferred from its artists' genres.

**How to avoid:** After fetching tracks, extract unique artist IDs. Fetch each artist via `/artists/{id}` to get their `genres[]` array. Cache aggressively -- the same artist appears across many tracks. Map the artist's genres back to all their tracks.

**Warning signs:** Genre field missing from track response objects.

### Pitfall 6: Deduplication Across Sources

**What goes wrong:** The same track appears in saved songs, a playlist, AND top tracks. Without deduplication, a user sees 3 stars for the same song.

**Why it happens:** Fetching from multiple sources (D-01) naturally produces duplicates.

**How to avoid:** Use a `Map<string, TrackData>` keyed by Spotify track ID. When a duplicate is found, merge metadata: if the track appears in top tracks, preserve its ranking; if it appears in saved songs, preserve its added_at date. The star should reflect the "best" data from all sources.

**Warning signs:** Star count much higher than expected library size.

## Code Examples

### Fibonacci Sphere Distribution (for Cluster Centroids)

Verified mathematical formula for evenly distributing N points on a sphere.

```typescript
// Source: standard mathematical formula (Fibonacci/golden-ratio sphere)
function fibonacciSphere(count: number, radius: number): [number, number, number][] {
  const points: [number, number, number][] = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)) // ~2.3999 radians

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2 // y goes from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y)
    const theta = goldenAngle * i

    const x = Math.cos(theta) * radiusAtY
    const z = Math.sin(theta) * radiusAtY

    points.push([x * radius, y * radius, z * radius])
  }
  return points
}
```

### Genre Taxonomy Map (Keyword Matching)

```typescript
// Genre mapping strategy: ordered array of [keyword, macroGenre] pairs
// First match wins, so more specific keywords go first
const GENRE_KEYWORDS: [string, string][] = [
  // Specific overrides first (prevent misclassification)
  ["trap metal", "Metal"],
  ["latin trap", "Latin"],
  ["trap", "Hip-Hop"],
  ["drill", "Hip-Hop"],
  ["grime", "Hip-Hop"],
  
  // Broad keyword matching
  ["hip hop", "Hip-Hop"],
  ["hip-hop", "Hip-Hop"],
  ["rap", "Hip-Hop"],
  
  ["rock", "Rock"],
  ["punk", "Rock"],
  ["grunge", "Rock"],
  ["emo", "Rock"],
  
  ["metal", "Metal"],
  ["core", "Metal"], // metalcore, deathcore, etc.
  
  ["pop", "Pop"],
  ["k-pop", "Pop"],
  
  ["electro", "Electronic"],
  ["edm", "Electronic"],
  ["house", "Electronic"],
  ["techno", "Electronic"],
  ["trance", "Electronic"],
  ["dubstep", "Electronic"],
  ["dnb", "Electronic"],
  ["drum and bass", "Electronic"],
  ["ambient", "Electronic"],
  
  ["r&b", "R&B"],
  ["rnb", "R&B"],
  ["soul", "R&B"],
  ["funk", "R&B"],
  ["neo soul", "R&B"],
  
  ["indie", "Indie"],
  ["alternative", "Indie"],
  ["lo-fi", "Indie"],
  ["shoegaze", "Indie"],
  
  ["jazz", "Jazz"],
  ["bebop", "Jazz"],
  ["swing", "Jazz"],
  
  ["classical", "Classical"],
  ["orchestra", "Classical"],
  ["symphony", "Classical"],
  ["piano", "Classical"],
  ["opera", "Classical"],
  
  ["latin", "Latin"],
  ["reggaeton", "Latin"],
  ["salsa", "Latin"],
  ["bachata", "Latin"],
  ["cumbia", "Latin"],
  ["bossa nova", "Latin"],
  
  ["country", "Country"],
  ["bluegrass", "Country"],
  ["americana", "Country"],
]

function classifyGenre(spotifyGenre: string): string {
  const lower = spotifyGenre.toLowerCase()
  for (const [keyword, macro] of GENRE_KEYWORDS) {
    if (lower.includes(keyword)) return macro
  }
  return "Mystery" // D-06: unknown genres get their own cluster
}

function classifyArtistGenres(artistGenres: string[]): string {
  // Take the first successfully classified genre
  for (const genre of artistGenres) {
    const classified = classifyGenre(genre)
    if (classified !== "Mystery") return classified
  }
  return "Mystery"
}
```

### Star Data Shape (Must Match demo-galaxy.json Contract)

```typescript
// This is the contract -- Phase 3 renderer reads this shape
interface StarData {
  id: string               // Spotify track ID (or "demo-XXX" for demo data)
  name: string             // Track name
  artist: string           // Primary artist name
  genre: string            // Macro-genre ID (e.g., "pop", "rock", "mystery")
  position: [number, number, number]  // 3D position in world space
  size: number             // 0.3 (small) to 2.0 (supergiant)
  brightness: number       // 0.0 to 1.0 (emissive intensity)
}

interface GenreCluster {
  id: string               // Lowercase ID (e.g., "pop", "hip-hop", "mystery")
  name: string             // Display name (e.g., "Pop", "Hip-Hop", "Mystery")
  color: [number, number, number]  // RGB 0-1 range
  centroid: [number, number, number] // 3D position of cluster center
}

interface GalaxyData {
  version: number
  description: string
  genres: GenreCluster[]
  stars: StarData[]
}
```

### Zustand Store Extension

```typescript
// Extend existing store.ts with galaxy data
interface GalaxySlice {
  // Galaxy data
  stars: StarData[]
  genres: GenreCluster[]
  
  // Pipeline progress
  fetchProgress: {
    phase: "idle" | "tracks" | "top-tracks" | "playlists" | "recently-played" | "artists" | "computing" | "complete"
    loaded: number
    total: number
  }
  
  // Actions
  addStarBatch: (batch: StarData[]) => void
  setGenres: (genres: GenreCluster[]) => void
  setFetchProgress: (progress: Partial<GalaxySlice["fetchProgress"]>) => void
  resetGalaxy: () => void
}
```

## Spotify API Endpoint Details

Precise constraints for each endpoint the pipeline will call.

| Endpoint | Scope Required | Pagination | Max Items | Rate Limit Notes |
|----------|---------------|------------|-----------|-----------------|
| GET /me/tracks | user-library-read | offset + limit (max 50/page) | 10,000 (hard offset cap) | Rolling 30s window |
| GET /me/top/tracks | user-top-read | limit only (no real pagination) | 50 per time_range (150 total) | Low request count |
| GET /me/playlists | playlist-read-private | offset + limit (max 50/page) | 100,000 (but pagination bug) | Do NOT follow `next` URL |
| GET /playlists/{id}/tracks | playlist-read-private | offset + limit (max 100/page) | Unlimited (per playlist) | Rate limited |
| GET /me/player/recently-played | user-read-recently-played | cursor (before/after) | 50 per request | Low request count |
| GET /artists/{id} | none (public data) | N/A (single item) | 1 | Highest volume -- need rate limiting |

### Fetch Order Strategy

Execute in this order to maximize visible progress:

1. **Top tracks (3 requests)** -- fast, small, provides ranking data immediately. Triggers first star rendering.
2. **Saved tracks (paginated)** -- the bulk of the library. Stream batches of 50 through the worker.
3. **Recently played (1-2 requests)** -- small, supplements data.
4. **Playlists (variable)** -- fetch playlist list, then each playlist's tracks. Most variable in size.
5. **Artists (variable, concurrent with above)** -- start fetching artist genres as soon as unique artist IDs accumulate. This runs in parallel with track fetching.

### Required Scope Changes

```typescript
// src/lib/spotify-scopes.ts -- MUST UPDATE
export const SPOTIFY_SCOPES = [
  "user-read-email",
  "user-read-private",
  "user-library-read",
  "user-top-read",
  "playlist-read-private",         // NEW: needed for D-01 playlist access
  "user-read-recently-played",     // NEW: needed for D-01 recently played
].join(" ")
```

**Impact:** Users who logged in during Phase 1 will need to re-authorize to grant the new scopes. This is fine for 5-user dev mode.

## Star Property Computation Logic

### Size (from Top Track Ranking)

```
Top 10 (any time range):     size = 1.5 - 2.0 (supergiant)
Top 11-50 (any time range):  size = 0.8 - 1.5 (large)
Not in top tracks:           size = 0.3 - 0.7 (standard)
```

Ranking priority: short_term > medium_term > long_term (a track at position 5 in short_term is "hotter" than position 5 in long_term).

### Brightness (from Recency / Source)

```
In short_term top:            brightness = 0.8 - 1.0
In medium_term top:           brightness = 0.6 - 0.8
In long_term top:             brightness = 0.4 - 0.6
Recently played (last 50):    brightness = 0.5 - 0.7
Saved songs (no top ranking): brightness = 0.2 - 0.4
Playlist only:                brightness = 0.1 - 0.3
```

### Color (from Genre Cluster)

Use the genre cluster's assigned color. Must be consistent with the demo data's 6 genres. Extend the palette for the ~10 macro-genres:

```typescript
const GENRE_COLORS: Record<string, [number, number, number]> = {
  "pop":        [1.0, 0.4, 0.7],   // Hot pink (from demo)
  "rock":       [0.9, 0.2, 0.2],   // Red (from demo)
  "hip-hop":    [0.6, 0.2, 0.9],   // Purple (from demo)
  "electronic": [0.1, 0.8, 0.9],   // Cyan (from demo)
  "rnb":        [0.9, 0.6, 0.1],   // Gold (from demo)
  "indie":      [0.4, 0.9, 0.4],   // Green (from demo)
  "metal":      [0.8, 0.1, 0.1],   // Dark red
  "jazz":       [0.9, 0.8, 0.3],   // Warm yellow
  "classical":  [0.7, 0.7, 1.0],   // Soft blue-white
  "latin":      [1.0, 0.5, 0.2],   // Orange
  "country":    [0.6, 0.4, 0.2],   // Brown/earth
  "mystery":    [0.8, 0.8, 0.8],   // Silver/white
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Batch artist fetching (GET /artists?ids=...) | Individual artist fetching (GET /artists/{id}) | Feb 2026 | Must rate-limit ~500 individual requests instead of ~10 batch requests |
| Audio features for star properties | Genre-based + ranking-based properties | Nov 2024 | Star color from genre, size from top-track rank, no energy/danceability data |
| Track popularity field for sizing | Top-track positional ranking | Feb 2026 | Popularity removed; use position in /me/top/tracks response |
| Implicit Grant OAuth | Authorization Code Flow only | Nov 2025 | Already handled by next-auth in Phase 1 |

## Open Questions

1. **Playlist pagination bug resolution timeline**
   - What we know: GET /me/playlists pagination is broken since Feb 2026 -- `next` URL points to removed endpoint.
   - What's unclear: When Spotify will fix this. Could be days or months.
   - Recommendation: Manually construct pagination URLs. Never follow `next` from response. This workaround is resilient regardless of fix timeline.

2. **Recently played depth**
   - What we know: GET /me/player/recently-played returns max 50 items per request. Cursor-based pagination exists.
   - What's unclear: How deep the history goes. Can you paginate backward through weeks/months of history, or is it capped at ~50 most recent?
   - Recommendation: Fetch one page of 50 recently-played tracks. It supplements the galaxy with current listening context. Don't over-invest in deep history pagination.

3. **Exact rate limit threshold for dev-mode apps**
   - What we know: Spotify uses a rolling 30-second window. The exact number of allowed requests is not documented and varies.
   - What's unclear: The precise limit for dev-mode apps. Community reports range from 30-100 req/30s.
   - Recommendation: Start with concurrency of 2 and 200ms spacing between requests. Monitor for 429s and adapt with exponential backoff + Retry-After header respect. This is conservative enough to avoid limits while still being reasonably fast.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.1 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Progressive fetch returns paginated tracks | unit | `npx vitest run src/__tests__/fetch-orchestrator.test.ts -t "paginates saved tracks"` | No -- Wave 0 |
| DATA-01 | Rate limiting respects 429 Retry-After | unit | `npx vitest run src/__tests__/fetch-orchestrator.test.ts -t "handles 429"` | No -- Wave 0 |
| DATA-01 | Deduplication merges tracks from multiple sources | unit | `npx vitest run src/__tests__/fetch-orchestrator.test.ts -t "deduplicates"` | No -- Wave 0 |
| DATA-02 | Genre normalization maps known micro-genres correctly | unit | `npx vitest run src/__tests__/genre-map.test.ts -t "classifies known genres"` | No -- Wave 0 |
| DATA-02 | Unknown genres classified as Mystery | unit | `npx vitest run src/__tests__/genre-map.test.ts -t "unknown genres"` | No -- Wave 0 |
| DATA-02 | Cluster count is ~10 (not 50+) | unit | `npx vitest run src/__tests__/genre-map.test.ts -t "macro genre count"` | No -- Wave 0 |
| DATA-03 | Star positions are within their cluster region | unit | `npx vitest run src/__tests__/galaxy-layout.test.ts -t "positions within cluster"` | No -- Wave 0 |
| DATA-03 | Top-ranked tracks are closer to cluster center | unit | `npx vitest run src/__tests__/galaxy-layout.test.ts -t "ranked layers"` | No -- Wave 0 |
| DATA-03 | Output matches StarData shape contract | unit | `npx vitest run src/__tests__/galaxy-layout.test.ts -t "output shape"` | No -- Wave 0 |
| DATA-03 | 5000+ tracks process without timeout | unit | `npx vitest run src/__tests__/galaxy-layout.test.ts -t "large library"` | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/genre-map.test.ts` -- covers DATA-02 (genre normalization pure functions)
- [ ] `src/__tests__/fetch-orchestrator.test.ts` -- covers DATA-01 (fetch queue, rate limiting, dedup)
- [ ] `src/__tests__/galaxy-layout.test.ts` -- covers DATA-03 (position computation, ranked layers, output shape)
- [ ] `src/__tests__/star-data.test.ts` -- covers star property computation (size, brightness, color mapping)

Note: Web Worker integration is best tested via browser/E2E since Vitest runs in Node. Unit tests should test the pure functions (genre mapping, position computation, star properties) that the Worker calls, not the Worker communication itself.

## Project Constraints (from CLAUDE.md)

- **Tech Stack:** Three.js + TypeScript + React + Next.js on Vercel (locked)
- **Auth:** next-auth v5 with Spotify provider, JWT session strategy (already implemented)
- **State:** Zustand for client state (already implemented, must extend)
- **Performance:** 60fps on modern desktop, 30fps+ on mobile -- data pipeline must not block render
- **API:** Spotify Web API only -- no scraping, no third-party data
- **Security:** Never expose access tokens to client; never commit .env
- **GSD Workflow:** All work through GSD commands
- **Git:** Feature branches, small focused commits, clear messages

## Sources

### Primary (HIGH confidence)
- Spotify API Reference - Get User's Saved Tracks: https://developer.spotify.com/documentation/web-api/reference/get-users-saved-tracks
- Spotify API Reference - Get User's Top Items: https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
- Spotify API Reference - Get Recently Played: https://developer.spotify.com/documentation/web-api/reference/get-recently-played
- Spotify API Rate Limits: https://developer.spotify.com/documentation/web-api/concepts/rate-limits
- Spotify API Scopes: https://developer.spotify.com/documentation/web-api/concepts/scopes
- Spotify Feb 2026 Changelog: https://developer.spotify.com/documentation/web-api/references/changes/february-2026
- Comlink GitHub: https://github.com/GoogleChromeLabs/comlink
- NPM version verification: ran `npm view` on comlink (4.4.2), @tanstack/react-query (5.96.1), @spotify/web-api-ts-sdk (1.2.0) -- April 2, 2026

### Secondary (MEDIUM confidence)
- Web Workers with Comlink in Next.js: https://park.is/blog_posts/20250417_nextjs_comlink_examples/
- Next.js 16.2 Turbopack Worker Origin support: https://nextjs.org/blog/next-16-2-turbopack
- Spotify top tracks 50-item cap: https://community.spotify.com/t5/Spotify-for-Developers/Cannot-set-offset-to-above-50-for-a-user-s-favorite-tracks/td-p/4975196
- Spotify playlist pagination bug (Feb 2026): https://community.spotify.com/t5/Spotify-for-Developers/GET-me-playlists-pagination-broken-next-URL-points-to-removed/td-p/7339214
- Every Noise at Once (genre taxonomy reference): https://en.wikipedia.org/wiki/Every_Noise_at_Once

### Tertiary (LOW confidence)
- Exact dev-mode rate limit threshold (community reports 30-100 req/30s, not officially documented)
- Recently-played pagination depth (unclear if cursor goes back beyond ~50 recent items)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- only adding Comlink (well-established, 4.4.2 stable). No experimental dependencies.
- Architecture: HIGH -- API route proxy pattern is standard next-auth v5. Web Worker with Comlink is proven in Next.js 15/16.
- Genre normalization: MEDIUM -- keyword matching covers 90%+ of genres but the long tail requires iteration. Taxonomy will need tuning.
- Pitfalls: HIGH -- rate limits, missing scopes, pagination bugs are well-documented.
- Fetch orchestrator: MEDIUM -- custom implementation, but the logic is straightforward (~100 lines). Rate limit tuning may need iteration.

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (Spotify API changes are the volatility risk; check changelog monthly)
