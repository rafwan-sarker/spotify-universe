# Phase 1: Auth & Demo Mode - Research

**Researched:** 2026-04-01
**Domain:** Spotify OAuth authentication + Next.js 16 App Router + R3F demo scene
**Confidence:** HIGH

## Summary

Phase 1 establishes the project foundation: a Next.js 16 App Router application with Spotify OAuth via Auth.js v5, session persistence via JWT (with Spotify token refresh), and a demo galaxy visible to unauthenticated visitors. This is a greenfield project with no existing code -- the entire scaffold must be created.

The critical technical challenge is the Auth.js v5 + Spotify token refresh pattern. Auth.js v5 stores OAuth tokens in JWTs via the `jwt` callback and makes them available via the `session` callback. Spotify access tokens expire after 1 hour. The jwt callback must check expiration and call Spotify's `/api/token` endpoint to refresh, storing the new access token and (possibly new) refresh token. A known issue with Auth.js v5 is that the jwt callback fires multiple times per render, which can invalidate refresh tokens (Spotify revokes them after a single use). The solution is a guard that only refreshes when truly expired, with a buffer window.

The demo galaxy requires a static JSON file of ~200 curated songs with pre-computed 3D positions, colors, and sizes -- bundled with the app, no API calls needed. The R3F Canvas must be dynamically imported with `ssr: false` to avoid Next.js server-side rendering errors (Three.js requires browser WebGL APIs). The demo scene uses a simple InstancedMesh with ~200 stars plus a background Points starfield, with an auto-orbiting camera via OrbitControls.

**Primary recommendation:** Use Auth.js v5 with the Spotify provider, JWT session strategy, and a carefully guarded token refresh in the jwt callback. Keep the Spotify access token server-side only (never expose to client). Use Zustand for client auth state (isLoggedIn, user profile), not for raw tokens.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** The demo galaxy runs immediately as the first screen -- no splash page, no login gate. The product IS the landing page.
- **D-02:** Camera auto-pilots on a slow cinematic orbit through the demo galaxy. User can take control at any time.
- **D-03:** A minimal neon-styled bottom banner shows: "This is a demo -- Connect Spotify to see YOUR galaxy" -- unobtrusive, matches synthwave aesthetic.
- **D-04:** After connecting Spotify, a clean warp/transition effect plays, then the user's real galaxy builds from scratch (no morphing from demo).
- **D-05:** Demo is powered by ~200 curated real songs with recognizable artists across 5-6 major genres (Pop, Rock, Hip-Hop, Electronic, R&B, Indie).
- **D-06:** Demo galaxy is view-only -- visitors can orbit/fly around but cannot interact with individual stars. This teases the full experience.
- **D-07:** Demo data is a static JSON file bundled with the app -- no API calls needed for the demo.
- **D-08:** If OAuth fails or user denies permissions, show a brief error page explaining what went wrong with a "Try Again" button.
- **D-09:** Token refresh happens silently in the background -- user never notices. If refresh fails, show a gentle "Session expired -- reconnect" banner.
- **D-10:** Small profile/avatar icon in top-right corner. Click reveals logout option.
- **D-11:** After logout, warp transition plays and user returns to the demo galaxy with the bottom banner.
- **D-12:** App shows the dark canvas immediately (instant skeleton) while JS/3D engine loads -- no loading spinner.
- **D-13:** Demo galaxy appears fully formed in one reveal (all 200 stars at once) -- progressive loading is for real libraries in Phase 2+.

### Claude's Discretion
- Token lifecycle implementation details (refresh timing, retry strategy)
- Spotify API scopes (minimal set needed for library access)
- Project scaffolding decisions (app router structure, folder layout, styling approach)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can log in with Spotify OAuth (server-side via Vercel functions) | Auth.js v5 Spotify provider with Authorization Code Flow. JWT session strategy stores tokens server-side. Route handler at `/api/auth/[...nextauth]/route.ts`. |
| AUTH-02 | User session persists across browser refresh | Auth.js v5 JWT stored in encrypted httpOnly cookie. Token refresh in jwt callback with expiry guard. Session persists until refresh token is revoked or user logs out. |
| AUTH-03 | Demo mode with pre-loaded sample galaxy for unauthenticated visitors | Static JSON bundled in `/src/data/demo-galaxy.json`. R3F Canvas with InstancedMesh renders ~200 stars. No auth required -- default landing page state. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Tech Stack:** Three.js + TypeScript + React via Next.js 16 + Vercel
- **Auth:** Spotify OAuth with server-side secret (Vercel functions)
- **Assets:** No paid 3D assets -- all procedural/shader-generated visuals
- **Performance:** 60fps on modern desktop browsers
- **GSD Workflow:** All work must go through GSD commands

## Standard Stack

### Core (Phase 1 Scope)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^16.2.0 | Full-stack framework | App Router + Turbopack bundler + serverless API routes on Vercel. Verified: 16.2.2 current. |
| react | ^19.2.0 | UI framework | Required by Next.js 16 and R3F v9. Verified: 19.2.4 current. |
| react-dom | ^19.2.0 | React DOM renderer | Must match react version. Verified: 19.2.4. |
| next-auth | 5.0.0-beta.30 | OAuth authentication | Auth.js v5 with built-in Spotify provider. JWT session strategy. Handles code flow, CSRF, refresh. Production-stable despite "beta" label (18+ months in production). Verified: 5.0.0-beta.30 is latest. |
| three | ^0.183.0 | 3D rendering engine | Required for demo galaxy star field. Verified: 0.183.2 current. |
| @react-three/fiber | ^9.5.0 | React renderer for Three.js | Declarative R3F components, render loop management, cleanup. Verified: 9.5.0 current. |
| @react-three/drei | ^10.7.0 | Three.js helpers | OrbitControls for demo camera, Stars background helper. Verified: 10.7.7 current. |
| zustand | ^5.0.12 | Client state management | Auth state (isLoggedIn, user), app mode (demo vs authenticated). Verified: 5.0.12 current. |
| tailwindcss | ^4.1.0 | Utility CSS | Neon-styled UI overlays (banner, profile menu, error page). Verified: 4.2.2 current. |
| typescript | ^5.8.0 | Type safety | Compatible with Next.js 16. Do NOT use TS 6.0 -- Next.js 16 supports 5.x. Verified: 5.8 stable. |

### Supporting (Phase 1 Scope)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tailwindcss/postcss | ^4.1.0 | PostCSS integration for Tailwind v4 | Required for Next.js CSS pipeline. Verified: 4.2.2. |
| motion | ^12.38.0 | DOM animations | Warp transition after login, banner fade-in/out, profile menu reveal. Verified: 12.38.0. |
| @types/three | latest | Three.js TypeScript types | Required for TypeScript support with Three.js. |
| @types/react | latest | React TypeScript types | Required by TypeScript. |
| @types/react-dom | latest | React DOM TypeScript types | Required by TypeScript. |
| eslint | ^10.1.0 | Linting | Code quality from day one. |
| prettier | ^3.8.0 | Formatting | Consistent style. |

### NOT Using in Phase 1

| Library | Why Deferred |
|---------|-------------|
| @react-three/postprocessing | Bloom/glow is Phase 5. Demo galaxy uses basic emissive materials only. |
| @tanstack/react-query | No Spotify API data fetching in Phase 1. Demo uses static JSON. |
| @spotify/web-api-ts-sdk | Phase 1 only needs OAuth login, not API data fetching. The SDK is useful in Phase 2+ when fetching tracks/artists. Auth.js handles OAuth itself. |
| leva | Dev debug panel not needed until 3D tuning in Phase 3+. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-auth v5 | Custom OAuth implementation | Custom saves no time and risks security holes. next-auth has CSRF protection, session encryption, built-in Spotify provider. |
| next-auth v5 | Spotify PKCE (client-only) | PKCE exposes tokens in the browser. No server-side session. Can't proxy API calls securely. |
| Zustand | React Context | Context triggers re-renders on any state change. Zustand has selectors for surgical updates -- critical for 3D performance later. |

**Installation:**
```bash
# Create Next.js 16 project
npx create-next-app@latest spotify-universe --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Core dependencies
npm install next-auth@beta three @react-three/fiber @react-three/drei zustand motion

# Dev dependencies
npm install -D @types/three prettier eslint-config-prettier
```

## Architecture Patterns

### Recommended Project Structure (Phase 1)
```
src/
├── app/
│   ├── layout.tsx                   # Root layout (dark bg, Tailwind, providers)
│   ├── page.tsx                     # Landing page -- renders galaxy + demo banner
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts         # Auth.js route handler (GET + POST)
│   ├── auth/
│   │   ├── error/
│   │   │   └── page.tsx             # OAuth error page (D-08)
│   │   └── signout/
│   │       └── page.tsx             # Post-logout redirect (optional)
│   └── globals.css                  # Tailwind @import + custom neon vars
├── auth.ts                          # Auth.js v5 config (providers, callbacks)
├── components/
│   ├── canvas/
│   │   ├── GalaxyScene.tsx          # Main R3F scene (demo + real galaxy)
│   │   ├── DemoGalaxy.tsx           # InstancedMesh for ~200 demo stars
│   │   ├── BackgroundStars.tsx      # Points starfield background
│   │   └── AutoOrbitCamera.tsx      # Cinematic auto-orbit camera (D-02)
│   ├── ui/
│   │   ├── DemoBanner.tsx           # Bottom neon banner (D-03)
│   │   ├── ProfileMenu.tsx          # Top-right avatar + logout (D-10)
│   │   ├── ConnectSpotifyButton.tsx # "Connect Spotify" CTA
│   │   └── WarpTransition.tsx       # Transition effect (D-04, D-11)
│   └── providers/
│       └── Providers.tsx            # SessionProvider + QueryClientProvider
├── lib/
│   ├── store.ts                     # Zustand store (auth, appMode)
│   └── spotify-scopes.ts            # OAuth scope constants
├── data/
│   └── demo-galaxy.json             # Static ~200 song demo data
└── types/
    └── next-auth.d.ts               # Auth.js type extensions
```

### Pattern 1: Auth.js v5 Configuration with Spotify Token Refresh

**What:** Central auth configuration that handles OAuth login, JWT storage, and silent token refresh.
**When to use:** Always -- this is the single auth entry point.
**Example:**

```typescript
// src/auth.ts
import NextAuth from "next-auth"
import Spotify from "next-auth/providers/spotify"

const SPOTIFY_SCOPES = [
  "user-read-email",       // User profile email
  "user-read-private",     // User profile details + search
  "user-library-read",     // Saved tracks (Phase 2)
  "user-top-read",         // Top tracks/artists (Phase 2)
].join(" ")

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: { scope: SPOTIFY_SCOPES },
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    error: "/auth/error",  // Custom error page (D-08)
  },
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign-in: persist OAuth tokens
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at! * 1000, // Convert to ms
        }
      }

      // Return token if still valid (5-minute buffer)
      if (Date.now() < (token.expiresAt as number) - 5 * 60 * 1000) {
        return token
      }

      // Token expired -- refresh silently
      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString("base64")}`,
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
        })

        const refreshed = await response.json()

        if (!response.ok) throw refreshed

        return {
          ...token,
          accessToken: refreshed.access_token,
          expiresAt: Date.now() + refreshed.expires_in * 1000,
          // Spotify may return a new refresh token
          refreshToken: refreshed.refresh_token ?? token.refreshToken,
        }
      } catch (error) {
        console.error("Token refresh failed:", error)
        return { ...token, error: "RefreshTokenError" }
      }
    },

    async session({ session, token }) {
      // Pass user info to client -- NOT the raw tokens
      session.user.id = token.sub!
      // Signal to client if refresh failed
      if (token.error === "RefreshTokenError") {
        session.error = "RefreshTokenError"
      }
      return session
    },
  },
})
```

**Source:** Auth.js v5 migration guide, Spotify OAuth docs, GitHub Discussion #11406 (token refresh fix)

### Pattern 2: R3F Canvas with Next.js App Router (SSR-safe)

**What:** Dynamically import the R3F Canvas to prevent SSR errors from Three.js browser APIs.
**When to use:** Every page that renders 3D content.
**Example:**

```typescript
// src/app/page.tsx (Server Component)
import dynamic from "next/dynamic"
import { DemoBanner } from "@/components/ui/DemoBanner"
import { ProfileMenu } from "@/components/ui/ProfileMenu"
import { auth } from "@/auth"

const GalaxyScene = dynamic(
  () => import("@/components/canvas/GalaxyScene"),
  { ssr: false }
)

export default async function HomePage() {
  const session = await auth()

  return (
    <main className="relative h-screen w-screen bg-black overflow-hidden">
      {/* 3D Canvas -- full viewport, loads client-side only */}
      <GalaxyScene isAuthenticated={!!session} />

      {/* DOM overlays */}
      {!session && <DemoBanner />}
      {session && <ProfileMenu user={session.user} />}
    </main>
  )
}
```

```typescript
// src/components/canvas/GalaxyScene.tsx
"use client"

import { Canvas } from "@react-three/fiber"
import { DemoGalaxy } from "./DemoGalaxy"
import { BackgroundStars } from "./BackgroundStars"
import { AutoOrbitCamera } from "./AutoOrbitCamera"

interface GalaxySceneProps {
  isAuthenticated: boolean
}

export default function GalaxyScene({ isAuthenticated }: GalaxySceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 50, 100], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: "#000005" }}
    >
      <AutoOrbitCamera />
      <BackgroundStars />
      {!isAuthenticated && <DemoGalaxy />}
      {/* Phase 2+: {isAuthenticated && <UserGalaxy />} */}
    </Canvas>
  )
}
```

### Pattern 3: Zustand Auth Store

**What:** Client-side state for auth status, separate from Auth.js session.
**When to use:** When React components need auth awareness without server round-trips.
**Example:**

```typescript
// src/lib/store.ts
import { create } from "zustand"

type AppMode = "demo" | "authenticated" | "transitioning"

interface AppStore {
  mode: AppMode
  setMode: (mode: AppMode) => void
  user: { name: string; image: string | null } | null
  setUser: (user: AppStore["user"]) => void
}

export const useAppStore = create<AppStore>((set) => ({
  mode: "demo",
  setMode: (mode) => set({ mode }),
  user: null,
  setUser: (user) => set({ user }),
}))
```

### Pattern 4: Demo Galaxy Static Data Structure

**What:** Pre-computed star data for the demo galaxy, bundled as a static JSON file.
**When to use:** Landing page for unauthenticated visitors.
**Example structure:**

```typescript
// src/data/demo-galaxy.json (abbreviated)
{
  "version": 1,
  "description": "Demo galaxy with ~200 curated songs across 6 genres",
  "genres": [
    { "id": "pop", "name": "Pop", "color": [1.0, 0.4, 0.7], "centroid": [30, 0, 10] },
    { "id": "rock", "name": "Rock", "color": [0.9, 0.2, 0.2], "centroid": [-25, 5, -20] },
    { "id": "hiphop", "name": "Hip-Hop", "color": [0.6, 0.2, 0.9], "centroid": [0, -15, 30] },
    { "id": "electronic", "name": "Electronic", "color": [0.1, 0.8, 0.9], "centroid": [-10, 20, -15] },
    { "id": "rnb", "name": "R&B", "color": [0.9, 0.6, 0.1], "centroid": [20, -10, -25] },
    { "id": "indie", "name": "Indie", "color": [0.4, 0.9, 0.4], "centroid": [-20, -5, 25] }
  ],
  "stars": [
    {
      "id": "demo-001",
      "name": "Blinding Lights",
      "artist": "The Weeknd",
      "genre": "pop",
      "position": [32.1, 1.4, 11.8],
      "size": 1.5,
      "brightness": 0.9
    }
    // ... ~200 entries
  ]
}
```

### Anti-Patterns to Avoid

- **Storing Spotify tokens in localStorage:** XSS-exploitable. Auth.js v5 stores them in encrypted httpOnly JWT cookies automatically.
- **Calling Spotify API from the browser:** CORS blocks token exchange. All Spotify API calls must proxy through serverless functions (via Auth.js or custom API routes).
- **Using `useState` for 3D animation values:** Causes React re-renders at 60fps. Use `useRef` + `useFrame` for all per-frame mutations.
- **Server-rendering the Canvas:** Three.js requires WebGL (browser-only). Always use `dynamic(() => import(...), { ssr: false })`.
- **Using `response_type=token` (Implicit Grant):** Deprecated by Spotify since November 2025. Use `response_type=code` (Authorization Code Flow).
- **Exposing Spotify access token to client session:** The session callback should pass user profile info only, not raw tokens. Tokens stay server-side in the JWT.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth flow | Custom redirect/token/refresh logic | Auth.js v5 Spotify provider | Handles CSRF, code exchange, encrypted JWT, session management. Rolling your own risks security holes. |
| Token refresh | Manual refresh timer + fetch calls | Auth.js v5 jwt callback | Built-in lifecycle. The jwt callback fires on every session check -- add refresh logic there, not in a separate timer. |
| Session persistence | Cookie management code | Auth.js v5 JWT strategy | Encrypted httpOnly cookies managed automatically. Survive browser refresh. |
| 3D camera controls | Manual mouse/keyboard handlers | Drei OrbitControls (demo) | OrbitControls handles pointer lock, damping, zoom limits, touch support. |
| Star field background | Custom particle system | Drei Stars component | Pre-built randomized star background with configurable density and size. |
| CSS utility system | Custom CSS classes for neon theme | Tailwind v4 + CSS variables | Utility-first with custom `--neon-*` CSS variables for theme consistency. |
| Route protection | Manual session checks in every page | Auth.js v5 `auth()` in server components | `const session = await auth()` works in server components, API routes, middleware. |

## Common Pitfalls

### Pitfall 1: Auth.js v5 jwt Callback Fires Multiple Times Per Render
**What goes wrong:** The jwt callback in Auth.js v5 can fire 3-6 times during a single page render (server component render, middleware check, etc.). If each invocation attempts a token refresh, the first one invalidates the refresh token and subsequent ones fail with "invalid_grant."
**Why it happens:** Auth.js checks the session at multiple points in the Next.js request lifecycle. Spotify revokes refresh tokens after a single use.
**How to avoid:** Guard the refresh with a time check: only refresh if the current time exceeds `expiresAt - buffer`. Use a 5-minute buffer. If the token is still valid, return it immediately without touching the refresh endpoint.
**Warning signs:** Console errors with "invalid_grant" or "Refresh token revoked" during page loads.

### Pitfall 2: Three.js Canvas Breaks Server-Side Rendering
**What goes wrong:** Importing `@react-three/fiber`'s Canvas in a server component crashes with "window is not defined" or "document is not defined."
**Why it happens:** Three.js and R3F require browser WebGL APIs that don't exist in Node.js.
**How to avoid:** Use `next/dynamic` with `{ ssr: false }` for any component that renders the Canvas. Keep the page.tsx as a server component; dynamically import the Canvas wrapper.
**Warning signs:** Build failures or hydration errors referencing window/document/WebGL.

### Pitfall 3: CORS Errors on Spotify Token Exchange
**What goes wrong:** Attempting to call `https://accounts.spotify.com/api/token` from browser JavaScript fails with CORS errors.
**Why it happens:** Spotify's token endpoint does not set CORS headers for browser origins.
**How to avoid:** Auth.js v5 handles the code-for-token exchange server-side in its route handler. Do not implement manual client-side token exchange.
**Warning signs:** Network tab shows preflight OPTIONS request failing to accounts.spotify.com.

### Pitfall 4: Missing Spotify Scopes Block Future Phases
**What goes wrong:** If Phase 1 requests only `user-read-email`, future phases cannot fetch the user's library without re-authenticating.
**Why it happens:** Spotify scopes are set at authorization time. Adding scopes later requires the user to re-authorize.
**How to avoid:** Request ALL needed scopes upfront in Phase 1: `user-read-email`, `user-read-private`, `user-library-read`, `user-top-read`. The user sees all permissions at once during first login.
**Warning signs:** 403 errors when calling /me/tracks or /me/top in Phase 2.

### Pitfall 5: Demo Galaxy Causes Layout Shift on Auth State Change
**What goes wrong:** When a user logs in, the demo galaxy unmounts and the real galaxy mounts, causing a visual flash or layout shift.
**Why it happens:** Conditional rendering (`{isDemo ? <DemoGalaxy /> : <UserGalaxy />}`) unmounts one component tree and mounts another.
**How to avoid:** In Phase 1, use the `mode` field in Zustand store to trigger a warp transition animation (D-04) that covers the swap. During the transition, both can coexist momentarily, then demo unmounts after the transition completes.
**Warning signs:** Black flash or canvas flicker when auth state changes.

### Pitfall 6: Spotify Developer App Configuration
**What goes wrong:** OAuth redirects fail because the redirect URI in the Spotify Developer Dashboard doesn't match the one in the app.
**Why it happens:** Spotify requires EXACT redirect URI matching -- including trailing slashes and protocol.
**How to avoid:** Register both `http://localhost:3000/api/auth/callback/spotify` (local dev) and `https://your-domain.vercel.app/api/auth/callback/spotify` (production) in the Spotify Dashboard. Auth.js v5 uses the path `/api/auth/callback/spotify` by default.
**Warning signs:** "INVALID_CLIENT: Invalid redirect URI" error after clicking "Connect Spotify."

## Spotify OAuth Scopes (Claude's Discretion)

**Recommended minimal set for v1 (request all in Phase 1):**

| Scope | Needed In | Unlocks |
|-------|-----------|---------|
| `user-read-email` | Phase 1 | User profile email for display |
| `user-read-private` | Phase 1 | User profile details (name, avatar, subscription type) + search |
| `user-library-read` | Phase 2 | `GET /me/tracks` -- saved songs library |
| `user-top-read` | Phase 2 | `GET /me/top/tracks` and `GET /me/top/artists` -- ranking data for star sizing |

**Not requesting:**
- `streaming` -- Only needed for Web Playback SDK (Premium users, deferred to v2+)
- `user-modify-playback-state` -- No playback control in v1
- `playlist-read-private` -- Playlists are out of scope for v1

**Why request Phase 2 scopes in Phase 1:** Changing scopes later forces re-authorization. Better UX to ask once.

## Token Lifecycle (Claude's Discretion)

**Recommended refresh strategy:**

1. Spotify access tokens expire in 3600 seconds (1 hour)
2. Auth.js jwt callback checks `Date.now() < expiresAt - 300000` (5-minute buffer)
3. If expired, call Spotify `/api/token` with refresh_token
4. Store new access_token + expiresAt. If Spotify returns a new refresh_token, store that too.
5. If refresh fails, set `token.error = "RefreshTokenError"`
6. Session callback forwards `error` to client
7. Client checks `session.error === "RefreshTokenError"` and shows "Session expired -- reconnect" banner (D-09)
8. Clicking the banner triggers `signIn("spotify")` which re-authorizes from scratch

**Retry strategy:** No retry on refresh failure. Spotify's "invalid_grant" means the refresh token is revoked -- retrying won't help. Prompt re-auth instead.

## Project Scaffolding (Claude's Discretion)

**Recommended approach:**

1. Use `npx create-next-app@latest` with `--typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
2. Next.js 16 ships with Turbopack by default -- no bundler configuration needed
3. Use `src/` directory to separate application code from root config files
4. Tailwind v4 uses `@import "tailwindcss"` in globals.css -- zero config beyond PostCSS plugin
5. Custom CSS variables for neon theme: `--neon-pink`, `--neon-cyan`, `--neon-purple` defined in globals.css
6. ESLint flat config (eslint.config.mjs) -- Next.js 16 scaffolds this automatically
7. Add `prettier` + `eslint-config-prettier` for formatting

**Environment variables needed (.env.local):**
```
AUTH_SECRET=<random 32+ char string>
SPOTIFY_CLIENT_ID=<from Spotify Developer Dashboard>
SPOTIFY_CLIENT_SECRET=<from Spotify Developer Dashboard>
```

## Code Examples

### InstancedMesh Demo Galaxy (verified R3F pattern)

```typescript
// src/components/canvas/DemoGalaxy.tsx
"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import demoData from "@/data/demo-galaxy.json"

const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()

export function DemoGalaxy() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = demoData.stars.length

  // Pre-compute colors array
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3)
    const genreColorMap = Object.fromEntries(
      demoData.genres.map((g) => [g.id, g.color])
    )
    demoData.stars.forEach((star, i) => {
      const [r, g, b] = genreColorMap[star.genre] ?? [1, 1, 1]
      tempColor.setRGB(r, g, b)
      tempColor.toArray(arr, i * 3)
    })
    return arr
  }, [count])

  // Set initial positions and scales
  useMemo(() => {
    if (!meshRef.current) return
    demoData.stars.forEach((star, i) => {
      tempObject.position.set(...(star.position as [number, number, number]))
      tempObject.scale.setScalar(star.size)
      tempObject.updateMatrix()
      meshRef.current!.setMatrixAt(i, tempObject.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <meshBasicMaterial
        toneMapped={false}
        vertexColors
      />
      <instancedBufferAttribute
        attach="geometry-attributes-color"
        args={[colors, 3]}
      />
    </instancedMesh>
  )
}
```

**Source:** R3F InstancedMesh discussion #761, R3F docs, Three.js InstancedMesh API

### Auto-Orbit Camera (cinematic demo orbit)

```typescript
// src/components/canvas/AutoOrbitCamera.tsx
"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"

export function AutoOrbitCamera() {
  const controlsRef = useRef<OrbitControlsImpl>(null)

  useFrame(() => {
    if (controlsRef.current) {
      // Slow auto-rotation for cinematic orbit
      controlsRef.current.autoRotate = true
      controlsRef.current.autoRotateSpeed = 0.3
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate
      autoRotateSpeed={0.3}
      enableZoom={true}
      enablePan={false}
      minDistance={30}
      maxDistance={200}
      dampingFactor={0.05}
      enableDamping
    />
  )
}
```

### Auth.js Type Extensions

```typescript
// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
    }
    error?: "RefreshTokenError"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    error?: "RefreshTokenError"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-auth v4 `getServerSession()` | Auth.js v5 `auth()` universal function | v5 beta (2024) | Single function works in server components, API routes, middleware |
| `response_type=token` (Implicit Grant) | `response_type=code` (Authorization Code Flow) | Spotify Nov 2025 | Implicit Grant fully deprecated. Must use code flow. |
| `next.config.js` | `next.config.ts` | Next.js 16 | TypeScript config file is now default |
| Webpack bundler | Turbopack (default) | Next.js 16 | ~87% faster dev startup. No manual configuration. |
| Tailwind v3 `@tailwind base/components/utilities` | Tailwind v4 `@import "tailwindcss"` | Tailwind v4 (2025) | Simplified CSS import, Rust-based engine, zero-config. |
| `middleware.ts` | `middleware.ts` (unchanged in Next.js 16) | N/A | Note: Some sources mention `proxy.ts` but this is for a specific use case. Standard middleware.ts still works for auth. |

## Open Questions

1. **InstancedMesh vs Points for demo stars**
   - What we know: InstancedMesh supports raycasting (click detection) but demo is view-only (D-06). Points is cheaper for non-interactive particles.
   - What's unclear: Should the demo use Points (simpler, no interaction) or InstancedMesh (matches real galaxy architecture from Phase 3)?
   - Recommendation: Use InstancedMesh to establish the pattern early. The 200-star count is trivial for either approach, and using the same primitive as the real galaxy means less code divergence later.

2. **Demo data curation**
   - What we know: Need ~200 real songs across Pop, Rock, Hip-Hop, Electronic, R&B, Indie (D-05).
   - What's unclear: Should demo data include real Spotify track IDs for potential future linking, or purely display-only names/artists?
   - Recommendation: Include real artist and track names for authenticity, but no Spotify IDs (the demo has no API interaction). Pre-compute positions using the same genre clustering algorithm that Phase 2 will use, so the demo looks like a real galaxy.

3. **Warp transition implementation for Phase 1 scope**
   - What we know: D-04 requires a "clean warp/transition effect" after login, and D-11 requires the same after logout.
   - What's unclear: How elaborate should the transition be in Phase 1? Full star-streak warp (Phase 4/5 feature) or a simpler fade/zoom?
   - Recommendation: Phase 1 implements a simple CSS/Motion-based fullscreen fade-to-black transition. The full star-streak warp is a Phase 4/5 concern. A clean black fade is sufficient to create the "reset" moment (D-04).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js runtime | Yes | v24.13.0 | -- |
| npm | Package management | Yes | 11.6.2 | -- |
| git | Version control | Yes | 2.50.1 | -- |
| Vercel CLI | Deployment | No | -- | Deploy via git push to Vercel (standard flow) |
| Spotify Developer Account | OAuth credentials | Unknown | -- | Must be set up manually before implementation |

**Missing dependencies with no fallback:**
- Spotify Developer Account with registered app (Client ID + Secret) -- must be created at https://developer.spotify.com/dashboard before auth can be tested

**Missing dependencies with fallback:**
- Vercel CLI not installed -- deploy via git integration (standard Vercel workflow, no CLI needed)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (not yet installed -- Wave 0 gap) |
| Config file | none -- see Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Spotify OAuth login completes without errors | integration (manual) | Manual: click "Connect Spotify", complete OAuth flow, verify redirect | N/A -- manual only |
| AUTH-01 | Auth.js config exports handlers, auth, signIn, signOut | unit | `npx vitest run src/__tests__/auth.test.ts -t "auth config"` | Wave 0 |
| AUTH-02 | JWT token refresh logic handles expired tokens | unit | `npx vitest run src/__tests__/auth.test.ts -t "token refresh"` | Wave 0 |
| AUTH-02 | Session persists after browser refresh | integration (manual) | Manual: login, close tab, reopen, verify still logged in | N/A -- manual only |
| AUTH-03 | Demo galaxy data loads and has correct structure | unit | `npx vitest run src/__tests__/demo-data.test.ts` | Wave 0 |
| AUTH-03 | Demo galaxy renders ~200 stars | smoke (manual) | Manual: open app without auth, verify stars visible in 3D scene | N/A -- manual only |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + manual OAuth flow verified

### Wave 0 Gaps
- [ ] `vitest` + `@vitejs/plugin-react` -- install as dev dependencies
- [ ] `vitest.config.ts` -- Vitest config compatible with Next.js 16 path aliases
- [ ] `src/__tests__/auth.test.ts` -- auth config unit tests (token refresh logic)
- [ ] `src/__tests__/demo-data.test.ts` -- demo galaxy JSON validation

## Sources

### Primary (HIGH confidence)
- Auth.js v5 Spotify provider: https://authjs.dev/reference/core/providers/spotify
- Auth.js v5 migration guide: https://authjs.dev/getting-started/migrating-to-v5
- Spotify Authorization Code Flow: https://developer.spotify.com/documentation/web-api/tutorials/code-flow
- Spotify OAuth Scopes: https://developer.spotify.com/documentation/web-api/concepts/scopes
- Spotify Token Refresh: https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens
- R3F v9 docs: https://r3f.docs.pmnd.rs/getting-started/introduction
- R3F InstancedMesh pattern: https://github.com/pmndrs/react-three-fiber/discussions/761
- Next.js App Router project structure: https://nextjs.org/docs/app/getting-started/project-structure
- npm registry version verification: ran `npm view` on all packages (2026-04-01)

### Secondary (MEDIUM confidence)
- Auth.js v5 + Next.js 16 guide: https://dev.to/huangyongshan46a11y/authjs-v5-with-nextjs-16-the-complete-authentication-guide-2026-2lg
- NextAuth Spotify 2025 dev guide: https://dev.to/ctrossat/nextauth-and-spotify-api-a-2025-devs-guide-4p95
- Auth.js v5 complete setup guide: https://nextjslaunchpad.com/article/nextjs-authentication-authjs-v5-complete-guide-sessions-providers-route-protection
- @spotify/web-api-ts-sdk Next.js integration: https://deepwiki.com/spotify/spotify-web-api-ts-sdk/6.2-next.js-integration
- R3F + Next.js starter: https://github.com/pmndrs/react-three-next

### Tertiary (LOW confidence)
- GitHub Discussion #11406 (Spotify token refresh issue): https://github.com/nextauthjs/next-auth/discussions/11406 -- Confirmed pattern but solution may need adjustment for latest Auth.js v5 beta

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified via npm registry, docs cross-referenced
- Architecture: HIGH -- patterns from official Auth.js docs, R3F docs, and verified community guides
- Auth flow: HIGH -- Spotify OAuth docs are authoritative, Auth.js v5 Spotify provider is well-documented
- Token refresh: MEDIUM -- known gotcha with multi-invocation in jwt callback, solution pattern is documented but edge cases may exist
- Demo galaxy: HIGH -- R3F InstancedMesh is well-documented, static JSON is trivial
- Pitfalls: HIGH -- verified via official Spotify docs, Auth.js issues, and R3F pitfalls page

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (30 days -- Auth.js v5 is slow-moving beta, Spotify API stable)
