# Technology Stack

**Project:** Spotify Universe
**Researched:** 2026-04-01

## Recommended Stack

### Core Rendering

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| three | ^0.183.0 | 3D rendering engine | Three.js r183 is the latest stable release (Feb 2026). Production-ready WebGPU support since r171. Massive ecosystem for galaxy/particle effects: InstancedMesh, Points, custom GLSL shaders. Better particle/space visualization ecosystem than Babylon.js -- more shader examples, community demos, and tutorials for exactly this kind of project. | HIGH |
| @react-three/fiber | ^9.5.0 | React renderer for Three.js | R3F v9 is stable and pairs with React 19. Declarative scene graph with re-usable components. Handles the Three.js lifecycle (resize, render loop, dispose) so we focus on scene logic, not boilerplate. Compatible with Three.js 0.183. | HIGH |
| @react-three/drei | ^10.7.0 | Three.js helpers for R3F | Provides Stars, OrbitControls, PositionalAudio, Text, Float, Html, and 50+ battle-tested abstractions. Saves weeks of custom implementation for camera controls, spatial audio, and text rendering. | HIGH |
| @react-three/postprocessing | ^3.0.4 | Post-processing effects | Bloom, god rays, chromatic aberration, vignette -- all critical for the neon synthwave aesthetic. Wraps the `postprocessing` library with R3F-friendly components. Last published ~1 year ago but stable and widely used. | HIGH |

### Application Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| next | ^16.2.0 | Full-stack React framework | Next.js 16 is the current stable (16.2.2 as of Apr 2026). Turbopack is now default bundler for both dev and build -- ~87% faster startup than 16.1. App Router provides server components for initial data fetching, API routes become Vercel serverless functions automatically, and built-in React 19.2 support. Perfect for Vercel deployment -- zero config. | HIGH |
| react | ^19.2.0 | UI framework | React 19.2 is the current stable, shipped with Next.js 16. Needed for R3F v9. View Transitions API for smooth page changes (hyperspace warp between views). Activity API for pausing off-screen components. | HIGH |
| react-dom | ^19.2.0 | React DOM renderer | Must match react version. Required by Next.js. | HIGH |
| typescript | ^5.8.0 | Type safety | TS 5.8 is the stable release compatible with Next.js 16. Do NOT use TS 6.0 here -- it is a "bridge release" and Next.js 16 officially supports 5.x. Type safety is critical for complex 3D scene state and Spotify data models. | HIGH |

### Spotify Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @spotify/web-api-ts-sdk | ^1.2.0 | Spotify API client | Official Spotify TypeScript SDK. Full type definitions for all endpoints. Handles auth token management, pagination, and error handling. Last published 2024 but actively used -- the Spotify API itself hasn't added new response fields requiring SDK updates. | MEDIUM |
| next-auth | 5.0.0-beta.30 | OAuth authentication | Auth.js v5 (next-auth@beta) is the standard for Next.js 16 App Router auth. Built-in Spotify provider. Handles OAuth code flow with server-side secret storage in Vercel env vars. Session management via JWT. Note: v5 is technically beta but has been in production use across thousands of apps for 18+ months. | MEDIUM |

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| zustand | ^5.0.12 | Client state management | Zustand v5 is stable (published 17 days ago). Minimal API, fine-grained subscriptions -- components re-render only when their selected state slice changes. Critical for 3D: galaxy state (star positions, colors) must not trigger unnecessary React re-renders. Same maintainers as R3F (pmndrs) -- designed to work together. | HIGH |
| @tanstack/react-query | ^5.96.0 | Server state / API caching | TanStack Query v5 is actively maintained (published yesterday). Handles Spotify API request caching, pagination of large libraries (5000+ tracks), background refetching, and error retry. Suspense support for progressive loading UI. | HIGH |

### Animation & UI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| motion | ^12.38.0 | UI animations (DOM overlays) | Motion v12 (formerly Framer Motion) -- 30M+ monthly npm downloads. Powers search bar fly-in, HUD transitions, menu animations. Import from `motion/react`. Hardware-accelerated. Do NOT use for 3D scene animations (use R3F useFrame for that). | HIGH |
| tailwindcss | ^4.1.0 | Utility CSS for UI overlays | Tailwind v4 uses Rust-based engine, zero-config with `@import "tailwindcss"`. Perfect for the minimal DOM UI layer: search bar, loading screen, HUD overlay. Canvas covers the viewport; Tailwind styles only the floating UI elements. | HIGH |

### Audio

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Web Audio API (built-in) | N/A | Spatial audio engine | Native browser API -- PannerNode with HRTF model provides realistic positional audio. R3F's `@react-three/drei` PositionalAudio component wraps this. Song previews get louder as camera approaches a star. Zero bundle size impact. | HIGH |

### Development Tools

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| leva | ^0.10.1 | Dev debug panel | GUI controls for tweaking 3D scene parameters (bloom intensity, star size, camera speed) in real-time during development. From the pmndrs ecosystem. Tree-shake out of production. | HIGH |
| eslint | ^10.1.0 | Linting | ESLint 10 with flat config. Catches bugs before runtime. | HIGH |
| prettier | ^3.8.0 | Formatting | Consistent code style. | HIGH |

### Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel | N/A (platform) | Hosting & deployment | Free tier handles this project's scale. Next.js API routes auto-deploy as serverless functions. Edge functions for low-latency auth redirects. Preview deployments on every PR. Zero infrastructure management. | HIGH |

## Spotify API Reality Check (CRITICAL)

This section documents the actual state of Spotify's API access as of April 2026. Getting this wrong would invalidate the entire project design.

### Development Mode Restrictions (Feb 2026)

- **Premium required:** The app owner must have an active Spotify Premium subscription
- **5 user limit:** Only 5 authorized users per Client ID in dev mode
- **1 Client ID:** Limited to one dev mode Client ID per developer account
- **If Premium lapses:** The app stops working entirely

### Endpoint Availability

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /me/tracks` | AVAILABLE | Paginated, max 50 per request. Core endpoint for library. |
| `GET /me/top/{type}` | AVAILABLE | Top tracks/artists. Provides ranking data for star sizing. |
| `GET /tracks/{id}` | AVAILABLE | Single track details. No popularity field (removed Feb 2026). |
| `GET /artists/{id}` | AVAILABLE | Single artist details (includes genres). No popularity/followers (removed Feb 2026). |
| `GET /me` | AVAILABLE | Current user profile. |
| `GET /me/following` | AVAILABLE | Followed artists. |
| `GET /me/playlists` | AVAILABLE | User's playlists. |
| Search | AVAILABLE | Max 10 results per query (reduced from 50). Default 5. |
| Player endpoints | AVAILABLE | All playback controls (requires Premium). |
| `GET /audio-features` | DEPRECATED | Returns 403 for apps created after Nov 27, 2024. Energy, danceability, valence, tempo data is NOT available for new apps. |
| `GET /audio-analysis` | DEPRECATED | Returns 403 for new apps. Beat detection, sections, timbre unavailable. |
| `GET /recommendations` | DEPRECATED | Returns 403 for new apps. |
| `GET /artists` (batch) | REMOVED | Must fetch artists one-by-one via `GET /artists/{id}`. |
| `GET /tracks` (batch) | REMOVED | Must fetch tracks one-by-one or paginate via `GET /me/tracks`. |
| `GET /artists/{id}/top-tracks` | REMOVED | Feb 2026. |
| `GET /browse/*` | REMOVED | No browsing/discovery. Not needed for this project. |
| `PUT /me/tracks` | REPLACED | Use `PUT /me/library` with Spotify URIs instead. |

**Confidence:** HIGH -- verified via official Spotify developer blog (Nov 2024, Feb 2026), community forum reports confirming 403 errors, and the endpoint reference page marking audio-features as deprecated.

### Audio Features: Impact on Project Design

The original PROJECT.md vision of "stars colored by energy level" is NOT achievable via the official Spotify API for new apps. This is the single most important constraint for the project.

**Alternative data mapping strategy (verified available):**
- **Star color:** Derived from genre family (rock = red, electronic = blue, hip-hop = purple, jazz = gold, etc.). More intuitive than energy mapping.
- **Star size:** Derived from top-track ranking (`GET /me/top/tracks` returns ranked order). Top 10 = supergiant, Top 50 = large, rest = standard.
- **Star brightness:** Derived from recency (recently saved tracks glow brighter).
- **Star position:** Genre clustering (artist genres from `GET /artists/{id}`).

### Audio Preview URLs (CRITICAL RISK)

**30-second preview URLs (`preview_url`) are NOT reliably available** for apps created after November 2024. The field often returns `null` in track objects.

**Workaround:** Scrape Spotify's public embed player HTML to extract preview URLs. No auth needed, just a track ID. This is fragile (depends on embed HTML structure staying stable) but widely used in the community.

**Better alternative for Premium users:** Use the Spotify Web Playback SDK to play full tracks with spatial positioning via Web Audio API. Limited to Premium subscribers but provides higher quality audio.

**Recommendation:** Design the spatial audio feature as a progressive enhancement, not a requirement. The galaxy visualization must work without audio. Implement the embed scraping approach in a serverless function that can be swapped later.

### Genre Data Strategy

Spotify tracks do NOT have genre fields. Genres are only available on Artist objects.

**Strategy:**
1. Fetch user's saved tracks via `GET /me/tracks` (paginated, 50 per page)
2. Extract unique artist IDs from tracks
3. Fetch each artist via `GET /artists/{id}` to get genre arrays
4. Normalize Spotify's 5000+ micro-genres into 15-25 macro-genre clusters
5. Map genres back to tracks through their artists
6. Use macro-genres for galaxy spatial clustering and star coloring

**Batching limitation:** The batch `GET /artists` endpoint was removed in Feb 2026. Must fetch artists individually. Rate limit is ~30 req/sec -- a library with 500 unique artists takes ~17 seconds. Cache aggressively with TanStack Query.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| 3D Engine | Three.js + R3F | Babylon.js | Babylon.js is a full game engine (great for Neon Dash) but overkill for data visualization. Three.js has a vastly larger ecosystem for particle/galaxy effects, more shader examples, and R3F provides React integration that Babylon.js lacks. |
| 3D Engine | Three.js + R3F | Raw Three.js (no React) | R3F eliminates render loop boilerplate, handles cleanup/disposal, and makes component composition natural. The UI overlays (search, HUD, menus) are React components -- using R3F keeps everything in one paradigm. |
| Framework | Next.js 16 | Vite + React SPA | Need serverless functions for OAuth (storing client secret). Need SSR for the loading/landing page (SEO, social sharing). Vite would require a separate backend. Next.js gives both in one deployable unit on Vercel. |
| Framework | Next.js 16 | Remix / TanStack Start | Vercel is the deployment target. Next.js + Vercel is the most battle-tested combination. No benefit from Remix's loader patterns for a 3D canvas app. |
| State | Zustand | Redux Toolkit | Redux adds ceremony (slices, reducers, dispatch) that Zustand eliminates. Zustand's subscribe-with-selector pattern is ideal for 3D where you need surgical re-render control. Same maintainers as R3F. |
| State | Zustand | Jotai | Jotai is atom-based (bottom-up). Galaxy state is a coherent store (top-down): star positions, camera state, selected star, audio state. Zustand's single-store model fits better. |
| Auth | next-auth v5 (beta) | Custom OAuth implementation | next-auth handles token refresh, session management, CSRF protection, and has a built-in Spotify provider. Rolling your own saves nothing and risks security holes. The beta label is misleading -- it's been production-stable for 18+ months. |
| Auth | next-auth v5 | Spotify PKCE (client-only) | PKCE can work client-side without a server secret, but: (1) tokens are exposed in the browser, (2) no server-side session management, (3) can't securely call Spotify API from serverless functions. Auth Code flow with server secret is more secure. |
| Animation | Motion (Framer Motion) | CSS animations / Tailwind transitions | Motion provides spring physics, layout animations, and gesture handling. CSS keyframes can't match the fluid transitions needed for the search/menu UI. |
| CSS | Tailwind v4 | CSS Modules / styled-components | Minimal DOM UI (search bar, HUD, menus) doesn't justify CSS-in-JS runtime cost. Tailwind is zero-runtime. CSS Modules work but are slower to iterate with. |
| Audio | Web Audio API (native) | Howler.js | Howler.js adds 10KB for features we don't need. The Web Audio API's PannerNode is what provides spatial positioning, and Drei's PositionalAudio already wraps it. |
| Bundler | Turbopack (via Next.js 16) | Webpack / standalone Vite | Turbopack is now default in Next.js 16 -- 87% faster startup. No configuration needed. Using standalone Vite would mean losing Next.js features (SSR, API routes, Vercel integration). |
| Spotify Client | @spotify/web-api-ts-sdk | spotify-web-api-node | spotify-web-api-node is unmaintained and lacks TypeScript types. The official Spotify SDK is maintained by Spotify, has full types, and handles auth flows. |

## NOT Using (Explicit Exclusions)

| Technology | Why Not | What to Do Instead |
|------------|---------|-------------------|
| WebGPU Renderer | Three.js WebGPU renderer is production-ready (since r171, Safari 26 support) but the R3F ecosystem (@react-three/postprocessing, many Drei helpers) still targets WebGLRenderer. R3F v10 (alpha) will make WebGPU first-class. Stick with WebGL for now -- 5000 instanced stars is trivial for WebGL. Upgrade to WebGPU when R3F v10 goes stable. | Use Three.js WebGLRenderer (R3F default). |
| Physics engines (Cannon, Rapier, Havok) | No physics needed. Stars don't collide. Camera movement is scripted, not simulated. | Simple vector math for camera fly-through. |
| D3.js | D3 is for 2D SVG/Canvas data visualization. We're in 3D WebGL. D3's force-directed layout algorithm could theoretically position stars, but it's simpler to write a custom clustering algorithm in TypeScript. | Custom genre clustering algorithm using artist genre data. |
| Socket.io / WebSockets | No real-time multiplayer or live updates. Galaxy is generated once from user's library. | Standard REST via Spotify API + TanStack Query caching. |
| Prisma / any database | No persistent data storage needed. User's data comes from Spotify on each session. Galaxy layout is computed client-side. | Spotify API is the only data source. Session state lives in next-auth JWT. |
| @react-three/rapier | Physics wrapper for R3F. Unnecessary -- no rigid body dynamics, no collisions. | N/A |
| Storybook | Overkill for a 3D project with minimal DOM UI. 3D components can't be meaningfully previewed in Storybook. | Use Leva panels + dev scenes for component testing. |
| Jest | Next.js 16 ships with built-in testing support. For a visualization project, manual testing in the browser is more valuable than unit tests for shader/rendering code. | Vitest (if needed) for utility functions. Browser-based testing for 3D. |

## Package Architecture

### Dependency Graph

```
next (framework)
  +-- react, react-dom (UI)
  +-- next-auth (auth + Spotify OAuth)
  +-- @tanstack/react-query (API state)
  +-- zustand (client state)
  +-- motion (DOM animations)
  +-- tailwindcss (styling)
  +-- three (3D engine)
       +-- @react-three/fiber (React bridge)
       +-- @react-three/drei (helpers)
       +-- @react-three/postprocessing (effects)
  +-- @spotify/web-api-ts-sdk (Spotify client)
```

### Bundle Strategy

Next.js 16 with Turbopack handles code splitting automatically:
- **Initial load:** Landing page + auth UI (~100KB gzipped)
- **Galaxy chunk:** Three.js + R3F + shaders (lazy-loaded after auth, ~300KB gzipped)
- **Spotify data:** Fetched progressively after galaxy scene mounts
- **Postprocessing:** Loaded after first render, enables bloom/glow effects

Three.js supports tree-shaking with ES module imports. Import only what you use:
```typescript
// Good: tree-shakeable
import { InstancedMesh, BufferGeometry, ShaderMaterial } from 'three'

// Bad: imports everything
import * as THREE from 'three'
```

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Key decisions:
- `target: "ES2022"` -- modern browsers, enables native class fields
- `moduleResolution: "bundler"` -- correct for Next.js 16 + Turbopack
- `strict: true` -- catches type errors in complex 3D state management
- `skipLibCheck: true` -- avoids slow type-checking of Three.js internals

## Installation

```bash
# Core dependencies
npm install next@latest react@latest react-dom@latest
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
npm install @spotify/web-api-ts-sdk
npm install next-auth@beta
npm install zustand @tanstack/react-query
npm install motion
npm install tailwindcss @tailwindcss/postcss

# Dev dependencies
npm install -D typescript @types/react @types/react-dom @types/three
npm install -D eslint @eslint/js typescript-eslint
npm install -D prettier eslint-config-prettier
npm install -D leva
```

## Version Pinning Strategy

Use `^` (caret) ranges for all packages -- allows patches and minor versions automatically. Three.js releases monthly (r181, r182, r183...) and R3F tracks closely. Pinning exact versions causes drift.

Exception: `next-auth` is installed as `next-auth@beta` which resolves to the latest v5 beta. Pin to a specific beta version after initial setup to avoid surprise breaking changes:
```bash
npm install next-auth@5.0.0-beta.30
```

## Sources

- Three.js releases: https://github.com/mrdoob/three.js/releases
- Three.js r183 release: https://github.com/mrdoob/three.js/releases/tag/r183
- Three.js 2026 overview: https://www.utsubo.com/blog/threejs-2026-what-changed
- R3F v9 docs: https://r3f.docs.pmnd.rs/getting-started/introduction
- R3F npm: https://www.npmjs.com/package/@react-three/fiber
- Drei PositionalAudio: https://drei.docs.pmnd.rs/abstractions/positional-audio
- @react-three/postprocessing: https://www.npmjs.com/package/@react-three/postprocessing
- Next.js 16 announcement: https://nextjs.org/blog/next-16
- Next.js 16.2 announcement: https://nextjs.org/blog/next-16-2
- Zustand npm: https://www.npmjs.com/package/zustand
- TanStack Query npm: https://www.npmjs.com/package/@tanstack/react-query
- Motion (Framer Motion) npm: https://www.npmjs.com/package/framer-motion
- Motion docs: https://motion.dev/docs/react
- Spotify TS SDK: https://github.com/spotify/spotify-web-api-ts-sdk
- Spotify Feb 2026 dev mode changes: https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security
- Spotify Feb 2026 migration guide: https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide
- Spotify Feb 2026 changelog: https://developer.spotify.com/documentation/web-api/references/changes/february-2026
- Spotify Nov 2024 API changes: https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api
- Spotify audio features deprecation: https://developer.spotify.com/documentation/web-api/reference/get-audio-features
- Spotify audio features 403 (community): https://community.spotify.com/t5/Spotify-for-Developers/Web-API-Get-Track-s-Audio-Features-403-error/td-p/6654507
- Spotify preview URL workaround: https://github.com/rexdotsh/spotify-preview-url-workaround
- Spotify OAuth PKCE flow: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
- Spotify authorization: https://developer.spotify.com/documentation/web-api/concepts/authorization
- Auth.js v5 Spotify provider: https://authjs.dev/reference/core/providers/spotify
- Auth.js v5 with Next.js 16: https://dev.to/huangyongshan46a11y/authjs-v5-with-nextjs-16-the-complete-authentication-guide-2026-2lg
- Vite 8 announcement: https://vite.dev/blog/announcing-vite8
- Three.js InstancedMesh docs: https://threejs.org/docs/pages/InstancedMesh.html
- Three.js performance tips: https://www.utsubo.com/blog/threejs-best-practices-100-tips
- WebGPU galaxy simulation: https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders
- Web Audio API MDN: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics
- Vercel serverless guide: https://vercel.com/docs/functions
- Leva npm: https://www.npmjs.com/package/leva
