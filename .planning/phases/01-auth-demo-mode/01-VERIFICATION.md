---
phase: 01-auth-demo-mode
verified: 2026-04-02T21:46:14Z
status: human_needed
score: 4/4 must-haves verified (automated)
re_verification: false
human_verification:
  - test: "Complete Spotify OAuth login flow end-to-end"
    expected: "Clicking 'Connect Spotify' redirects to Spotify login, then returns with profile avatar visible and DemoBanner gone"
    why_human: "Requires real Spotify credentials (SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET not configured in .env.local). OAuth redirect, token exchange, and callback can only be verified with live credentials."
  - test: "Session persists after closing and reopening the browser tab"
    expected: "Navigating to the app after closing tab still shows the profile avatar (logged-in state) without re-authenticating"
    why_human: "Session cookie persistence requires a real login to produce a JWT cookie. Cannot verify without completing OAuth flow first."
  - test: "Logout returns to demo galaxy with banner (warp transition plays)"
    expected: "Clicking Log Out plays a fade-to-black transition then shows the DemoBanner again at the bottom"
    why_human: "Requires authenticated state to exist first. Warp animation timing (800ms delay + signOut) is a UI behavior."
  - test: "OAuth error page renders correctly when Spotify login fails"
    expected: "Navigating to /auth/error?error=OAuthCallback shows branded dark page with correct error message and Try Again button"
    why_human: "Can be partially tested without credentials by visiting /auth/error directly, but the auth redirect behavior requires live credentials."
---

# Phase 1: Auth + Demo Mode Verification Report

**Phase Goal:** Anyone can access the app -- authenticated users connect their Spotify, unauthenticated visitors explore a pre-built demo galaxy
**Verified:** 2026-04-02T21:46:14Z
**Status:** human_needed (all automated checks pass; OAuth flow needs live credentials)
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths (Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can click "Connect Spotify" and complete OAuth login without errors | ? HUMAN NEEDED | `ConnectSpotifyButton` calls `signIn("spotify")` correctly; `auth.ts` configures Spotify provider with correct scopes and token endpoint. Spotify credentials not set in `.env.local` -- live OAuth untested. |
| 2 | User can close and reopen the browser tab and remain logged in | ? HUMAN NEEDED | JWT strategy configured (`session: { strategy: "jwt" }`); Auth.js v5 default uses httpOnly cookies with 30-day maxAge. Session persistence is architecturally correct but requires a real login to produce a cookie to verify. |
| 3 | Unauthenticated visitor sees a demo galaxy rendered on screen without needing to log in | VERIFIED | `page.tsx` conditionally renders `DemoBanner` + `GalaxySceneLoader` without any auth gate. `DemoGalaxy.tsx` loads 200 stars from `demo-galaxy.json` via InstancedMesh. Build succeeds; demo verified by Plan 03 author. |
| 4 | Logged-in user can log out and return to the demo/landing state | ? HUMAN NEEDED | `ProfileMenu` calls `setMode("transitioning")` then `signOut({ callbackUrl: "/" })`. `WarpTransition` listens to Zustand mode. Architecture is correct and wired; requires authenticated session to verify behavior. |

**Automated score:** 1/4 fully verified without credentials. All 4 truths verified structurally/architecturally. OAuth truths blocked on live credentials.

---

### Required Artifacts

#### Plan 01-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/auth.ts` | Auth.js v5 config with Spotify provider and token refresh | VERIFIED | Exports `handlers`, `auth`, `signIn`, `signOut`. JWT callback with 5-minute buffer. Token refresh to `accounts.spotify.com/api/token`. `RefreshTokenError` on failure. |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.js route handler for Spotify OAuth | VERIFIED | Re-exports `{ GET, POST } = handlers` from `@/auth`. |
| `src/lib/store.ts` | Zustand store for app mode and user state | VERIFIED | Exports `useAppStore`. AppMode `"demo" | "authenticated" | "transitioning"`. Defaults to `"demo"`. |
| `src/types/next-auth.d.ts` | Type extensions for Auth.js Session with Spotify token fields | VERIFIED | Extends `Session` with `user.id` and `error?: "RefreshTokenError"`. Extends `JWT` with `accessToken`, `refreshToken`, `expiresAt`, `error`. |
| `vitest.config.ts` | Test configuration for Next.js 16 compatibility | VERIFIED | `@vitejs/plugin-react` present. `@/` alias resolves to `./src`. |

#### Plan 01-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/data/demo-galaxy.json` | Static demo data with ~200 curated songs across 6 genres | VERIFIED | Exactly 200 stars. 6 genres (pop, rock, hiphop, electronic, rnb, indie). All 200 stars have required fields (id, name, artist, genre, position[3], size, brightness). No stars with invalid genre. |
| `src/components/canvas/DemoGalaxy.tsx` | InstancedMesh rendering ~200 stars with genre-based colors | VERIFIED | Imports `demoData` from `@/data/demo-galaxy.json`. Uses `instancedMesh` with vertex colors via `instancedBufferAttribute`. Module-scope `tempObject` and `tempColor`. |
| `src/components/canvas/GalaxyScene.tsx` | R3F Canvas wrapper dynamically imported with ssr:false | VERIFIED | `Canvas` from `@react-three/fiber`. `useAppStore` import. `isAuthenticated` prop wires to `ModeSync`. Conditional `DemoGalaxy` render. Default export for dynamic import. |
| `src/components/canvas/AutoOrbitCamera.tsx` | Cinematic auto-orbit camera with user override | VERIFIED | `OrbitControls` from `@react-three/drei`. `autoRotate` and `autoRotateSpeed={0.3}` present. User zoom/rotate enabled. |
| `src/components/canvas/BackgroundStars.tsx` | Distant starfield background using Drei Stars | VERIFIED | `Stars` from `@react-three/drei`. 3000-count starfield with radius 300. |
| `src/components/canvas/GalaxySceneLoader.tsx` | Client wrapper for dynamic import (deviation from plan) | VERIFIED | `"use client"`. `dynamic(() => import("@/components/canvas/GalaxyScene"), { ssr: false })`. Addresses Next.js 16 constraint blocking `ssr:false` in server components. |

#### Plan 01-03 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/ui/DemoBanner.tsx` | Bottom neon banner with Connect Spotify CTA | VERIFIED | `"use client"`. `fixed bottom-0`. `motion` from `motion/react`. Contains "Connect Spotify" text. Renders `ConnectSpotifyButton`. |
| `src/components/ui/ConnectSpotifyButton.tsx` | Button that initiates Spotify OAuth | VERIFIED | Calls `signIn("spotify")` on click. Neon-styled with SVG Spotify icon. |
| `src/components/ui/ProfileMenu.tsx` | Top-right avatar with logout dropdown | VERIFIED | `fixed top-4 right-4`. Sets `"transitioning"` mode before `signOut`. Avatar with fallback initial letter. |
| `src/components/ui/WarpTransition.tsx` | Fullscreen fade-to-black transition | VERIFIED | `useAppStore` reads mode. Shows overlay when `mode === "transitioning"`. `AnimatePresence` for exit animation. Auto-hides after 1000ms. |
| `src/components/ui/SessionExpiredBanner.tsx` | Reconnect banner for token refresh failures | VERIFIED | Checks `session.error === "RefreshTokenError"`. Shows "Session expired" with `signIn("spotify")` reconnect button. Dismissable. |
| `src/app/auth/error/page.tsx` | Branded OAuth error page | VERIFIED | Background `#000005`. "Something went wrong" heading. Error-type-specific messages. Renders `TryAgainButton`. |
| `src/app/auth/error/TryAgainButton.tsx` | Client-side Try Again button | VERIFIED | "use client". Calls `signIn("spotify")`. Neon-pink styled. |

---

### Key Link Verification

#### Plan 01-01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/api/auth/[...nextauth]/route.ts` | `src/auth.ts` | re-exports handlers | WIRED | `import { handlers } from "@/auth"` + `export const { GET, POST } = handlers` |
| `src/auth.ts` | `https://accounts.spotify.com/api/token` | token refresh fetch in jwt callback | WIRED | Line 46: `fetch("https://accounts.spotify.com/api/token", ...)` with Basic auth and `grant_type=refresh_token` |
| `src/app/layout.tsx` | `src/components/providers/Providers.tsx` | wraps children in SessionProvider | WIRED | `import Providers from "@/components/providers/Providers"` + `<Providers>{children}</Providers>` |

#### Plan 01-02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/page.tsx` | `src/components/canvas/GalaxySceneLoader.tsx` | dynamic import with ssr:false (via loader) | WIRED | `GalaxySceneLoader` imported in `page.tsx`; `GalaxySceneLoader` wraps `dynamic(import("GalaxyScene"), { ssr: false })` |
| `src/components/canvas/DemoGalaxy.tsx` | `src/data/demo-galaxy.json` | JSON import for star positions and colors | WIRED | `import demoData from "@/data/demo-galaxy.json"` used in `useMemo` and `useEffect` |
| `src/components/canvas/GalaxyScene.tsx` | `src/components/canvas/DemoGalaxy.tsx` | renders DemoGalaxy inside Canvas | WIRED | `<DemoGalaxy />` rendered conditionally when `mode === "demo" || !isAuthenticated` |

Note: Plan 01-02 specified `dynamic` directly in `page.tsx` but the implementation correctly uses `GalaxySceneLoader.tsx` as an intermediate client wrapper (documented deviation addressing Next.js 16 constraint). Wiring is functionally identical.

#### Plan 01-03 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/components/ui/ConnectSpotifyButton.tsx` | `next-auth/react` | `signIn("spotify")` call | WIRED | `signIn("spotify")` called directly in `onClick` handler |
| `src/components/ui/ProfileMenu.tsx` | `next-auth/react` | `signOut()` call | WIRED | `signOut({ callbackUrl: "/" })` called after 800ms delay in `handleLogout` |
| `src/app/page.tsx` | `src/components/ui/DemoBanner.tsx` | conditional render when no session | WIRED | `{!session && <DemoBanner />}` on line 16 |
| `src/app/page.tsx` | `src/components/ui/ProfileMenu.tsx` | conditional render when session exists | WIRED | `{session?.user && <ProfileMenu user={session.user} />}` on line 17 |
| `src/components/ui/WarpTransition.tsx` | `src/lib/store.ts` | reads mode from Zustand store | WIRED | `const mode = useAppStore((s) => s.mode)` drives `visible` state |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `DemoGalaxy.tsx` | `demoData.stars` (200 items) | `src/data/demo-galaxy.json` imported at module level | Yes -- 200 entries with positions, colors, sizes | FLOWING |
| `GalaxyScene.tsx` | `mode` from Zustand store | `useAppStore` reactive subscription | Yes -- updated by `ModeSync` component on mount | FLOWING |
| `ProfileMenu.tsx` | `user` prop | `session.user` from `auth()` in server component | Yes -- passed from Auth.js session callback (populates after login) | FLOWING (requires live session) |
| `SessionExpiredBanner.tsx` | `session.error` | `useSession()` from `next-auth/react` | Conditional on `RefreshTokenError` token state | FLOWING (conditional) |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 10 Vitest tests pass | `npx vitest run --reporter=verbose` | 10/10 passing (5 scope tests + 5 demo-data tests) | PASS |
| Production build succeeds | `npm run build` | 4 routes compiled: `/`, `/api/auth/[...nextauth]`, `/auth/error`, `/_not-found` | PASS |
| demo-galaxy.json has 200 valid stars | `node -e "require('./src/data/demo-galaxy.json').stars.length"` | 200 | PASS |
| All 200 stars have required fields | Field validation script | 0 stars missing fields; 0 stars with invalid genre | PASS |
| signIn("spotify") wired in ConnectSpotifyButton | grep check | `onClick={() => signIn("spotify")}` present | PASS |
| signOut wired before transitioning mode in ProfileMenu | grep check | `setMode("transitioning")` then `signOut(...)` confirmed | PASS |
| OAuth live flow | requires browser + credentials | SPOTIFY_CLIENT_ID empty in .env.local | SKIP |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUTH-01 | 01-01, 01-03 | User can log in with Spotify OAuth | NEEDS HUMAN | Auth.js Spotify provider configured; `signIn("spotify")` wired; real OAuth untested (no credentials) |
| AUTH-02 | 01-01, 01-03 | User session persists across browser refresh | NEEDS HUMAN | JWT strategy with httpOnly cookies (Auth.js default 30-day maxAge); architecturally correct; untested without live login |
| AUTH-03 | 01-02, 01-03 | Demo mode with pre-loaded sample galaxy for unauthenticated visitors | VERIFIED | 200-star demo galaxy renders without auth. DemoBanner shown to unauthenticated visitors. Build + tests pass. |

**Orphaned requirements check:** REQUIREMENTS.md maps AUTH-01, AUTH-02, AUTH-03 to Phase 1. All three are claimed by the plans. No orphaned requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/ui/SessionExpiredBanner.tsx` | 11 | `return null` | INFO | Expected conditional render -- not a stub. Returns null when error is not "RefreshTokenError". |
| `src/components/canvas/GalaxyScene.tsx` | 29 | `return null` | INFO | Expected -- `ModeSync` is a logic-only component that syncs auth prop to Zustand store. No render output required. |

No blocking anti-patterns found. Both `return null` instances are legitimate conditional/logic patterns, not stubs.

**Notable deviation (non-blocking):** `src/auth.ts` uses a conditional provider pattern (`const providers = []; if (env vars) { providers.push(Spotify(...)) }`). This was a Plan 03 fix to allow demo mode when Spotify credentials are absent. AUTH_SECRET is now set in `.env.local` but SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are empty. The app runs in "auth-unavailable" mode where clicking "Connect Spotify" will not redirect to Spotify.

---

### Human Verification Required

#### 1. Spotify OAuth Login Flow

**Test:** Configure `.env.local` with real Spotify credentials (create app at https://developer.spotify.com/dashboard, add redirect URI `http://localhost:3000/api/auth/callback/spotify`). Run `npm run dev`, open http://localhost:3000, click "Connect Spotify".

**Expected:** Redirects to Spotify login page. After approving, returns to the app with the DemoBanner gone and a profile avatar in the top-right corner.

**Why human:** Requires live Spotify OAuth credentials. SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are empty in `.env.local`.

#### 2. Session Persistence Across Tab Close

**Test:** After completing step 1 (logged in), close the browser tab. Reopen http://localhost:3000.

**Expected:** Profile avatar still visible -- user remains logged in without re-authenticating.

**Why human:** Session cookie can only be verified after a real login produces an Auth.js JWT cookie.

#### 3. Logout and Warp Transition

**Test:** While logged in, click the profile avatar (top-right), then click "Log Out".

**Expected:** A fade-to-black overlay appears for ~1 second, then the page returns to demo mode with the DemoBanner visible at the bottom.

**Why human:** Requires authenticated state. Warp animation timing is a visual behavior.

#### 4. OAuth Error Page (Optional)

**Test:** With credentials configured, navigate to http://localhost:3000/auth/error?error=OAuthCallback.

**Expected:** Dark background (#000005), neon-pink "Something went wrong" heading, message "Spotify login was denied or failed.", and a "Try Again" button that initiates OAuth.

**Why human:** Can be partially verified by direct URL (no credentials needed for the error page itself), but the actual redirect to this page from a failed OAuth requires live credentials.

---

## Gaps Summary

No structural gaps found. All artifacts exist, are substantive, and are wired correctly. The phase goal is architecturally complete.

The only outstanding items are live OAuth verification (SUCCESS CRITERIA 1, 2, 4), which require Spotify developer credentials that have not been configured yet. The code is correctly wired per AUTH-01 and AUTH-02 implementation requirements -- these are human verification items, not code gaps.

SUCCESS CRITERIA 3 (unauthenticated visitor sees demo galaxy) is fully verified programmatically: demo galaxy renders, tests pass, build succeeds, conditional rendering is wired correctly.

---

_Verified: 2026-04-02T21:46:14Z_
_Verifier: Claude (gsd-verifier)_
