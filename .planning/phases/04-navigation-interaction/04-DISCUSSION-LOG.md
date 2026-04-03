# Phase 4: Navigation & Interaction - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 04-navigation-interaction
**Areas discussed:** Flight control scheme, Star click & info display, Search experience, Warp visual effect

---

## Flight Control Scheme

### Q1: How should the user fly through the galaxy?

| Option | Description | Selected |
|--------|-------------|----------|
| Cruise flight | WASD/arrow keys for movement, mouse for camera look. Hold-to-fly, release-to-drift. Momentum with damping. Like Space Engine, No Man's Sky photo mode. | ✓ |
| Enhanced orbit | Click-drag to orbit, scroll to zoom, double-click to re-center. Like Google Earth. |  |
| Hybrid (orbit + fly) | Default orbit mode, hold Shift for free-flight. Best of both but more complex. |  |

**User's choice:** Cruise flight
**Notes:** None

### Q2: Camera drift behavior on key release?

| Option | Description | Selected |
|--------|-------------|----------|
| Gentle drift | Decelerates over ~1-2 seconds. Zero-gravity coasting feel. | ✓ |
| Quick stop | Stops within ~0.3 seconds. More precise. |  |
| You decide | Claude picks damping values. |  |

**User's choice:** Gentle drift
**Notes:** None

### Q3: Camera behavior when idle?

| Option | Description | Selected |
|--------|-------------|----------|
| Slow auto-drift | After ~5s idle, gentle drift/rotation resumes. Stops on input. | ✓ |
| Stay still | Camera holds position when idle. |  |
| You decide | Claude picks based on what works. |  |

**User's choice:** Slow auto-drift
**Notes:** None

---

## Star Click & Info Display

### Q4: What happens when you click a star?

| Option | Description | Selected |
|--------|-------------|----------|
| Info card + warp option | Camera glides close, info card appears (name, artist, album art, Spotify link, "Warp to Artist" button). | ✓ |
| Instant warp to artist | Click → immediately warp to artist constellation. Info after landing. |  |
| Hover info + click warp | Hover for tooltip, click to warp. Lighter UI. |  |

**User's choice:** Info card + warp option
**Notes:** None

### Q5: Where should the info card appear?

| Option | Description | Selected |
|--------|-------------|----------|
| Floating beside star | HTML overlay positioned near clicked star in 3D space. Neon synthwave styled. | ✓ |
| Fixed sidebar | Slides in from right edge. Always same position. |  |
| You decide | Claude picks best placement. |  |

**User's choice:** Floating beside star
**Notes:** None

### Q6: Album art in StarData?

| Option | Description | Selected |
|--------|-------------|----------|
| Add album art to pipeline | Extend StarData with albumArt URL. Small pipeline change, big visual payoff. | ✓ |
| Card without album art | Just text info. No pipeline changes. |  |
| You decide | Claude determines if worth it. |  |

**User's choice:** Add album art to pipeline
**Notes:** None

---

## Search Experience

### Q7: Where should the search bar live?

| Option | Description | Selected |
|--------|-------------|----------|
| Top center | Hidden by default. Opens via / or Cmd+K. Auto-hides. Minimal footprint. | ✓ |
| Command palette overlay | Full-width overlay like VS Code. Dims galaxy behind it. |  |
| Always-visible top bar | Persistent search input always visible. |  |

**User's choice:** Top center
**Notes:** None

### Q8: What should search match against?

| Option | Description | Selected |
|--------|-------------|----------|
| Songs + artists | Client-side fuzzy search over stars[] for track name and artist name. | ✓ |
| Songs + artists + genres | Also match genre names for cluster exploration. |  |
| You decide | Claude determines best scope. |  |

**User's choice:** Songs + artists
**Notes:** None

### Q9: What happens when you select a search result?

| Option | Description | Selected |
|--------|-------------|----------|
| Instant warp to star | Search closes → camera warps with streak effect → info card opens on arrival. | ✓ |
| Highlight first, then warp | Star pulses/highlights → press Enter to warp. Two-step. |  |
| You decide | Claude picks best UX. |  |

**User's choice:** Instant warp to star
**Notes:** None

---

## Warp Visual Effect

### Q10: How cinematic should the warp transition be?

| Option | Description | Selected |
|--------|-------------|----------|
| Star-streak speed lines | Stars stretch into streaks (Star Wars hyperspace). 3-phase: accelerate (0.3s) → hyperspace (0.5s) → decelerate (0.4s). | ✓ |
| Quick zoom blur | Radial motion blur toward target. ~0.5s. Simpler. |  |
| Tunnel of light | Cylindrical tunnel of light particles. Wormhole feel. Heavier VFX. |  |

**User's choice:** Star-streak speed lines
**Notes:** None

### Q11: Same warp effect for all warp types?

| Option | Description | Selected |
|--------|-------------|----------|
| Same effect everywhere | One consistent warp animation for all navigation warps. | ✓ |
| Short vs long warps | Intensity scales with travel distance. |  |
| You decide | Claude determines during implementation. |  |

**User's choice:** Same effect everywhere
**Notes:** None

---

## Claude's Discretion

- Exact WASD movement speed and drift damping values
- Raycasting implementation for InstancedMesh click detection
- Fuzzy search library choice
- Star-streak shader implementation approach
- Camera interpolation curve for warp travel
- Click on empty space behavior
- Search result limit and ranking algorithm

## Deferred Ideas

None — discussion stayed within phase scope
