---
phase: 02-data-pipeline
plan: 02
subsystem: api
tags: [next-auth, spotify-api, api-routes, proxy, oauth-scopes, rate-limiting]

# Dependency graph
requires:
  - phase: 02-data-pipeline
    provides: SpotifyTrackRaw, SpotifyArtistRaw types from Plan 01
  - phase: 01-auth-demo-mode
    provides: JWT callback with accessToken, next-auth session config
provides:
  - Six Spotify API proxy routes (tracks, top-tracks, playlists, playlists/[id], recently-played, artists/[id])
  - Shared spotifyFetch helper with auth check and rate limit forwarding
  - OAuth scopes for playlist and recently-played access
affects: [02-data-pipeline, 03-galaxy-renderer]

# Tech tracking
tech-stack:
  added: []
  patterns: [api-proxy-route, spotifyFetch-helper, getToken-not-auth]

key-files:
  created:
    - src/lib/spotify/api-helpers.ts
    - src/app/api/spotify/tracks/route.ts
    - src/app/api/spotify/top-tracks/route.ts
    - src/app/api/spotify/playlists/route.ts
    - src/app/api/spotify/playlists/[id]/route.ts
    - src/app/api/spotify/recently-played/route.ts
    - src/app/api/spotify/artists/[id]/route.ts
  modified:
    - src/lib/spotify-scopes.ts
    - src/__tests__/auth-config.test.ts

key-decisions:
  - "getToken() from next-auth/jwt (not auth()) for reading raw JWT access token in API routes"
  - "Shared spotifyFetch helper to eliminate boilerplate across 6 route handlers"
  - "Input validation on all query params (offset, limit, time_range) with 400 responses"

patterns-established:
  - "API proxy pattern: all Spotify calls go through Next.js API routes via spotifyFetch helper"
  - "Dynamic route params use Promise-based pattern (Next.js 16): await params"
  - "Rate limit forwarding: 429 responses include Retry-After header for client orchestrator"

requirements-completed: [DATA-01]

# Metrics
duration: 2min
completed: 2026-04-03
---

# Phase 2 Plan 2: Spotify API Route Handlers Summary

**Six API proxy routes forwarding authenticated Spotify requests with shared auth/rate-limit helper and expanded OAuth scopes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-03T00:11:07Z
- **Completed:** 2026-04-03T00:13:03Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Shared spotifyFetch helper centralizing auth check, rate limit forwarding, and error handling for all Spotify API proxies
- Six route handlers covering all data sources: saved tracks, top tracks, playlists, playlist tracks, recently played, artist details
- OAuth scopes expanded with playlist-read-private and user-read-recently-played (forces re-auth, acceptable for 5-user dev mode)
- Input validation on all query parameters with 400 error responses

## Task Commits

Each task was committed atomically:

1. **Task 1: Update OAuth scopes and create shared API proxy helper** - `b9fae1d` (feat)
2. **Task 2: Create all six Spotify API proxy route handlers** - `63979c5` (feat)

## Files Created/Modified
- `src/lib/spotify/api-helpers.ts` - Shared getSpotifyToken and spotifyFetch helper functions
- `src/lib/spotify-scopes.ts` - Added playlist-read-private and user-read-recently-played scopes
- `src/app/api/spotify/tracks/route.ts` - Paginated saved tracks proxy (offset, limit)
- `src/app/api/spotify/top-tracks/route.ts` - Top tracks by time range with validation (no pagination, max 50)
- `src/app/api/spotify/playlists/route.ts` - User playlists list proxy (manual pagination, never follow `next` URL)
- `src/app/api/spotify/playlists/[id]/route.ts` - Playlist tracks proxy (max 100/page)
- `src/app/api/spotify/recently-played/route.ts` - Recently played proxy (single page, max 50)
- `src/app/api/spotify/artists/[id]/route.ts` - Single artist details proxy (genres endpoint)
- `src/__tests__/auth-config.test.ts` - Updated scope count test from 4 to 6, added new scope assertions

## Decisions Made
- Used getToken() from next-auth/jwt instead of auth() because the session callback strips the access token for security
- Created shared spotifyFetch helper rather than duplicating auth/rate-limit logic across 6 routes
- Added input validation on all query params (offset, limit, time_range) returning 400 for invalid values

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated existing scope count test**
- **Found during:** Task 2 (route handler creation)
- **Issue:** auth-config.test.ts expected exactly 4 scopes, but Task 1 correctly added 2 new scopes (total 6)
- **Fix:** Updated test to expect 6 scopes and added assertions for the two new scopes (playlist-read-private, user-read-recently-played)
- **Files modified:** src/__tests__/auth-config.test.ts
- **Verification:** All 56 tests pass (7 auth-config, 20 genre-map, 24 star-data, 5 demo-data)
- **Committed in:** 63979c5 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug -- outdated test assertion)
**Impact on plan:** Essential test update to match the intentional scope expansion. No scope creep.

## Issues Encountered
None

## User Setup Required
None - existing Spotify credentials from Phase 1 continue to work. Users will need to re-authorize (re-login) to grant the two new scopes.

## Next Phase Readiness
- All 6 API proxy routes ready for the client-side fetch orchestrator (Plan 03)
- Rate limiting is handled via 429 forwarding; client orchestrator will implement Retry-After respect
- Artist endpoint is the highest-volume call (1 per unique artist); client-side rate limiting critical
- Full test suite green (56 tests) with no regressions

## Self-Check: PASSED

All 9 files exist. Both task commits verified in git log (b9fae1d, 63979c5).

---
*Phase: 02-data-pipeline*
*Completed: 2026-04-03*
