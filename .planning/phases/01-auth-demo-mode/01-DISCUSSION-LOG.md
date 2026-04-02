# Phase 1: Auth & Demo Mode - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 01-auth-demo-mode
**Areas discussed:** Landing page flow, Demo galaxy content, Auth error handling, Session & logout UX, Loading states

---

## Landing Page Flow

### First Screen

| Option | Description | Selected |
|--------|-------------|----------|
| Demo galaxy running | Galaxy spinning in background with floating Connect Spotify button overlay | ✓ |
| Cinematic intro | Quick 3-5 second zoom-in animation, then demo galaxy reveals | |
| Landing page first | Static hero section explaining concept, CTA leads to galaxy | |

**User's choice:** Demo galaxy running
**Notes:** Product IS the landing page — no separate marketing page

### Auth Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Floating button | Persistent neon button in corner | |
| Bottom banner | Sleek banner: "This is a demo — Connect Spotify to see YOUR galaxy" | ✓ |
| After exploring | No prompt initially, shows after 15-30 seconds | |

**User's choice:** Bottom banner
**Notes:** Minimal + neon tone to match synthwave aesthetic

### Post-Login Transition

| Option | Description | Selected |
|--------|-------------|----------|
| Morphs into yours | Demo stars fade out, real stars fade in | |
| Clean reset | Quick warp/transition, galaxy builds from scratch | ✓ |
| Side by side | Brief comparison moment | |

**User's choice:** Clean reset

### Demo Camera Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-pilot orbit | Camera slowly orbits on cinematic path, user can take control | ✓ |
| Free flight | Full flight controls from start | |
| Guided tour | Camera flies through highlights, then hands off | |

**User's choice:** Auto-pilot orbit

---

## Demo Galaxy Content

### Data Source

| Option | Description | Selected |
|--------|-------------|----------|
| Curated real songs | ~200 real songs, recognizable artists | ✓ |
| Generated/fictional | Procedurally generated fake data | |
| Your library | Pre-fetch personal data as demo | |

**User's choice:** Curated real songs

### Scale

| Option | Description | Selected |
|--------|-------------|----------|
| ~200 stars | Small but representative | ✓ |
| ~1000 stars | Impressive density | |
| ~3000+ stars | Full scale demo | |

**User's choice:** ~200 stars

### Genre Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| 5-6 major genres | Pop, Rock, Hip-Hop, Electronic, R&B, Indie | ✓ |
| 10+ genres | Wider spread including Jazz, Classical, Latin | |
| You decide | Claude picks representative mix | |

**User's choice:** 5-6 major genres

### Interactivity

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, full interaction | Click demo stars to see song info | |
| View only | Orbit/fly but can't interact with stars | ✓ |
| Limited | Hover shows info, click prompts Connect Spotify | |

**User's choice:** View only

---

## Auth Error Handling

### OAuth Failure

| Option | Description | Selected |
|--------|-------------|----------|
| Back to demo | Silently return to demo with subtle toast | |
| Error screen | Brief error page with Try Again button | ✓ |
| You decide | Claude picks smoothest UX | |

**User's choice:** Error screen

### Token Expiry

| Option | Description | Selected |
|--------|-------------|----------|
| Silent refresh | Auto-refresh in background, user never notices | ✓ |
| Gentle prompt | Show reconnect banner if refresh fails | |
| You decide | Claude handles token lifecycle | |

**User's choice:** Silent refresh

---

## Session & Logout UX

### Logout Location

| Option | Description | Selected |
|--------|-------------|----------|
| Corner icon | Small profile/avatar icon in top-right | ✓ |
| Settings menu | Hamburger/gear icon with panel | |
| You decide | Claude places where it makes sense | |

**User's choice:** Corner icon

### Post-Logout

| Option | Description | Selected |
|--------|-------------|----------|
| Demo galaxy | Warp back to demo galaxy | ✓ |
| Landing page | Static landing page with CTA | |
| Same galaxy, locked | Stay but lose interactivity | |

**User's choice:** Demo galaxy

---

## Loading States

### Initial Load

| Option | Description | Selected |
|--------|-------------|----------|
| Black + neon loader | Glowing neon loading animation | |
| Instant skeleton | Dark empty canvas, galaxy fades in | ✓ |
| You decide | Claude picks smoothest experience | |

**User's choice:** Instant skeleton

### Galaxy Build

| Option | Description | Selected |
|--------|-------------|----------|
| Empty space first | Dark void, stars pop in by cluster | |
| All at once | Load silently, reveal full galaxy | ✓ |
| Particle dust | Swirling dust coalesces into stars | |

**User's choice:** All at once (demo is only 200 stars — progressive is for real libraries)

---

## Claude's Discretion

- Token lifecycle implementation details
- Spotify API scopes selection
- Project scaffolding (app router, folders, styling)

## Deferred Ideas

None — discussion stayed within phase scope
