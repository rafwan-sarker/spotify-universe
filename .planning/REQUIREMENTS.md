# Requirements: Spotify Universe

**Defined:** 2026-04-01
**Core Value:** Flying through your own music galaxy must feel smooth, immersive, and visually stunning

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Data

- [x] **AUTH-01**: User can log in with Spotify OAuth (server-side via Vercel functions)
- [x] **AUTH-02**: User session persists across browser refresh
- [x] **AUTH-03**: Demo mode with pre-loaded sample galaxy for unauthenticated visitors
- [x] **DATA-01**: Progressively fetch user's full Spotify library (saved songs + top tracks)
- [x] **DATA-02**: Normalize 5000+ Spotify micro-genres into 15-25 macro-genre clusters
- [x] **DATA-03**: Map each song to a 3D position based on genre cluster membership

### Galaxy Rendering

- [x] **GLXY-01**: Render every song as an instanced star particle (5000+ at 60fps)
- [ ] **GLXY-02**: Stars grouped into distinct genre nebulae/clusters in 3D space
- [x] **GLXY-03**: Star color determined by genre (rock=red, electronic=cyan, hip-hop=purple, etc.)
- [x] **GLXY-04**: Progressive galaxy build — stars appear in waves as data streams in
- [x] **GLXY-05**: Star size based on top-track ranking (most-listened songs are the biggest stars)

### Navigation

- [x] **NAV-01**: Smooth cruise flight controls (mouse/keyboard) for free-form exploration
- [x] **NAV-02**: Hyperspace warp jump transition (star-streak effect) when navigating
- [x] **NAV-03**: Click a star to warp to that artist's full constellation
- [x] **NAV-04**: Search bar to find any song/artist and warp directly to it

### Visual Style

- [x] **VIS-01**: Neon synthwave aesthetic with bloom/glow post-processing on all stars
- [x] **VIS-02**: Warp streak particle effects during hyperspace jumps
- [x] **VIS-05**: Top 5 most-listened stars glow as bright beacons (unmissable in the galaxy)
- [x] **VIS-06**: Genre labels floating in 3D space near each cluster

### UI & Personalization

- [ ] **UI-01**: Mini-map HUD showing current position in the galaxy
- [ ] **UI-05**: Galaxy stats card ("Your galaxy: X stars, Y genres, Z% dominant genre")
- [ ] **UI-06**: Galaxy personality label based on genre distribution (e.g. "Eclectic Explorer", "Genre Loyalist")
- [x] **UI-07**: Artist constellation lines connecting stars by the same artist on star selection

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Audio

- **AUDIO-01**: Spatial audio — faint song previews get louder as you fly near stars (blocked by Spotify preview URL restrictions for new apps)

### Visual Polish

- **VIS-04**: Procedural nebula clouds behind genre clusters

### UI Enhancements

- **UI-04**: Screenshot export for social sharing (viral growth mechanic)

### Social

- **SOCL-01**: Compare galaxies with friends (overlap visualization)
- **SOCL-02**: Public shareable profile link for your galaxy

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile/touch controls | Desktop web first — touch flight controls are a separate UX challenge |
| Desktop app (Electron/Tauri) | Web-only for maximum shareability, no install friction |
| Playlist-specific views | Full library only for v1 — playlist galaxies are v2+ |
| Offline mode | Requires Spotify connection for data + auth |
| Energy-based star coloring | Spotify Audio Features API deprecated Nov 2024 for new apps |
| Play count star sizing | Spotify removed popularity/play count from API Feb 2026 |
| Batch API endpoints | Unavailable for new Spotify apps — progressive fetch required |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| DATA-01 | Phase 2 | Complete |
| DATA-02 | Phase 2 | Complete |
| DATA-03 | Phase 2 | Complete |
| GLXY-01 | Phase 3 | Complete |
| GLXY-02 | Phase 3 | Pending |
| GLXY-03 | Phase 3 | Complete |
| GLXY-04 | Phase 3 | Complete |
| GLXY-05 | Phase 3 | Complete |
| NAV-01 | Phase 4 | Complete |
| NAV-02 | Phase 4 | Complete |
| NAV-03 | Phase 4 | Complete |
| NAV-04 | Phase 4 | Complete |
| VIS-01 | Phase 5 | Complete |
| VIS-02 | Phase 5 | Complete |
| UI-01 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-02 after roadmap creation*
