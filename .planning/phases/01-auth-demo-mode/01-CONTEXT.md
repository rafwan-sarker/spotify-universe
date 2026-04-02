# Phase 1: Auth & Demo Mode - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Spotify OAuth login with Vercel serverless functions, session persistence across browser refresh, and a pre-built demo galaxy for unauthenticated visitors. The demo galaxy IS the landing page — no separate marketing page.

</domain>

<decisions>
## Implementation Decisions

### Landing Page Flow
- **D-01:** The demo galaxy runs immediately as the first screen — no splash page, no login gate. The product IS the landing page.
- **D-02:** Camera auto-pilots on a slow cinematic orbit through the demo galaxy. User can take control at any time.
- **D-03:** A minimal neon-styled bottom banner shows: "This is a demo — Connect Spotify to see YOUR galaxy" — unobtrusive, matches synthwave aesthetic.
- **D-04:** After connecting Spotify, a clean warp/transition effect plays, then the user's real galaxy builds from scratch (no morphing from demo).

### Demo Galaxy Content
- **D-05:** Demo is powered by ~200 curated real songs with recognizable artists across 5-6 major genres (Pop, Rock, Hip-Hop, Electronic, R&B, Indie).
- **D-06:** Demo galaxy is view-only — visitors can orbit/fly around but cannot interact with individual stars. This teases the full experience.
- **D-07:** Demo data is a static JSON file bundled with the app — no API calls needed for the demo.

### Auth Error Handling
- **D-08:** If OAuth fails or user denies permissions, show a brief error page explaining what went wrong with a "Try Again" button.
- **D-09:** Token refresh happens silently in the background — user never notices. If refresh fails, show a gentle "Session expired — reconnect" banner.

### Session & Logout UX
- **D-10:** Small profile/avatar icon in top-right corner. Click reveals logout option.
- **D-11:** After logout, warp transition plays and user returns to the demo galaxy with the bottom banner.

### Loading States
- **D-12:** App shows the dark canvas immediately (instant skeleton) while JS/3D engine loads — no loading spinner.
- **D-13:** Demo galaxy appears fully formed in one reveal (all 200 stars at once) — progressive loading is for real libraries in Phase 2+.

### Claude's Discretion
- Token lifecycle implementation details (refresh timing, retry strategy)
- Spotify API scopes (minimal set needed for library access)
- Project scaffolding decisions (app router structure, folder layout, styling approach)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — AUTH-01, AUTH-02, AUTH-03 requirements
- `.planning/ROADMAP.md` — Phase 1 success criteria and dependencies

### Research
- `.planning/research/STACK.md` — Recommended stack: Next.js 16.2, next-auth v5, Zustand, R3F v9.5
- `.planning/research/PITFALLS.md` — Critical: Spotify dev mode 5-user cap, auth security patterns, React/Three.js boundary architecture
- `.planning/research/ARCHITECTURE.md` — Three-tier architecture (React DOM overlay + R3F Canvas + Vercel serverless)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes the foundational patterns

### Integration Points
- Vercel serverless functions for OAuth token exchange
- Next.js app router for page routing
- R3F Canvas for 3D galaxy rendering (demo in Phase 1, real data in Phase 2+)

</code_context>

<specifics>
## Specific Ideas

- Demo galaxy auto-orbit should feel cinematic and slow — like drifting through space in a movie
- Bottom banner should be minimal enough to not distract from the galaxy but clear enough that visitors know what to do
- The clean reset after login (not morph) creates a clear "this is YOUR galaxy now" moment
- Error page after OAuth failure should still feel on-brand (neon/dark aesthetic, not a generic white error page)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-auth-demo-mode*
*Context gathered: 2026-04-01*
