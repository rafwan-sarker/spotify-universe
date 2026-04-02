---
phase: 01-auth-demo-mode
plan: 01
subsystem: auth
tags: [next-auth, spotify-oauth, jwt, zustand, tailwind-v4, vitest, next-js-16]

# Dependency graph
requires:
  - phase: none
    provides: greenfield project
provides:
  - Next.js 16 project scaffold with Turbopack
  - Auth.js v5 Spotify OAuth with JWT token refresh
  - Zustand store for app mode tracking (demo/authenticated/transitioning)
  - Vitest test infrastructure with path aliases
  - Tailwind v4 with neon CSS variables
  - SessionProvider wrapper in root layout
affects: [01-02, 01-03, 02-data-pipeline]

# Tech tracking
tech-stack:
  added: [next@16.2, react@19.2, next-auth@5-beta, three@0.183, @react-three/fiber@9.5, @react-three/drei@10.7, zustand@5, motion@12, tailwindcss@4, vitest@3, typescript@5.8]
  patterns: [auth-js-v5-jwt-strategy, spotify-token-refresh-with-buffer, zustand-app-mode-store, tailwind-v4-import-syntax]

key-files:
  created: [src/auth.ts, src/app/api/auth/[...nextauth]/route.ts, src/lib/spotify-scopes.ts, src/lib/store.ts, src/types/next-auth.d.ts, src/components/providers/Providers.tsx, src/__tests__/auth-config.test.ts, src/__tests__/demo-data.test.ts, vitest.config.ts]
  modified: [package.json, tsconfig.json]

key-decisions:
  - "Requested all 4 Spotify scopes upfront to prevent re-authorization in Phase 2"
  - "5-minute buffer on token expiry to guard against jwt callback multi-invocation race condition"
  - "Zustand store defaults to demo mode -- authenticated state set after login"
  - "Tailwind and PostCSS as devDependencies since they are build-time tools"

patterns-established:
  - "Auth.js v5 jwt callback pattern: guard refresh with time check, never refresh if token still valid"
  - "Session callback exposes user.id and error field only -- raw tokens stay server-side"
  - "Zustand AppMode type: demo | authenticated | transitioning"
  - "CSS custom properties for neon theme colors (--neon-pink, --neon-cyan, --neon-purple)"
  - "Vitest with @/ path alias matching tsconfig paths"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: 4min
completed: 2026-04-02
---

# Phase 01 Plan 01: Next.js 16 Scaffold + Spotify OAuth Summary

**Next.js 16 scaffold with Auth.js v5 Spotify OAuth, JWT token refresh with 5-minute buffer, Zustand app mode store, and Vitest test infrastructure**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-02T20:56:21Z
- **Completed:** 2026-04-02T21:00:42Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Next.js 16.2 project scaffolded with all Phase 1 dependencies (Three.js, R3F, Zustand, Motion, Tailwind v4)
- Auth.js v5 configured with Spotify provider, JWT session strategy, and silent token refresh guarded by 5-minute buffer
- All 4 Spotify OAuth scopes requested upfront (user-read-email, user-read-private, user-library-read, user-top-read) to prevent re-authorization later
- Zustand store tracks demo/authenticated/transitioning app modes
- Vitest configured with path aliases, auth scope tests passing (5/5)
- Demo data test scaffolds written as contract for Plan 02

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 16 project** - `2e5c5d0` (feat)
2. **Task 2: Auth.js v5 + Zustand + tests** - `50d2103` (feat)

## Files Created/Modified
- `package.json` - Project dependencies (Next.js 16, Auth.js, Three.js, R3F, Zustand, Motion, Tailwind, Vitest)
- `tsconfig.json` - TypeScript 5.8 config with bundler resolution and @/ path alias
- `next.config.ts` - Minimal Next.js config (Turbopack is default)
- `eslint.config.mjs` - ESLint 10 flat config with Next.js and Prettier
- `postcss.config.mjs` - Tailwind v4 PostCSS plugin
- `vitest.config.ts` - Vitest with React plugin and @/ alias
- `src/app/globals.css` - Tailwind v4 import + neon CSS variables
- `src/app/layout.tsx` - Root layout with dark background, Providers wrapper, metadata
- `src/app/page.tsx` - Placeholder page with dark background (no white flash)
- `src/auth.ts` - Auth.js v5 config with Spotify provider, JWT callbacks, token refresh
- `src/app/api/auth/[...nextauth]/route.ts` - Auth.js route handler (GET + POST)
- `src/types/next-auth.d.ts` - Session and JWT type extensions for Spotify tokens
- `src/lib/spotify-scopes.ts` - Spotify OAuth scopes constant
- `src/lib/store.ts` - Zustand store for app mode and user state
- `src/components/providers/Providers.tsx` - SessionProvider wrapper
- `src/__tests__/auth-config.test.ts` - Scope validation tests (passing)
- `src/__tests__/demo-data.test.ts` - Demo galaxy data contract tests (failing until Plan 02)
- `.env.example` - Environment variable template
- `.gitignore` - Standard Next.js gitignore with .env.local

## Decisions Made
- Requested all 4 Spotify scopes in Phase 1 to avoid re-authorization when Phase 2 needs library/top-track access
- Used 5-minute buffer on token expiry check to prevent race condition when Auth.js jwt callback fires multiple times per render
- Zustand store defaults to "demo" mode with explicit "transitioning" state for smooth UX during auth changes
- Tailwind CSS and PostCSS placed in devDependencies (build-time only)
- @eslint/js pinned to ^10.0.1 (latest available) instead of ^10.1.0 (not yet published)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed @eslint/js version**
- **Found during:** Task 1 (dependency installation)
- **Issue:** Plan specified @eslint/js ^10.1.0 but latest published version is 10.0.1
- **Fix:** Changed to ^10.0.1
- **Files modified:** package.json
- **Verification:** npm install succeeded
- **Committed in:** 2e5c5d0

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor version adjustment. No scope change.

## Issues Encountered
None beyond the version mismatch noted above.

## User Setup Required

**External services require manual configuration.** Before testing OAuth:

1. Create a Spotify Developer App at https://developer.spotify.com/dashboard
2. Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`
3. Copy Client ID and Client Secret into `.env.local`:
   ```
   AUTH_SECRET=<generate with: npx auth secret>
   SPOTIFY_CLIENT_ID=<from dashboard>
   SPOTIFY_CLIENT_SECRET=<from dashboard>
   ```
4. Verify: `npm run dev` then visit http://localhost:3000/api/auth/signin

## Known Stubs
None. All files contain complete implementations for their scope.

## Next Phase Readiness
- Auth infrastructure complete -- Plan 02 can build the demo galaxy 3D scene
- Demo data test contract defines exactly what demo-galaxy.json must contain
- Providers wrapper already in layout, ready for additional providers
- Zustand store ready for mode switching when auth UI is wired in Plan 03

## Self-Check: PASSED

All 19 created files verified present. Both task commits (2e5c5d0, 50d2103) verified in git log.

---
*Phase: 01-auth-demo-mode*
*Completed: 2026-04-02*
