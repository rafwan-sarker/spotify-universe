# Spotify Universe

## What This Is

A 3D web app that transforms your Spotify library into an interactive galaxy you can fly through. Every song you've ever saved becomes a star, clustered into genre nebulae, colored by energy level. Connect your Spotify, watch your galaxy form star by star, then cruise through it — hearing spatial audio whispers of nearby songs as you explore, and hyperspace-jumping between artist constellations. Built with a neon synthwave aesthetic.

## Core Value

Flying through your own music galaxy must feel smooth, immersive, and visually stunning — the "wow" moment when you see your entire music taste rendered as a living cosmos.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Spotify OAuth login to pull user's full library (saved songs, playlists, top tracks)
- [ ] 3D galaxy rendering with every song as a star, clustered by genre
- [ ] Stars colored by energy level (cool blue = calm, hot orange/red = high energy)
- [ ] Star size reflects play count (favorites are the biggest stars)
- [ ] Smooth cruise flight controls for free-form galaxy exploration
- [ ] Hyperspace jump warp transition when navigating to an artist constellation
- [ ] Warp-to-artist: clicking a star warps you to that artist's full constellation
- [ ] Spatial audio: faint song previews get louder as you fly near stars
- [ ] Progressive galaxy build: stars appear in waves as data streams in from Spotify
- [ ] Mini-map HUD showing current position in the galaxy
- [ ] Search bar to find any song/artist and warp directly to it
- [ ] Neon synthwave visual aesthetic (glowing outlines, neon grids, retro-futuristic palette)
- [ ] Bloom/glow post-processing effects for screenshot-worthy visuals
- [ ] Genre nebulae with distinct visual regions in the galaxy

### Out of Scope

- Social features (compare galaxies, public profiles) — keep v1 focused on the solo experience
- Mobile/touch controls — desktop web first, mobile later
- Screenshot/poster export — nice to have but not core for v1
- Playlist-specific views — full library only for now
- Offline mode — requires Spotify connection
- Desktop app (Electron/Tauri) — web-only for maximum shareability

## Context

- Spotify Web API provides audio features (energy, danceability, valence, tempo) per track — these drive star color and positioning
- Spotify API rate limits: ~30 requests/second with proper token handling
- Full libraries can be 5,000+ songs — need efficient instanced rendering for star particles
- Three.js has strong ecosystem for galaxy/particle effects (InstancedMesh, Points, custom shaders)
- Spotify 30-second preview URLs are free with the API — used for spatial audio
- User already has experience with 3D web rendering (Babylon.js/Neon Dash project)

## Constraints

- **Tech Stack**: Three.js + TypeScript + Vite + React — Three.js for 3D, React for UI overlays
- **Hosting**: Vercel — free tier, serverless functions for Spotify OAuth
- **Auth**: Spotify OAuth with server-side secret (Vercel functions) — PKCE alone can't protect client secret
- **Performance**: Must handle 5,000+ stars at 60fps on modern desktop browsers
- **API**: Spotify Web API only — no scraping, no third-party data
- **Assets**: No paid 3D assets — all procedural/shader-generated visuals
- **Audio**: Spotify 30-second preview clips for spatial audio (free with API)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Three.js over Babylon.js | Better particle/galaxy ecosystem, more shader examples for space visuals | — Pending |
| Vercel serverless for backend | Zero infrastructure, free tier, handles OAuth securely | — Pending |
| Genre clustering over mood clustering | More intuitive for users — "my rock nebula" is clearer than "my 0.7 energy zone" | — Pending |
| Energy-based star coloring | Creates natural visual gradient across the galaxy, leverages Spotify audio features | — Pending |
| No social features in v1 | Focus all effort on core fly-through experience quality | — Pending |
| Progressive loading over big bang | Watching the galaxy form IS the experience — turns loading into content | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-01 after initialization*
